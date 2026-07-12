/**
 * Internal document draft prompt — INTERNAL WORK PRODUCT ONLY.
 * Every generated draft is stored as an AI_DRAFT document version in
 * ATTORNEY_REVIEW_REQUIRED status; it cannot reach a client, a signature,
 * or a filing without an attorney approving and releasing that exact
 * version.
 */
import { AI_MARKERS } from "../types";
export { SYSTEM_PROMPT } from "./internal-summary";

export function buildPrompt(context: Record<string, unknown>, instruction?: string): string {
  return [
    "Draft the INTERNAL working document described below from the structured facts. This is a first draft for attorney revision — not a final, not for filing, not for the client.",
    `Instruction from firm staff: ${instruction ?? "(none provided)"}`,
    `Where a fact is missing write ${AI_MARKERS.NOT_FOUND}; inferred content gets ${AI_MARKERS.INFERRED}; legal propositions get ${AI_MARKERS.NEEDS_CITE_CHECK}; alternative treatments get ${AI_MARKERS.TREATMENT}.`,
    "Facts:",
    JSON.stringify(context, null, 2),
  ].join("\n\n");
}
