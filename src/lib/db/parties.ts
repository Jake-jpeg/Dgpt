/**
 * Parties — the two spouses on a matter (2026-10-30).
 *
 * Operator: "Dual login system. Each has to complete intake to ensure there
 * is a meeting of the minds. If there is? final product goes to Jake Kim
 * Law Firm for review."
 *
 *   A — the spouse who started the case with June. The firm's client;
 *       `matter.client_user_id` is kept equal to A's user so every existing
 *       client-side path (sessions, documents, the client portal) keeps
 *       working unchanged.
 *   B — the spouse A invited. Joins through a single-use link bound to the
 *       email A gave June; answers the SAME questionnaire, separately.
 *
 * A party reads only its own answers. The firm reads both, side by side,
 * once both are complete. Neither ever sees the other's.
 */
import { getDb, newId, nowIso } from "./index";

export type PartyRole = "A" | "B";
export type PartyStatus = "INVITED" | "JOINED" | "INTAKE_IN_PROGRESS" | "INTAKE_COMPLETE" | "WITHDRAWN";

export interface PartyRow {
  id: string;
  matterId: string;
  role: PartyRole;
  userId: string | null;
  invitedEmail: string;
  displayName: string;
  status: PartyStatus;
  /** Second spouse only: when they acknowledged the representation notice, and which version. */
  noticeAckAt: string | null;
  noticeAckVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToParty(r: Record<string, unknown>): PartyRow {
  return {
    id: r.id as string,
    matterId: r.matter_id as string,
    role: r.role as PartyRole,
    userId: (r.user_id as string | null) ?? null,
    invitedEmail: (r.invited_email as string) ?? "",
    displayName: (r.display_name as string) ?? "",
    status: (r.status as PartyStatus) ?? "INVITED",
    noticeAckAt: (r.notice_ack_at as string | null) ?? null,
    noticeAckVersion: (r.notice_ack_version as string | null) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export async function listParties(matterId: string): Promise<PartyRow[]> {
  const rows = await getDb().all(`SELECT * FROM matter_party WHERE matter_id = ? ORDER BY role`, matterId);
  return rows.map(rowToParty);
}

export async function getParty(matterId: string, role: PartyRole): Promise<PartyRow | null> {
  const r = await getDb().get(`SELECT * FROM matter_party WHERE matter_id = ? AND role = ?`, matterId, role);
  return r ? rowToParty(r) : null;
}

export async function getPartyById(id: string): Promise<PartyRow | null> {
  const r = await getDb().get(`SELECT * FROM matter_party WHERE id = ?`, id);
  return r ? rowToParty(r) : null;
}

/** Create a party seat. B starts INVITED (no user yet); A is JOINED at birth. */
export async function createParty(opts: {
  matterId: string;
  role: PartyRole;
  userId?: string | null;
  invitedEmail?: string;
  displayName?: string;
}): Promise<PartyRow> {
  const id = newId();
  const t = nowIso();
  await getDb().run(
    `INSERT INTO matter_party (id, matter_id, role, user_id, invited_email, display_name, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    opts.matterId,
    opts.role,
    opts.userId ?? null,
    (opts.invitedEmail ?? "").trim().toLowerCase(),
    (opts.displayName ?? "").trim(),
    opts.userId ? "JOINED" : "INVITED",
    t,
    t
  );
  return (await getPartyById(id))!;
}

/**
 * Seat a user on a party. For the second spouse, `noticeVersion` records
 * that they acknowledged the "the firm represents your spouse, not you"
 * notice (operator, 2026-10-30: "store the acknowledgment with a
 * timestamp") — the timestamp is the seat time, in the same UPDATE.
 */
export async function seatParty(partyId: string, userId: string, noticeVersion?: string): Promise<void> {
  const t = nowIso();
  if (noticeVersion) {
    await getDb().run(
      `UPDATE matter_party SET user_id = ?, status = 'JOINED', notice_ack_at = ?, notice_ack_version = ?, updated_at = ? WHERE id = ?`,
      userId,
      t,
      noticeVersion,
      t,
      partyId
    );
    return;
  }
  await getDb().run(
    `UPDATE matter_party SET user_id = ?, status = 'JOINED', updated_at = ? WHERE id = ?`,
    userId,
    t,
    partyId
  );
}

export async function setPartyStatus(partyId: string, status: PartyStatus): Promise<void> {
  await getDb().run(`UPDATE matter_party SET status = ?, updated_at = ? WHERE id = ?`, status, nowIso(), partyId);
}

/**
 * Which party a user is on a matter. Legacy matters (created before the
 * two-spouse model) have no party rows: their bound client is A.
 */
export async function partyRoleForUser(
  matter: { id: string; clientUserId: string | null },
  userId: string
): Promise<PartyRole | null> {
  const r = await getDb().get<{ role: string }>(
    `SELECT role FROM matter_party WHERE matter_id = ? AND user_id = ?`,
    matter.id,
    userId
  );
  if (r) return r.role as PartyRole;
  return matter.clientUserId === userId ? "A" : null;
}

/** Matter ids where this user sits as a party (either role). */
export async function matterIdsForPartyUser(userId: string): Promise<string[]> {
  const rows = await getDb().all<{ matter_id: string }>(
    `SELECT matter_id FROM matter_party WHERE user_id = ?`,
    userId
  );
  return rows.map((r) => r.matter_id);
}

/** True once BOTH parties have completed their interview. */
export async function bothPartiesComplete(matterId: string): Promise<boolean> {
  const parties = await listParties(matterId);
  return parties.length === 2 && parties.every((p) => p.status === "INTAKE_COMPLETE");
}
