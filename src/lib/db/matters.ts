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
  /** 2026-07-21: conflicts are run in the FIRM'S OWN SYSTEM before the
   *  client is directed here. EXTERNAL records that posture; it is set only
   *  at matter self-open and is NOT the attorney-only CLEARED disposition. */
  | "EXTERNAL"
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
  /** Lowercased email the attorney expects to register. Confers NO access. */
  expectedClientEmail: string | null;
  // B6 — attorney jurisdiction & scope review
  jurisdictionCandidate: string | null;
  jurisdictionConfirmed: string | null;
  jurisdictionConfirmedBy: string | null;
  jurisdictionConfirmedAt: string | null;
  matterCategory: string | null;
  matterCategoryConfirmedBy: string | null;
  scopeStatus: string;
  scopeNotes: string | null;
  intakeSchemaVersion: string | null;
  /** 1 commencement | 2 settlement | 3 finalization — attorney-advanced. */
  intakePhase: number;
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
    expectedClientEmail: (r.expected_client_email as string | null) ?? null,
    jurisdictionCandidate: (r.jurisdiction_candidate as string | null) ?? null,
    jurisdictionConfirmed: (r.jurisdiction_confirmed as string | null) ?? null,
    jurisdictionConfirmedBy: (r.jurisdiction_confirmed_by as string | null) ?? null,
    jurisdictionConfirmedAt: (r.jurisdiction_confirmed_at as string | null) ?? null,
    matterCategory: (r.matter_category as string | null) ?? null,
    matterCategoryConfirmedBy: (r.matter_category_confirmed_by as string | null) ?? null,
    scopeStatus: (r.scope_status as string) ?? "UNREVIEWED",
    scopeNotes: (r.scope_notes as string | null) ?? null,
    intakeSchemaVersion: (r.intake_schema_version as string | null) ?? null,
    intakePhase: Number(r.intake_phase ?? 1),
    createdBy: r.created_by as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    lastActivityAt: r.last_activity_at as string,
  };
}

