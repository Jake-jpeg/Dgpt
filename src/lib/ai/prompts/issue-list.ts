/**
 * Issue-spotting list prompt — INTERNAL WORK PRODUCT ONLY.
 */
import { AI_MARKERS } from "../types";
export { SYSTEM_PROMPT } from "./internal-summary";

export function buildPrompt(context: Record<string, unknown>): string {
  return [
    "From the structured intake facts below, produce an INTERNAL issue list for the reviewing attorney.",
    `For each issue: a one-line statement, why it matters, and what is missing (use ${AI_MARKERS.NOT_FOUND} / ${AI_MARKERS.INFERRED} / ${AI_MARKERS.NEEDS_CITE_CHECK} / ${AI_MARKERS.TREATMENT} as instructed).`,
    "Do NOT recommend a course of action to the client; frame everything as items for attorney evaluation.",
    "Facts:",
    JSON.stringify(context, null, 2),
  ].join("\n\n");
}
