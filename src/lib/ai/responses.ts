/**
 * Structured-output client (B7) — SERVER-ONLY.
 *
 * PROVIDER-AGNOSTIC since 2026-08-01. Everything provider-specific (endpoint,
 * auth header, forced-tool syntax, response shape) lives in ./providers.ts;
 * this file owns what must NEVER vary by provider: the retry policy, the
 * timeout, the error taxonomy, and the rule that there is no fallback.
 *
 * Provider is chosen PER CALL SITE, not globally — the intake bot can run on
 * one provider while the attorney workbench stays on another. There is still
 * no fallback provider and no fallback model: if the configured model is
 * unavailable the call fails with an INTERNAL configuration error and nothing
 * is exposed to a client.
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
import { envOptional } from "@/lib/env";
import {
  adapterFor,
  anthropicAdapter,
  type AiProvider,
  type ProviderAdapter,
} from "./providers";
import { AiConfigError } from "./errors";

export { AiConfigError };
export type { AiProvider };

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
export function assertApiKeyCharset(key: string, envVar = "ANTHROPIC_API_KEY"): string {
  for (let i = 0; i < key.length; i++) {
    const code = key.charCodeAt(i);
    if (code < 0x21 || code > 0x7e) {
      throw new AiConfigError(
        `AI_GUARD: ${envVar} contains an invalid character at position ${i} — re-enter the key in the environment settings`
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
  return anthropicAdapter.endpoint();
}

export function aiModel(): string {
  return envOptional("ANTHROPIC_MODEL") ?? DEFAULT_ANTHROPIC_MODEL;
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

/**
 * One structured-output call. Throws AiConfigError for configuration problems
 * (bad key, unknown model, base-URL override in production) and Error for
 * transport/validation-level failures. Callers own audit logging (metadata
 * only).
 *
 * `provider` defaults to anthropic, so every existing call site is unchanged.
 */
export async function callStructured(opts: {
  model: string;
  system: string;
  user: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  matterId: string | null;
  provider?: AiProvider;
}): Promise<StructuredCallResult> {
  const adapter: ProviderAdapter = opts.provider ? adapterFor(opts.provider) : anthropicAdapter;

  const key = envOptional(adapter.apiKeyEnv);
  if (!key) throw new AiConfigError(`AI_GUARD: ${adapter.apiKeyEnv} is not configured`);
  assertApiKeyCharset(key, adapter.apiKeyEnv);

  const headers = adapter.headers(key);
  const body = adapter.body({
    model: opts.model,
    system: opts.system,
    user: opts.user,
    schemaName: opts.schemaName,
    jsonSchema: opts.jsonSchema,
    safetyId: safetyIdentifier(opts.matterId),
    maxOutputTokens: aiMaxOutputTokens(),
  });
  const endpoint = adapter.endpoint();

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
        throw new AiConfigError(
          `AI_GUARD: provider rejected credentials (check ${adapter.apiKeyEnv})`
        );
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
      const out = adapter.parse(await res.json());
      return {
        parsed: out.parsed,
        responseId: out.responseId,
        model: out.model ?? opts.model,
        latencyMs: Date.now() - started,
        tokensIn: out.tokensIn,
        tokensOut: out.tokensOut,
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
