/**
 * Matter-linked invitations — the ONLY way a client enters the portal.
 * Public self-registration does not exist.
 *
 * Token properties (all enforced here):
 *  - opaque: 256-bit random, base64url; carries no matter or identity data;
 *  - hashed at rest: only SHA-256(token) is stored — a DB leak does not
 *    yield usable invitations;
 *  - expiring (INVITE_TTL_HOURS, default 14 days), revocable, single-use;
 *  - **bound to ONE email**: the attorney sets the client's email when
 *    creating the invitation, and acceptance is refused unless the
 *    authenticated Google/Outlook identity's verified email matches it.
 *    A leaked or forwarded link is therefore useless to anyone else — only
 *    the one intended account can ever consume it, and only once.
 *
 * Failure behavior: invalid, expired, revoked, and previously-used tokens
 * are indistinguishable to the caller (`acceptInvitation` returns null for
 * all of them; routes answer with one neutral message). An email mismatch is
 * surfaced distinctly so the client can be told to use the right account.
 */
import { createHash, randomBytes } from "node:crypto";
import { getDb, newId, nowIso } from "./index";
import { bindClientToMatter, getMatter, markConflictsExternal } from "./matters";
import { provisionClientAccount } from "./users";
import { createSession, listSessionsByMatter, recordAudit } from "./repo";

export interface InvitationRow {
  id: string;
  matterId: string;
  tokenHash: string;
  /** Lowercased email the invitation is bound to — only this account may accept. */
  targetEmail: string;
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
    targetEmail: ((r.target_email as string | null) ?? "").toLowerCase(),
    expiresAt: r.expires_at as string,
    revokedAt: (r.revoked_at as string | null) ?? null,
    usedAt: (r.used_at as string | null) ?? null,
    usedByUserId: (r.used_by_user_id as string | null) ?? null,
    createdBy: r.created_by as string,
    createdAt: r.created_at as string,
  };
}

/**
 * "jane.doe@gmail.com" → "ja***@gmail.com". A FIXED three stars, so the mask
 * doesn't even leak the local-part length — just enough for the invited
 * client to recognize their own address.
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}***@${domain}`;
}

export function hashInviteToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function inviteTtlHours(): number {
  const n = Number(process.env.INVITE_TTL_HOURS ?? "336"); // 14 days
  return Number.isFinite(n) && n > 0 ? n : 336;
}

/**
 * Create an email-bound invitation. `targetEmail` is required — the link
 * will only accept for that address. Returns the raw token EXACTLY ONCE; it
 * is never stored or logged.
 */
export async function createInvitation(opts: {
  matterId: string;
  createdBy: string;
  targetEmail: string;
  ttlHours?: number;
}): Promise<{ invitation: InvitationRow; rawToken: string }> {
  const targetEmail = opts.targetEmail.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(targetEmail)) {
    throw new Error("VALIDATION: a valid client email is required to create an invitation");
  }
  const raw = randomBytes(32).toString("base64url");
  const id = newId();
  const t = nowIso();
  const ttl = opts.ttlHours ?? inviteTtlHours();
  const expires = new Date(Date.now() + ttl * 60 * 60 * 1000).toISOString();
  await getDb().run(
    `INSERT INTO invitation (id, matter_id, token_hash, target_email, expires_at, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    opts.matterId,
    hashInviteToken(raw),
    targetEmail,
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
 * Accept an invitation for the authenticated client. `email` is the verified
 * email of the signing-in identity and MUST match the invitation's bound
 * target email — the single-account guarantee. Returns the accepted
 * invitation, or null for EVERY failure mode (unknown, expired, revoked,
 * already used, matter unavailable, email mismatch) — callers must not
 * distinguish beyond what the onboarding helper surfaces.
 */
export async function acceptInvitation(opts: {
  rawToken: string;
  clientUserId: string;
  email: string;
}): Promise<InvitationRow | null> {
  const db = getDb();
  const inv = await previewInvitation(opts.rawToken);
  if (!inv) return null;

  // THE single-account gate: only the invited email may accept.
  if (opts.email.trim().toLowerCase() !== inv.targetEmail) return null;

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

export type InviteOnboardError =
  | "invalid" // unknown / expired / revoked / used
  | "wrong_email" // signed in with an account other than the invited one
  | "account_conflict" // that email is already bound to a different sign-in
  | "firm_account"; // a firm-role account cannot accept a client invitation

/**
 * The whole invited-client onboarding, from a validated OAuth identity to a
 * ready intake session — used by BOTH the frictionless OAuth callback and
 * the signed-in accept route so the rules live in one place:
 *
 *  1. token must be live (else "invalid");
 *  2. identity email must equal the invitation's bound email (else
 *     "wrong_email") — nothing is created or consumed on a mismatch, so the
 *     real client can still use the link;
 *  3. provision/bind the CLIENT account for this identity (email-bound; a
 *     different subject on the same email is refused as "account_conflict");
 *  4. a firm-role account may not accept ("firm_account");
 *  5. consume the invitation, bind the client to the matter, record the
 *     firm's EXTERNAL conflict posture, and open the intake session.
 */
export async function onboardInvitedClient(opts: {
  rawToken: string;
  subject: string;
  email: string;
  name?: string;
}): Promise<{ matterId: string; sessionId: string } | { error: InviteOnboardError }> {
  const inv = await previewInvitation(opts.rawToken);
  if (!inv) return { error: "invalid" };
  if (opts.email.trim().toLowerCase() !== inv.targetEmail) return { error: "wrong_email" };

  let account;
  try {
    account = await provisionClientAccount({
      subject: opts.subject,
      email: opts.email,
      name: opts.name,
    });
  } catch {
    return { error: "account_conflict" };
  }
  if (account.role !== "CLIENT") return { error: "firm_account" };

  const accepted = await acceptInvitation({
    rawToken: opts.rawToken,
    clientUserId: account.id,
    email: opts.email,
  });
  if (!accepted) return { error: "invalid" };

  await markConflictsExternal(inv.matterId);
  await recordAudit(inv.matterId, "INVITATION_ACCEPTED", `invitation=${inv.id}`, account.id);

  const existing = (await listSessionsByMatter(inv.matterId)).find(
    (s) => s.ownerSubject === opts.subject
  );
  const sess =
    existing ??
    (await createSession({
      initiatedBy: "CLIENT",
      ownerSubject: opts.subject,
      initialState: "GATE_RESIDENCY",
      matterId: inv.matterId,
      conflictClear: true,
    }));
  if (!existing) await recordAudit(sess.id, "SESSION_STARTED", "initiatedBy=CLIENT");

  return { matterId: inv.matterId, sessionId: sess.id };
}
