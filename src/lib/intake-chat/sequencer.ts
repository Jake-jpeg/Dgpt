/**
 * The sequencer — a PURE function from (schema, answers, gates, checklist)
 * to the next step of the conversation.
 *
 * This is deliberately not the model's job. Which question comes next, and
 * whether the intake is finished, is deterministic and auditable: the same
 * state always produces the same step. The model's only role is asking the
 * step in warm, plain words and interpreting the reply. That is what makes
 * "exhaustive" (spec §3 rule 8) a property the server can guarantee rather
 * than a behavior we hope for.
 *
 * Order: welcome → gates → every schema section in order → read-back →
 * confirmation → complete.
 *
 * THE DOCUMENT CHECKLIST IS NEVER WALKED CONVERSATIONALLY (removed
 * 2026-07-26 after the first live interview: it ballooned a 15-question
 * intake into 30+ turns, asked child-document questions in a no-kids case,
 * and broke the "N questions" promise). Documents move over EMAIL, directly
 * with the firm — the portal does not even accept client uploads anymore.
 * The derived checklist remains an internal firm-side artifact
 * (form-readiness, attorney panels); the client is simply never
 * interrogated about it.
 */
import type { AnswerMap, IntakeItem, IntakeSchema } from "@/lib/intake2/types";
import { itemVisible, isAnswered, type ChecklistEntry } from "@/lib/intake2/engine";
import { clientItemInPhase, activeIntakePhase, type IntakePhase } from "@/config/intake/phases";
import { GATE_QUESTIONS, type GateQuestion } from "@/config/gate-questions";
import type { MachineState } from "@/lib/intake/machine";
import { isGateState } from "@/lib/intake/scope-gate";

/** Machine states at or past which the gate phase is behind us. */
const PAST_GATES: MachineState[] = ["TIER_BRANCH", "INTAKE", "READY_FOR_REVIEW"];

export type StepKind =
  | "WELCOME"
  | "GATE"
  | "QUESTION"
  | "READBACK"
  | "CONFIRM"
  | "COMPLETE"
  | "STOPPED";

export interface Step {
  kind: StepKind;
  /** Gate state, schema item id, or document id, depending on kind. */
  id: string | null;
  /** The underlying schema item, when kind is QUESTION. */
  item?: IntakeItem;
  /** The gate question, when kind is GATE. */
  gate?: GateQuestion;
  /** Human-facing section label for the progress indicator. */
  sectionTitle: string | null;
  /** 1-based section position and total, for "Section 7 of 19". */
  sectionIndex: number | null;
  sectionCount: number;
}

export interface SequencerState {
  schema: IntakeSchema;
  answers: AnswerMap;
  /**
   * The live intake-session machine state. The MACHINE owns which gate is
   * current (the NY residency cascade branches, so gate order is not a
   * fixed list): while the state IS a gate, that gate is the step; once the
   * state is past the gates, the question phase begins.
   */
  machineState: MachineState;
  /** Derived checklist for this matter. */
  checklist: ChecklistEntry[];
  /** Document ids the client has already reported on. */
  /** True once the assistant has delivered the scripted opening. */
  welcomed: boolean;
  /** True once the read-back summary has been shown. */
  readBackShown: boolean;
  /** True once the client confirmed the read-back. */
  confirmed: boolean;
  /** Set when a gate or DV stop has fired — nothing further is asked. */
  stopped?: "SCOPE" | "DV" | null;
  /** The matter's intake phase (1 commencement · 2 settlement · 3 finalization). */
  phase?: IntakePhase;
}

/** CLIENT-answerable items the conversation is responsible for asking.
 *  Phase-filtered: only items in the matter's intake phase are ever asked
 *  (Phase 1 = the Summons + Verified Complaint field set; Phase 2 adds the
 *  settlement/stipulation facts; Phase 3 adds nothing client-side). */
export function askableItems(
  schema: IntakeSchema,
  answers: AnswerMap,
  phase: IntakePhase = activeIntakePhase()
): IntakeItem[] {
  return schema.items.filter(
    (i) =>
      i.audience === "CLIENT" &&
      i.type !== "document_request" &&
      i.type !== "attorney_determination" &&
      clientItemInPhase(i, phase) &&
      itemVisible(i, answers)
  );
}

function sectionsInOrder(schema: IntakeSchema) {
  return schema.sections.slice().sort((a, b) => a.order - b.order);
}

