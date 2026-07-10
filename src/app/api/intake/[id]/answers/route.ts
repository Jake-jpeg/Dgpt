import { requireAnyRole, errorResponse } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { submitAnswers, isTerminated } from "@/lib/intake/service";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const user = await requireAnyRole(req);
    const { id } = await ctx.params;
    const outcome = submitAnswers(user, id, await req.json());
    return Response.json(outcome, { status: isTerminated(outcome) ? 200 : 200 });
  } catch (e) {
    return errorResponse(e);
  }
}
