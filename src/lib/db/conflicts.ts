/**
 * Conflict-screening history. Deliberately NO foreign keys: a law firm's
 * duty to check future conflicts outlives any one matter, so the minimum
 * reasonably necessary information (party identities/aliases, opposing
 * party, entities, screen result, disposition) survives purges of a
 * matter's substantive content. This table is never auto-purged.
 *
 * Internal reasoning (`internalNote`, screen result, disposition detail) is
 * NEVER exposed to clients — client-facing code uses the neutral status
 * strings in src/lib/matters/client-view.ts.
 */
import { getDb, newId, nowIso } from "./index";
import type { PartyName } from "./repo";
import type { ScreenStatus } from "./matters";
import { getUserById } from "./users";

export interface ConflictSubmissionRow {
  id: string;
  matterRef: string;
  clientParty: PartyName;
  adverseParty: PartyName;
  entities: string[];
  screenResult: ScreenStatus;
  submittedBy: string;
  createdAt: string;
  disposition: "CLEARED" | "DECLINED" | "NEEDS_MORE_INFORMATION" | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  internalNote: string | null;
}

function rowToSubmission(r: Record<string, unknown>): ConflictSubmissionRow {
  return {
    id: r.id as string,
    matterRef: r.matter_ref as string,
    clientParty: JSON.parse(r.client_party as string),
    adverseParty: JSON.parse(r.adverse_party as string),
    entities: JSON.parse((r.entities as string) || "[]"),
    screenResult: r.screen_result as ScreenStatus,
    submittedBy: r.submitted_by as string,
    createdAt: r.created_at as string,
    disposition: (r.disposition as ConflictSubmissionRow["disposition"]) ?? null,
    resolvedBy: (r.resolved_by as string | null) ?? null,
    resolvedAt: (r.resolved_at as string | null) ?? null,
    internalNote: (r.internal_note as string | null) ?? null,
  };
}

export function recordConflictSubmission(opts: {
  matterRef: string;
  clientParty: PartyName;
  adverseParty: PartyName;
  entities?: string[];
  screenResult: ScreenStatus;
  submittedBy: string;
}): ConflictSubmissionRow {
  const id = newId();
  getDb()
    .prepare(
      `INSERT INTO conflict_submission
       (id, matter_ref, client_party, adverse_party, entities, screen_result, submitted_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      opts.matterRef,
      JSON.stringify(opts.clientParty),
      JSON.stringify(opts.adverseParty),
      JSON.stringify(opts.entities ?? []),
      opts.screenResult,
      opts.submittedBy,
      nowIso()
    );
  return getConflictSubmission(id)!;
}

export function getConflictSubmission(id: string): ConflictSubmissionRow | null {
  const r = getDb()
    .prepare(`SELECT * FROM conflict_submission WHERE id = ?`)
    .get(id) as Record<string, unknown> | undefined;
  return r ? rowToSubmission(r) : null;
}

export function listConflictSubmissionsForMatter(matterRef: string): ConflictSubmissionRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM conflict_submission WHERE matter_ref = ? ORDER BY created_at DESC`)
    .all(matterRef) as Record<string, unknown>[];
  return rows.map(rowToSubmission);
}

/**
 * Attorney disposition on the latest submission. Structural guard: the
 * acting user's CURRENT role is re-read here, exactly like
 * attorneySetConflictDisposition in matters.ts.
 */
export function resolveLatestSubmission(opts: {
  matterRef: string;
  actingUserId: string;
  disposition: "CLEARED" | "DECLINED" | "NEEDS_MORE_INFORMATION";
  internalNote?: string;
}): void {
  const actor = getUserById(opts.actingUserId);
  if (!actor || !actor.active || actor.role !== "ATTORNEY") {
    throw new Error("CONFLICT_GUARD: only an active ATTORNEY may resolve conflict submissions");
  }
  const latest = listConflictSubmissionsForMatter(opts.matterRef)[0];
  if (!latest) return;
  getDb()
    .prepare(
      `UPDATE conflict_submission
       SET disposition = ?, resolved_by = ?, resolved_at = ?, internal_note = COALESCE(?, internal_note)
       WHERE id = ?`
    )
    .run(opts.disposition, actor.id, nowIso(), opts.internalNote ?? null, latest.id);
}

/** Test/inspection helper. */
export function countConflictSubmissions(matterRef?: string): number {
  const db = getDb();
  const r = (
    matterRef
      ? db.prepare(`SELECT COUNT(*) c FROM conflict_submission WHERE matter_ref = ?`).get(matterRef)
      : db.prepare(`SELECT COUNT(*) c FROM conflict_submission`).get()
  ) as { c: number };
  return r.c;
}
