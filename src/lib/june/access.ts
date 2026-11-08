/**
 * Who may talk to June (2026-11-08): a signed-in, signed-up, not-rejected
 * CLIENT. Shared by the turn, draft and finish routes so the three doors
 * agree. A banned/deactivated account surfaces its own 403 message.
 */
import { HttpError } from "@/lib/auth/rbac";
import { getSessionUser } from "@/lib/auth/session";
import { requireUser, type AuthedUser } from "@/lib/auth/authz";
import { getSignup, mayUseGuide } from "@/lib/db/signups";

export type StartAccess = "OK" | "SIGN_IN" | "SIGN_UP" | "REJECTED" | "NOT_CLIENT";

/** Who may talk to June: a signed-in, signed-up, not-rejected CLIENT. */
export async function starterAccess(req: Request): Promise<{ access: StartAccess; authed: AuthedUser | null; name: string }> {
  const session = await getSessionUser(req);
  if (!session) return { access: "SIGN_IN", authed: null, name: "" };
  let authed: AuthedUser;
  try {
    authed = await requireUser(req, ["CLIENT"]);
  } catch (e) {
    // A banned/deactivated account surfaces its own 403 — the page shows the message.
    if (e instanceof HttpError && /suspended|deactivated/i.test(e.message)) throw e;
    return { access: "NOT_CLIENT", authed: null, name: "" };
  }
  const may = await mayUseGuide(authed.account.id);
  if (!may.ok) return { access: may.reason === "REJECTED" ? "REJECTED" : "SIGN_UP", authed, name: "" };
  const signup = await getSignup(authed.account.id);
  return { access: "OK", authed, name: (signup?.fullName || authed.account.name || "").trim() };
}

