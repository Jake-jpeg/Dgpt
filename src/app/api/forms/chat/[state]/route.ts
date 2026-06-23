// DivorceGPT Multi-State Dynamic Form Filler API
// Route: /api/forms/chat/[state]
// State-specific AI instructions live in /lib/states/{code}.ts
//
// SECURITY HARDENING — April 2026
// See commit message for full changelog.

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { getStateConfig } from '@/lib/states';
import { ANTHROPIC_MODEL } from '@/lib/ai-config';
import {
  verifySessionToken,
  extractSessionToken,
  type SessionPayload,
} from '@/lib/session-token';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ═══════════════════════════════════════════════════════════════
// GUARDRAIL 01: RATE LIMITER
// In-memory, keyed by paymentIntentId. 20 requests per 60s.
// Resets on redeploy (acceptable for DO App Platform).
// ═══════════════════════════════════════════════════════════════
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60_000);

function isRateLimited(sessionKey: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(sessionKey);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(sessionKey, { count: 1, windowStart: now });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// ═══════════════════════════════════════════════════════════════
// GUARDRAIL 02: SESSION AUTH
// Verifies the HMAC-signed dgpt_session cookie set by
// /api/validate-session after Stripe payment confirmation.
// ═══════════════════════════════════════════════════════════════
function authenticateRequest(req: Request, state: string): SessionPayload | null {
  const token = extractSessionToken(req);
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  // Free keys can access any state; paid users only their purchased state
  if (!payload.paymentIntentId.startsWith('pi_free_') && payload.state !== state) {
    return null;
  }

  return payload;
}

// ═══════════════════════════════════════════════════════════════
// GUARDRAIL 03: THE BLACKHOLE — Server-side PII redaction
// Patterns stored as source strings, fresh RegExp per call to
// avoid /g lastIndex state bleed across requests.
// Credit card regex requires separator-delimited groups to stop
// matching phone numbers and street addresses.
// ═══════════════════════════════════════════════════════════════
const SENSITIVE_PATTERN_SOURCES: Array<{ source: string; flags: string }> = [
  // SSN: 123-45-6789, 123 45 6789, 123456789
  { source: '\\b\\d{3}[-\\s]?\\d{2}[-\\s]?\\d{4}\\b', flags: 'g' },
  // Credit/debit cards: separator-delimited groups (4-4-4-4, etc.)
  { source: '\\b\\d{4}[-\\s]\\d{4}[-\\s]\\d{4}[-\\s]\\d{1,7}\\b', flags: 'g' },
  // Bank/routing/account numbers preceded by keyword
  { source: '(?:account|acct|routing|aba)[\\s#:]*\\d{8,17}', flags: 'gi' },
  // Driver's license numbers preceded by keyword
  { source: '\\b(?:DL|driver\'?s?\\s*(?:license|lic))[\\s#:]*[A-Z0-9-]{6,15}', flags: 'gi' },
];

function redactSensitiveData(text: string): { redacted: string; wasRedacted: boolean } {
  let redacted = text;
  let wasRedacted = false;

  for (const { source, flags } of SENSITIVE_PATTERN_SOURCES) {
    const pattern = new RegExp(source, flags);
    const newText = redacted.replace(pattern, '[REDACTED]');
    if (newText !== redacted) {
      wasRedacted = true;
      redacted = newText;
    }
  }

  return { redacted, wasRedacted };
}

// ═══════════════════════════════════════════════════════════════
// DATE PARSING — Strict mode
// Accepts: "Month DD, YYYY", "MM/DD/YYYY", "YYYY-MM-DD",
//          "YYYY/MM/DD" (Asian), "DD.MM.YYYY" (European)
// Rejects everything else.
// ═══════════════════════════════════════════════════════════════
const MONTH_NAMES = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
];

function parseDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (trimmed.length < 6) return null;

  // Format 1: "Month DD, YYYY" or "Month DD YYYY"
  const namedMatch = trimmed.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (namedMatch) {
    const monthIndex = MONTH_NAMES.indexOf(namedMatch[1].toLowerCase());
    if (monthIndex === -1) return null;
    const day = parseInt(namedMatch[2], 10);
    const year = parseInt(namedMatch[3], 10);
    return validateDateComponents(year, monthIndex, day);
  }

  // Format 2: "MM/DD/YYYY"
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10) - 1;
    const day = parseInt(slashMatch[2], 10);
    const year = parseInt(slashMatch[3], 10);
    return validateDateComponents(year, month, day);
  }

  // Format 3: "YYYY-MM-DD" or "YYYY-M-D"
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return validateDateComponents(year, month, day);
  }

  // Format 4: "YYYY/MM/DD" or "YYYY/M/D" (Asian — KR, JP, CN)
  const asianSlashMatch = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (asianSlashMatch) {
    const year = parseInt(asianSlashMatch[1], 10);
    const month = parseInt(asianSlashMatch[2], 10) - 1;
    const day = parseInt(asianSlashMatch[3], 10);
    return validateDateComponents(year, month, day);
  }

  // Format 5: "DD.MM.YYYY" (European — DE, FR, IT)
  const euroMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (euroMatch) {
    const day = parseInt(euroMatch[1], 10);
    const month = parseInt(euroMatch[2], 10) - 1;
    const year = parseInt(euroMatch[3], 10);
    return validateDateComponents(year, month, day);
  }

  return null;
}

function validateDateComponents(year: number, month: number, day: number): Date | null {
  if (year < 1900 || year > 2100) return null;
  if (month < 0 || month > 11) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month, day);
  // Reject if date rolled over (e.g., Feb 30 → Mar 2)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}

function isAtLeastMonthsAgo(date: Date, months: number, canonicalNow: Date): boolean {
  if (months === 0) return date <= canonicalNow;
  const threshold = new Date(
    canonicalNow.getFullYear(),
    canonicalNow.getMonth() - months,
    canonicalNow.getDate()
  );
  return date <= threshold;
}

// ═══════════════════════════════════════════════════════════════
// LANGUAGE DETECTION — Requires 3+ word matches for Latin scripts
// ═══════════════════════════════════════════════════════════════
function detectLanguage(text: string): string {
  // Korean + English only. Hangul => Korean; everything else => English.
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  return 'en';
}

// ═══════════════════════════════════════════════════════════════
// LANGUAGE SCOPE GUARD — Korean + English only (deterministic)
// Allowed scripts: Latin (English + romanized Korean + court-form names/
// addresses, which are always English) and Hangul (Korean). A message is
// blocked only when it carries a RUN (>= 3) of characters from other
// scripts, so a single stray character never hard-stops a real KOR/ENG user.
// ═══════════════════════════════════════════════════════════════
const DISALLOWED_SCRIPT = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\u0400-\u052f\u0600-\u06ff\u0750-\u077f\u0590-\u05ff\u0900-\u097f\u0980-\u09ff\u0e00-\u0e7f\u0370-\u03ff]/g;

const LANG_SCOPE_THRESHOLD = 3;

function isDisallowedLanguage(text: string): boolean {
  const matches = text.match(DISALLOWED_SCRIPT);
  return !!matches && matches.length >= LANG_SCOPE_THRESHOLD;
}

const LANG_SCOPE_NOTICE =
  'DivorceGPT supports English and Korean only. Please continue in English or Korean.\n\n' +
  'DivorceGPT는 영어와 한국어만 지원합니다. 영어 또는 한국어로 진행해 주세요.';

// ═══════════════════════════════════════════════════════════════
// INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════
const MAX_MESSAGE_LENGTH = 5000;
const MAX_MESSAGES_COUNT = 50;
const MAX_TOTAL_PAYLOAD_CHARS = 100_000;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function validateMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length === 0 || raw.length > MAX_MESSAGES_COUNT) return null;

  const validated: ChatMessage[] = [];
  for (const msg of raw) {
    if (typeof msg !== 'object' || msg === null) return null;
    if (typeof msg.role !== 'string' || typeof msg.content !== 'string') return null;
    if (msg.role !== 'user' && msg.role !== 'assistant') return null;
    if (msg.content.length > MAX_MESSAGE_LENGTH) return null;
    validated.push({ role: msg.role, content: msg.content });
  }

  return validated;
}

function validatePhaseData(
  data: unknown,
  allowedKeys: string[]
): Record<string, string | boolean> | null {
  if (data === null || data === undefined) return {};
  if (typeof data !== 'object' || Array.isArray(data)) return null;

  const validated: Record<string, string | boolean> = {};
  const allowedSet = new Set(allowedKeys);

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (!allowedSet.has(key)) continue;
    if (typeof value !== 'string' && typeof value !== 'boolean') continue;
    if (typeof value === 'string' && value.length > 500) continue;
    validated[key] = value;
  }

  return validated;
}

