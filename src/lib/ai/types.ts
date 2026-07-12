/**
 * Internal AI layer — shared types.
 *
 * OpenAI is the ONLY AI provider in this system, and every use is INTERNAL
 * work product for STAFF/ATTORNEY: nothing generated here is ever shown to
 * a client without an attorney approving and releasing the exact version.
 */

export const AI_FEATURES = [
  "INTERNAL_SUMMARY",
  "ISSUE_LIST",
  "INCONSISTENCY_REVIEW",
  "DOCUMENT_DRAFT",
] as const;

export type AiFeature = (typeof AI_FEATURES)[number];

/**
 * Internal markers the prompts instruct the model to use. These flag
 * uncertainty for the reviewing attorney; they are internal-only strings.
 */
export const AI_MARKERS = {
  NOT_FOUND: "[not found]",
  INFERRED: "[inferred]",
  NEEDS_CITE_CHECK: "[needs cite check]",
  TREATMENT: "[TREATMENT?]",
} as const;

export interface AiInvocationInput {
  feature: AiFeature;
  matterId: string;
  /** app_user.id of the STAFF/ATTORNEY invoking — role is re-checked. */
  actingUserId: string;
  /** Structured facts assembled server-side (never raw client free text dumps). */
  context: Record<string, unknown>;
  /** Feature-specific instruction detail (e.g. which document to draft). */
  instruction?: string;
}

export interface AiInvocationResult {
  feature: AiFeature;
  model: string;
  /** Generated text — internal work product, review required. */
  text: string;
}

/** Thrown when AI_FEATURES_ENABLED != "true" or no API key is configured. */
export class AiDisabledError extends Error {
  constructor() {
    super("AI_DISABLED: internal AI features are switched off; manual workflows remain fully available");
  }
}
