/**
 * Inconsistency review prompt — INTERNAL WORK PRODUCT ONLY.
 */
import { AI_MARKERS } from "../types";
export { SYSTEM_PROMPT } from "./internal-summary";

export function buildPrompt(context: Record<string, unknown>): string {
  return [
    "Review the structured intake facts below for INTERNAL quality control.",
    "List: (1) internal inconsistencies (dates, amounts, contradictory answers); (2) implausible or incomplete entries; (3) items the firm should verify against source documents.",
    `Mark absent data ${AI_MARKERS.NOT_FOUND} and inferences ${AI_MARKERS.INFERRED}. Do not draw legal conclusions; flag ambiguities with ${AI_MARKERS.TREATMENT}.`,
    "Facts:",
    JSON.stringify(context, null, 2),
  ].join("\n\n");
}
