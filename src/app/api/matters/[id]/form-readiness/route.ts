/**
 * Attorney-only deterministic form-readiness report (B13).
 */
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getMatterAnswers, schemaForMatter } from "@/lib/db/intake2";
import { getConfigChecklistState } from "@/lib/db/checklist";
import { buildFormReadiness } from "@/lib/intake2/form-readiness";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const schema = schemaForMatter(matter);
    const report = buildFormReadiness(
      matter,
      schema,
      (await getMatterAnswers(matter.id)),
      (await getConfigChecklistState(matter.id))
    );
    return Response.json({ report });
  } catch (e) {
    return errorResponse(e);
  }
}
