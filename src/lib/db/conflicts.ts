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

export async function recordConflictSubmission(opts: {
  matterRef: string;
  clientParty: PartyName;
  adverseParty: PartyName;
  entities?: string[];
  screenResult: ScreenStatus;
  submittedBy: string;
}): Promise<ConflictSubmissionRow> {
  const id = newId();
  await getDb().run(
    `INSERT INTO conflict_submission
     (id, matter_ref, client_party, adverse_party, entities, screen_result, submitted_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    opts.matterRef,
    JSON.stringify(opts.clientParty),
    JSON.stringify(opts.adverseParty),
    JSON.stringify(opts.entities ?? []),
    opts.screenResult,
    opts.submittedBy,
    nowIso()
  );
  return (await getConflictSubmission(id))!;
}

export async function getConflictSubmission(id: string): Promise<ConflictSubmissionRow | null> {
  const r = await getDb().get(`SELECT * FROM conflict_submission WHERE id = ?`, id);
  return r ? rowToSubmission(r) : null;
}

export async function listConflictSubmissionsForMatter(
  matterRef: string
): Promise<ConflictSubmissionRow[]> {
  const rows = await getDb().all(
    `SELECT * FROM conflict_submission WHERE matter_ref = ? ORDER BY created_at DESC`,
    matterRef
  );
  return rows.map(rowToSubmission);
}

/**
 * Attorney disposition on the latest submission. Structural guard: the
 * acting user's CURRENT role is re-read here, exactly like
 * attorneySetConflictDisposition in matters.ts.
 */
export async function resolveLatestSubmission(opts: {
  matterRef: string;
  actingUserId: string;
  disposition: "CLEARED" | "DECLINED" | "NEEDS_MORE_INFORMATION";
  internalNote?: string;
}): Promise<void> {
  const actor = await getUserById(opts.actingUserId);
  if (!actor || !actor.active || actor.role !== "ATTORNEY") {
    throw new Error("CONFLICT_GUARD: only an active ATTORNEY may resolve conflict submissions");
  }
  const latest = (await listConflictSubmissionsForMatter(opts.matterRef))[0];
  if (!latest) return;
  await getDb().run(
    `UPDATE conflict_submission
     SET disposition = ?, resolved_by = ?, resolved_at = ?, internal_note = COALESCE(?, internal_note)
     WHERE id = ?`,
    opts.disposition,
    actor.id,
    nowIso(),
    opts.internalNote ?? null,
    latest.id
  );
}

/** Test/inspection helper. */
export async function countConflictSubmissions(matterRef?: string): Promise<number> {
  const db = getDb();
  const r = (matterRef
    ? await db.get<{ c: number }>(
        `SELECT COUNT(*) c FROM conflict_submission WHERE matter_ref = ?`,
        matterRef
      )
    : await db.get<{ c: number }>(`SELECT COUNT(*) c FROM conflict_submission`))!;
  return r.c;
}
