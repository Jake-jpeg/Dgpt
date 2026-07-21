/**
 * Matter-linked invitations — the ONLY way a client enters the portal.
 * Public self-registration does not exist in the 2.0 workflow.
 *
 * Token properties (all enforced here):
 *  - opaque: 256-bit random, base64url; carries no matter or identity data;
 *  - hashed at rest: only SHA-256(token) is stored — a DB leak does not
 *    yield usable invitations;
 *  - expiring (INVITE_TTL_HOURS, default 14 days), revocable, single-use;
 *  - bound to the authenticated client account that accepts it.
 *
 * Failure behavior: invalid, expired, revoked, and previously-used tokens
 * are indistinguishable to the caller (`acceptInvitation` returns null for
 * all of them; routes answer with one neutral message).
 */
import { createHash, randomBytes } from "node:crypto";
import { getDb, newId, nowIso } from "./index";
import { bindClientToMatter, getMatter } from "./matters";

export interface InvitationRow {
  id: string;
  matterId: string;
  tokenHash: string;
  expiresAt: string;
  revokedAt: string | null;
  usedAt: string | null;
  usedByUserId: string | null;
  createdBy: string;
  createdAt: string;
}

function rowToInvitation(r: Record<string, unknown>): InvitationRow {
  return {
    id: r.id as string,
    matterId: r.matter_id as string,
    tokenHash: r.token_hash as string,
    expiresAt: r.expires_at as string,
    revokedAt: (r.revoked_at as string | null) ?? null,
    usedAt: (r.used_at as string | null) ?? null,
    usedByUserId: (r.used_by_user_id as string | null) ?? null,
    createdBy: r.created_by as string,
    createdAt: r.created_at as string,
  };
}

export function hashInviteToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function inviteTtlHours(): number {
  const n = Number(process.env.INVITE_TTL_HOURS ?? "336"); // 14 days
  return Number.isFinite(n) && n > 0 ? n : 336;
}

/** Returns the raw token EXACTLY ONCE — it is never stored or logged. */
export async function createInvitation(opts: {
  matterId: string;
  createdBy: string;
  ttlHours?: number;
}): Promise<{ invitation: InvitationRow; rawToken: string }> {
  const raw = randomBytes(32).toString("base64url");
  const id = newId();
  const t = nowIso();
  const ttl = opts.ttlHours ?? inviteTtlHours();
  const expires = new Date(Date.now() + ttl * 60 * 60 * 1000).toISOString();
  await getDb().run(
    `INSERT INTO invitation (id, matter_id, token_hash, expires_at, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    opts.matterId,
    hashInviteToken(raw),
    expires,
    opts.createdBy,
    t
  );
  return { invitation: (await getInvitation(id))!, rawToken: raw };
}

export async function getInvitation(id: string): Promise<InvitationRow | null> {
  const r = await getDb().get(`SELECT * FROM invitation WHERE id = ?`, id);
  return r ? rowToInvitation(r) : null;
}

export async function listInvitationsForMatter(matterId: string): Promise<InvitationRow[]> {
  const rows = await getDb().all(
    `SELECT * FROM invitation WHERE matter_id = ? ORDER BY created_at DESC`,
    matterId
  );
  return rows.map(rowToInvitation);
}

export async function revokeInvitation(id: string): Promise<void> {
  await getDb().run(
    `UPDATE invitation SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL`,
    nowIso(),
    id
  );
}

/**
 * Validate a raw token WITHOUT consuming it. Returns the invitation when it
 * is live (exists, unrevoked, unused, unexpired, matter present), else null
 * for EVERY failure mode — callers must not distinguish. Used by the accept
 * flow so that no account is ever created for an invalid token.
 */
export async function previewInvitation(rawToken: string): Promise<InvitationRow | null> {
  const r = await getDb().get(
    `SELECT * FROM invitation WHERE token_hash = ?`,
    hashInviteToken(rawToken)
  );
  if (!r) return null;
  const inv = rowToInvitation(r);
  if (inv.revokedAt || inv.usedAt) return null;
  if (new Date(inv.expiresAt).getTime() <= Date.now()) return null;
  if (!(await getMatter(inv.matterId))) return null;
  return inv;
}

/**
 * Accept an invitation for the authenticated client. Returns the accepted
 * invitation, or null for EVERY failure mode (unknown, expired, revoked,
 * already used, matter unavailable) — callers must not distinguish.
 */
export async function acceptInvitation(opts: {
  rawToken: string;
  clientUserId: string;
}): Promise<InvitationRow | null> {
  const db = getDb();
  const inv = await previewInvitation(opts.rawToken);
  if (!inv) return null;

  const matter = (await getMatter(inv.matterId))!;
  // A matter is one client's engagement: an invitation cannot rebind a
  // matter that already belongs to a different client account.
  if (matter.clientUserId && matter.clientUserId !== opts.clientUserId) return null;

  await db.run(
    `UPDATE invitation SET used_at = ?, used_by_user_id = ? WHERE id = ?`,
    nowIso(),
    opts.clientUserId,
    inv.id
  );
  await bindClientToMatter(inv.matterId, opts.clientUserId);
  return getInvitation(inv.id);
}
