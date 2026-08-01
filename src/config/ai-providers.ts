/**
 * WHICH provider and model each call site uses — configuration, not client.
 *
 * This module deliberately imports NOTHING from `@/lib/ai/`. That direction
 * matters: `/api/health` has to report how the AI is configured, and a
 * standing tripwire (tests/ai-layer.test.ts) forbids any client-reachable
 * route from importing the AI layer. So the AI layer imports its registry from
 * HERE, and health reads the same configuration without pulling a provider
 * client into a public route.
 *
 * ── ONE SWITCH ──────────────────────────────────────────────────────────
 * Operator, 2026-08-01: "Swap out the API call to GPT Terra… ALL of it. Man we
 * have so many env variables."
 *
 * He is right, so the rows collapsed. To move the entire platform to a new
 * provider you now set TWO rows:
 *
 *     AI_PROVIDER=openai
 *     OPENAI_API_KEY=...
 *
 * and to roll the entire platform back you delete one. Everything else is an
 * optional override that almost nobody should ever need.
 *
 * WHY THE KEYS ARE STILL NAMED PER PROVIDER, and always will be: they are
 * different credentials from different vendors with different billing. A
 * single AI_API_KEY row would make "I pasted the wrong key" a silent
 * cross-vendor auth failure instead of a clear one, and would leave a stale
 * secret in an env row nobody remembers is live. Two named rows can coexist
 * safely; one shared row cannot.
 *
 * ── TIERS ───────────────────────────────────────────────────────────────
 * Two jobs, two default models, because they are genuinely different work:
 *
 *   intake     — narrow. The sequencer owns question order, the machine owns
 *                the gates, the server disposes every proposal. The model only
 *                phrases the given step and interprets one reply through a
 *                forced schema. Cheapest tier that can do that.
 *   workbench  — the attorney's document analysis and internal actions.
 *                Reads real case material and produces work product a lawyer
 *                relies on. Stronger tier.
 */
import { envOptional } from "@/lib/env";

export const AI_PROVIDERS = ["anthropic", "openai"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export const AI_TIERS = ["intake", "workbench"] as const;
export type AiTier = (typeof AI_TIERS)[number];

export function isAiProvider(v: string): v is AiProvider {
  return (AI_PROVIDERS as readonly string[]).includes(v);
}

/** Each provider reads its OWN key — see the header for why this never merges. */
export const PROVIDER_KEY_ENV: Record<AiProvider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
};

/** DEV-ONLY endpoint override per provider; refused in production builds. */
export const PROVIDER_BASE_URL_ENV: Record<AiProvider, string> = {
  anthropic: "ANTHROPIC_BASE_URL",
  openai: "OPENAI_BASE_URL",
};

/**
 * Verified current API model ids (Anthropic docs 2026-07-26; OpenAI docs
 * 2026-08-01). Operator directive 2026-08-01 put BOTH tiers on Terra.
 *
 * Worth knowing when reviewing this table: on the OpenAI side the closest
 * analogue to Sonnet for the workbench tier is Sol, not Terra — Terra is the
 * "balanced production" tier and Sol is the one described for deep reasoning.
 * Terra is what was asked for; AI_MODEL_WORKBENCH=gpt-5.6-sol is a one-row
 * change if the workbench output turns out thinner than Sonnet's.
 */
export const DEFAULT_MODELS: Record<AiProvider, Record<AiTier, string>> = {
  anthropic: {
    intake: "claude-haiku-4-5",
    workbench: "claude-sonnet-5",
  },
  openai: {
    intake: "gpt-5.6-terra",
    workbench: "gpt-5.6-terra",
  },
};

export class IntakeProviderConfigError extends Error {}

function readProvider(envVar: string, fallback: AiProvider | null): AiProvider | null {
  const raw = envOptional(envVar);
  if (!raw) return fallback;
  const norm = raw.trim().toLowerCase();
  if (!isAiProvider(norm)) {
    throw new IntakeProviderConfigError(
      `AI_GUARD: ${envVar}="${norm}" is not a known provider (expected: ${AI_PROVIDERS.join(", ")})`
    );
  }
  return norm;
}

/**
 * The provider for a tier.
 *
 * AI_PROVIDER is the one switch. A tier-specific row exists so the intake can
 * be moved alone for an experiment without dragging the attorney workbench
 * with it — but it is an override, not the normal control.
 *
 * An unrecognised name FAILS LOUDLY. Silently running on a different provider
 * than the operator asked for is exactly the class of surprise AI_GUARD exists
 * to prevent.
 */
export function aiProviderFor(tier: AiTier): AiProvider {
  const globalDefault = readProvider("AI_PROVIDER", "anthropic")!;
  if (tier === "intake") {
    // INTAKE_AI_PROVIDER predates AI_PROVIDER (2026-08-01 morning). Still
    // honoured so an environment configured earlier today keeps working.
    return readProvider("INTAKE_AI_PROVIDER", globalDefault)!;
  }
  return readProvider("AI_PROVIDER_WORKBENCH", globalDefault)!;
}

/**
 * The model for a tier: the explicit override, else the provider's default for
 * that tier.
 *
 * The pre-consolidation rows still resolve on the ANTHROPIC path only, so an
 * environment configured before today keeps working untouched. They
 * deliberately do NOT leak onto another provider — ANTHROPIC_MODEL naming an
 * OpenAI model would be nonsense, and silently honouring it would be worse.
 */
export function aiModelFor(tier: AiTier): string {
  const provider = aiProviderFor(tier);

  if (tier === "intake") {
    const explicit = envOptional("AI_MODEL_INTAKE") || envOptional("INTAKE_MODEL");
    if (explicit) return explicit;
    if (provider === "anthropic") {
      const legacy = envOptional("ANTHROPIC_INTAKE_MODEL") || envOptional("ANTHROPIC_MODEL");
      if (legacy) return legacy;
    }
    return DEFAULT_MODELS[provider].intake;
  }

  const explicit = envOptional("AI_MODEL_WORKBENCH");
  if (explicit) return explicit;
  if (provider === "anthropic") {
    const legacy = envOptional("ANTHROPIC_MODEL");
    if (legacy) return legacy;
  }
  return DEFAULT_MODELS[provider].workbench;
}

/* ── narrow aliases, so call sites read plainly ──────────────────────── */

export const intakeChatProvider = () => aiProviderFor("intake");
export const intakeChatModel = () => aiModelFor("intake");
