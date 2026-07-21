/**
 * Accommodations — STAFF/ATTORNEY record that intake is being completed by
 * an alternate, attorney-approved method (telephone, video, in person,
 * paper, assisted portal, other).
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import {
  ACCOMMODATION_METHODS,
  listAccommodations,
  recordAccommodation,
} from "@/lib/db/matter-workflow";
import { recordAudit } from "@/lib/db/repo";

const schema = z.object({
  method: z.enum(ACCOMMODATION_METHODS),
  note: z.string().trim().max(2000).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid accommodation payload");
    const row = (await recordAccommodation({
          matterId: matter.id,
          method: parsed.data.method,
          note: parsed.data.note,
          recordedBy: authed.account.id,
        }));
    (await recordAudit(matter.id, "ACCOMMODATION_RECORDED", `method=${row.method}`, authed.account.id));
    return Response.json({ accommodation: row }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    return Response.json({ accommodations: (await listAccommodations(matter.id)) });
  } catch (e) {
    return errorResponse(e);
  }
}
