/**
 * Anthropic Messages API client (B7) — SERVER-ONLY, structured outputs.
 *
 * Provider decision (operator): the platform's SOLE model provider is
 * Anthropic (Claude Sonnet family). No fallback provider and no fallback
 * model — if the configured model is unavailable the call fails with an
 * INTERNAL configuration error; nothing is exposed to a client.
 *
 * - Structured output via a FORCED tool call: the action's JSON schema is
 *   presented as the single available tool and tool_choice pins it, so the
 *   model must return arguments matching that schema. The three-layer
 *   output validation in run-action (schema → citation allowlist →
 *   provenance refs) is unchanged and still rejects anything off-shape.
 * - Privacy-minimizing: no persisted conversation state; a privacy-
 *   preserving safety identifier (salted hash of the matter id — never an
 *   email or name) rides in metadata.user_id; bounded output tokens;
 *   request timeout; bounded retries (never on 4xx).
 * - Metadata-only logging: response ID, model, prompt version, latency,
 *   token usage. NEVER prompt contents, document text, or responses.
 * - No extended thinking is requested; no chain-of-thought is stored.
 */
import { createHmac } from "node:crypto";
import { envOptional, isProduction } from "@/lib/env";
import { appStage } from "@/config/stage";

const OFFICIAL_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5";

/**
 * Fail loudly on a key that cannot legally become an HTTP header value.
 *
 * Header values are ByteStrings: any code point above U+00FF makes fetch()
 * throw a TypeError SYNCHRONOUSLY, before a single byte reaches the network.
 * That surfaced in production as a generic 500 in ~71ms with no provider
 * error to read — a pasted key carrying U+2190 ("←") at index 28, almost
 * certainly a copy artifact from a rendered document or terminal.
 *
 * API keys are printable ASCII by construction, so anything outside
 * 0x21–0x7E is a paste artifact. The POSITION is reported so the operator
 * can find it; the key itself is NEVER logged or echoed.
 */
export function assertApiKeyCharset(key: string): string {
  for (let i = 0; i < key.length; i++) {
    const code = key.charCodeAt(i);
    if (code < 0x21 || code > 0x7e) {
      throw new AiConfigError(
        `AI_GUARD: ANTHROPIC_API_KEY contains an invalid character at position ${i} — re-enter the key in the environment settings`
      );
    }
  }
  return key;
}

/**
 * Resolve the Messages endpoint. ANTHROPIC_BASE_URL is a DEVELOPMENT-ONLY
 * testing override (offline mock server for acceptance dry-runs). Any
 * non-official base is refused in production builds (which is what every
 * deployed stage runs), so live staging/pilot traffic can never be
 * redirected away from the official endpoint.
 */
export function messagesUrl(): string {
  const base = envOptional("ANTHROPIC_BASE_URL");
  if (!base) return OFFICIAL_MESSAGES_URL;
  if (isProduction()) {
    throw new AiConfigError(
      `AI_GUARD: ANTHROPIC_BASE_URL override is refused in production builds (APP_STAGE=${appStage()}) — development testing only`
    );
  }
  return base.replace(/\/+$/, "") + "/messages";
}

export function aiModel(): string {
  return envOptional("ANTHROPIC_MODEL") ?? DEFAULT_ANTHROPIC_MODEL;
}
export function aiReviewModel(): string {
  return envOptional("ANTHROPIC_REVIEW_MODEL") ?? aiModel();
}
export function aiTimeoutMs(): number {
  const n = Number(process.env.AI_REQUEST_TIMEOUT_MS ?? "60000");
  return Number.isFinite(n) && n > 1000 ? n : 60000;
}
export function aiMaxOutputTokens(): number {
  const n = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? "4000");
  return Number.isFinite(n) && n > 100 ? n : 4000;
}
export function aiMaxRetries(): number {
  const n = Number(process.env.AI_MAX_RETRIES ?? "2");
  return Number.isFinite(n) && n >= 0 && n <= 5 ? n : 2;
}

/** Privacy-preserving safety identifier: salted hash, never PII. */
export function safetyIdentifier(matterId: string | null): string {
  const salt = process.env.AUDIT_HASH_SECRET ?? process.env.SESSION_SECRET ?? "dgpt";
  return "m-" + createHmac("sha256", salt).update(matterId ?? "no-matter").digest("hex").slice(0, 24);
}

export interface StructuredCallResult {
  parsed: unknown;
  responseId: string | null;
  model: string;
  latencyMs: number;
  tokensIn: number | null;
  tokensOut: number | null;
}

export class AiConfigError extends Error {}

/**
 * One structured-output call. Throws AiConfigError for configuration
 * problems (bad key, unknown model) and Error for transport/validation-
 * level failures. Callers own audit logging (metadata only).
 */
export async function callStructured(opts: {
  model: string;
  system: string;
  user: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  matterId: string | null;
}): Promise<StructuredCallResult> {
  const key = envOptional("ANTHROPIC_API_KEY");
  if (!key) throw new AiConfigError("AI_GUARD: ANTHROPIC_API_KEY is not configured");
  assertApiKeyCharset(key);

  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-api-key": key,
    "anthropic-version": ANTHROPIC_VERSION,
  };

  const body = JSON.stringify({
    model: opts.model,
    max_tokens: aiMaxOutputTokens(),
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
    tools: [
      {
        name: opts.schemaName,
        description:
          "Return the structured report for this action. Respond ONLY by calling this tool with arguments that match the schema exactly.",
        input_schema: opts.jsonSchema,
      },
    ],
    tool_choice: { type: "tool", name: opts.schemaName },
    metadata: { user_id: safetyIdentifier(opts.matterId) },
  });

  const endpoint = messagesUrl();
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= aiMaxRetries(); attempt++) {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), aiTimeoutMs());
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status === 401 || res.status === 403) {
        throw new AiConfigError("AI_GUARD: provider rejected credentials (check ANTHROPIC_API_KEY)");
      }
      if (res.status === 404 || res.status === 400) {
        // Model unavailable / bad request: configuration error — status code
        // only, never the response body (it can echo request content).
        const maybeModel = res.status === 404 ? " (configured model may be unavailable)" : "";
        throw new AiConfigError(
          `AI_GUARD: provider request invalid (HTTP ${res.status})${maybeModel} — no fallback model is attempted`
        );
      }
      if (!res.ok) {
        lastError = new Error(`AI_GUARD: provider request failed (HTTP ${res.status})`);
        continue; // retry 429/5xx/529
      }
      const data = (await res.json()) as {
        id?: string;
        model?: string;
        content?: { type: string; name?: string; input?: unknown; text?: string }[];
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      const block = data.content?.find((c) => c.type === "tool_use");
      if (!block || block.input === undefined || block.input === null) {
        throw new Error("AI_GUARD: provider returned no structured output");
      }
      return {
        parsed: block.input,
        responseId: data.id ?? null,
        model: data.model ?? opts.model,
        latencyMs: Date.now() - started,
        tokensIn: data.usage?.input_tokens ?? null,
        tokensOut: data.usage?.output_tokens ?? null,
      };
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof AiConfigError) throw e;
      lastError =
        e instanceof Error && e.name === "AbortError"
          ? new Error("AI_GUARD: provider request timed out")
          : e instanceof Error
            ? e
            : new Error("AI_GUARD: provider request failed");
    }
  }
  throw lastError ?? new Error("AI_GUARD: provider request failed");
}
