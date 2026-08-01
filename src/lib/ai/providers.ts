/**
 * PROVIDER SEAM for structured-output calls (2026-08-01).
 *
 * Operator, earlier this month: "I'm an API reseller. So, I'd like to make
 * something so that I can swap out the provider on a whim." So the swap is an
 * ENV FLIP, not an edit — which also means the rollback is an env flip.
 *
 * Everything provider-specific lives behind this one interface: the endpoint,
 * the auth header, how a forced tool call is expressed, and how the structured
 * arguments come back. `callStructured` in responses.ts owns the parts that
 * must NOT vary by provider — the retry policy, the timeout, the error
 * taxonomy, and the rule that there is never a fallback model.
 *
 * The AI_GUARD posture is identical on every adapter:
 *   401/403      → AiConfigError (credentials)
 *   400/404      → AiConfigError (bad request / unknown model), status code
 *                  ONLY, never the response body — it can echo request content
 *   429/5xx      → retry, bounded
 *   no tool call → hard error, never a prose fallback
 *
 * BASE-URL OVERRIDES ARE REFUSED IN PRODUCTION, per provider. The override
 * exists for offline mock servers during acceptance dry-runs; live traffic can
 * never be redirected away from the official endpoint. That guard is
 * per-provider allowlisting, NOT removal.
 */
import { envOptional, isProduction } from "@/lib/env";
import { appStage } from "@/config/stage";
import { AiConfigError } from "./errors";
// The registry lives in config, NOT here: /api/health must report the intake
// provider without importing the AI layer (tests/ai-layer.test.ts).
import {
  AI_PROVIDERS,
  PROVIDER_KEY_ENV,
  PROVIDER_BASE_URL_ENV,
  isAiProvider,
  type AiProvider,
} from "@/config/ai-providers";

export { AI_PROVIDERS, isAiProvider };
export type { AiProvider };

export interface ProviderRequest {
  model: string;
  system: string;
  user: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  /** Salted hash of the matter id — never PII. */
  safetyId: string;
  maxOutputTokens: number;
}

export interface ProviderResponse {
  parsed: unknown;
  responseId: string | null;
  model: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
}

export interface ProviderAdapter {
  id: AiProvider;
  /** Env var holding the key, named in operator-facing errors. */
  apiKeyEnv: string;
  /** Env var holding the DEV-ONLY base override. */
  baseUrlEnv: string;
  endpoint(): string;
  headers(apiKey: string): Record<string, string>;
  body(req: ProviderRequest): string;
  /** Throws if the provider returned no structured tool call. */
  parse(data: unknown): ProviderResponse;
}

/**
 * Shared base-URL resolution: official unless overridden, and an override is
 * refused outright in production builds (which is what every deployed stage
 * runs).
 */
function resolveEndpoint(opts: {
  envVar: string;
  official: string;
  path: string;
}): string {
  const base = envOptional(opts.envVar);
  if (!base) return opts.official;
  if (isProduction()) {
    throw new AiConfigError(
      `AI_GUARD: ${opts.envVar} override is refused in production builds (APP_STAGE=${appStage()}) — development testing only`
    );
  }
  return base.replace(/\/+$/, "") + opts.path;
}

/* ── Anthropic ───────────────────────────────────────────────────────── */

export const OFFICIAL_ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export const anthropicAdapter: ProviderAdapter = {
  id: "anthropic",
  apiKeyEnv: PROVIDER_KEY_ENV.anthropic,
  baseUrlEnv: PROVIDER_BASE_URL_ENV.anthropic,

  endpoint() {
    return resolveEndpoint({
      envVar: PROVIDER_BASE_URL_ENV.anthropic,
      official: OFFICIAL_ANTHROPIC_MESSAGES_URL,
      path: "/messages",
    });
  },

  headers(apiKey) {
    return {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    };
  },

  body(req) {
    return JSON.stringify({
      model: req.model,
      max_tokens: req.maxOutputTokens,
      system: req.system,
      messages: [{ role: "user", content: req.user }],
      tools: [
        {
          name: req.schemaName,
          description:
            "Return the structured report for this action. Respond ONLY by calling this tool with arguments that match the schema exactly.",
          input_schema: req.jsonSchema,
        },
      ],
      tool_choice: { type: "tool", name: req.schemaName },
      metadata: { user_id: req.safetyId },
    });
  },

  parse(data) {
    const d = (data ?? {}) as {
      id?: string;
      model?: string;
      content?: { type: string; name?: string; input?: unknown }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const block = d.content?.find((c) => c.type === "tool_use");
    if (!block || block.input === undefined || block.input === null) {
      throw new Error("AI_GUARD: provider returned no structured output");
    }
    return {
      parsed: block.input, // already an object
      responseId: d.id ?? null,
      model: d.model ?? null,
      tokensIn: d.usage?.input_tokens ?? null,
      tokensOut: d.usage?.output_tokens ?? null,
    };
  },
};

/* ── OpenAI ──────────────────────────────────────────────────────────── */

export const OFFICIAL_OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

export const openaiAdapter: ProviderAdapter = {
  id: "openai",
  apiKeyEnv: PROVIDER_KEY_ENV.openai,
  baseUrlEnv: PROVIDER_BASE_URL_ENV.openai,

  endpoint() {
    return resolveEndpoint({
      envVar: PROVIDER_BASE_URL_ENV.openai,
      official: OFFICIAL_OPENAI_CHAT_URL,
      path: "/chat/completions",
    });
  },

  headers(apiKey) {
    return {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    };
  },

  body(req) {
    return JSON.stringify({
      model: req.model,
      // OpenAI's reasoning-capable models take max_completion_tokens; the old
      // max_tokens is rejected on them.
      max_completion_tokens: req.maxOutputTokens,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.user },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: req.schemaName,
            description:
              "Return the structured report for this action. Respond ONLY by calling this tool with arguments that match the schema exactly.",
            // strict:true is why INTAKE_TURN_SCHEMA had to become
            // provider-portable in 7fe648d — every property required, null
            // unions for optional, and no unconstrained `{}` values.
            parameters: req.jsonSchema,
            strict: true,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: req.schemaName } },
      // Same privacy posture as the Anthropic metadata.user_id: a salted hash
      // of the matter id, never an email or a name.
      user: req.safetyId,
    });
  },

  parse(data) {
    const d = (data ?? {}) as {
      id?: string;
      model?: string;
      choices?: {
        message?: {
          tool_calls?: { function?: { name?: string; arguments?: string } }[];
        };
      }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const args = d.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (typeof args !== "string" || args.length === 0) {
      // Covers a refusal, a prose answer, or a stop before the tool call.
      throw new Error("AI_GUARD: provider returned no structured output");
    }
    let parsed: unknown;
    try {
      // UNLIKE Anthropic, the arguments arrive as a STRING.
      parsed = JSON.parse(args);
    } catch {
      // Never echo the body — it can carry request content.
      throw new Error("AI_GUARD: provider returned unparseable structured output");
    }
    return {
      parsed,
      responseId: d.id ?? null,
      model: d.model ?? null,
      tokensIn: d.usage?.prompt_tokens ?? null,
      tokensOut: d.usage?.completion_tokens ?? null,
    };
  },
};

const ADAPTERS: Record<AiProvider, ProviderAdapter> = {
  anthropic: anthropicAdapter,
  openai: openaiAdapter,
};

export function adapterFor(provider: AiProvider): ProviderAdapter {
  const a = ADAPTERS[provider];
  if (!a) throw new AiConfigError(`AI_GUARD: unknown AI provider "${provider}"`);
  return a;
}
