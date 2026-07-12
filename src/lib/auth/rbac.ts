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
import type { Role, SessionUser } from "./session";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Stage-1 compatibility wrappers, now DB-backed: the CURRENT role is
 * re-read from app_user on every call (see src/lib/auth/authz.ts). The
 * session cookie alone never authorizes anything.
 */
export async function requireRole(req: Request, role: Role): Promise<SessionUser> {
  const { requireUser } = await import("./authz");
  const { session, account } = await requireUser(req, [role]);
  return { ...session, role: account.role };
}

export async function requireAnyRole(req: Request): Promise<SessionUser> {
  const { requireUser } = await import("./authz");
  const { session, account } = await requireUser(req, [
    "CLIENT",
    "STAFF",
    "ATTORNEY",
    "ADMIN",
  ]);
  return { ...session, role: account.role };
}

/** Best-effort access-denial audit (never blocks the response). */
function auditDenial(status: number, message: string): void {
  import("@/lib/db/repo")
    .then(({ recordAudit }) => {
      recordAudit("access", "ACCESS_DENIED", `status=${status} reason=${message.slice(0, 120)}`);
    })
    .catch(() => {
      /* auditing must never turn a denial into a 500 */
    });
}

export function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) {
    if (e.status === 401 || e.status === 403) auditDenial(e.status, e.message);
    return Response.json({ error: e.message }, { status: e.status });
  }
  const msg = e instanceof Error ? e.message : "Internal error";
  if (msg.startsWith("VALIDATION:")) {
    return Response.json({ error: msg }, { status: 400 });
  }
  if (
    msg.startsWith("PERSISTENCE_GUARD:") ||
    msg.startsWith("STATE_MACHINE:") ||
    msg.startsWith("CONFLICT_GUARD:") ||
    msg.startsWith("DOCUMENT_GUARD:") ||
    msg.startsWith("STORAGE_GUARD:") ||
    msg.startsWith("RETENTION_GUARD:")
  ) {
    // Guard trips are conflicts with server-held state, not server faults.
    return Response.json({ error: msg }, { status: 409 });
  }
  console.error("Unhandled API error:", e);
  return Response.json({ error: "Internal error" }, { status: 500 });
}
