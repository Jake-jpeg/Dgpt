/**
 * OpenAI Responses API client (B7) — SERVER-ONLY, structured outputs.
 *
 * - Single provider; if the configured model is unavailable the call fails
 *   with an INTERNAL configuration error — no silent vendor or model
 *   switch, and nothing is exposed to a client.
 * - Privacy-minimizing: store=false; a privacy-preserving safety identifier
 *   (salted hash of the matter id — never an email or name); no persisted
 *   conversation state; bounded output tokens; request timeout; bounded
 *   retries (never on 4xx).
 * - Metadata-only logging: response ID, model, prompt version, latency,
 *   token usage. NEVER prompt contents, document text, or responses.
 * - No chain-of-thought is requested or stored.
 */
import { createHmac } from "node:crypto";
import { envOptional, isProduction } from "@/lib/env";
import { appStage } from "@/config/stage";

const OFFICIAL_RESPONSES_URL = "https://api.openai.com/v1/responses";

/**
 * Resolve the Responses endpoint. OPENAI_BASE_URL is a DEVELOPMENT-ONLY
 * testing override (offline mock server for acceptance dry-runs). Any
 * non-official base is refused in production builds (which is what every
 * deployed stage runs), so live staging/pilot traffic can never be
 * redirected away from the official endpoint.
 */
export function responsesUrl(): string {
  const base = envOptional("OPENAI_BASE_URL");
  if (!base) return OFFICIAL_RESPONSES_URL;
  if (isProduction()) {
    throw new AiConfigError(
      `AI_GUARD: OPENAI_BASE_URL override is refused in production builds (APP_STAGE=${appStage()}) — development testing only`
    );
  }
  return base.replace(/\/+$/, "") + "/responses";
}

export function aiModel(): string {
  return envOptional("OPENAI_MODEL") ?? "gpt-4o-mini";
}
export function aiReviewModel(): string {
  return envOptional("OPENAI_REVIEW_MODEL") ?? aiModel();
}
export function aiTimeoutMs(): number {
  const n = Number(process.env.OPENAI_REQUEST_TIMEOUT_MS ?? "60000");
  return Number.isFinite(n) && n > 1000 ? n : 60000;
}
export function aiMaxOutputTokens(): number {
  const n = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS ?? "4000");
  return Number.isFinite(n) && n > 100 ? n : 4000;
}
export function aiMaxRetries(): number {
  const n = Number(process.env.OPENAI_MAX_RETRIES ?? "2");
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
  const key = envOptional("OPENAI_API_KEY");
  if (!key) throw new AiConfigError("AI_GUARD: OPENAI_API_KEY is not configured");

  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${key}`,
  };
  const org = envOptional("OPENAI_ORG_ID");
  const project = envOptional("OPENAI_PROJECT_ID");
  if (org) headers["OpenAI-Organization"] = org;
  if (project) headers["OpenAI-Project"] = project;

  const body = JSON.stringify({
    model: opts.model,
    input: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    text: {
      format: {
        type: "json_schema",
        name: opts.schemaName,
        strict: true,
        schema: opts.jsonSchema,
      },
    },
    max_output_tokens: aiMaxOutputTokens(),
    store: false,
    safety_identifier: safetyIdentifier(opts.matterId),
  });

  const endpoint = responsesUrl();
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
        throw new AiConfigError("AI_GUARD: provider rejected credentials (check key/org/project)");
      }
      if (res.status === 404 || res.status === 400) {
        // Model unavailable / bad request: configuration error — status code
        // only, never the response body (it can echo request content).
        const maybeModel = res.status === 404 ? " (configured model may be unavailable)" : "";
        throw new AiConfigError(`AI_GUARD: provider request invalid (HTTP ${res.status})${maybeModel} — no fallback model is attempted`);
      }
      if (!res.ok) {
        lastError = new Error(`AI_GUARD: provider request failed (HTTP ${res.status})`);
        continue; // retry 5xx/429
      }
      const data = (await res.json()) as {
        id?: string;
        model?: string;
        output?: { type: string; content?: { type: string; text?: string }[] }[];
        output_text?: string;
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      const text =
        data.output_text ??
        data.output
          ?.flatMap((o) => o.content ?? [])
          .filter((c) => c.type === "output_text" || c.type === "text")
          .map((c) => c.text ?? "")
          .join("") ??
        "";
      if (!text) throw new Error("AI_GUARD: provider returned no structured text");
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("AI_GUARD: provider returned non-JSON structured output");
      }
      return {
        parsed,
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
