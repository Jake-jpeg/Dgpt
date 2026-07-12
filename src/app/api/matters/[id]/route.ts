/**
 * Single-matter view, shaped by role:
 *  - CLIENT: plain-language status only. Never internal notes, never
 *    conflict reasoning, never unreleased work product.
 *  - STAFF/ATTORNEY (with a grant): working view.
 * 404 for anyone else — existence is never leaked.
 */
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { listSessionsByMatter } from "@/lib/db/repo";
import { clientMatterStatus } from "@/lib/matters/client-view";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["CLIENT", "STAFF", "ATTORNEY", "ADMIN"]);
    const { id } = await ctx.params;
    const matter = requireMatterAccess(authed, id);

    if (authed.account.role === "CLIENT") {
      return Response.json({
        matter: {
          id: matter.id,
          status: clientMatterStatus(matter),
          canProceed: matter.conflictStatus === "CLEARED",
        },
      });
    }

    return Response.json({
      matter: {
        id: matter.id,
        label: matter.label,
        lifecycle: matter.lifecycle,
        conflictStatus: matter.conflictStatus,
        conflictStatusSetBy: matter.conflictStatusSetBy,
        conflictStatusSetAt: matter.conflictStatusSetAt,
        legalHold: matter.legalHold,
        clientUserId: matter.clientUserId,
        createdAt: matter.createdAt,
        updatedAt: matter.updatedAt,
        sessions: listSessionsByMatter(matter.id).map((s) => ({
          id: s.id,
          state: s.state,
          tier: s.tier,
          updatedAt: s.updatedAt,
        })),
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
