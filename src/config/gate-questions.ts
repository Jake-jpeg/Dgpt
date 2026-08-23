/**
 * ATTORNEY-CONTROLLED CONFIG — the scope-gate questions, in the fixed order
 * the server walks them. These are blunt coded filters, not legal judgment:
 * a DV disclosure is out, complexity/children trips are out, and the NY
 * residency cascade FLAGS for attorney review but never rejects a client on
 * residency alone. The server (src/lib/intake/scope-gate.ts) owns the
 * evaluation; this file owns the wording.
 *
 * [ATTORNEY REVIEW REQUIRED — NY] Residency cascade implemented per the
 * approved DRL § 230 design: the objective paths (two-year residence;
 * one-year residence + married in NY / lived in NY as spouses) are automated;
 * the cause-occurred paths are deliberately left to attorney review via the
 * RESIDENCY_ATTORNEY_REVIEW flag. Nothing here disqualifies on residency.
 */
import type { ProcessCopyId } from "./process-copy";
import type { CardId } from "./cards";
import { NY_COUNTIES, NJ_COUNTIES } from "./intake-fields";

export interface GateQuestion {
  /** Matches the machine state that asks it. */
  state:
    | "GATE_RESIDENCY"
    | "GATE_RESIDENCY_1YR"
    | "GATE_RESIDENCY_NEXUS"
    | "GATE_VENUE"
    | "GATE_DV"
    | "GATE_CHILDREN"
    | "GATE_COMPLEXITY";
  prompt: string;
  whyId: ProcessCopyId;
  kind: "yesno" | "county" | "choice";
  options?: { value: string; label: string }[];
  /** Which static card is served when the gate trips. */
  outCard?: CardId;
}

export const GATE_QUESTIONS: Record<GateQuestion["state"], GateQuestion> = {
  GATE_RESIDENCY: {
    state: "GATE_RESIDENCY",
    // DRL § 230(5) two-year path. "Yes" satisfies residency outright.
    prompt:
      "Have you or your spouse lived in New York State continuously for at least the past 2 years?",
    whyId: "WHY_RESIDENCY",
    kind: "yesno",
    // Never disqualifies — "no" continues to the one-year question.
  },
  GATE_RESIDENCY_1YR: {
    state: "GATE_RESIDENCY_1YR",
    // DRL § 230(1)-(4) one-year paths, first prong.
    prompt:
      "Have you or your spouse lived in New York State continuously for at least the past 1 year?",
    whyId: "WHY_RESIDENCY",
    kind: "yesno",
    // Never disqualifies — "no" flags for attorney review and continues.
  },
  GATE_RESIDENCY_NEXUS: {
    state: "GATE_RESIDENCY_NEXUS",
    // DRL § 230(1)-(2) second prong: NY marriage or NY marital residence.
    // The cause-occurred alternatives are NOT asked here — attorney review.
    prompt:
      "Were you married in New York, or did you and your spouse ever live in New York together as a married couple?",
    whyId: "WHY_RESIDENCY",
    kind: "yesno",
    // Never disqualifies — "no" flags for attorney review and continues.
  },
  GATE_VENUE: {
    state: "GATE_VENUE",
    // Collect-only: all 62 NY counties plus "I'm not sure". Venue is the
    // attorney's call — "not sure" flags for review and continues.
    prompt: "Which New York county do you live in?",
    whyId: "WHY_VENUE",
    kind: "county",
    options: [
      ...NY_COUNTIES.map((c) => ({ value: c, label: c })),
      { value: "UNSURE", label: "I'm not sure" },
    ],
    // never disqualifies
  },
  GATE_DV: {
    state: "GATE_DV",
    // Deliberately broad and plain: past or present, resolved or active.
    // The software's only job at this question is to recognize DV, stop,
    // and direct to a person. It never assesses severity, never proceeds.
    prompt:
      "Is there now, or has there ever been, domestic violence or a restraining order between you and your spouse?",
    whyId: "WHY_DV",
    kind: "yesno",
    outCard: "DV_RESOURCES", // ANY "yes" → hard out, human handoff, no data retained
  },
  GATE_CHILDREN: {
    state: "GATE_CHILDREN",
    prompt:
      "Do you and your spouse have any children together who are under 18 or still dependent?",
    whyId: "WHY_CHILDREN",
    kind: "yesno",
    outCard: "NY_BAR_REFERRAL", // custody tier is deferred — out for now
  },
  GATE_COMPLEXITY: {
    state: "GATE_COMPLEXITY",
    prompt:
      "Do you fully agree on how everything is divided, or is there anything you're unsure about or disagree on?",
    whyId: "WHY_COMPLEXITY",
    kind: "choice",
    options: [
      { value: "FULLY_AGREE", label: "We fully agree on everything" },
      { value: "SOME_UNCERTAINTY", label: "There are things we're unsure about" },
      { value: "DISAGREEMENT", label: "We disagree on some things" },
      {
        value: "NEED_VALUATION",
        label: "We'd need an accountant, appraiser, or business valuation",
      },
    ],
    outCard: "NY_BAR_REFERRAL", // anything but FULLY_AGREE → out
  },
};

/* ── New Jersey (the second playbook) ─────────────────────────────────
 * "Two separate bots for two separate states" (operator, 2026-08): the NJ
 * interview never speaks New York law and vice versa. NJ residency is ONE
 * flat rule — N.J.S.A. 2A:34-10, one year of continuous residence — so
 * there is no cascade: one residency question, then venue. DV, children,
 * and complexity are deliberately IDENTICAL to New York (same objects, not
 * copies): those gates are about safety and scope, not state law.
 */
const NJ_GATE_OVERRIDES: Partial<Record<GateQuestion["state"], GateQuestion>> = {
  GATE_RESIDENCY: {
    state: "GATE_RESIDENCY",
    // N.J.S.A. 2A:34-10 flat one-year rule. "Yes" satisfies residency
    // outright; "no" is a hard stop to attorney review (no second question).
    prompt:
      "Have you or your spouse lived in New Jersey continuously for at least the past 1 year?",
    whyId: "WHY_RESIDENCY",
    kind: "yesno",
  },
  GATE_VENUE: {
    state: "GATE_VENUE",
    // Collect-only, like New York: all 21 NJ counties plus "I'm not sure".
    prompt: "Which New Jersey county do you live in?",
    whyId: "WHY_VENUE",
    kind: "county",
    options: [
      ...NJ_COUNTIES.map((c) => ({ value: c, label: c })),
      { value: "UNSURE", label: "I'm not sure" },
    ],
  },
};

export type GateJurisdiction = "NY" | "NJ";

/** The gate wording for a jurisdiction. NY is the untouched original set. */
export function gateQuestionsFor(
  jurisdiction: GateJurisdiction
): Record<GateQuestion["state"], GateQuestion> {
  return jurisdiction === "NJ" ? { ...GATE_QUESTIONS, ...NJ_GATE_OVERRIDES } : GATE_QUESTIONS;
}
