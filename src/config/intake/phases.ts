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
  "shared.identity.client_dob",
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
  // NY residency + venue + grounds (¶FIRST, caption county, ¶NINTH)
  "ny.case.resident_now",
  "ny.case.resident_since",
  "ny.case.county",
  "ny.case.grounds_facts",
  "ny.case.grounds_dates",
  // Service posture (drives the acknowledgment-of-service / waiver path)
  "ny.case.service_facts",
]);

/**
 * The active phase. Defaults to 1 — Phase 1 IS the product right now.
 * Set INTAKE_PHASE=ALL to restore the full questionnaire (previous behavior),
 * e.g. for a future phase rollout or side-by-side comparison.
 */
export function activeIntakePhase(): 1 | "ALL" {
  const v = (process.env.INTAKE_PHASE ?? "1").trim().toUpperCase();
  return v === "ALL" ? "ALL" : 1;
}

/**
 * Phase membership for CLIENT-audience items. Non-client items (attorney
 * determinations, staff panels) are never phase-filtered — pass them through.
 */
export function clientItemInActivePhase(item: { id: string; audience: string }): boolean {
  if (activeIntakePhase() === "ALL") return true;
  if (item.audience !== "CLIENT") return true;
  return PHASE1_ITEM_IDS.has(item.id);
}
