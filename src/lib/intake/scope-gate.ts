/**
 * Scope gate — blunt coded filters, run after a conflict CLEAR and before any
 * substantive intake. Any trip = out, with the mapped static card; the session
 * is purged (no substantive data ever persists for out-of-scope users).
 *
 * The server owns gate order via the state machine; a client cannot skip or
 * reorder steps. Gate answers for PASSING steps are held on the session row /
 * answer store only after the step passes — a tripping answer is never
 * persisted at all.
 */
import { GATE_QUESTIONS } from "@/config/gate-questions";
import { NJ_COUNTIES } from "@/config/intake-fields";
import type { MachineState } from "./machine";
import type { CardId } from "@/config/cards";

export type GateState = keyof typeof GATE_QUESTIONS;

export function isGateState(s: MachineState): s is GateState {
  return s in GATE_QUESTIONS;
}

export type GateEvaluation =
  | { outcome: "PASS"; next: MachineState; persist?: { county?: string } }
  | { outcome: "OUT"; card: CardId; auditEvent: string };

const NEXT: Record<GateState, MachineState> = {
  GATE_RESIDENCY: "GATE_VENUE",
  GATE_VENUE: "GATE_DV",
  GATE_DV: "GATE_CHILDREN",
  GATE_CHILDREN: "GATE_COMPLEXITY",
  GATE_COMPLEXITY: "TIER_BRANCH",
};

/**
 * Evaluate one gate answer. Pure function: no I/O, fully unit-testable.
 * Throws on malformed input (the API layer converts that to a 400).
 */
export function evaluateGate(state: GateState, rawAnswer: unknown): GateEvaluation {
  switch (state) {
    case "GATE_RESIDENCY": {
      const yes = requireYesNo(rawAnswer);
      // "No" → out. The adultery exception to the 12-month rule is NEVER
      // auto-resolved here — the card tells the user to contact the office.
      return yes
        ? { outcome: "PASS", next: NEXT[state] }
        : { outcome: "OUT", card: "RESIDENCY_ATTORNEY_FLAG", auditEvent: "SCOPE_OUT_RESIDENCY" };
    }
    case "GATE_VENUE": {
      const county = String(rawAnswer ?? "");
      if (!(NJ_COUNTIES as readonly string[]).includes(county)) {
        throw new Error("VALIDATION: unknown county");
      }
      // Venue never disqualifies; county is captured for the attorney.
      return { outcome: "PASS", next: NEXT[state], persist: { county } };
    }
    case "GATE_DV": {
      const yes = requireYesNo(rawAnswer);
      // ANY DV → hard out, DV-resource card (distinct from the bar referral).
      return yes
        ? { outcome: "OUT", card: "DV_RESOURCES", auditEvent: "SCOPE_OUT_DV" }
        : { outcome: "PASS", next: NEXT[state] };
    }
    case "GATE_CHILDREN": {
      const yes = requireYesNo(rawAnswer);
      // Custody tier is deferred — children → out via referral card.
      return yes
        ? { outcome: "OUT", card: "BERGEN_BAR_REFERRAL", auditEvent: "SCOPE_OUT_CHILDREN" }
        : { outcome: "PASS", next: NEXT[state] };
    }
    case "GATE_COMPLEXITY": {
      const v = String(rawAnswer ?? "");
      const valid = GATE_QUESTIONS.GATE_COMPLEXITY.options!.map((o) => o.value);
      if (!valid.includes(v)) throw new Error("VALIDATION: invalid complexity answer");
      // Any disagreement, uncertainty, or valuation need → out.
      return v === "FULLY_AGREE"
        ? { outcome: "PASS", next: NEXT[state] }
        : { outcome: "OUT", card: "BERGEN_BAR_REFERRAL", auditEvent: "SCOPE_OUT_COMPLEXITY" };
    }
  }
}

function requireYesNo(raw: unknown): boolean {
  if (raw === true || raw === "yes") return true;
  if (raw === false || raw === "no") return false;
  throw new Error("VALIDATION: expected yes/no");
}
