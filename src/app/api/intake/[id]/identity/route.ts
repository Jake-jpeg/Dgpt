import { requireAnyRole, errorResponse } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { submitIdentityAndCheck, isTerminated } from "@/lib/intake/service";
import { getProcessCopy } from "@/config/process-copy";
import { GATE_QUESTIONS } from "@/config/gate-questions";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const user = await requireAnyRole(req);
    const { id } = await ctx.params;
    const outcome = await submitIdentityAndCheck(user, id, await req.json());

    if (isTerminated(outcome)) {
      // Conflict HIT: the static forward-out card. The session no longer exists.
      return Response.json(outcome);
    }
    return Response.json({
      result: "CLEAR",
      state: outcome.session.state,
      copy: { scopeGate: getProcessCopy("SCOPE_GATE_EXPLAINER") },
      gateQuestion: GATE_QUESTIONS.GATE_RESIDENCY,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