/**
 * Section position, counted over the sections the CLIENT is actually walking.
 *
 * Was counted over EVERY section in the schema, which showed a Phase 1 client
 * "Section 3 of 25" beside a progress rail listing eight (2026-08-01, from a
 * live screenshot). The denominator has to be the same set the rail shows or
 * it reads as a bug — and to the client it IS one.
 *
 * Membership is by "has a client item in this phase", NOT by "has an
 * unanswered visible item": answering something must never shrink the
 * denominator underneath the person answering it.
 */
function sectionMeta(state: SequencerState, sectionId: string | null) {
  const { schema } = state;
  const phase = state.phase ?? activeIntakePhase();
  const walked = sectionsInOrder(schema).filter((sec) =>
    schema.items.some(
      (i) =>
        i.section === sec.id &&
        i.audience === "CLIENT" &&
        i.type !== "document_request" &&
        i.type !== "attorney_determination" &&
        clientItemInPhase(i, phase)
    )
  );
  const idx = sectionId ? walked.findIndex((s) => s.id === sectionId) : -1;
  return {
    sectionTitle: idx >= 0 ? walked[idx].title : null,
    sectionIndex: idx >= 0 ? idx + 1 : null,
    sectionCount: walked.length,
  };
}

/**
 * The next step. Exhaustive by construction: it will not advance past the
 * question phase while any visible, unanswered CLIENT item remains.
 */
export function nextStep(state: SequencerState): Step {
  const { schema, answers } = state;

  if (state.stopped) {
    return {
      kind: "STOPPED",
      id: state.stopped,
      ...sectionMeta(state, null),
    };
  }

  if (!state.welcomed) {
    return { kind: "WELCOME", id: null, ...sectionMeta(state, null) };
  }

  // Gates first — the machine decides which gate is current (the residency
  // cascade branches; the venue/DV/children/complexity order is fixed).
  if (isGateState(state.machineState)) {
    return {
      kind: "GATE",
      id: state.machineState,
      gate: GATE_QUESTIONS[state.machineState],
      ...sectionMeta(state, null),
    };
  }
  if (!PAST_GATES.includes(state.machineState)) {
    // Defensive: an unexpected machine state (e.g. legacy PRE_GATE) never
    // silently skips the gates — surface it as a stop for a human to fix.
    return { kind: "STOPPED", id: `UNEXPECTED_STATE_${state.machineState}`, ...sectionMeta(state, null) };
  }

  // Every visible CLIENT item, section by section, in schema order.
  const askable = askableItems(schema, answers, state.phase ?? activeIntakePhase());
  for (const section of sectionsInOrder(schema)) {
    const next = askable.find((i) => i.section === section.id && !isAnswered(i, answers));
    if (next) {
      return {
        kind: "QUESTION",
        id: next.id,
        item: next,
        ...sectionMeta(state, section.id),
      };
    }
  }
  // Items whose section is missing from the section list still get asked —
  // an unasked question is never acceptable, even if the schema is untidy.
  const orphan = askable.find((i) => !isAnswered(i, answers));
  if (orphan) {
    return {
      kind: "QUESTION",
      id: orphan.id,
      item: orphan,
      ...sectionMeta(state, orphan.section),
    };
  }

  // Documents are handled over email with the firm — no checklist walk
  // (see the header note). Straight to the read-back once questions end.
  if (!state.readBackShown) {
    return { kind: "READBACK", id: null, ...sectionMeta(state, null) };
  }
  if (!state.confirmed) {
    return { kind: "CONFIRM", id: null, ...sectionMeta(state, null) };
  }
  return { kind: "COMPLETE", id: null, ...sectionMeta(state, null) };
}

/** Progress for the client-facing indicator. Counts questions, not turns. */
export function progress(state: SequencerState): {
  answered: number;
  total: number;
  sectionTitle: string | null;
  sectionIndex: number | null;
  sectionCount: number;
} {
  const askable = askableItems(state.schema, state.answers, state.phase ?? activeIntakePhase());
  const step = nextStep(state);
  return {
    answered: askable.filter((i) => isAnswered(i, state.answers)).length,
    total: askable.length,
    sectionTitle: step.sectionTitle,
    sectionIndex: step.sectionIndex,
    sectionCount: step.sectionCount,
  };
}

/** True when nothing remains to ask — the packet is ready for the attorney. */
export function isComplete(state: SequencerState): boolean {
  return nextStep(state).kind === "COMPLETE";
}
