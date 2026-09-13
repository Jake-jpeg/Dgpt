/**
 * Scope gate — the short eligibility check that opens every interview.
 *
 * NOTHING STOPS THE CLIENT (operator ruling 2026-09-13: "EVERYTHING is fair
 * game. Even DV is fair game because a lawyer is reviewing the whole
 * thing."). Every gate answer is recorded and the interview continues; what
 * used to be a hard stop is now an ATTORNEY-REVIEW FLAG on the session, and
 * the attorney sees those flags on the matter before anything is drafted.
 * The gates still shape the interview (residency branches, county is
 * captured, the DV resources card is shown) — they just never turn a
 * prospective client away from their own firm's intake.
 *
 * Why the stops went: the first NJ live run (2026-09-12) died at the
 * children gate. Everything built since July — the child recitals, UD-10 /
 * UD-11 child relief, the Word engine's children.ts — sat behind a gate that
 * would not let a case with a child through, and the copy on the stop card
 * gave the client nobody to call. A lawyer reviews every packet; the gate
 * has no business making that call for them.
 *
 * Residency (kept as a branch, not a stop):
 *   NY § 230(5) two years .................. PASS.
 *   NY § 230(1)/(2) one year + nexus ....... PASS.
 *   NY § 230(3) one year, no nexus ......... PASS + RESIDENCY_ATTORNEY_REVIEW.
 *   NY under one year ...................... PASS + RESIDENCY_ATTORNEY_REVIEW
 *     (only § 230(4) could remain — the attorney decides).
 *   NJ N.J.S.A. 2A:34-10 one year: yes ..... PASS; no → PASS + review flag.
 * Venue: collect-only — "not sure" flags; a county is captured, never judged.
 * DV: PASS + DV_DISCLOSED_ATTORNEY_REVIEW, and the jurisdiction's DV
 *   resources card is shown once (the session continues).
 * Children: PASS + CHILDREN_PRESENT_ATTORNEY_REVIEW (the packet handles
 *   children; the attorney reviews custody/support).
 * Complexity: anything but "fully agree" → PASS + COMPLEXITY_ATTORNEY_REVIEW.
 *
 * The server owns gate order via the state machine; a client cannot skip or
 * reorder steps.
 */
import { GATE_QUESTIONS, type GateJurisdiction } from "@/config/gate-questions";
import { NY_COUNTIES, NJ_COUNTIES } from "@/config/intake-fields";
import type { MachineState } from "./machine";
import type { CardId } from "@/config/cards";

export type GateState = keyof typeof GATE_QUESTIONS;

export function isGateState(s: MachineState): s is GateState {
  return s in GATE_QUESTIONS;
}

/** Every gate PASSES. What varies is where it goes next and what it flags. */
export interface GateEvaluation {
  outcome: "PASS";
  next: MachineState;
  persist?: { county?: string };
  /** Attorney-review flags raised by this answer (session continues). */
  reviewFlags?: string[];
  /** An informational card to show the client once (e.g. DV resources). */
  card?: CardId;
  /** Audit event name for a flagged answer (recorded alongside GATE_PASSED). */
  auditEvent?: string;
}

/** Flag names — what the attorney reads on the matter. */
export const GATE_REVIEW_FLAGS = {
  RESIDENCY: "RESIDENCY_ATTORNEY_REVIEW",
  VENUE_UNSURE: "VENUE_UNSURE",
  DV: "DV_DISCLOSED_ATTORNEY_REVIEW",
  CHILDREN: "CHILDREN_PRESENT_ATTORNEY_REVIEW",
  COMPLEXITY: "COMPLEXITY_ATTORNEY_REVIEW",
} as const;

/**
 * Evaluate one gate answer. Pure function: no I/O, fully unit-testable.
 * Throws on malformed input (the API layer converts that to a 400).
 *
 * `jurisdiction` selects the playbook ("NY" default keeps every existing
 * caller byte-identical). New Jersey's residency is one flat rule —
 * N.J.S.A. 2A:34-10, one year of continuous residence — so its cascade is
 * one question. DV / children / complexity evaluate identically in both
 * states; only the DV resources card is state-specific.
 */
