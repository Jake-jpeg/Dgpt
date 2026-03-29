// DivorceGPT Multi-State Dynamic Form Filler API
// Route: /api/forms/chat/[state]
// State-specific AI instructions live in /lib/states/{code}.ts
// This route mirrors /api/forms/chat/route.ts but accepts a state parameter.

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { getStateConfig } from '@/lib/states';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ═══════════════════════════════════════════════════════════════
// GUARDRAIL 02: THE BLACKHOLE — Server-side sensitive data redaction
// Strips SSNs, bank accounts, credit cards, and other PII from
// user messages BEFORE they are sent to the AI provider.
// Reference: divorcegpt.com/transparency — "Sensitive Data Gets Destroyed in Transit"
// ═══════════════════════════════════════════════════════════════
const SENSITIVE_PATTERNS = [
  // SSN: formatted XXX-XX-XXXX or XXX XX XXXX (3-2-4 grouping distinguishes from phone 3-3-4)
  /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/g,
  // SSN: unformatted 9-digit string (with or without keyword context)
  // Broad catch — better to over-redact than leak an SSN to the API
  /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  // Credit card: 13-19 digit sequences with optional separators (broad catch)
  /\b(?:\d[-\s]?){13,19}\b/g,
  // Bank account: 8-17 digit sequences preceded by account-related keywords
  /(?:account|acct|routing|aba)[\s#:]*\d{8,17}/gi,
  // Driver's license: preceded by DL-related keywords
  /\b(?:DL|driver'?s?\s*(?:license|lic))[\s#:]*[A-Z0-9-]{6,15}/gi,
];

function redactSensitiveData(text: string): { redacted: string; wasRedacted: boolean } {
  let redacted = text;
  let wasRedacted = false;

  for (const pattern of SENSITIVE_PATTERNS) {
    const newText = redacted.replace(pattern, '[REDACTED]');
    if (newText !== redacted) {
      wasRedacted = true;
      redacted = newText;
    }
  }

  return { redacted, wasRedacted };
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;
  const match = dateStr.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/);
  if (match) {
    const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    const monthIndex = monthNames.indexOf(match[1].toLowerCase());
    if (monthIndex !== -1) {
      return new Date(parseInt(match[3]), monthIndex, parseInt(match[2]));
    }
  }
  return null;
}

function isAtLeastMonthsAgo(date: Date, months: number, canonicalNow: Date): boolean {
  const threshold = new Date(canonicalNow.getFullYear(), canonicalNow.getMonth() - months, canonicalNow.getDate());
  return date <= threshold;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ state: string }> }
) {
  try {
    const { state } = await params;

    const stateConfig = getStateConfig(state);
    if (!stateConfig) {
      return NextResponse.json(
        { reply: `State "${state}" is not yet supported. Check back soon.`, extractedData: null },
        { status: 404 }
      );
    }

    const p1Keys = stateConfig.phase1Fields.map(f => f.key);
    const p2Keys = stateConfig.phase2Fields.map(f => f.key);
    const p3Keys = stateConfig.phase3Fields.map(f => f.key);

    const { messages, currentPhase, phase1Data, phase2Data, phase3Data } = await req.json();

    // FIX #1: Server-side redaction BEFORE sending to Anthropic
    let sensitiveDataDetected = false;
    const sanitizedMessages = messages.map((msg: { role: string; content: string }) => {
      if (msg.role === 'user') {
        const { redacted, wasRedacted } = redactSensitiveData(msg.content);
        if (wasRedacted) sensitiveDataDetected = true;
        return { ...msg, content: redacted };
      }
      return msg;
    });

    // FIX #2 & #3: Single canonical date
    const canonicalNow = new Date();
    const canonicalDateStr = canonicalNow.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Build context based on current phase
    let contextMessage = '\n\n[SYSTEM STATUS: ';
    contextMessage += `Today's date: ${canonicalDateStr}. `;
    contextMessage += `Current Phase: ${currentPhase || 1}. `;
    contextMessage += `State: ${stateConfig.name}. `;
    
    if (phase1Data && Object.keys(phase1Data).length > 0) {
      contextMessage += `Phase 1 Data: ${JSON.stringify(phase1Data)}. `;
    }
    
    if (currentPhase === 1) {
      const missing = p1Keys.filter(f => !phase1Data?.[f]);
      if (missing.length > 0) {
        contextMessage += `Phase 1 missing: ${missing.join(', ')}. `;
      } else {
        contextMessage += 'Phase 1 COMPLETE - output {"phase1Complete": true}. ';
      }
    }
    
    if (currentPhase === 2) {
      contextMessage += `Phase 2 Data: ${JSON.stringify(phase2Data || {})}. `;
      const isReligious = phase1Data?.ceremonyType === 'religious';
      const missing = p2Keys.filter(f => !phase2Data?.[f]);
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
      contextMessage += `Phase 3 Data: ${JSON.stringify(phase3Data || {})}. `;
      const missing = p3Keys.filter(f => !phase3Data?.[f]);
      if (missing.length > 0) {
        contextMessage += `Phase 3 missing: ${missing.join(', ')}. `;
      } else {
        contextMessage += 'Phase 3 COMPLETE - output {"phase3Complete": true}. ';
      }
    }
    
    contextMessage += ']';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: stateConfig.systemPrompt + contextMessage,
      messages: sanitizedMessages,
    });

    // FIX #5: Join ALL content blocks
    const reply = response.content
      .filter(block => block.type === 'text')
      .map(block => block.type === 'text' ? block.text : '')
      .join('\n');

    let finalReply = reply;
    if (sensitiveDataDetected) {
      const notice = 'I noticed you included sensitive information like a Social Security number. DivorceGPT does not need, store, or process this data. Please do not enter SSNs, bank accounts, or other sensitive identifiers. If you need to include an SSN on a court form, you will do that yourself on the printed document.\n\n';
      finalReply = notice + reply;
    }

    // Parse JSON blocks
    const jsonMatches = [...reply.matchAll(/```json\s*([\s\S]*?)\s*```/g)];
    let extractedData: Record<string, string | boolean> = {};
    let phase1Complete = false;
    let phase2Complete = false;
    let phase3Complete = false;
    let isDisqualified = false;
    let disqualifyReason = '';
    let isTerminated = false;
    let terminateReason = '';

    // FIX #4: Collect ALL validation warnings
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
          const field = parsed.field;
          const value = parsed.value;

          // NAME VALIDATION
          if (['plaintiffName', 'defendantName', 'firstSpouseName', 'secondSpouseName', 'witnessName'].includes(field)) {
            if (value.trim().length < 3) {
              validationWarnings.push(`Please provide a full legal name (first and last name).`);
              continue;
            }
            if (!/\s/.test(value.trim())) {
              validationWarnings.push(`Please provide both first and last name.`);
              continue;
            }
            if (/\d/.test(value)) {
              validationWarnings.push(`Name should not contain numbers. Please re-enter your legal name.`);
              continue;
            }
            extractedData[field] = value;
            continue;
          }

          // ADDRESS VALIDATION
          if (['qualifyingAddress', 'plaintiffAddress', 'defendantAddress', 'defendantCurrentAddress'].includes(field)) {
            const hasZip = /\d{5}(-\d{4})?/.test(value);
            if (!hasZip) {
              validationWarnings.push(`Address must include a ZIP code. Please re-enter the complete address.`);
              continue;
            }
            
            const statePattern = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New\s+Hampshire|New\s+Jersey|New\s+Mexico|New\s+York|North\s+Carolina|North\s+Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode\s+Island|South\s+Carolina|South\s+Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West\s+Virginia|Wisconsin|Wyoming)\b/i;
            if (!statePattern.test(value)) {
              validationWarnings.push(`Address must include a state. Please provide the full address (street, city, state, ZIP).`);
              continue;
            }
            if (value.trim().length < 15) {
              validationWarnings.push(`Address appears incomplete. Please provide the full street address, city, state, and ZIP code.`);
              continue;
            }
            if (!/\d/.test(value.split(',')[0] || value)) {
              validationWarnings.push(`Address should include a street number. Please verify.`);
              continue;
            }

            // FIX #6: Server-side address/county mismatch enforcement (NY-specific)
            if ((field === 'qualifyingAddress' || field === 'plaintiffAddress') && state === 'ny') {
              const currentCounty = phase1Data?.qualifyingCounty || extractedData['qualifyingCounty'];
              if (currentCounty) {
                const boroughMap: Record<string, string[]> = {
                  'bronx': ['bronx'],
                  'kings': ['brooklyn', 'kings'],
                  'new york': ['manhattan', 'new york'],
                  'queens': ['queens'],
                  'richmond': ['staten island', 'richmond'],
                };
                const countyLower = (currentCounty as string).toLowerCase();
                const addressLower = value.toLowerCase();
                const countyAliases = boroughMap[countyLower] || [countyLower];
                const addressHasCounty = countyAliases.some(alias => addressLower.includes(alias));
                const allKnownAreas = Object.values(boroughMap).flat();
                const addressMentionsOtherArea = allKnownAreas.some(area =>
                  addressLower.includes(area) && !countyAliases.includes(area)
                );
                if (addressMentionsOtherArea && !addressHasCounty) {
                  validationWarnings.push(`The address you provided does not appear to match your selected filing county (${currentCounty}). Your qualifying address must be in the county where you're filing. Please confirm your address or update your filing county.`);
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
              validationWarnings.push(`That appears to be 9 digits. If this is a US number, it should be 10 digits (area code + 7 digits). Please verify.`);
              extractedData[field] = value;
              continue;
            }
            if (digits.length < 9) {
              validationWarnings.push(`Please provide a complete phone number (10 digits for US, or include country code for international).`);
              continue;
            }
            if (digits.length > 11) {
              extractedData[field] = value;
              continue;
            }
            extractedData[field] = value;
            continue;
          }

          // MARRIAGE DATE VALIDATION
          if (field === 'marriageDate') {
            const mDate = parseDate(value);
            if (!mDate) {
              validationWarnings.push(`Could not parse marriage date. Please use format like "June 15, 2020".`);
              continue;
            }
            if (mDate > canonicalNow) {
              validationWarnings.push(`Marriage date cannot be in the future. Please verify.`);
              continue;
            }
            extractedData[field] = value;
            continue;
          }

          // FILING/SUMMONS DATE VALIDATION
          if (field === 'summonsDate') {
            const sDate = parseDate(value);
            if (!sDate) {
              validationWarnings.push(`Could not parse filing date. Please use format like "January 10, 2026".`);
              continue;
            }
            if (sDate > canonicalNow) {
              validationWarnings.push(`Filing date cannot be in the future. This is the date the clerk accepted your filing. Please verify.`);
              continue;
            }
            if (phase2Data?.marriageDate || extractedData['marriageDate']) {
              const marriageDate = parseDate((phase2Data?.marriageDate || extractedData['marriageDate']) as string);
              if (marriageDate && sDate < marriageDate) {
                validationWarnings.push(`Filing date cannot be before the marriage date. Please verify your dates.`);
                continue;
              }
            }
            extractedData[field] = value;
            continue;
          }

          // BREAKDOWN DATE VALIDATION — uses state-specific months
          if (field === 'breakdownDate') {
            const bDate = parseDate(value);
            if (!bDate) {
              validationWarnings.push(`Could not parse breakdown date. Please use format like "March 1, 2025".`);
              continue;
            }
            const breakdownMonths = stateConfig.breakdownMonths ?? 6;
            if (!isAtLeastMonthsAgo(bDate, breakdownMonths, canonicalNow)) {
              validationWarnings.push(`The breakdown date must be at least ${breakdownMonths} months before today (${canonicalDateStr}). Please verify.`);
              continue;
            }
            if (phase2Data?.marriageDate || extractedData['marriageDate']) {
              const marriageDate = parseDate((phase2Data?.marriageDate || extractedData['marriageDate']) as string);
              if (marriageDate && bDate < marriageDate) {
                validationWarnings.push(`Breakdown date cannot be before marriage date. Please verify your dates.`);
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
              validationWarnings.push(`Could not parse judgment entry date. Please use format like "February 28, 2027".`);
              continue;
            }
            const endOfToday = new Date(canonicalNow);
            endOfToday.setHours(23, 59, 59, 999);
            if (entryDate > endOfToday) {
              validationWarnings.push(`The Judgment entry date cannot be in the future. The Judgment must already be entered before proceeding. Please verify.`);
              continue;
            }
            if (phase2Data?.summonsDate) {
              const summonsDate = parseDate(phase2Data.summonsDate);
              if (summonsDate && entryDate < summonsDate) {
                validationWarnings.push(`Judgment entry date (${value}) cannot be before the filing date (${phase2Data.summonsDate}). Please verify.`);
                continue;
              }
            }
            if (phase2Data?.marriageDate) {
              const marriageDate = parseDate(phase2Data.marriageDate);
              if (marriageDate && entryDate < marriageDate) {
                validationWarnings.push(`Judgment entry date cannot be before the marriage date. Please verify.`);
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
              validationWarnings.push(`Index number format should be like "12345/2026". Please verify.`);
            }
            extractedData[field] = value;
            continue;
          }

          // DOCKET NUMBER VALIDATION (NJ)
          if (field === 'docketNumber') {
            const docketMatch = value.match(/^FM-/i);
            if (!docketMatch) {
              validationWarnings.push(`NJ docket number should start with "FM-" (e.g., FM-07-012345-26). Please verify.`);
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

    // FIX #7: More resilient outside-counsel check
    if (currentPhase === 2) {
      const hasAnyCaseNumber = extractedData['indexNumber'] || extractedData['docketNumber'];
      const phase1HasAnyData = phase1Data && Object.keys(phase1Data).length > 0;
      if (hasAnyCaseNumber && !phase1HasAnyData) {
        isDisqualified = true;
        disqualifyReason = 'outside_counsel_case';
      }
    }

    // SERVER-SIDE PHASE COMPLETION SAFETY NET
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
      const allPresent = p1Keys.every(f => merged[f]);
      if (allPresent) phase1Complete = true;
    }
    
    if (currentPhase === 2 && !phase2Complete) {
      const merged = { ...phase2Data, ...extractedData };
      const allPresent = p2Keys.every(f => merged[f]);
      if (allPresent) phase2Complete = true;
    }
    
    if (currentPhase === 3 && !phase3Complete) {
      const merged = { ...phase3Data, ...extractedData };
      const allPresent = p3Keys.every(f => merged[f]);
      if (allPresent) phase3Complete = true;
    }

    // Clean reply: strip JSON, append ALL validation warnings
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
