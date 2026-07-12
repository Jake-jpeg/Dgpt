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
export function createInvitation(opts: {
  matterId: string;
  createdBy: string;
  ttlHours?: number;
}): { invitation: InvitationRow; rawToken: string } {
  const raw = randomBytes(32).toString("base64url");
  const id = newId();
  const t = nowIso();
  const ttl = opts.ttlHours ?? inviteTtlHours();
  const expires = new Date(Date.now() + ttl * 60 * 60 * 1000).toISOString();
  getDb()
    .prepare(
      `INSERT INTO invitation (id, matter_id, token_hash, expires_at, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, opts.matterId, hashInviteToken(raw), expires, opts.createdBy, t);
  return { invitation: getInvitation(id)!, rawToken: raw };
}

export function getInvitation(id: string): InvitationRow | null {
  const r = getDb()
    .prepare(`SELECT * FROM invitation WHERE id = ?`)
    .get(id) as Record<string, unknown> | undefined;
  return r ? rowToInvitation(r) : null;
}

export function listInvitationsForMatter(matterId: string): InvitationRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM invitation WHERE matter_id = ? ORDER BY created_at DESC`)
    .all(matterId) as Record<string, unknown>[];
  return rows.map(rowToInvitation);
}

export function revokeInvitation(id: string): void {
  getDb()
    .prepare(`UPDATE invitation SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL`)
    .run(nowIso(), id);
}

/**
 * Validate a raw token WITHOUT consuming it. Returns the invitation when it
 * is live (exists, unrevoked, unused, unexpired, matter present), else null
 * for EVERY failure mode — callers must not distinguish. Used by the accept
 * flow so that no account is ever created for an invalid token.
 */
export function previewInvitation(rawToken: string): InvitationRow | null {
  const r = getDb()
    .prepare(`SELECT * FROM invitation WHERE token_hash = ?`)
    .get(hashInviteToken(rawToken)) as Record<string, unknown> | undefined;
  if (!r) return null;
  const inv = rowToInvitation(r);
  if (inv.revokedAt || inv.usedAt) return null;
  if (new Date(inv.expiresAt).getTime() <= Date.now()) return null;
  if (!getMatter(inv.matterId)) return null;
  return inv;
}

/**
 * Accept an invitation for the authenticated client. Returns the accepted
 * invitation, or null for EVERY failure mode (unknown, expired, revoked,
 * already used, matter unavailable) — callers must not distinguish.
 */
export function acceptInvitation(opts: {
  rawToken: string;
  clientUserId: string;
}): InvitationRow | null {
  const db = getDb();
  const inv = previewInvitation(opts.rawToken);
  if (!inv) return null;

  const matter = getMatter(inv.matterId)!;
  // A matter is one client's engagement: an invitation cannot rebind a
  // matter that already belongs to a different client account.
  if (matter.clientUserId && matter.clientUserId !== opts.clientUserId) return null;

  db.prepare(`UPDATE invitation SET used_at = ?, used_by_user_id = ? WHERE id = ?`).run(
    nowIso(),
    opts.clientUserId,
    inv.id
  );
  bindClientToMatter(inv.matterId, opts.clientUserId);
  return getInvitation(inv.id);
}