export function evaluateGate(
  state: GateState,
  rawAnswer: unknown,
  jurisdiction: GateJurisdiction = "NY"
): GateEvaluation {
  switch (state) {
    case "GATE_RESIDENCY": {
      const yes = requireYesNo(rawAnswer);
      if (jurisdiction === "NJ") {
        // N.J.S.A. 2A:34-10 — the flat one-year rule, asked as one question.
        // "No" is the attorney's problem to solve, not a door closing.
        return yes
          ? { outcome: "PASS", next: "GATE_VENUE" }
          : {
              outcome: "PASS",
              next: "GATE_VENUE",
              reviewFlags: [GATE_REVIEW_FLAGS.RESIDENCY],
              auditEvent: "GATE_FLAG_RESIDENCY",
            };
      }
      // DRL § 230(5): two-year continuous residence — objective. Shorter is
      // not a rejection: the one-year pathways are real law — continue to
      // the one-year question.
      return yes
        ? { outcome: "PASS", next: "GATE_VENUE" }
        : { outcome: "PASS", next: "GATE_RESIDENCY_1YR" };
    }
    case "GATE_RESIDENCY_1YR": {
      if (jurisdiction === "NJ") {
        // Unreachable by construction (the NJ GATE_RESIDENCY never routes
        // here). Refuse loudly rather than answer New York law to a New
        // Jersey client.
        throw new Error("VALIDATION: the NY residency cascade is not part of the NJ interview");
      }
      // The one-year durational floor shared by § 230(1)-(3).
      // Yes → the nexus question sorts out WHICH prong.
      // No → only § 230(4) (cause + both resident now) could remain: a
      // genuine attorney determination. Flag it and keep going.
      const yes = requireYesNo(rawAnswer);
      return yes
        ? { outcome: "PASS", next: "GATE_RESIDENCY_NEXUS" }
        : {
            outcome: "PASS",
            next: "GATE_VENUE",
            reviewFlags: [GATE_REVIEW_FLAGS.RESIDENCY],
            auditEvent: "GATE_FLAG_RESIDENCY",
          };
    }
    case "GATE_RESIDENCY_NEXUS": {
      if (jurisdiction === "NJ") {
        throw new Error("VALIDATION: the NY residency cascade is not part of the NJ interview");
      }
      // Objective nexus prongs (§ 230(1)-(2)): married in NY, or lived in NY
      // as spouses — checkbox facts; one year + nexus passes CLEAN.
      // No objective nexus → the remaining basis is § 230(3) (the breakdown
      // occurred in NY): valid law, but "where a breakdown occurred" is a
      // characterization the attorney verifies before signing.
      const yes = requireYesNo(rawAnswer);
      return yes
        ? { outcome: "PASS", next: "GATE_VENUE" }
        : {
            outcome: "PASS",
            next: "GATE_VENUE",
            reviewFlags: [GATE_REVIEW_FLAGS.RESIDENCY],
            auditEvent: "GATE_FLAG_RESIDENCY",
          };
    }
    case "GATE_VENUE": {
      const county = String(rawAnswer ?? "");
      if (county === "UNSURE") {
        // Venue is the attorney's call — never a client-facing rejection.
        return {
          outcome: "PASS",
          next: "GATE_DV",
          reviewFlags: [GATE_REVIEW_FLAGS.VENUE_UNSURE],
          auditEvent: "GATE_FLAG_VENUE",
        };
      }
      const counties: readonly string[] = jurisdiction === "NJ" ? NJ_COUNTIES : NY_COUNTIES;
      if (!counties.includes(county)) {
        throw new Error("VALIDATION: unknown county");
      }
      // County is captured for the attorney; never disqualifies.
      return { outcome: "PASS", next: "GATE_DV", persist: { county } };
    }
    case "GATE_DV": {
      const yes = requireYesNo(rawAnswer);
      // ANY DV → the attorney reviews personally; the client sees the
      // state's DV resources once and the interview continues.
      return yes
        ? {
            outcome: "PASS",
            next: "GATE_CHILDREN",
            reviewFlags: [GATE_REVIEW_FLAGS.DV],
            card: jurisdiction === "NJ" ? "DV_RESOURCES_NJ" : "DV_RESOURCES",
            auditEvent: "GATE_FLAG_DV",
          }
        : { outcome: "PASS", next: "GATE_CHILDREN" };
    }
    case "GATE_CHILDREN": {
      const yes = requireYesNo(rawAnswer);
      // Children are IN scope: the packet recites them (¶FIFTH, UD-10 /
      // UD-11 child relief, NJ complaint). The attorney reviews custody and
      // support; the interview goes on to collect the children's details.
      return yes
        ? {
            outcome: "PASS",
            next: "GATE_COMPLEXITY",
            reviewFlags: [GATE_REVIEW_FLAGS.CHILDREN],
            auditEvent: "GATE_FLAG_CHILDREN",
          }
        : { outcome: "PASS", next: "GATE_COMPLEXITY" };
    }
    case "GATE_COMPLEXITY": {
      const v = String(rawAnswer ?? "");
      const valid = GATE_QUESTIONS.GATE_COMPLEXITY.options!.map((o) => o.value);
      if (!valid.includes(v)) throw new Error("VALIDATION: invalid complexity answer");
      // Disagreement, uncertainty, or a valuation need → the attorney's
      // judgment, flagged; the facts still get collected.
      return v === "FULLY_AGREE"
        ? { outcome: "PASS", next: "TIER_BRANCH" }
        : {
            outcome: "PASS",
            next: "TIER_BRANCH",
            reviewFlags: [GATE_REVIEW_FLAGS.COMPLEXITY],
            auditEvent: "GATE_FLAG_COMPLEXITY",
          };
    }
  }
}

function requireYesNo(raw: unknown): boolean {
  if (raw === true || raw === "yes") return true;
  if (raw === false || raw === "no") return false;
  throw new Error("VALIDATION: expected yes/no");
}
