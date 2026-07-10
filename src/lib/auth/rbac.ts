/**
 * Server-side RBAC. Two hard-separated roles; a client session must never
 * reach attorney views or data by URL, API call, or otherwise.
 *
 * - Every protected handler calls requireRole() FIRST.
 * - Attorney requests are re-checked against the email allowlist on EVERY
 *   request, not just at login — removing an email from ATTORNEY_EMAILS
 *   revokes access immediately.
 * - Failures return errors, never data.
 */
import { attorneyEmailAllowlist } from "@/lib/env";
import { getSessionUser, type Role, type SessionUser } from "./session";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireRole(req: Request, role: Role): Promise<SessionUser> {
  const user = await getSessionUser(req);
  if (!user) throw new HttpError(401, "Not signed in");
  if (user.role !== role) throw new HttpError(403, "Forbidden for this role");
  if (role === "ATTORNEY") {
    const allow = attorneyEmailAllowlist();
    if (!allow.includes(user.email.toLowerCase())) {
      throw new HttpError(403, "Attorney access not authorized for this account");
    }
  }
  return user;
}

export async function requireAnyRole(req: Request): Promise<SessionUser> {
  const user = await getSessionUser(req);
  if (!user) throw new HttpError(401, "Not signed in");
  if (user.role === "ATTORNEY") {
    const allow = attorneyEmailAllowlist();
    if (!allow.includes(user.email.toLowerCase())) {
      throw new HttpError(403, "Attorney access not authorized for this account");
    }
  }
  return user;
}

export function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) {
    return Response.json({ error: e.message }, { status: e.status });
  }
  const msg = e instanceof Error ? e.message : "Internal error";
  if (msg.startsWith("VALIDATION:")) {
    return Response.json({ error: msg }, { status: 400 });
  }
  if (msg.startsWith("PERSISTENCE_GUARD:") || msg.startsWith("STATE_MACHINE:")) {
    // Guard trips are conflicts with server-held state, not server faults.
    return Response.json({ error: msg }, { status: 409 });
  }
  console.error("Unhandled API error:", e);
  return Response.json({ error: "Internal error" }, { status: 500 });
}
