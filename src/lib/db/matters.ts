/**
 * Matter repository — the unit of representation in the 2.0 attorney
 * workflow. Every client-facing artifact (intake, uploads, documents,
 * releases) hangs off a matter.
 *
 * STRUCTURAL GUARDS (not configurable; deliberately enforced at the
 * persistence layer in the same belt-and-suspenders style as
 * repo.insertAnswer):
 *
 *  - Automated conflict screening may write ONLY the four non-terminal
 *    statuses (`recordScreenStatus`). The terminal dispositions CLEARED and
 *    DECLINED have exactly one code path (`attorneySetConflictDisposition`),
 *    which re-reads the acting user's CURRENT role from the database and
 *    throws unless that role is ATTORNEY. There is no configuration flag,
 *    admin setting, or alternate function that bypasses this.
 */
import { getDb, newId, nowIso } from "./index";
import { getUserById, type UserRow } from "./users";

export type MatterLifecycle =
  | "PROSPECTIVE"
  | "ENGAGED"
  | "ABANDONED"
  | "DECLINED"
  | "CLOSED";

export type ConflictStatus =
  | "NOT_STARTED"
  | "NO_APPARENT_MATCH"
  | "POTENTIAL_MATCH"
  | "NEEDS_MORE_INFORMATION"
  | "PENDING_ATTORNEY_REVIEW"
  | "CLEARED"
  | "DECLINED";

/** The ONLY statuses automated screening is permitted to produce. */
export const SCREEN_STATUSES = [
  "NO_APPARENT_MATCH",
  "POTENTIAL_MATCH",
  "NEEDS_MORE_INFORMATION",
  "PENDING_ATTORNEY_REVIEW",
] as const;

export type ScreenStatus = (typeof SCREEN_STATUSES)[number];

/** Attorney-only terminal dispositions. */
export const TERMINAL_CONFLICT_STATUSES = ["CLEARED", "DECLINED"] as const;

