import { requireAnyRole, errorResponse } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { answerBranch, isTerminated, sessionView } from "@/lib/intake/service";
import { getProcessCopy } from "@/config/process-copy";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const user = await requireAnyRole(req);
    const { id } = await ctx.params;
    const outcome = answerBranch(user, id, await req.json());
    if (isTerminated(outcome)) return Response.json(outcome);
    return Response.json({
      tier: outcome.tier,
      copy: { intake: getProcessCopy("INTAKE_EXPLAINER") },
      view: sessionView(user, id),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
