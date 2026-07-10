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
 *        │                              │ none                Bergen Bar card, purged)
 *        │                        GATE_COMPLEXITY ──disagree/unsure/valuation──►
 *        │                              │ fully agree          (Bergen Bar card, purged)
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
  "GATE_RESIDENCY",
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
  "GATE_VENUE",
  "GATE_DV",
  "GATE_CHILDREN",
  "GATE_COMPLEXITY",
  "TIER_BRANCH",
  "INTAKE",
];

/** The fixed order of scope-gate steps; the server, not the client, decides which is next. */
export const GATE_SEQUENCE: MachineState[] = [
  "GATE_RESIDENCY",
  "GATE_VENUE",
  "GATE_DV",
  "GATE_CHILDREN",
  "GATE_COMPLEXITY",
];

const ALLOWED_TRANSITIONS: Record<MachineState, MachineState[]> = {
  PRE_GATE: ["GATE_RESIDENCY"], // only via a CLEAR conflict check
  GATE_RESIDENCY: ["GATE_VENUE"],
  GATE_VENUE: ["GATE_DV"],
  GATE_DV: ["GATE_CHILDREN"],
  GATE_CHILDREN: ["GATE_COMPLEXITY"],
  GATE_COMPLEXITY: ["TIER_BRANCH"],
  TIER_BRANCH: ["INTAKE"],
  INTAKE: ["READY_FOR_REVIEW"],
  READY_FOR_REVIEW: [],
};

export function canTransition(from: MachineState, to: MachineState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: MachineState, to: MachineState): void {
  if (!canTransition(from, to)) {
    throw new Error(`STATE_MACHINE: illegal transition ${from} → ${to}`);
  }
}