// ═══════════════════════════════════════════════════════════════
// SENSITIVE DATA NOTICES (i18n)
// ═══════════════════════════════════════════════════════════════
const SENSITIVE_NOTICES: Record<string, string> = {
  en: 'I noticed you included sensitive information like a Social Security number. DivorceGPT does not need, store, or process this data. Please do not enter SSNs, bank accounts, or other sensitive identifiers. If you need to include an SSN on a court form, you will do that yourself on the printed document.',
  ko: '민감한 정보(예: 사회보장번호)가 포함된 것을 발견했습니다. DivorceGPT는 이러한 데이터를 필요로 하지 않으며, 저장하거나 처리하지 않습니다. SSN, 은행 계좌 또는 기타 민감한 식별 정보를 입력하지 마세요. 법원 양식에 SSN을 기재해야 하는 경우, 출력된 문서에 직접 작성하세요.',
};

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════
export async function POST(
  req: Request,
  { params }: { params: Promise<{ state: string }> }
) {
  try {
    // ── Content-Type guard ──────────────────────────────────
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { reply: 'Invalid request format.', extractedData: null },
        { status: 415 }
      );
    }

    // ── State config (need this before auth for the state code) ─
    const { state } = await params;

    const stateConfig = getStateConfig(state);
    if (!stateConfig) {
      return NextResponse.json(
        { reply: `State "${state}" is not yet supported. Check back soon.`, extractedData: null },
        { status: 404 }
      );
    }

    // ── Auth (verify signed cookie from /api/validate-session) ─
    const session = authenticateRequest(req, state);
    if (!session) {
      return NextResponse.json(
        { reply: 'Session expired or invalid. Please return to your session link to continue.', extractedData: null },
        { status: 401 }
      );
    }

    // ── Rate limit (keyed by paymentIntentId) ──────────────
    if (isRateLimited(session.paymentIntentId)) {
      return NextResponse.json(
        { reply: 'You\'re sending messages too quickly. Please wait a moment and try again.', extractedData: null },
        { status: 429 }
      );
    }

    // ── Field keys from state config ───────────────────────
    const p1Keys = stateConfig.phase1Fields.map((f: { key: string }) => f.key);
    const p2Keys = stateConfig.phase2Fields.map((f: { key: string }) => f.key);
    const p3Keys = stateConfig.phase3Fields.map((f: { key: string }) => f.key);
    const allAllowedKeys = [...p1Keys, ...p2Keys, ...p3Keys];

    // ── Parse & validate payload ───────────────────────────
    let body: Record<string, unknown>;
    try {
      const rawText = await req.text();
      if (rawText.length > MAX_TOTAL_PAYLOAD_CHARS) {
        return NextResponse.json(
          { reply: 'Request too large.', extractedData: null },
          { status: 413 }
        );
      }
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { reply: 'Invalid JSON payload.', extractedData: null },
        { status: 400 }
      );
    }

    const messages = validateMessages(body.messages);
    if (!messages) {
      return NextResponse.json(
        { reply: 'Invalid message format.', extractedData: null },
        { status: 400 }
      );
    }

    // ── Language scope guard (KOR/ENG only) ─────────────────
    // Hard stop BEFORE the model call if the latest user message is
    // substantially in a disallowed script. No model call, no extraction.
    const latestUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    if (isDisallowedLanguage(latestUserMsg)) {
      return NextResponse.json(
        { reply: LANG_SCOPE_NOTICE, extractedData: null },
        { status: 200 }
      );
    }

    const currentPhase = typeof body.currentPhase === 'number'
      && [1, 2, 3].includes(body.currentPhase)
      ? body.currentPhase as number
      : 1;

    const phase1Data = validatePhaseData(body.phase1Data, p1Keys);
    const phase2Data = validatePhaseData(body.phase2Data, p2Keys);
    const phase3Data = validatePhaseData(body.phase3Data, p3Keys);

    if (phase1Data === null || phase2Data === null || phase3Data === null) {
      return NextResponse.json(
        { reply: 'Invalid form data format.', extractedData: null },
        { status: 400 }
      );
    }

    // ── PII redaction (Blackhole) ──────────────────────────
    let sensitiveDataDetected = false;
    const sanitizedMessages = messages.map((msg) => {
      if (msg.role === 'user') {
        const { redacted, wasRedacted } = redactSensitiveData(msg.content);
        if (wasRedacted) sensitiveDataDetected = true;
        return { ...msg, content: redacted };
      }
      return msg;
    });

    // ── Canonical date ─────────────────────────────────────
    const canonicalNow = new Date();
    const canonicalDateStr = canonicalNow.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    // ── Build context block ────────────────────────────────
    let contextMessage = '\n\n[SYSTEM STATUS: ';
    contextMessage += `Today's date: ${canonicalDateStr}. `;
    contextMessage += `Current Phase: ${currentPhase}. `;
    contextMessage += `State: ${stateConfig.name}. `;

    if (Object.keys(phase1Data).length > 0) {
      contextMessage += `Phase 1 Data: ${JSON.stringify(phase1Data)}. `;
    }

    if (currentPhase === 1) {
      const missing = p1Keys.filter((f: string) => !phase1Data[f]);
      if (missing.length > 0) {
        contextMessage += `Phase 1 missing: ${missing.join(', ')}. `;
      } else {
        contextMessage += 'Phase 1 COMPLETE - output {"phase1Complete": true}. ';
      }
    }

    if (currentPhase === 2) {
      contextMessage += `Phase 2 Data: ${JSON.stringify(phase2Data)}. `;
      const isReligious = phase1Data.ceremonyType === 'religious';
      const missing = p2Keys.filter((f: string) => !phase2Data[f]);
      if (missing.length > 0) {
        contextMessage += `Phase 2 missing: ${missing.join(', ')}. `;
      } else {
        contextMessage += 'Phase 2 COMPLETE - output {"phase2Complete": true}. ';
      }
      if (isReligious) {
        contextMessage += 'RELIGIOUS CEREMONY - waiver requirements apply per state law. ';
      }
    }

    if (currentPhase === 3) {
      contextMessage += `Phase 3 Data: ${JSON.stringify(phase3Data)}. `;
      const missing = p3Keys.filter((f: string) => !phase3Data[f]);
      if (missing.length > 0) {
        contextMessage += `Phase 3 missing: ${missing.join(', ')}. `;
      } else {
        contextMessage += 'Phase 3 COMPLETE - output {"phase3Complete": true}. ';
      }
    }

    contextMessage += ']';

    // ── Call Anthropic (with prompt caching) ────────────────
    // The state systemPrompt (~14K tokens) is identical for every user
    // of this state, so the cache entry is SHARED across users. With a
    // 1-hour TTL, sparse/sporadic traffic (users arriving >5min but <60min
    // apart) converts what would be cache *writes* into cache *reads*, and
    // bridges the document-gathering pauses inside a single session.
    // contextMessage stays AFTER the breakpoint so it never busts the cache.
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1500,
      system: [
        {
          type: 'text',
          text: stateConfig.systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: contextMessage,
        },
      ],
      messages: sanitizedMessages,
    });

    // ── Cache performance logging ──────────────────────────
    const usage = response.usage as {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
    const cacheRead = usage.cache_read_input_tokens ?? 0;
    const cacheWrite = usage.cache_creation_input_tokens ?? 0;
    const uncached = usage.input_tokens;
    const totalInput = cacheRead + cacheWrite + uncached;
    const savingsPercent = totalInput > 0 ? Math.round((cacheRead / totalInput) * 100) : 0;
    console.log(
      `[Cache ${state.toUpperCase()}] read=${cacheRead} write=${cacheWrite} uncached=${uncached} output=${usage.output_tokens} | ${savingsPercent}% cached`
    );

    // ── Extract reply text ─────────────────────────────────
    const reply = response.content
      .filter(block => block.type === 'text')
      .map(block => block.type === 'text' ? block.text : '')
      .join('\n');

    // ── Sensitive data notice (language-aware) ─────────────
    let finalReply = reply;
    if (sensitiveDataDetected) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
      const detectedLang = detectLanguage(lastUserMsg);
      const notice = SENSITIVE_NOTICES[detectedLang] || SENSITIVE_NOTICES.en;
      finalReply = notice + '\n\n' + reply;
    }

    // ── Parse JSON extraction blocks ───────────────────────
    const jsonMatches = [...reply.matchAll(/```json\s*([\s\S]*?)\s*```/g)];
    let extractedData: Record<string, string | boolean> = {};
    let phase1Complete = false;
    let phase2Complete = false;
    let phase3Complete = false;
    let isDisqualified = false;
    let disqualifyReason = '';
    let isTerminated = false;
    let terminateReason = '';
    const validationWarnings: string[] = [];

    for (const match of jsonMatches) {
      try {
        const parsed = JSON.parse(match[1]);

        if (parsed.phase1Complete) phase1Complete = true;
        if (parsed.phase2Complete) phase2Complete = true;
        if (parsed.phase3Complete) phase3Complete = true;

        if (parsed.disqualified) {
          isDisqualified = true;
          disqualifyReason = parsed.reason || '';
        }

        if (parsed.terminate) {
          isTerminated = true;
          terminateReason = parsed.reason || 'policy_violation';
        }

        if (parsed.field && parsed.value !== undefined) {
          const field = String(parsed.field);
          const value = String(parsed.value);

          // Only accept fields defined in the state config
          if (!allAllowedKeys.includes(field)) continue;

          // NAME VALIDATION
          // RESIDENCY GROUND VALIDATION (DRL §230) — user-selected A–F, never defaulted.
          // Populates the sworn UD-6 Affirmation (Para 2); an incorrect ground is a false oath.
          if (field === 'residencyType') {
            const letter = String(value).trim().toUpperCase();
            if (!/^[A-F]$/.test(letter)) {
              validationWarnings.push('Residency ground must be one of A, B, C, D, E, or F (DRL §230). Ask the user which option matches their facts — do not assume.');
              continue;
            }
            extractedData[field] = letter;
            continue;
          }

          if (['plaintiffName', 'defendantName', 'firstSpouseName', 'secondSpouseName', 'witnessName'].includes(field)) {
            if (value.trim().length < 3) {
              validationWarnings.push('Please provide a full legal name (first and last name).');
              continue;
            }
            if (!/\s/.test(value.trim())) {
              validationWarnings.push('Please provide both first and last name.');
              continue;
            }
            if (/\d/.test(value)) {
              validationWarnings.push('Name should not contain numbers. Please re-enter your legal name.');
              continue;
            }
            extractedData[field] = value;
            continue;
          }

          // ADDRESS VALIDATION
          if (['qualifyingAddress', 'plaintiffAddress', 'defendantAddress', 'defendantCurrentAddress'].includes(field)) {
            const hasZip = /\d{5}(-\d{4})?/.test(value);
            if (!hasZip) {
              validationWarnings.push('Address must include a ZIP code. Please re-enter the complete address.');
              continue;
            }

            const statePattern = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New\s+Hampshire|New\s+Jersey|New\s+Mexico|New\s+York|North\s+Carolina|North\s+Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode\s+Island|South\s+Carolina|South\s+Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West\s+Virginia|Wisconsin|Wyoming)\b/i;
            if (!statePattern.test(value)) {
              validationWarnings.push('Address must include a state. Please provide the full address (street, city, state, ZIP).');
              continue;
            }
            if (value.trim().length < 15) {
              validationWarnings.push('Address appears incomplete. Please provide the full street address, city, state, and ZIP code.');
              continue;
            }
            if (!/\d/.test(value.split(',')[0] || value)) {
              validationWarnings.push('Address should include a street number. Please verify.');
              continue;
            }

            // NY borough/county mismatch enforcement
            if ((field === 'qualifyingAddress' || field === 'plaintiffAddress') && state === 'ny') {
              const currentCounty = (phase1Data.qualifyingCounty || extractedData['qualifyingCounty']) as string | undefined;
              if (currentCounty) {
                const boroughMap: Record<string, string[]> = {
                  'bronx': ['bronx'],
                  'kings': ['brooklyn', 'kings'],
                  'new york': ['manhattan', 'new york'],
                  'queens': ['queens'],
                  'richmond': ['staten island', 'richmond'],
                };
                const countyLower = currentCounty.toLowerCase();
                const addressLower = value.toLowerCase();
                const countyAliases = boroughMap[countyLower] || [countyLower];
                const allKnownAreas = Object.values(boroughMap).flat();
                const addressMentionsOtherArea = allKnownAreas.some(area =>
                  addressLower.includes(area) && !countyAliases.includes(area)
                );
                if (addressMentionsOtherArea && !countyAliases.some(alias => addressLower.includes(alias))) {
                  validationWarnings.push(
                    `The address you provided does not appear to match your selected filing county (${currentCounty}). Your qualifying address must be in the county where you're filing. Please confirm your address or update your filing county.`
                  );
                }
              }
            }

            extractedData[field] = value;
            continue;
          }

          // PHONE VALIDATION
          if (field === 'plaintiffPhone') {
            const digits = value.replace(/\D/g, '');
            if (digits.length === 10) {
              extractedData[field] = value;
              continue;
            }
            if (digits.length === 11 && digits[0] === '1') {
              extractedData[field] = value;
              continue;
            }
            if (digits.length === 9) {
              validationWarnings.push('That appears to be 9 digits. If this is a US number, it should be 10 digits (area code + 7 digits). Please verify.');
              extractedData[field] = value;
              continue;
            }
            if (digits.length < 9) {
              validationWarnings.push('Please provide a complete phone number (10 digits for US, or include country code for international).');
              continue;
            }
            extractedData[field] = value;
            continue;
          }

          // MARRIAGE DATE VALIDATION
          if (field === 'marriageDate') {
            const mDate = parseDate(value);
            if (!mDate) {
              validationWarnings.push('Could not parse marriage date. Please use a format like "June 15, 2020", "06/15/2020", or "2020/6/15".');
              continue;
            }
            if (mDate > canonicalNow) {
              validationWarnings.push('Marriage date cannot be in the future. Please verify.');
              continue;
            }
            extractedData[field] = value;
            continue;
          }

          // FILING/SUMMONS DATE VALIDATION
          if (field === 'summonsDate') {
            const sDate = parseDate(value);
            if (!sDate) {
              validationWarnings.push('Could not parse filing date. Please use a format like "January 10, 2026", "01/10/2026", or "2026/1/10".');
              continue;
            }
            if (sDate > canonicalNow) {
              validationWarnings.push('Filing date cannot be in the future. This is the date the clerk accepted your filing. Please verify.');
              continue;
            }
            const marriageDateStr = (phase2Data.marriageDate || extractedData['marriageDate']) as string | undefined;
            if (marriageDateStr) {
              const marriageDate = parseDate(marriageDateStr);
              if (marriageDate && sDate < marriageDate) {
                validationWarnings.push('Filing date cannot be before the marriage date. Please verify your dates.');
                continue;
              }
            }
            extractedData[field] = value;
            continue;
          }

          // BREAKDOWN DATE VALIDATION
          if (field === 'breakdownDate') {
            const bDate = parseDate(value);
            if (!bDate) {
              validationWarnings.push('Could not parse breakdown date. Please use a format like "March 1, 2025", "03/01/2025", or "2025/3/1".');
              continue;
            }
            const breakdownMonths = stateConfig.breakdownMonths ?? 6;
            if (!isAtLeastMonthsAgo(bDate, breakdownMonths, canonicalNow)) {
              validationWarnings.push(
                `The breakdown date must be at least ${breakdownMonths} months before today (${canonicalDateStr}). Please verify.`
              );
              continue;
            }
            const marriageDateStr = (phase2Data.marriageDate || extractedData['marriageDate']) as string | undefined;
            if (marriageDateStr) {
              const marriageDate = parseDate(marriageDateStr);
              if (marriageDate && bDate < marriageDate) {
                validationWarnings.push('Breakdown date cannot be before marriage date. Please verify your dates.');
                continue;
              }
            }
            extractedData[field] = value;
            continue;
          }

          // JUDGMENT ENTRY DATE VALIDATION
          if (field === 'judgmentEntryDate') {
            const entryDate = parseDate(value);
            if (!entryDate) {
              validationWarnings.push('Could not parse judgment entry date. Please use a format like "February 28, 2027", "02/28/2027", or "2027/2/28".');
              continue;
            }
            const endOfToday = new Date(canonicalNow);
            endOfToday.setHours(23, 59, 59, 999);
            if (entryDate > endOfToday) {
              validationWarnings.push('The Judgment entry date cannot be in the future. The Judgment must already be entered before proceeding. Please verify.');
              continue;
            }
            if (phase2Data.summonsDate) {
              const summonsDate = parseDate(phase2Data.summonsDate as string);
              if (summonsDate && entryDate < summonsDate) {
                validationWarnings.push(`Judgment entry date (${value}) cannot be before the filing date (${phase2Data.summonsDate}). Please verify.`);
                continue;
              }
            }
            if (phase2Data.marriageDate) {
              const marriageDate = parseDate(phase2Data.marriageDate as string);
              if (marriageDate && entryDate < marriageDate) {
                validationWarnings.push('Judgment entry date cannot be before the marriage date. Please verify.');
                continue;
              }
            }
            extractedData[field] = value;
            continue;
          }

          // INDEX NUMBER VALIDATION (NY)
          if (field === 'indexNumber') {
            const indexMatch = value.match(/^\d+\/\d{4}$/) || value.match(/^\d{4}\/\d+$/);
            if (!indexMatch) {
              validationWarnings.push('Index number format should be like "12345/2026". Please verify.');
            }
            extractedData[field] = value;
            continue;
          }

          // DOCKET NUMBER VALIDATION (NJ)
          if (field === 'docketNumber') {
            const docketMatch = value.match(/^FM-/i);
            if (!docketMatch) {
              validationWarnings.push('NJ docket number should start with "FM-" (e.g., FM-07-012345-26). Please verify.');
            }
            extractedData[field] = value;
            continue;
          }

          // Default: save the field
          extractedData[field] = value;
        }
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    }

    // ── Outside-counsel heuristic (hardened) ────────────────
    if (currentPhase === 2) {
      const hasAnyCaseNumber = extractedData['indexNumber'] || extractedData['docketNumber'];
      const phase1FieldCount = Object.keys(phase1Data).length;
      const MIN_P1_FIELDS_FOR_HEURISTIC = 3;
      if (hasAnyCaseNumber && phase1FieldCount < MIN_P1_FIELDS_FOR_HEURISTIC) {
        isDisqualified = true;
        disqualifyReason = 'outside_counsel_case';
      }
    }

    // ── Server-side phase completion safety net ─────────────
    const mergedP1 = { ...phase1Data, ...extractedData };
    if (mergedP1.plaintiffAddress && !mergedP1.qualifyingAddress && mergedP1.qualifyingParty === 'plaintiff') {
      extractedData['qualifyingAddress'] = mergedP1.plaintiffAddress as string;
    }
    if (mergedP1.qualifyingAddress && !mergedP1.plaintiffAddress && mergedP1.qualifyingParty === 'plaintiff') {
      extractedData['plaintiffAddress'] = mergedP1.qualifyingAddress as string;
    }
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
    if (mergedP1.plaintiffAddress && !mergedP1.defendantAddress &&
        /same address|same one|yes same|same place|lives with me|live together|we both live|living together/.test(lastMsg)) {
      extractedData['defendantAddress'] = mergedP1.plaintiffAddress as string;
    }

    if (currentPhase === 1 && !phase1Complete) {
      const merged = { ...phase1Data, ...extractedData };
      const allPresent = p1Keys.every((f: string) => merged[f]);
      if (allPresent) phase1Complete = true;
    }

    if (currentPhase === 2 && !phase2Complete) {
      const merged = { ...phase2Data, ...extractedData };
      const allPresent = p2Keys.every((f: string) => merged[f]);
      if (allPresent) phase2Complete = true;
    }

    if (currentPhase === 3 && !phase3Complete) {
      const merged = { ...phase3Data, ...extractedData };
      const allPresent = p3Keys.every((f: string) => merged[f]);
      if (allPresent) phase3Complete = true;
    }

    // ── Clean reply & respond ──────────────────────────────
    let cleanReply = finalReply.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
    if (validationWarnings.length > 0 && !isTerminated && !isDisqualified) {
      cleanReply = validationWarnings.join('\n\n') + '\n\n' + cleanReply;
    }

    return NextResponse.json({
      reply: cleanReply,
      extractedData: Object.keys(extractedData).length > 0 ? extractedData : null,
      phase1Complete,
      phase2Complete,
      phase3Complete,
      isDisqualified,
      disqualifyReason,
      isTerminated,
      terminateReason,
    });
  } catch (error) {
    console.error('Form filler API error:', error);
    return NextResponse.json(
      { reply: 'Sorry, something went wrong. Please try again.', extractedData: null },
      { status: 500 }
    );
  }
}
