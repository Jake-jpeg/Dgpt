/**
 * Pre-gate identity capture + automated conflict screening.
 *
 * 2.0: this endpoint never clears and never declines. The response is one
 * neutral pending message regardless of the automated screen's internal
 * result — the client learns nothing about matches, reasoning, or scores.
 */
import { requireAnyRole, errorResponse } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { submitIdentityAndCheck } from "@/lib/intake/service";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const user = await requireAnyRole(req);
    const { id } = await ctx.params;
    const outcome = await submitIdentityAndCheck(user, id, await req.json());
    return Response.json({
      result: outcome.result,
      state: outcome.session.state,
      message: outcome.message,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
