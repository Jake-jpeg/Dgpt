/**
 * Matter access grants for firm-side users. A STAFF/ATTORNEY who already
 * works the matter may bring in colleagues (STAFF, ATTORNEY, or an admin
 * doing matter work). Clients are NEVER granted this way — the only path
 * that binds a client to a matter is invitation acceptance.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { grantMatterAccess, revokeMatterAccess } from "@/lib/db/matters";
import { getUserById } from "@/lib/db/users";
import { recordAudit } from "@/lib/db/repo";

const schema = z.object({
  userId: z.string().trim().min(1),
  action: z.enum(["GRANT", "REVOKE"]),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = requireMatterAccess(authed, id);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid payload");

    const target = getUserById(parsed.data.userId);
    if (!target || !target.active) throw new HttpError(404, "User not found");
    if (target.role === "CLIENT") {
      throw new HttpError(400, "Clients join a matter only through an invitation");
    }

    if (parsed.data.action === "GRANT") {
      grantMatterAccess(matter.id, target.id, authed.account.id);
    } else {
      revokeMatterAccess(matter.id, target.id);
    }
    recordAudit(
      matter.id,
      parsed.data.action === "GRANT" ? "MATTER_ACCESS_GRANTED" : "MATTER_ACCESS_REVOKED",
      `user=${target.id}`,
      authed.account.id
    );
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
