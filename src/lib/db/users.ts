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

export function getUserBySubject(subject: string): UserRow | null {
  const r = getDb()
    .prepare(`SELECT * FROM app_user WHERE subject = ?`)
    .get(subject) as Record<string, unknown> | undefined;
  return r ? rowToUser(r) : null;
}

export function getUserByEmail(email: string): UserRow | null {
  const r = getDb()
    .prepare(`SELECT * FROM app_user WHERE email = ?`)
    .get(email.trim().toLowerCase()) as Record<string, unknown> | undefined;
  return r ? rowToUser(r) : null;
}

export function getUserById(id: string): UserRow | null {
  const r = getDb()
    .prepare(`SELECT * FROM app_user WHERE id = ?`)
    .get(id) as Record<string, unknown> | undefined;
  return r ? rowToUser(r) : null;
}

export function listUsers(): UserRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM app_user ORDER BY created_at ASC`)
    .all() as Record<string, unknown>[];
  return rows.map(rowToUser);
}

/** Admin action: pre-create a user by email so a role exists before first login. */
export function createUser(opts: {
  email: string;
  role: UserRole;
  name?: string;
}): UserRow {
  const db = getDb();
  const id = newId();
  const t = nowIso();
  db.prepare(
    `INSERT INTO app_user (id, subject, email, name, role, active, created_at, updated_at)
     VALUES (?, NULL, ?, ?, ?, 1, ?, ?)`
  ).run(id, opts.email.trim().toLowerCase(), opts.name ?? "", opts.role, t, t);
  return getUserById(id)!;
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
 *  4. otherwise NULL. Successful Microsoft or Google authentication creates
 *     NOTHING: firm accounts must be admin-created, and client accounts are
 *     created exclusively by invitation acceptance
 *     (`provisionClientAccount`).
 */
export function findAccountForSession(opts: {
  subject: string;
  email: string;
  name?: string;
  adminBootstrapEmails: string[];
}): UserRow | null {
  const db = getDb();
  const email = opts.email.trim().toLowerCase();
  const existing = getUserBySubject(opts.subject);
  if (existing) return existing;

  const byEmail = email ? getUserByEmail(email) : null;
  if (byEmail) {
    if (byEmail.subject && byEmail.subject !== opts.subject) {
      // Same email, different identity subject — do not silently rebind.
      return byEmail; // caller's subject check refuses it
    }
    db.prepare(`UPDATE app_user SET subject = ?, name = ?, updated_at = ? WHERE id = ?`).run(
      opts.subject,
      opts.name || byEmail.name,
      nowIso(),
      byEmail.id
    );
    return getUserById(byEmail.id)!;
  }

  if (email && opts.adminBootstrapEmails.includes(email)) {
    const id = newId();
    const t = nowIso();
    db.prepare(
      `INSERT INTO app_user (id, subject, email, name, role, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'ADMIN', 1, ?, ?)`
    ).run(id, opts.subject, email, opts.name ?? "", t, t);
    return getUserById(id)!;
  }

  return null;
}

/**
 * THE ONLY code path that creates a CLIENT account from a session identity —
 * called exclusively by invitation acceptance after the token validates.
 * A generic Google sign-in never reaches this.
 */
export function provisionClientAccount(opts: {
  subject: string;
  email: string;
  name?: string;
}): UserRow {
  const existing = getUserBySubject(opts.subject);
  if (existing) return existing;
  const id = newId();
  const t = nowIso();
  getDb()
    .prepare(
      `INSERT INTO app_user (id, subject, email, name, role, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'CLIENT', 1, ?, ?)`
    )
    .run(id, opts.subject, opts.email.trim().toLowerCase(), opts.name ?? "", t, t);
  return getUserById(id)!;
}

/**
 * Manual account-recovery/relink (docs/ACCOUNT-RECOVERY.md): an ADMIN, after
 * firm-side identity verification, clears the stored subject so the user's
 * NEXT provider sign-in re-binds by email. Audited by the caller.
 */
export function clearUserSubject(userId: string): UserRow {
  getDb()
    .prepare(`UPDATE app_user SET subject = NULL, updated_at = ? WHERE id = ?`)
    .run(nowIso(), userId);
  const u = getUserById(userId);
  if (!u) throw new Error("VALIDATION: user not found");
  return u;
}

/** Admin action: change a user's role (audited by the caller). */
export function setUserRole(userId: string, role: UserRole): UserRow {
  if (!USER_ROLES.includes(role)) throw new Error(`VALIDATION: unknown role ${role}`);
  getDb()
    .prepare(`UPDATE app_user SET role = ?, updated_at = ? WHERE id = ?`)
    .run(role, nowIso(), userId);
  const u = getUserById(userId);
  if (!u) throw new Error("VALIDATION: user not found");
  return u;
}

/** Admin action: activate / deactivate an account (deactivation, not deletion). */
export function setUserActive(userId: string, active: boolean): UserRow {
  getDb()
    .prepare(`UPDATE app_user SET active = ?, updated_at = ? WHERE id = ?`)
    .run(active ? 1 : 0, nowIso(), userId);
  const u = getUserById(userId);
  if (!u) throw new Error("VALIDATION: user not found");
  return u;
}
