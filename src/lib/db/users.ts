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
 * Resolve (or provision) the account row for an authenticated session.
 *
 * Resolution order:
 *  1. subject match (normal path after first login);
 *  2. email match (admin pre-created the user) → bind the subject;
 *  3. no row → provision. Provisioned role is CLIENT unless:
 *     - the email is on ADMIN_EMAILS (bootstrap/recovery) → ADMIN;
 *     - `sessionRole` is ATTORNEY (the login flow already enforced the
 *       ATTORNEY_EMAILS allowlist; authz re-checks it every request) → ATTORNEY.
 *     STAFF/ADMIN are never provisioned from a session token alone.
 */
export function resolveAccount(opts: {
  subject: string;
  email: string;
  name: string;
  sessionRole: UserRole;
  adminBootstrapEmails: string[];
}): UserRow {
  const db = getDb();
  const email = opts.email.trim().toLowerCase();
  const existing = getUserBySubject(opts.subject);
  if (existing) return existing;

  const byEmail = email ? getUserByEmail(email) : null;
  if (byEmail) {
    if (byEmail.subject && byEmail.subject !== opts.subject) {
      // Same email, different identity subject — do not silently rebind.
      return byEmail; // caller will fail authz because subject won't match
    }
    db.prepare(`UPDATE app_user SET subject = ?, name = ?, updated_at = ? WHERE id = ?`).run(
      opts.subject,
      opts.name || byEmail.name,
      nowIso(),
      byEmail.id
    );
    return getUserById(byEmail.id)!;
  }

  let role: UserRole = "CLIENT";
  if (email && opts.adminBootstrapEmails.includes(email)) role = "ADMIN";
  else if (opts.sessionRole === "ATTORNEY") role = "ATTORNEY";

  const id = newId();
  const t = nowIso();
  db.prepare(
    `INSERT INTO app_user (id, subject, email, name, role, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(id, opts.subject, email, opts.name ?? "", role, t, t);
  return getUserById(id)!;
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
