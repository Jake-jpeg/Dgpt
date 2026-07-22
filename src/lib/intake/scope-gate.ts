/**
 * Scope gate — blunt coded filters, run after a conflict CLEAR and before any
 * substantive intake. DV / children / complexity trips = out, with the mapped
 * static card; the session is purged (no substantive data ever persists for
 * out-of-scope users).
 *
 * PHASE 1 policy (the active product — Summons + Verified Complaint only):
 * the clean DRL § 230(5) two-year continuous residence is the ONLY automated
 * pass. Any shorter path (the § 230(1)-(4) one-year + nexus grounds) is a
 * HARD STOP to attorney review before anything proceeds — durational
 * residency is jurisdictional, and courts are unforgiving about it
 * (operator directive 2026-07-22: "Jurisdiction games — courts HATE").
 * Children present is likewise a stop to attorney review: Phase 1 is the
 * no-unemancipated-children lane; child cases are handled by counsel.
 *
 * Under INTAKE_PHASE=ALL the legacy cascade behavior applies: the residency
 * cascade never terminates (flag + continue) and children route to the bar
 * referral card.
 *
 * Venue is collect-only — "not sure" flags and continues; a county answer is
 * captured for the attorney, never judged.
 *
 * The server owns gate order via the state machine; a client cannot skip or
 * reorder steps. Gate answers for PASSING steps are held on the session row /
 * answer store only after the step passes — a tripping answer is never
 * persisted at all.
 */
import { GATE_QUESTIONS } from "@/config/gate-questions";
import { NY_COUNTIES } from "@/config/intake-fields";
import { activeIntakePhase } from "@/config/intake/phases";
import type { MachineState } from "./machine";
import type { CardId } from "@/config/cards";

export type GateState = keyof typeof GATE_QUESTIONS;

export function isGateState(s: MachineState): s is GateState {
  return s in GATE_QUESTIONS;
}

export type GateEvaluation =
  | {
      outcome: "PASS";
      next: MachineState;
      persist?: { county?: string };
      /** Attorney-review flags raised by this answer (session continues). */
      reviewFlags?: string[];
    }
  | { outcome: "OUT"; card: CardId; auditEvent: string };

/**
 * Evaluate one gate answer. Pure function: no I/O, fully unit-testable.
 * Throws on malformed input (the API layer converts that to a 400).
 */
export function evaluateGate(state: GateState, rawAnswer: unknown): GateEvaluation {
  switch (state) {
    case "GATE_RESIDENCY": {
      // DRL § 230(5): two-year continuous residence — objective, automated.
      // Phase 1: this is the ONLY automated pass. Anything shorter is a hard
      // stop to attorney review — durational residency is jurisdictional.
      const yes = requireYesNo(rawAnswer);
      if (yes) return { outcome: "PASS", next: "GATE_VENUE" };
      return activeIntakePhase() === "ALL"
        ? { outcome: "PASS", next: "GATE_RESIDENCY_1YR" }
        : {
            outcome: "OUT",
            card: "PHASE1_ATTORNEY_REVIEW",
            auditEvent: "SCOPE_OUT_RESIDENCY_PHASE1",
          };
    }
    case "GATE_RESIDENCY_1YR": {
      // One-year paths (§ 230(1)-(4)) — reachable only under INTAKE_PHASE=ALL.
      // "No" is NOT a rejection there: the cause-occurred alternatives are
      // deliberately an attorney determination — flag and continue.
      const yes = requireYesNo(rawAnswer);
      if (activeIntakePhase() !== "ALL") {
        return {
          outcome: "OUT",
          card: "PHASE1_ATTORNEY_REVIEW",
          auditEvent: "SCOPE_OUT_RESIDENCY_PHASE1",
        };
      }
      return yes
        ? { outcome: "PASS", next: "GATE_RESIDENCY_NEXUS" }
        : {
            outcome: "PASS",
            next: "GATE_VENUE",
            reviewFlags: ["RESIDENCY_ATTORNEY_REVIEW"],
          };
    }
    case "GATE_RESIDENCY_NEXUS": {
      // Second prong (§ 230(1)-(2)) — reachable only under INTAKE_PHASE=ALL.
      const yes = requireYesNo(rawAnswer);
      if (activeIntakePhase() !== "ALL") {
        return {
          outcome: "OUT",
          card: "PHASE1_ATTORNEY_REVIEW",
          auditEvent: "SCOPE_OUT_RESIDENCY_PHASE1",
        };
      }
      return yes
        ? { outcome: "PASS", next: "GATE_VENUE" }
        : {
            outcome: "PASS",
            next: "GATE_VENUE",
            reviewFlags: ["RESIDENCY_ATTORNEY_REVIEW"],
          };
    }
    case "GATE_VENUE": {
      const county = String(rawAnswer ?? "");
      if (county === "UNSURE") {
        // Venue is the attorney's call — never a client-facing rejection.
        return {
          outcome: "PASS",
          next: "GATE_DV",
          reviewFlags: ["VENUE_UNSURE"],
        };
      }
      if (!(NY_COUNTIES as readonly string[]).includes(county)) {
        throw new Error("VALIDATION: unknown county");
      }
      // County is captured for the attorney; never disqualifies.
      return { outcome: "PASS", next: "GATE_DV", persist: { county } };
    }
    case "GATE_DV": {
      const yes = requireYesNo(rawAnswer);
      // ANY DV → hard out, DV-resource card (distinct from the bar referral).
      return yes
        ? { outcome: "OUT", card: "DV_RESOURCES", auditEvent: "SCOPE_OUT_DV" }
        : { outcome: "PASS", next: "GATE_CHILDREN" };
    }
    case "GATE_CHILDREN": {
      const yes = requireYesNo(rawAnswer);
      // Phase 1 is the no-unemancipated-children lane: children present →
      // stop to ATTORNEY REVIEW (the firm handles child cases with counsel —
      // custody/support in a later supervised phase). Legacy (ALL): bar
      // referral card.
      if (!yes) return { outcome: "PASS", next: "GATE_COMPLEXITY" };
      return activeIntakePhase() === "ALL"
        ? { outcome: "OUT", card: "NY_BAR_REFERRAL", auditEvent: "SCOPE_OUT_CHILDREN" }
        : {
            outcome: "OUT",
            card: "PHASE1_ATTORNEY_REVIEW",
            auditEvent: "SCOPE_OUT_CHILDREN",
          };
    }
    case "GATE_COMPLEXITY": {
      const v = String(rawAnswer ?? "");
      const valid = GATE_QUESTIONS.GATE_COMPLEXITY.options!.map((o) => o.value);
      if (!valid.includes(v)) throw new Error("VALIDATION: invalid complexity answer");
      // Any disagreement, uncertainty, or valuation need → out.
      return v === "FULLY_AGREE"
        ? { outcome: "PASS", next: "TIER_BRANCH" }
        : { outcome: "OUT", card: "NY_BAR_REFERRAL", auditEvent: "SCOPE_OUT_COMPLEXITY" };
    }
  }
}

function requireYesNo(raw: unknown): boolean {
  if (raw === true || raw === "yes") return true;
  if (raw === false || raw === "no") return false;
  throw new Error("VALIDATION: expected yes/no");
}
