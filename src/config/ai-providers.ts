/**
 * WHICH provider and model each call site uses — configuration, not client.
 *
 * This module deliberately imports NOTHING from `@/lib/ai/`. That direction
 * matters: `/api/health` has to report how the intake bot is configured, and a
 * standing tripwire (tests/ai-layer.test.ts) forbids any client-reachable
 * route from importing the AI layer. So the AI layer imports its registry from
 * HERE, and health reads the same configuration without pulling a provider
 * client into a public route.
 *
 * Operator, 2026-07-31: "we're switching from Haiku to GPT Terra." Earlier the
 * same month: "I'm an API reseller. So, I'd like to make something so that I
 * can swap out the provider on a whim." Hence: env rows, resolved per call
 * site, so the swap AND the rollback are env flips rather than deploys.
 */
import { envOptional } from "@/lib/env";

export const AI_PROVIDERS = ["anthropic", "openai"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export function isAiProvider(v: string): v is AiProvider {
  return (AI_PROVIDERS as readonly string[]).includes(v);
}

/** Each provider reads its OWN key — there is no shared credential row. */
export const PROVIDER_KEY_ENV: Record<AiProvider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
};

/** DEV-ONLY endpoint override per provider; refused in production builds. */
export const PROVIDER_BASE_URL_ENV: Record<AiProvider, string> = {
  anthropic: "ANTHROPIC_BASE_URL",
  openai: "OPENAI_BASE_URL",
};

export const DEFAULT_INTAKE_MODEL: Record<AiProvider, string> = {
  // Operator decision 2026-07-26: the fastest tier, because the intake turn is
  // a narrow job — the sequencer owns question order, the machine owns the
  // gates, the server disposes every proposal.
  anthropic: "claude-haiku-4-5",
  // Operator directive 2026-07-31. Verified current API model id, OpenAI docs
  // 2026-08-01.
  openai: "gpt-5.6-terra",
};

export class IntakeProviderConfigError extends Error {}

/**
 * The intake bot's provider. INTAKE_BOT ONLY — the attorney workbench
 * (run-action.ts) and internal actions resolve their own model and are
 * unaffected by this row.
 *
 * An unrecognised name FAILS LOUDLY. Silently falling back to a different
 * provider than the operator asked for is exactly the class of surprise
 * AI_GUARD exists to prevent.
 */
export function intakeChatProvider(): AiProvider {
  const raw = (envOptional("INTAKE_AI_PROVIDER") || "anthropic").trim().toLowerCase();
  if (!isAiProvider(raw)) {
    throw new IntakeProviderConfigError(
      `AI_GUARD: INTAKE_AI_PROVIDER="${raw}" is not a known provider (expected: ${AI_PROVIDERS.join(", ")})`
    );
  }
  return raw;
}

/**
 * The intake bot's model.
 *
 * INTAKE_MODEL wins outright. Otherwise the provider's default, except that
 * the pre-2026-08-01 rows (ANTHROPIC_INTAKE_MODEL, then ANTHROPIC_MODEL) still
 * resolve on the anthropic path, so an environment configured before the seam
 * existed keeps working untouched.
 */
export function intakeChatModel(): string {
  const explicit = envOptional("INTAKE_MODEL");
  if (explicit) return explicit;
  const provider = intakeChatProvider();
  if (provider === "anthropic") {
    return (
      envOptional("ANTHROPIC_INTAKE_MODEL") ||
      envOptional("ANTHROPIC_MODEL") ||
      DEFAULT_INTAKE_MODEL.anthropic
    );
  }
  return DEFAULT_INTAKE_MODEL[provider];
}
