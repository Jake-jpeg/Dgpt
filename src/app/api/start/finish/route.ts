/**
 * "Create my case" (2026-10-30): the signed-in starting spouse turns their
 * June draft into a matter — two party seats, an invitation link for the
 * other spouse, their own interview opened. CLIENT only; the draft must be
 * parked under THIS account's verified email.
 */
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { requireUser } from "@/lib/auth/authz";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { finishStart, pendingStartDraftFor } from "@/lib/june/start";
import { joinUrl } from "@/lib/june/links";

export async function POST(req: Request) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["CLIENT"]);
    const draft = await pendingStartDraftFor(authed.account.email);
    if (!draft) throw new HttpError(404, "No case is waiting for this email — start with June first");
    let result;
    try {
      result = await finishStart(draft, authed.account);
    } catch (e) {
      throw new HttpError(409, e instanceof Error ? e.message.replace(/^(START_GUARD|VALIDATION): /, "") : "Could not create the case");
    }
    return Response.json({
      matterId: result.matterId,
      inviteUrl: joinUrl(req, result.inviteToken),
      inviteExpiresAt: result.inviteExpiresAt,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
