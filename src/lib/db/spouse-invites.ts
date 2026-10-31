/**
 * Spouse invitations (2026-10-30) — the single-use link that seats the
 * second spouse (party B) on a matter the first spouse started with June.
 *
 * Same guarantees the retired July flow had, minus the part that failed:
 *   • the raw token is returned ONCE and never stored — only SHA-256(token);
 *   • the link is bound to the email June was given for the spouse; only an
 *     account whose PROVIDER-VERIFIED email matches may accept;
 *   • single use: `used_at` is set in the same step that seats the party;
 *   • 14-day expiry; A (or the firm) can revoke and reissue.
 * The July failure was carrying the token through the OAuth round-trip in a
 * cookie. Here the token lives in the URL the spouse was sent: /join/<token>
 * works whether they sign in first or after, because the page simply asks
 * them to sign in and then accepts on the same URL.
 */
import { createHash, randomBytes } from "node:crypto";
import { getDb, newId, nowIso } from "./index";
import { getPartyById, seatParty } from "./parties";
import { getMatter } from "./matters";
import { createSession, listSessionsByMatter, recordAudit } from "./repo";
import type { UserRow } from "./users";

export const SPOUSE_INVITE_TTL_DAYS = 14;

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export interface SpouseInvitation {
  id: string;
  matterId: string;
  partyId: string | null;
  targetEmail: string;
  expiresAt: string;
  revokedAt: string | null;
  usedAt: string | null;
}

function rowToInvite(r: Record<string, unknown>): SpouseInvitation {
  return {
    id: r.id as string,
    matterId: r.matter_id as string,
    partyId: (r.party_id as string | null) ?? null,
    targetEmail: (r.target_email as string) ?? "",
    expiresAt: r.expires_at as string,
    revokedAt: (r.revoked_at as string | null) ?? null,
    usedAt: (r.used_at as string | null) ?? null,
  };
}

/** Issue a link for a party seat. Any earlier live link for the seat is revoked. */
export async function createSpouseInvitation(opts: {
  matterId: string;
  partyId: string;
  targetEmail: string;
  createdBy: string;
}): Promise<{ id: string; token: string; expiresAt: string }> {
  const db = getDb();
  const t = nowIso();
  await db.run(
    `UPDATE invitation SET revoked_at = ? WHERE party_id = ? AND used_at IS NULL AND revoked_at IS NULL`,
    t,
    opts.partyId
  );
  const token = randomBytes(32).toString("base64url");
  const id = newId();
  const expiresAt = new Date(Date.now() + SPOUSE_INVITE_TTL_DAYS * 86_400_000).toISOString();
  await db.run(
    `INSERT INTO invitation (id, matter_id, token_hash, target_email, party_id, expires_at, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    opts.matterId,
    hashToken(token),
    opts.targetEmail.trim().toLowerCase(),
    opts.partyId,
    expiresAt,
    opts.createdBy,
    t
  );
  return { id, token, expiresAt };
}

export async function findSpouseInvitation(token: string): Promise<SpouseInvitation | null> {
  if (!token || token.length > 200) return null;
  const r = await getDb().get(`SELECT * FROM invitation WHERE token_hash = ?`, hashToken(token));
  return r ? rowToInvite(r) : null;
}

export async function liveInvitationForParty(partyId: string): Promise<SpouseInvitation | null> {
  const r = await getDb().get(
    `SELECT * FROM invitation WHERE party_id = ? AND used_at IS NULL AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    partyId
  );
  return r ? rowToInvite(r) : null;
}

export type InviteState = "OPEN" | "EXPIRED" | "USED" | "REVOKED" | "UNKNOWN";

export function invitationState(inv: SpouseInvitation | null): InviteState {
  if (!inv) return "UNKNOWN";
  if (inv.usedAt) return "USED";
  if (inv.revokedAt) return "REVOKED";
  if (new Date(inv.expiresAt).getTime() < Date.now()) return "EXPIRED";
  return "OPEN";
}

/**
 * Seat the signed-in user as party B. Email-bound: the account's verified
 * email must equal the invited address (case-insensitive). The seat, the
 * interview session, the used_at stamp, and the audit all happen here.
 */
export async function acceptSpouseInvitation(
  token: string,
  user: UserRow,
  /** The SPOUSE_NOTICE_VERSION the spouse acknowledged — required (RPC 4.3 notice, 2026-10-30). */
  noticeVersion: string | null
): Promise<
  | { ok: true; matterId: string; sessionId: string }
  | { ok: false; reason: "UNKNOWN" | "EXPIRED" | "USED" | "REVOKED" | "WRONG_EMAIL" | "NOT_A_CLIENT" | "SEAT_TAKEN" | "NOTICE_NOT_ACKNOWLEDGED" }
> {
  if (!noticeVersion) return { ok: false, reason: "NOTICE_NOT_ACKNOWLEDGED" };
  const inv = await findSpouseInvitation(token);
  const state = invitationState(inv);
  if (state !== "OPEN" || !inv || !inv.partyId) return { ok: false, reason: state === "OPEN" ? "UNKNOWN" : state };
  if (user.role !== "CLIENT" || !user.subject) return { ok: false, reason: "NOT_A_CLIENT" };
  if (user.email.toLowerCase() !== inv.targetEmail) return { ok: false, reason: "WRONG_EMAIL" };
  const party = await getPartyById(inv.partyId);
  const matter = await getMatter(inv.matterId);
  if (!party || !matter) return { ok: false, reason: "UNKNOWN" };
  if (party.userId && party.userId !== user.id) return { ok: false, reason: "SEAT_TAKEN" };
  if (matter.clientUserId === user.id) return { ok: false, reason: "WRONG_EMAIL" }; // one person cannot be both spouses

  await seatParty(party.id, user.id, noticeVersion);
  const t = nowIso();
  await getDb().run(`UPDATE invitation SET used_at = ?, used_by_user_id = ? WHERE id = ?`, t, user.id, inv.id);
  await recordAudit(matter.id, "SPOUSE_NOTICE_ACKNOWLEDGED", `party=${party.role} version=${noticeVersion}`, user.id);

  const existing = (await listSessionsByMatter(matter.id)).find((s) => s.ownerSubject === user.subject);
  const sess =
    existing ??
    (await createSession({
      initiatedBy: "CLIENT",
      ownerSubject: user.subject,
      initialState: "GATE_RESIDENCY",
      matterId: matter.id,
      partyId: party.role,
      conflictClear: true,
    }));
  if (!existing) await recordAudit(sess.id, "SESSION_STARTED", `initiatedBy=CLIENT party=${party.role}`);
  await recordAudit(matter.id, "INVITE_ACCEPTED", `party=${party.role}`, user.id);
  return { ok: true, matterId: matter.id, sessionId: sess.id };
}
