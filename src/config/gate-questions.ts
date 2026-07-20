/**
 * ATTORNEY-CONTROLLED CONFIG — the scope-gate questions, in the fixed order
 * the server walks them. These are blunt coded filters, not legal judgment:
 * any trip = out, with the mapped static card. The server (src/lib/intake/
 * scope-gate.ts) owns the evaluation; this file owns the wording.
 */
import type { ProcessCopyId } from "./process-copy";
import type { CardId } from "./cards";
import { NJ_COUNTIES } from "./intake-fields";

export interface GateQuestion {
  /** Matches the machine state that asks it. */
  state: "GATE_RESIDENCY" | "GATE_VENUE" | "GATE_DV" | "GATE_CHILDREN" | "GATE_COMPLEXITY";
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
    // [ATTORNEY REVIEW REQUIRED — NY residency gate redrafted from NY-DIVORCE-RESIDENCE-001; operator must approve before live client use]
    // TEXT ONLY was redrafted for NY. The PASS/FAIL logic in
    // src/lib/intake/scope-gate.ts is unchanged and still encodes a SINGLE
    // yes/no threshold — an NJ shape. DRL § 230 has FIVE alternative paths
    // (incl. a two-year-residence path and a "cause occurred in NY + both
    // residents" path with no stated duration), which a single yes/no cannot
    // represent: a "No" here can wrongly scope out a client who qualifies
    // under another alternative. The operator must redesign the gate logic,
    // not just approve this wording. See the accompanying report.
    prompt:
      "Have you or your spouse lived in New York for at least the past year?",
    whyId: "WHY_RESIDENCY",
    kind: "yesno",
    outCard: "RESIDENCY_ATTORNEY_FLAG", // "no" → out with a "contact the office" card (not a hard dead-end)
  },
  GATE_VENUE: {
    state: "GATE_VENUE",
    // [ATTORNEY REVIEW REQUIRED — NY residency gate redrafted from NY-DIVORCE-RESIDENCE-001; operator must approve before live client use]
    // TEXT ONLY. The `options` below and the validation in scope-gate.ts still
    // use NJ_COUNTIES — a real New York county (e.g. "Kings") is currently
    // REJECTED as invalid. This control is not functional for NY clients until
    // a NY county dataset and the scope-gate validation are added (data + logic,
    // out of scope for this presentation pass). See the accompanying report.
    prompt: "Which New York county do you live in?",
    whyId: "WHY_VENUE",
    kind: "county",
    options: NJ_COUNTIES.map((c) => ({ value: c, label: c })),
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
    outCard: "BERGEN_BAR_REFERRAL", // custody tier is deferred — out for now
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
    outCard: "BERGEN_BAR_REFERRAL", // anything but FULLY_AGREE → out
  },
};
