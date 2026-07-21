import { requireAnyRole, errorResponse } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { sessionView } from "@/lib/intake/service";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const user = await requireAnyRole(req);
    const { id } = await ctx.params;
    return Response.json((await sessionView(user, id)));
  } catch (e) {
    return errorResponse(e);
  }
}
