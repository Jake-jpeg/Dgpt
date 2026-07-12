/**
 * Conflict review + disposition for a matter.
 *
 * GET  — ATTORNEY (with a grant): the retained conflict submissions and the
 *        matter's current status. STAFF sees submissions exist but this
 *        endpoint is attorney-only because dispositions are decided here.
 * POST — ATTORNEY ONLY: CLEARED | DECLINED | NEEDS_MORE_INFORMATION.
 *        STAFF and ADMIN are refused at the API layer AND (belt and
 *        suspenders) by the structural role re-check in the persistence
 *        layer. Automated code paths cannot reach CLEARED/DECLINED at all.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { listConflictSubmissionsForMatter } from "@/lib/db/conflicts";
import { applyConflictDisposition } from "@/lib/intake/service";
import { getMatter } from "@/lib/db/matters";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = requireMatterAccess(authed, id);
    return Response.json({
      matterId: matter.id,
      conflictStatus: matter.conflictStatus,
      submissions: listConflictSubmissionsForMatter(matter.id),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

const schema = z.object({
  disposition: z.enum(["CLEARED", "DECLINED", "NEEDS_MORE_INFORMATION"]),
  internalNote: z.string().trim().max(4000).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = requireMatterAccess(authed, id);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid disposition payload");

    applyConflictDisposition({
      matterId: matter.id,
      actingUserId: authed.account.id,
      disposition: parsed.data.disposition,
      internalNote: parsed.data.internalNote,
    });
    return Response.json({
      matterId: matter.id,
      conflictStatus: getMatter(matter.id)!.conflictStatus,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
