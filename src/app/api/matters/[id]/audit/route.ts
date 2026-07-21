/**
 * Matter audit trail — ATTORNEY (with a grant) only. Events referenced by
 * the matter id and by its intake sessions. Details carry identifiers and
 * salted hashes only — never raw confidential content.
 */
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getAuditEvents, listSessionsByMatter } from "@/lib/db/repo";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const refs = [matter.id, ...(await listSessionsByMatter(matter.id)).map((s) => s.id)];
    const perRef = await Promise.all(
      (refs.map(async (ref) =>
                (await getAuditEvents(ref)).map((e) => ({ ref, event: e.event, detail: e.detail, at: e.created_at }))
              ))
    );
    const events = perRef.flat().sort((a, b) => a.at.localeCompare(b.at));
    return Response.json({ events });
  } catch (e) {
    return errorResponse(e);
  }
}
