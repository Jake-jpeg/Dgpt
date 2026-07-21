/**
 * Revoke an invitation — STAFF/ATTORNEY with a grant on the invitation's
 * matter. Revocation is immediate; a revoked token is indistinguishable from
 * an invalid one to whoever holds it.
 */
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getInvitation, revokeInvitation } from "@/lib/db/invitations";
import { recordAudit } from "@/lib/db/repo";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const invitation = (await getInvitation(id));
    if (!invitation) throw new HttpError(404, "Not found");
    // Access is checked against the matter, and reads as 404 when absent.
    const matter = (await requireMatterAccess(authed, invitation.matterId));
    (await revokeInvitation(invitation.id));
    (await recordAudit(matter.id, "INVITATION_REVOKED", `invitation=${invitation.id}`, authed.account.id));
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
