/**
 * 2.0 authorization layer — DB-backed roles + matter-level access.
 *
 * Rules:
 *  - The session cookie proves IDENTITY. The `app_user` table is the source
 *    of truth for the CURRENT role: every protected action calls
 *    `requireUser`, which re-reads the row. Role values arriving from the
 *    browser (or even from the signed cookie) are never sufficient.
 *  - ATTORNEY additionally re-checks the ATTORNEY_EMAILS allowlist on every
 *    request (carried over from Stage 1 — removing an email revokes
 *    attorney power immediately, even mid-session).
 *  - ADMIN manages users/config but holds NO attorney powers: conflict
 *    dispositions and document approval/release call the structural guards
 *    in the persistence layer, which re-read the role again at write time.
 *  - Matter access: a CLIENT only reaches a matter they are bound to;
 *    STAFF/ATTORNEY (and any admin doing matter work) need explicit grants.
 *    Failures are 404 — never confirm another matter's existence.
 */
import { attorneyEmailAllowlist, adminBootstrapEmails } from "@/lib/env";
import { getSessionUser, type Role, type SessionUser } from "./session";
import { HttpError } from "./rbac";
import { findAccountForSession, type UserRow } from "@/lib/db/users";
import { canAccessMatter, getMatter, type MatterRow } from "@/lib/db/matters";

export interface AuthedUser {
  /** The verified session (identity claims). */
  session: SessionUser;
  /** The authoritative account row — role read from the DB just now. */
  account: UserRow;
}

/**
 * Authenticate the request and re-check the CURRENT role in the database.
 * `roles` is the allowlist of DB roles permitted to proceed.
 */
export async function requireUser(req: Request, roles: Role[]): Promise<AuthedUser> {
  const session = await getSessionUser(req);
  if (!session) throw new HttpError(401, "Not signed in");

  // Providers authenticate; the DATABASE authorizes. A successful Microsoft
  // or Google sign-in with no corresponding app account gets nothing.
  const account = await findAccountForSession({
    subject: session.subject,
    email: session.email,
    name: session.name,
    adminBootstrapEmails: adminBootstrapEmails(),
  });
  if (!account) {
    throw new HttpError(403, "This sign-in is not linked to an authorized account");
  }

  if (!account.active) throw new HttpError(403, "Account is deactivated");
  if (account.subject !== session.subject) {
    // Email collision with a different identity — refuse rather than merge.
    throw new HttpError(403, "Account identity mismatch");
  }
  if (!roles.includes(account.role)) {
    throw new HttpError(403, "Forbidden for this role");
  }
  if (account.role === "ATTORNEY") {
    const allow = attorneyEmailAllowlist();
    if (!allow.includes(account.email.toLowerCase())) {
      throw new HttpError(403, "Attorney access not authorized for this account");
    }
  }
  return { session, account };
}

/** Convenience wrappers that read as policy. */
export const requireClient = (req: Request) => requireUser(req, ["CLIENT"]);
export const requireStaffOrAttorney = (req: Request) => requireUser(req, ["STAFF", "ATTORNEY"]);
export const requireAttorney = (req: Request) => requireUser(req, ["ATTORNEY"]);
export const requireAdmin = (req: Request) => requireUser(req, ["ADMIN"]);

/**
 * Load a matter and verify the caller may access it. 404 on both "does not
 * exist" and "not yours" — existence is never leaked.
 */
export async function requireMatterAccess(
  authed: AuthedUser,
  matterId: string
): Promise<MatterRow> {
  const matter = await getMatter(matterId);
  if (!matter || !(await canAccessMatter(authed.account, matter))) {
    throw new HttpError(404, "Matter not found");
  }
  return matter;
}
