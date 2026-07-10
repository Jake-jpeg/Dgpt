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
    prompt:
      "Has at least one of you (you or your spouse) lived in New Jersey continuously for the last 12 months?",
    whyId: "WHY_RESIDENCY",
    kind: "yesno",
    outCard: "RESIDENCY_ATTORNEY_FLAG", // "no" → out; the adultery exception is never auto-resolved
  },
  GATE_VENUE: {
    state: "GATE_VENUE",
    prompt: "Which New Jersey county do you live in?",
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
