/**
 * User repository — DB-stored roles for CLIENT | STAFF | ATTORNEY | ADMIN.
 *
 * Design rules (2.0 attorney workflow):
 *  - The database, not the session cookie, is the source of truth for roles.
 *    `requireUser` in src/lib/auth/authz.ts re-reads this table for every
 *    protected action.
 *  - `ADMIN_EMAILS` is bootstrap/recovery ONLY: it lets a listed account
 *    self-provision the ADMIN role at first login so the firm can stand the
 *    system up. Ordinary role management happens through the admin API and
 *    lands in this table.
 *  - STAFF and ADMIN roles are never self-provisioned from a session token;
 *    they exist only when created here (by an admin, or ADMIN bootstrap).
 */
import { getDb, newId, nowIso } from "./index";

export type UserRole = "CLIENT" | "STAFF" | "ATTORNEY" | "ADMIN";

export const USER_ROLES: UserRole[] = ["CLIENT", "STAFF", "ATTORNEY", "ADMIN"];

export interface UserRow {
  id: string;
  subject: string | null;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

function rowToUser(r: Record<string, unknown>): UserRow {
  return {
    id: r.id as string,
    subject: (r.subject as string | null) ?? null,
    email: r.email as string,
    name: (r.name as string) ?? "",
    role: r.role as UserRole,
    active: r.active === 1,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export async function getUserBySubject(subject: string): Promise<UserRow | null> {
  const r = await getDb().get(`SELECT * FROM app_user WHERE subject = ?`, subject);
  return r ? rowToUser(r) : null;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const r = await getDb().get(
    `SELECT * FROM app_user WHERE email = ?`,
    email.trim().toLowerCase()
  );
  return r ? rowToUser(r) : null;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const r = await getDb().get(`SELECT * FROM app_user WHERE id = ?`, id);
  return r ? rowToUser(r) : null;
}

export async function listUsers(): Promise<UserRow[]> {
  const rows = await getDb().all(`SELECT * FROM app_user ORDER BY created_at ASC`);
  return rows.map(rowToUser);
}

/** Admin action: pre-create a user by email so a role exists before first login. */
export async function createUser(opts: {
  email: string;
  role: UserRole;
  name?: string;
}): Promise<UserRow> {
  const db = getDb();
  const id = newId();
  const t = nowIso();
  await db.run(
    `INSERT INTO app_user (id, subject, email, name, role, active, created_at, updated_at)
     VALUES (?, NULL, ?, ?, ?, 1, ?, ?)`,
    id,
    opts.email.trim().toLowerCase(),
    opts.name ?? "",
    opts.role,
    t,
    t
  );
  return (await getUserById(id))!;
}

/**
 * Find the account row for an authenticated session — PROVIDERS
 * AUTHENTICATE, THE DATABASE AUTHORIZES (pilot hardening).
 *
 * Resolution order:
 *  1. subject match (normal path after first login);
 *  2. email match against a pre-created row whose subject is not yet bound
 *     (admin created the user; first login binds the stable subject). A row
 *     already bound to a DIFFERENT subject is returned as-is — the caller's
 *     subject check refuses it; nothing silently relinks on email alone;
 *  3. ADMIN_EMAILS bootstrap/recovery ONLY: a listed email may provision the
 *     ADMIN role at first login;
 *  4. otherwise NULL here. Firm accounts must be admin-created; CLIENT
 *     accounts are created at login by the OAuth callback via
 *     `provisionClientAccount`, called only from invitation acceptance
 *     (invite-only, 2026-07-21 directive).
 */
/**
 * OPEN CLIENT SIGNUP (2026-07-21 directive): a brand-new Google/MSA identity
 * becomes a CLIENT account at LOGIN TIME — the firm directs clients to the
 * site and runs conflicts in its own system. Only the absolute minimum is
 * stored: provider subject, email, display name. Called ONLY from the OAuth
 * callback for the client providers; per-request authorization never creates
 * accounts, and Microsoft Entra remains firm-only.
 */
export async function provisionClientAccount(opts: {
  subject: string;
  email: string;
  name?: string;
}): Promise<UserRow> {
  const db = getDb();
  const email = opts.email.trim().toLowerCase();
  const existing = await getUserBySubject(opts.subject);
  if (existing) return existing;
  const byEmail = email ? await getUserByEmail(email) : null;
  if (byEmail) {
    if (byEmail.subject && byEmail.subject !== opts.subject) {
      // Same email, different identity subject — never silently rebind.
      throw new Error("ACCOUNT_CONFLICT: this email is linked to a different sign-in identity");
    }
    await db.run(
      `UPDATE app_user SET subject = ?, name = ?, updated_at = ? WHERE id = ?`,
      opts.subject,
      opts.name || byEmail.name,
      nowIso(),
      byEmail.id
    );
    return (await getUserById(byEmail.id))!;
  }
  const id = newId();
  const t = nowIso();
  await db.run(
    `INSERT INTO app_user (id, subject, email, name, role, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'CLIENT', 1, ?, ?)`,
    id,
    opts.subject,
    email,
    opts.name ?? "",
    t,
    t
  );
  return (await getUserById(id))!;
}

export async function findAccountForSession(opts: {
  subject: string;
  email: string;
  name?: string;
  adminBootstrapEmails: string[];
}): Promise<UserRow | null> {
  const db = getDb();
  const email = opts.email.trim().toLowerCase();
  const existing = await getUserBySubject(opts.subject);
  if (existing) return existing;

  const byEmail = email ? await getUserByEmail(email) : null;
  if (byEmail) {
    if (byEmail.subject && byEmail.subject !== opts.subject) {
      // Same email, different identity subject — do not silently rebind.
      return byEmail; // caller's subject check refuses it
    }
    await db.run(
      `UPDATE app_user SET subject = ?, name = ?, updated_at = ? WHERE id = ?`,
      opts.subject,
      opts.name || byEmail.name,
      nowIso(),
      byEmail.id
    );
    return (await getUserById(byEmail.id))!;
  }

  if (email && opts.adminBootstrapEmails.includes(email)) {
    const id = newId();
    const t = nowIso();
    await db.run(
      `INSERT INTO app_user (id, subject, email, name, role, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'ADMIN', 1, ?, ?)`,
      id,
      opts.subject,
      email,
      opts.name ?? "",
      t,
      t
    );
    return (await getUserById(id))!;
  }

  return null;
}

/**
 * Manual account-recovery/relink (docs/ACCOUNT-RECOVERY.md): an ADMIN, after
 * firm-side identity verification, clears the stored subject so the user's
 * NEXT provider sign-in re-binds by email. Audited by the caller.
 */
export async function clearUserSubject(userId: string): Promise<UserRow> {
  await getDb().run(`UPDATE app_user SET subject = NULL, updated_at = ? WHERE id = ?`, nowIso(), userId);
  const u = await getUserById(userId);
  if (!u) throw new Error("VALIDATION: user not found");
  return u;
}

/** Admin action: change a user's role (audited by the caller). */
export async function setUserRole(userId: string, role: UserRole): Promise<UserRow> {
  if (!USER_ROLES.includes(role)) throw new Error(`VALIDATION: unknown role ${role}`);
  await getDb().run(`UPDATE app_user SET role = ?, updated_at = ? WHERE id = ?`, role, nowIso(), userId);
  const u = await getUserById(userId);
  if (!u) throw new Error("VALIDATION: user not found");
  return u;
}

/** Admin action: activate / deactivate an account (deactivation, not deletion). */
export async function setUserActive(userId: string, active: boolean): Promise<UserRow> {
  await getDb().run(
    `UPDATE app_user SET active = ?, updated_at = ? WHERE id = ?`,
    active ? 1 : 0,
    nowIso(),
    userId
  );
  const u = await getUserById(userId);
  if (!u) throw new Error("VALIDATION: user not found");
  return u;
}

/**
 * Count everything that would be orphaned if this user row were deleted.
 * Hard deletion is allowed ONLY when this is zero: a user tied to any case
 * history is deactivated, never removed, so the audit chain and every
 * matter/document/session keeps a valid actor reference.
 *
 * The reference set is deliberately broad: matters (as the client OR the
 * creator), document versions authored, intake sessions owned (keyed by the
 * auth subject, not the user id), and conflict submissions made.
 */
export async function countUserReferences(user: UserRow): Promise<number> {
  const db = getDb();
  const one = async (sql: string, arg: string) =>
    (await db.get<{ c: number }>(sql, arg))?.c ?? 0;

  let refs = 0;
  refs += await one(`SELECT COUNT(*) AS c FROM matter WHERE client_user_id = ?`, user.id);
  refs += await one(`SELECT COUNT(*) AS c FROM matter WHERE created_by = ?`, user.id);
  refs += await one(`SELECT COUNT(*) AS c FROM document_version WHERE created_by = ?`, user.id);
  refs += await one(`SELECT COUNT(*) AS c FROM conflict_submission WHERE submitted_by = ?`, user.id);
  // Intake sessions are keyed by the opaque auth subject, not the user id.
  // A never-signed-in row (subject NULL) can own no sessions.
  if (user.subject) {
    refs += await one(`SELECT COUNT(*) AS c FROM intake_session WHERE owner_subject = ?`, user.subject);
  }
  return refs;
}

/**
 * Hard-delete a reference-free user row. Returns false and deletes nothing
 * if any case history references it — the caller responds 409 and offers
 * deactivation instead. The reference re-check happens inside the same call
 * so a row cannot pick up a reference between the check and the delete.
 */
export async function deleteUserIfUnreferenced(
  userId: string
): Promise<{ deleted: boolean; user: UserRow | null }> {
  const user = await getUserById(userId);
  if (!user) return { deleted: false, user: null };
  if ((await countUserReferences(user)) > 0) return { deleted: false, user };
  await getDb().run(`DELETE FROM app_user WHERE id = ?`, userId);
  return { deleted: true, user };
}
