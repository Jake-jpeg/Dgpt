/**
 * What the SECOND spouse is asked (2026-10-31).
 *
 * The firm represents party A only. Party B is the other spouse — an
 * unrepresented adverse party in RPC 4.3 terms. Gathering from them the
 * facts the court papers require and their own statement of the agreement's
 * terms is ordinary uncontested-divorce practice (an affidavit of defendant
 * says as much). Interviewing them about their goals, their finances beyond
 * what support needs, their safety, or "anything else your attorney should
 * know" is not: it elicits confidences from someone the firm does not
 * represent, in a counseling register, and lands them on opposing counsel's
 * desk. Operator ruling (Jake, 2026-10-31): "B confirms, nothing else. B is
 * advised of rights."
 *
 * So B's schema is A's schema MINUS the sections below, PLUS one question —
 * whether they are agreeing freely. B never sees A's answers; the attorney
 * compares the two statements of the terms (src/lib/compare).
 *
 * This is a server-side scope: saveMatterAnswers validates B's answers
 * against THIS schema, so a B client cannot post an answer to an excluded
 * item, whatever the page shows.
 */
import type { IntakeItem, IntakeSchema, IntakeSection } from "./types";

export type PartyId = "A" | "B";

/** Sections party B is never asked. */
export const B_EXCLUDED_SECTIONS: ReadonlySet<string> = new Set([
  "safety", // replaced by the single voluntariness question below
  "goals", // "your goals & concerns" — advice-adjacent, A only
  "expenses", // monthly expenses — Statement of Net Worth material, A only
  "taxes",
  "special", // "anything else your attorney should know?" — not B's attorney
  "documents", // the firm requests documents from its client, not from B
  "review",
  "property_history", // how property was acquired — characterisation is A's attorney's analysis
  "ny_financial", // Statement of Net Worth preparation — A's sworn statement
  "ny_scope",
  "nj_scope", // the scope gate is decided on A's case
  "ny_postjudgment",
]);

export const VOLUNTARY_SECTION: IntakeSection = {
  id: "voluntary",
  title: "Your agreement",
  description:
    "You answer for yourself. The firm represents your spouse, not you, and cannot advise you; you may speak with your own attorney at any time.",
  order: 2,
};

export const VOLUNTARY_ITEM_ID = "party_b.voluntary";

export const VOLUNTARY_ITEM: IntakeItem = {
  id: VOLUNTARY_ITEM_ID,
  jurisdiction: "SHARED",
  section: "voluntary",
  prompt: "Are you agreeing to this divorce and its terms freely — without pressure from anyone?",
  helpText:
    "Answer honestly. A 'no' does not stop anything or tell your spouse; it tells the attorney to speak with you before any papers are prepared. If you are in danger right now, call 911.",
  type: "yes_no",
  required: true,
  sensitive: true,
  audience: "CLIENT",
  authorityIds: [], // purely factual
  reviewStatus: "APPROVED",
};

/** The schema a given party is interviewed against. A = the firm's client, unchanged. */
export function schemaForParty(schema: IntakeSchema, party: PartyId): IntakeSchema {
  if (party !== "B") return schema;
  const sections = schema.sections
    .filter((s) => !B_EXCLUDED_SECTIONS.has(s.id))
    .concat(VOLUNTARY_SECTION)
    .sort((a, b) => a.order - b.order);
  const items = [VOLUNTARY_ITEM, ...schema.items.filter((i) => !B_EXCLUDED_SECTIONS.has(i.section))];
  return { ...schema, id: `${schema.id}#B`, sections, items };
}

/** True when the stored answer says the second spouse is NOT agreeing freely. */
export function pressureReported(answers: Record<string, unknown>): boolean {
  return answers[VOLUNTARY_ITEM_ID] === false;
}