export async function createMatter(opts: {
  label: string;
  createdBy: string;
  /** The creator's state choice from the picker. For a STAFF creator this
   *  is recorded as the CANDIDATE only — confirming jurisdiction remains an
   *  attorney act (attorneySetJurisdictionAndScope guards that). */
  jurisdictionCandidate?: "NY" | "NJ";
}): Promise<MatterRow> {
  const db = getDb();
  const id = newId();
  const t = nowIso();
  await db.run(
    `INSERT INTO matter (id, label, created_by, jurisdiction_candidate, created_at, updated_at, last_activity_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    opts.label,
    opts.createdBy,
    opts.jurisdictionCandidate ?? null,
    t,
    t,
    t
  );
  return (await getMatter(id))!;
}

export async function getMatter(id: string): Promise<MatterRow | null> {
  const r = await getDb().get(`SELECT * FROM matter WHERE id = ?`, id);
  return r ? rowToMatter(r) : null;
}

export async function listAllMatters(): Promise<MatterRow[]> {
  const rows = await getDb().all(`SELECT * FROM matter ORDER BY updated_at DESC`);
  return rows.map(rowToMatter);
}

export async function listMattersForClient(clientUserId: string): Promise<MatterRow[]> {
  const rows = await getDb().all(
    `SELECT * FROM matter WHERE client_user_id = ? ORDER BY updated_at DESC`,
    clientUserId
  );
  return rows.map(rowToMatter);
}

export async function listMattersForGrantee(userId: string): Promise<MatterRow[]> {
  const rows = await getDb().all(
    `SELECT m.* FROM matter m
     JOIN matter_access a ON a.matter_id = m.id
     WHERE a.user_id = ? ORDER BY m.updated_at DESC`,
    userId
  );
  return rows.map(rowToMatter);
}

// ── Matter access grants (STAFF / ATTORNEY) ──────────────────────────

export async function grantMatterAccess(
  matterId: string,
  userId: string,
  grantedBy: string
): Promise<void> {
  await getDb().run(
    `INSERT INTO matter_access (id, matter_id, user_id, granted_by, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(matter_id, user_id) DO NOTHING`,
    newId(),
    matterId,
    userId,
    grantedBy,
    nowIso()
  );
}

export async function revokeMatterAccess(matterId: string, userId: string): Promise<void> {
  await getDb().run(`DELETE FROM matter_access WHERE matter_id = ? AND user_id = ?`, matterId, userId);
}

export async function hasMatterGrant(matterId: string, userId: string): Promise<boolean> {
  const r = await getDb().get(
    `SELECT 1 AS x FROM matter_access WHERE matter_id = ? AND user_id = ?`,
    matterId,
    userId
  );
  return Boolean(r);
}

/**
 * Central matter-access decision. A CLIENT may access only a matter to which
 * they are bound as the client. STAFF and ATTORNEY must hold an explicit
 * matter grant. ADMIN manages users/configuration but is NOT granted blanket
 * access to matter content by role (least privilege); an admin who also
 * works matters receives explicit grants.
 */
export async function canAccessMatter(user: UserRow, matter: MatterRow): Promise<boolean> {
  if (!user.active) return false;
  switch (user.role) {
    case "CLIENT":
      // A client sees ONLY their own matter — never another client's.
      return matter.clientUserId === user.id;
    case "STAFF":
    case "ATTORNEY":
      // Firm-wide (2026-07-21 directive, solo/small-firm model): any active
      // firm member sees and can work EVERY matter, so a client who
      // self-signs-up is visible to the lawyer without an invitation or
      // per-matter grant. The attorney-only STRUCTURAL guards (conflict
      // CLEARED/DECLINED, jurisdiction/scope, document approval/release) are
      // enforced separately by role re-reads at the persistence layer and are
      // NOT affected by this visibility rule.
      return true;
    case "ADMIN":
      // Admin keeps the least-privilege management view (labels + status);
      // working a matter still requires an explicit grant.
      return hasMatterGrant(matter.id, user.id);
    default:
      return false;
  }
}

export async function bindClientToMatter(matterId: string, clientUserId: string): Promise<void> {
  const t = nowIso();
  await getDb().run(
    `UPDATE matter SET client_user_id = ?, updated_at = ?, last_activity_at = ? WHERE id = ?`,
    clientUserId,
    t,
    t,
    matterId
  );
}

/**
 * Record the client the attorney expects on this matter, by email, BEFORE
 * that person has ever signed in (operator, 2026-07-29: "Lawyer adds client
 * via their email address").
 *
 * THIS GRANTS NOTHING. It is a label, not a credential. Access still comes
 * only from `bindClientToMatter`, which only the attorney's explicit connect
 * action calls. The stored address does one job: when a registration appears
 * whose provider-VERIFIED email matches, the firm portal can say "this is
 * the person you added" so the attorney confirms a name instead of picking a
 * stranger out of a list. A typo therefore costs a wasted invitation, never
 * a disclosed matter — which is why matching is deliberately not
 * auto-connect. (The retired invitation-link flow bound an email the same
 * way; the links themselves are NOT coming back — the invite cookie did not
 * survive the OAuth round-trip in live testing. See git history at 5041649.)
 *
 * Pass null to clear. Returns the updated matter.
 */
export async function setExpectedClientEmail(
  matterId: string,
  email: string | null
): Promise<MatterRow> {
  const normalized = email === null ? null : email.trim().toLowerCase();
  if (normalized !== null && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    throw new Error("VALIDATION: enter a valid email address for the client");
  }
  const t = nowIso();
  await getDb().run(
    `UPDATE matter SET expected_client_email = ?, updated_at = ?, last_activity_at = ? WHERE id = ?`,
    normalized,
    t,
    t,
    matterId
  );
  const m = await getMatter(matterId);
  if (!m) throw new Error("VALIDATION: matter not found");
  return m;
}

// ── Conflict status (structural attorney-only terminal states) ───────

/**
 * Automated screening result. REFUSES terminal statuses by construction:
 * the type and a runtime check both restrict input to the four screen
 * statuses.
 */
export async function recordScreenStatus(matterId: string, status: ScreenStatus): Promise<void> {
  if (!(SCREEN_STATUSES as readonly string[]).includes(status)) {
    throw new Error(
      `CONFLICT_GUARD: automated screening may not set conflict status '${status}'`
    );
  }
  const t = nowIso();
  await getDb().run(
    `UPDATE matter SET conflict_status = ?, conflict_status_set_by = 'SYSTEM_SCREEN',
     conflict_status_set_at = ?, updated_at = ?, last_activity_at = ? WHERE id = ?`,
    status,
    t,
    t,
    t,
    matterId
  );
}

/**
 * THE ONLY code path that can mark a matter CLEARED or DECLINED.
 *
 * The acting user's role is re-read from the app_user table HERE, at the
 * moment of the write — a stale session, a spoofed body field, an ADMIN, or
 * STAFF can never produce a terminal conflict disposition.
 */
export async function attorneySetConflictDisposition(opts: {
  matterId: string;
  actingUserId: string;
  disposition: "CLEARED" | "DECLINED" | "NEEDS_MORE_INFORMATION";
}): Promise<MatterRow> {
  const actor = await getUserById(opts.actingUserId);
  if (!actor || !actor.active || actor.role !== "ATTORNEY") {
    throw new Error(
      "CONFLICT_GUARD: only an active ATTORNEY may set a conflict disposition"
    );
  }
  const matter = await getMatter(opts.matterId);
  if (!matter) throw new Error("VALIDATION: matter not found");
  const t = nowIso();
  await getDb().run(
    `UPDATE matter SET conflict_status = ?, conflict_status_set_by = ?,
     conflict_status_set_at = ?, updated_at = ?, last_activity_at = ? WHERE id = ?`,
    opts.disposition,
    actor.id,
    t,
    t,
    t,
    opts.matterId
  );
  return (await getMatter(opts.matterId))!;
}

/** Client-blocking check used by intake + persistence guards. EXTERNAL
 *  (conflicts run in the firm's own system) passes alongside the
 *  attorney-set CLEARED. */
export async function matterConflictCleared(matterId: string): Promise<boolean> {
  const m = await getMatter(matterId);
  return Boolean(m && (m.conflictStatus === "CLEARED" || m.conflictStatus === "EXTERNAL"));
}

/**
 * ATTORNEY matter deletion — the lawyer runs their own book (operator
 * directive 2026-07-22: attorney-side delete, not admin-only; "once LAS has
 * this, they call the shots"). Removes the matter and EVERYTHING it owns,
 * atomically: FK children (documents/versions/approvals/releases,
 * invitations, accommodations, info/assistance requests, notes, access
 * grants) via ON DELETE CASCADE, plus the non-FK children (intake answers +
 * history, conflict submissions, disclosure acks, AI metadata, the matter's
 * intake sessions → their identity/answers/chat transcripts).
 *
 * RETAINED: the tamper-evident audit_event chain and bot_interaction_log
 * (opaque refs, no PII), exactly like the admin cascade.
 *
 * If the bound client account is left owning NOTHING (no other matter, no
 * sessions, no submissions), it is removed too — an invited client whose only
 * matter is deleted should not linger as a login with nowhere to go. The
 * caller (route) enforces the ATTORNEY role and refuses legal holds.
 */
export async function deleteMatterCascade(matterId: string): Promise<{
  deleted: boolean;
  clientAccountDeleted: boolean;
  clientEmail: string | null;
}> {
  const db = getDb();
  const result = await db.serialized(async (tx) => {
    const m = await tx.get<{ id: string; client_user_id: string | null }>(
      `SELECT id, client_user_id FROM matter WHERE id = ?`,
      matterId
    );
    if (!m) return { deleted: false, clientUserId: null as string | null };
    await tx.run(`DELETE FROM matter_intake_answer WHERE matter_id = ?`, matterId);
    await tx.run(`DELETE FROM matter_intake_answer_history WHERE matter_id = ?`, matterId);
    await tx.run(`DELETE FROM conflict_submission WHERE matter_ref = ?`, matterId);
    await tx.run(`DELETE FROM disclosure_ack WHERE matter_ref = ?`, matterId);
    await tx.run(`DELETE FROM ai_invocation WHERE matter_ref = ?`, matterId);
    await tx.run(`DELETE FROM ai_job WHERE matter_ref = ?`, matterId);
    // Sessions link by non-FK matter_id; deleting them cascades their
    // party_identity / intake_answer / intake_chat_message rows.
    await tx.run(`DELETE FROM intake_session WHERE matter_id = ?`, matterId);
    await tx.run(`DELETE FROM matter WHERE id = ?`, matterId);
    return { deleted: true, clientUserId: m.client_user_id };
  });

  if (!result.deleted) return { deleted: false, clientAccountDeleted: false, clientEmail: null };

  // Orphan cleanup: a CLIENT account with zero remaining case references.
  let clientAccountDeleted = false;
  let clientEmail: string | null = null;
  if (result.clientUserId) {
    const { getUserById, countUserReferences } = await import("./users");
    const user = await getUserById(result.clientUserId);
    if (user && user.role === "CLIENT") {
      clientEmail = user.email;
      if ((await countUserReferences(user)) === 0) {
        await db.run(`DELETE FROM app_user WHERE id = ?`, user.id);
        clientAccountDeleted = true;
      }
    }
  }
  return { deleted: true, clientAccountDeleted, clientEmail };
}

/**
 * Advance (or rewind) a matter's intake phase — 1 commencement, 2 settlement,
 * 3 finalization. Attorney-driven case progression; the API route enforces
 * the ATTORNEY role and the change is audited there.
 */
export async function setMatterIntakePhase(matterId: string, phase: 1 | 2 | 3): Promise<void> {
  const t = nowIso();
  await getDb().run(
    `UPDATE matter SET intake_phase = ?, updated_at = ?, last_activity_at = ? WHERE id = ?`,
    phase,
    t,
    t,
    matterId
  );
}

/** Invitation acceptance records the firm's external-conflicts posture on the matter. */
export async function markConflictsExternal(matterId: string): Promise<void> {
  const t = nowIso();
  await getDb().run(
    `UPDATE matter SET conflict_status = 'EXTERNAL', conflict_status_set_by = 'FIRM_EXTERNAL_SYSTEM',
     conflict_status_set_at = ?, updated_at = ?, last_activity_at = ? WHERE id = ? AND conflict_status = 'NOT_STARTED'`,
    t,
    t,
    t,
    matterId
  );
}

// ── Lifecycle + legal hold ────────────────────────────────────────────

export async function setMatterLifecycle(
  matterId: string,
  lifecycle: MatterLifecycle
): Promise<void> {
  const t = nowIso();
  await getDb().run(
    `UPDATE matter SET lifecycle = ?, updated_at = ?, last_activity_at = ? WHERE id = ?`,
    lifecycle,
    t,
    t,
    matterId
  );
}

export async function setLegalHold(matterId: string, hold: boolean, reason?: string): Promise<void> {
  const t = nowIso();
  await getDb().run(
    `UPDATE matter SET legal_hold = ?, legal_hold_reason = ?, updated_at = ? WHERE id = ?`,
    hold ? 1 : 0,
    hold ? reason ?? null : null,
    t,
    matterId
  );
}
