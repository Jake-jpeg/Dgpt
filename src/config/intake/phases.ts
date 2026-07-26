/**
 * Intake phases — the product ships ONE phase at a time.
 *
 * NY divorce practice is a three-phase pipeline, and the intake mirrors it:
 *   Phase 1 — commencement: Summons + Verified Complaint (this file's list).
 *   Phase 2 — uncontested packet: affidavits + stipulation of settlement
 *             (agreed ED; the clause bank drives the field set).
 *   Phase 3 — finalization: Notice of Entry / Affidavit of Service.
 *
 * Phase 1 asks ONLY what the Summons and Verified Complaint consume, plus the
 * scope gates (residency / venue / DV / children / complexity) that run in the
 * state machine BEFORE any schema question. Every question must earn its seat
 * by mapping to a pleading fact — everything else (SNW, assets, property
 * history, parenting…) belongs to a later phase and is not asked.
 *
 * Mechanics: `PHASE1_ITEM_IDS` is an allow-list over the EXISTING intake2
 * schema — no item definitions change, so retiring the phase filter (or
 * flipping INTAKE_PHASE=ALL) instantly restores the full questionnaire.
 * The filter applies to CLIENT-audience items only; attorney determinations
 * and staff views are never phase-filtered.
 */

export const PHASE1_ITEM_IDS: ReadonlySet<string> = new Set([
  // Parties (caption, ¶SIXTH, verification, UD-1)
  "shared.identity.client_name",
  // client_dob deliberately ABSENT: no Phase 1-2 pleading or agreement
  // prints it (operator, 2026-07-26 live test: "And the DOB?"). The lawyer
  // collects it at drafting when a form actually needs it.
  "shared.identity.client_address",
  "shared.identity.other_name",
  "shared.identity.other_address",
  // Marriage (¶THIRD / ¶FOURTH — DRL § 253 civil/religious branch)
  "shared.relationship.status_kind",
  "shared.relationship.marriage_date",
  "shared.relationship.marriage_place",
  "shared.relationship.marriage_state",
  "shared.relationship.ceremony_type",
  // Prior/pending matrimonial actions (¶SEVENTH / ¶EIGHTH)
  "shared.relationship.prior_matrimonial_actions",
  // NY residency + venue + grounds (¶FIRST, caption county, ¶NINTH).
  // married_in_ny / lived_in_ny_as_spouses select WHICH § 230 prong the
  // complaint pleads (2yr → § 230(5); 1yr + nexus → § 230(1)/(2); 1yr no
  // nexus → § 230(3), attorney-flagged at the gate).
  "ny.case.resident_now",
  "ny.case.resident_since",
  "ny.case.married_in_ny",
  "ny.case.lived_in_ny_as_spouses",
  "ny.case.county",
  "ny.case.grounds_facts",
  "ny.case.grounds_dates",
  // Service posture (drives the acknowledgment-of-service / waiver path)
  "ny.case.service_facts",
  // Existing-case index number (optional): pending-action signal at intake,
  // and the caption field for the Phase-3 UD-14/UD-15 renders.
  "ny.case.index_number",
]);

/**
 * PHASE 2 — settlement facts for the uncontested packet + Stipulation of
 * Settlement. CUMULATIVE: a matter in phase 2 asks phase-1 ∪ phase-2 items.
 * Every item feeds either a stipulation article or a UD packet form.
 */
export const PHASE2_ITEM_IDS: ReadonlySet<string> = new Set([
  ...PHASE1_ITEM_IDS,
  // Where things stand (agreement posture; signed agreement → doc request)
  "ny.case.agreement_posture",
  "ny.case.signed_agreement",
  // Property & debts (stip Articles III–IV; facts, division is the parties')
  "shared.assets.records",
  "shared.assets.real_estate_any",
  "shared.debts.records",
  // Settlement terms (stip Articles III & V)
  "ny.settlement.plaintiff_income",
  "ny.settlement.defendant_income",
  "ny.settlement.maintenance_waived",
  "ny.settlement.division_terms",
  // Name restoration (stip Article VII / judgment)
  "shared.relationship.name_restoration",
  "shared.relationship.name_restoration_name",
]);

export type IntakePhase = 1 | 2 | 3 | "ALL";

/**
 * Resolve a matter's effective phase. Per-matter `intake_phase` (set by the
 * attorney as the case progresses) drives it; the INTAKE_PHASE=ALL env is a
 * global kill-switch back to the full questionnaire. Phase 3 asks nothing new
 * of the client (finalization is firm-side renders), so it inherits phase 2's
 * question set.
 */
export function matterIntakePhase(matter?: { intakePhase?: number | null } | null): IntakePhase {
  if ((process.env.INTAKE_PHASE ?? "").trim().toUpperCase() === "ALL") return "ALL";
  const p = matter?.intakePhase;
  return p === 2 ? 2 : p === 3 ? 3 : 1;
}

/** Back-compat default when no matter is in scope: env ALL, else phase 1. */
export function activeIntakePhase(): IntakePhase {
  return matterIntakePhase(null);
}

/**
 * Phase membership for CLIENT-audience items. Non-client items (attorney
 * determinations, staff panels) are never phase-filtered — pass them through.
 */
export function clientItemInPhase(
  item: { id: string; audience: string },
  phase: IntakePhase
): boolean {
  if (phase === "ALL") return true;
  if (item.audience !== "CLIENT") return true;
  if (phase === 1) return PHASE1_ITEM_IDS.has(item.id);
  return PHASE2_ITEM_IDS.has(item.id); // phases 2 and 3
}

/** Legacy single-argument form — env-resolved phase (used where no matter is available). */
export function clientItemInActivePhase(item: { id: string; audience: string }): boolean {
  return clientItemInPhase(item, activeIntakePhase());
}
