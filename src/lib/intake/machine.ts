/**
 * The intake state machine. This is the spine of Stage 1: a session is always
 * in exactly one state, every API endpoint validates the current state
 * server-side before doing anything, and all transitions happen here.
 *
 * The intake "bot" is NOT a generative agent — it is this machine plus the
 * constrained responder in src/lib/bot/.
 *
 * Flow:
 *
 *   PRE_GATE ──identity captured──► conflict check
 *        │                              │
 *        │                        HIT ──► (purged; terminal, no row remains)
 *        │                              │
 *        │                        CLEAR ▼
 *        │                        GATE_RESIDENCY ──no──► (attorney-flag card, purged)
 *        │                              │ yes
 *        │                        GATE_VENUE (county capture; never disqualifies)
 *        │                              │
 *        │                        GATE_DV ──any DV──► (DV-resource card, purged)
 *        │                              │ none
 *        │                        GATE_CHILDREN ──children──► (custody tier deferred:
 *        │                              │ none                NY bar-referral card, purged)
 *        │                        GATE_COMPLEXITY ──disagree/unsure/valuation──►
 *        │                              │ fully agree          (NY bar-referral card, purged)
 *        │                        TIER_BRANCH (assets? alimony?)
 *        │                              │
 *        │              ┌───────────────┴────────────────┐
 *        │        INTAKE (TIER1)                   INTAKE (TIER2)
 *        │              └───────────────┬────────────────┘
 *        │                              ▼
 *        │                       READY_FOR_REVIEW ──► attorney review view
 *
 * Sessions that trip a gate are purged from the DB entirely (only the minimal
 * audit trail survives), so terminal "OUT" states never exist as rows.
 */

export const MACHINE_STATES = [
  "PRE_GATE",
  "CONFLICT_REVIEW_PENDING",
  "GATE_RESIDENCY",
  "GATE_RESIDENCY_1YR",
  "GATE_RESIDENCY_NEXUS",
  "GATE_VENUE",
  "GATE_DV",
  "GATE_CHILDREN",
  "GATE_COMPLEXITY",
  "TIER_BRANCH",
  "INTAKE",
  "READY_FOR_REVIEW",
] as const;

export type MachineState = (typeof MACHINE_STATES)[number];

/** States in which substantive intake answers may be written (see repo.insertAnswer). */
export const ANSWER_WRITABLE_STATES: MachineState[] = ["TIER_BRANCH", "INTAKE"];

/** States in which the constrained bot will respond at all. */
export const BOT_ACTIVE_STATES: MachineState[] = [
  "GATE_RESIDENCY",
  "GATE_RESIDENCY_1YR",
  "GATE_RESIDENCY_NEXUS",
  "GATE_VENUE",
  "GATE_DV",
  "GATE_CHILDREN",
  "GATE_COMPLEXITY",
  "TIER_BRANCH",
  "INTAKE",
];

const ALLOWED_TRANSITIONS: Record<MachineState, MachineState[]> = {
  // 2.0: automated screening NEVER clears a session into the gates. Identity
  // capture parks the session in CONFLICT_REVIEW_PENDING; only an attorney's
  // CLEARED disposition on the matter moves it forward.
  PRE_GATE: ["CONFLICT_REVIEW_PENDING"],
  CONFLICT_REVIEW_PENDING: ["GATE_RESIDENCY"],
  // NY residency cascade (DRL § 230): the 2-year path passes straight to
  // venue; otherwise the 1-year question, then the NY-nexus question. No
  // residency answer ever terminates — failures flag for attorney review.
  GATE_RESIDENCY: ["GATE_VENUE", "GATE_RESIDENCY_1YR"],
  GATE_RESIDENCY_1YR: ["GATE_VENUE", "GATE_RESIDENCY_NEXUS"],
  GATE_RESIDENCY_NEXUS: ["GATE_VENUE"],
  GATE_VENUE: ["GATE_DV"],
  GATE_DV: ["GATE_CHILDREN"],
  GATE_CHILDREN: ["GATE_COMPLEXITY"],
  GATE_COMPLEXITY: ["TIER_BRANCH"],
  // TIER_BRANCH → READY_FOR_REVIEW is the conversational-intake completion:
  // the chat walks the schema-driven questions (intake2 store), not the v1
  // tier forms, so it finishes directly from the post-gate state.
  TIER_BRANCH: ["INTAKE", "READY_FOR_REVIEW"],
  INTAKE: ["READY_FOR_REVIEW"],
  READY_FOR_REVIEW: [],
};

export function canTransition(from: MachineState, to: MachineState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * The single legal successor of a gate, or null if the state branches or is
 * terminal. Every gate that can hard-stop a client (GATE_DV, GATE_CHILDREN,
 * GATE_COMPLEXITY) has exactly one, which is what lets the attorney's unlock
 * carry the session PAST the gate it tripped on. Without that, reopening
 * would drop the client back onto the same question and re-lock instantly.
 */
export function soleSuccessor(from: MachineState): MachineState | null {
  const next = ALLOWED_TRANSITIONS[from];
  return next && next.length === 1 ? next[0] : null;
}

export function assertTransition(from: MachineState, to: MachineState): void {
  if (!canTransition(from, to)) {
    throw new Error(`STATE_MACHINE: illegal transition ${from} → ${to}`);
  }
}