export interface MatterRow {
  id: string;
  label: string;
  lifecycle: MatterLifecycle;
  conflictStatus: ConflictStatus;
  conflictStatusSetBy: string | null;
  conflictStatusSetAt: string | null;
  legalHold: boolean;
  legalHoldReason: string | null;
  clientUserId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

function rowToMatter(r: Record<string, unknown>): MatterRow {
  return {
    id: r.id as string,
    label: r.label as string,
    lifecycle: r.lifecycle as MatterLifecycle,
    conflictStatus: r.conflict_status as ConflictStatus,
    conflictStatusSetBy: (r.conflict_status_set_by as string | null) ?? null,
    conflictStatusSetAt: (r.conflict_status_set_at as string | null) ?? null,
    legalHold: r.legal_hold === 1,
    legalHoldReason: (r.legal_hold_reason as string | null) ?? null,
    clientUserId: (r.client_user_id as string | null) ?? null,
    createdBy: r.created_by as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    lastActivityAt: r.last_activity_at as string,
  };
}

export function createMatter(opts: { label: string; createdBy: string }): MatterRow {
  const db = getDb();
  const id = newId();
  const t = nowIso();
  db.prepare(
    `INSERT INTO matter (id, label, created_by, created_at, updated_at, last_activity_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, opts.label, opts.createdBy, t, t, t);
  return getMatter(id)!;
}

export function getMatter(id: string): MatterRow | null {
  const r = getDb()
    .prepare(`SELECT * FROM matter WHERE id = ?`)
    .get(id) as Record<string, unknown> | undefined;
  return r ? rowToMatter(r) : null;
}

export function touchMatter(id: string): void {
  const t = nowIso();
  getDb()
    .prepare(`UPDATE matter SET last_activity_at = ?, updated_at = ? WHERE id = ?`)
    .run(t, t, id);
}

export function listAllMatters(): MatterRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM matter ORDER BY updated_at DESC`)
    .all() as Record<string, unknown>[];
  return rows.map(rowToMatter);
}

export function listMattersForClient(clientUserId: string): MatterRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM matter WHERE client_user_id = ? ORDER BY updated_at DESC`)
    .all(clientUserId) as Record<string, unknown>[];
  return rows.map(rowToMatter);
}

export function listMattersForGrantee(userId: string): MatterRow[] {
  const rows = getDb()
    .prepare(
      `SELECT m.* FROM matter m
       JOIN matter_access a ON a.matter_id = m.id
       WHERE a.user_id = ? ORDER BY m.updated_at DESC`
    )
    .all(userId) as Record<string, unknown>[];
  return rows.map(rowToMatter);
}

// ── Matter access grants (STAFF / ATTORNEY) ──────────────────────────

export function grantMatterAccess(matterId: string, userId: string, grantedBy: string): void {
  getDb()
    .prepare(
      `INSERT INTO matter_access (id, matter_id, user_id, granted_by, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(matter_id, user_id) DO NOTHING`
    )
    .run(newId(), matterId, userId, grantedBy, nowIso());
}

export function revokeMatterAccess(matterId: string, userId: string): void {
  getDb()
    .prepare(`DELETE FROM matter_access WHERE matter_id = ? AND user_id = ?`)
    .run(matterId, userId);
}

export function hasMatterGrant(matterId: string, userId: string): boolean {
  const r = getDb()
    .prepare(`SELECT 1 AS x FROM matter_access WHERE matter_id = ? AND user_id = ?`)
    .get(matterId, userId);
  return Boolean(r);
}

/**
 * Central matter-access decision. A CLIENT may access only a matter to which
 * they are bound as the client. STAFF and ATTORNEY must hold an explicit
 * matter grant. ADMIN manages users/configuration but is NOT granted blanket
 * access to matter content by role (least privilege); an admin who also
 * works matters receives explicit grants.
 */
export function canAccessMatter(user: UserRow, matter: MatterRow): boolean {
  if (!user.active) return false;
  switch (user.role) {
    case "CLIENT":
      return matter.clientUserId === user.id;
    case "STAFF":
    case "ATTORNEY":
      return hasMatterGrant(matter.id, user.id);
    case "ADMIN":
      return hasMatterGrant(matter.id, user.id);
    default:
      return false;
  }
}

export function bindClientToMatter(matterId: string, clientUserId: string): void {
  const t = nowIso();
  getDb()
    .prepare(`UPDATE matter SET client_user_id = ?, updated_at = ?, last_activity_at = ? WHERE id = ?`)
    .run(clientUserId, t, t, matterId);
}

// ── Conflict status (structural attorney-only terminal states) ───────

/**
 * Automated screening result. REFUSES terminal statuses by construction:
 * the type and a runtime check both restrict input to the four screen
 * statuses.
 */
export function recordScreenStatus(matterId: string, status: ScreenStatus): void {
  if (!(SCREEN_STATUSES as readonly string[]).includes(status)) {
    throw new Error(
      `CONFLICT_GUARD: automated screening may not set conflict status '${status}'`
    );
  }
  const t = nowIso();
  getDb()
    .prepare(
      `UPDATE matter SET conflict_status = ?, conflict_status_set_by = 'SYSTEM_SCREEN',
       conflict_status_set_at = ?, updated_at = ?, last_activity_at = ? WHERE id = ?`
    )
    .run(status, t, t, t, matterId);
}

/**
 * THE ONLY code path that can mark a matter CLEARED or DECLINED.
 *
 * The acting user's role is re-read from the app_user table HERE, at the
 * moment of the write — a stale session, a spoofed body field, an ADMIN, or
 * STAFF can never produce a terminal conflict disposition.
 */
export function attorneySetConflictDisposition(opts: {
  matterId: string;
  actingUserId: string;
  disposition: "CLEARED" | "DECLINED" | "NEEDS_MORE_INFORMATION";
}): MatterRow {
  const actor = getUserById(opts.actingUserId);
  if (!actor || !actor.active || actor.role !== "ATTORNEY") {
    throw new Error(
      "CONFLICT_GUARD: only an active ATTORNEY may set a conflict disposition"
    );
  }
  const matter = getMatter(opts.matterId);
  if (!matter) throw new Error("VALIDATION: matter not found");
  const t = nowIso();
  getDb()
    .prepare(
      `UPDATE matter SET conflict_status = ?, conflict_status_set_by = ?,
       conflict_status_set_at = ?, updated_at = ?, last_activity_at = ? WHERE id = ?`
    )
    .run(opts.disposition, actor.id, t, t, t, opts.matterId);
  return getMatter(opts.matterId)!;
}

/** Client-blocking check used by intake + persistence guards. */
export function matterConflictCleared(matterId: string): boolean {
  const m = getMatter(matterId);
  return Boolean(m && m.conflictStatus === "CLEARED");
}

// ── Lifecycle + legal hold ────────────────────────────────────────────

export function setMatterLifecycle(matterId: string, lifecycle: MatterLifecycle): void {
  const t = nowIso();
  getDb()
    .prepare(`UPDATE matter SET lifecycle = ?, updated_at = ?, last_activity_at = ? WHERE id = ?`)
    .run(lifecycle, t, t, matterId);
}

export function setLegalHold(matterId: string, hold: boolean, reason?: string): void {
  const t = nowIso();
  getDb()
    .prepare(
      `UPDATE matter SET legal_hold = ?, legal_hold_reason = ?, updated_at = ? WHERE id = ?`
    )
    .run(hold ? 1 : 0, hold ? reason ?? null : null, t, matterId);
}
