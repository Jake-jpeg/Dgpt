import { requireAnyRole, errorResponse } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { completeIntake } from "@/lib/intake/service";
import { getProcessCopy } from "@/config/process-copy";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const user = await requireAnyRole(req);
    const { id } = await ctx.params;
    const result = (await completeIntake(user, id));
    return Response.json({
      ...result,
      copy: { readyForReview: getProcessCopy("READY_FOR_REVIEW") },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
