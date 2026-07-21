/**
 * Matter lifecycle + legal hold — ATTORNEY only. Engagement, closure,
 * abandonment, and litigation hold are legal determinations; STAFF and
 * ADMIN cannot make them.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { setMatterLifecycle, setLegalHold, getMatter } from "@/lib/db/matters";
import { recordAudit } from "@/lib/db/repo";

const schema = z.object({
  lifecycle: z.enum(["PROSPECTIVE", "ENGAGED", "ABANDONED", "CLOSED"]).optional(),
  legalHold: z.boolean().optional(),
  legalHoldReason: z.string().trim().max(2000).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success || (parsed.data.lifecycle === undefined && parsed.data.legalHold === undefined)) {
      throw new HttpError(400, "VALIDATION: nothing to update");
    }
    if (parsed.data.lifecycle !== undefined) {
      (await setMatterLifecycle(matter.id, parsed.data.lifecycle));
      (await recordAudit(
                matter.id,
                "MATTER_LIFECYCLE_CHANGED",
                `from=${matter.lifecycle} to=${parsed.data.lifecycle}`,
                authed.account.id
              ));
    }
    if (parsed.data.legalHold !== undefined) {
      (await setLegalHold(matter.id, parsed.data.legalHold, parsed.data.legalHoldReason));
      (await recordAudit(
                matter.id,
                parsed.data.legalHold ? "LEGAL_HOLD_SET" : "LEGAL_HOLD_RELEASED",
                undefined,
                authed.account.id
              ));
    }
    const updated = (await getMatter(matter.id))!;
    return Response.json({
      matter: { id: updated.id, lifecycle: updated.lifecycle, legalHold: updated.legalHold },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
