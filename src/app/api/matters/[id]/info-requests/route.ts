/**
 * Missing-information requests.
 *
 * POST/PATCH — STAFF/ATTORNEY: create plain-language requests, resolve them.
 * GET — role-shaped: the CLIENT sees only open items' labels (never the
 *       internal note); STAFF/ATTORNEY see the working view.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import {
  createInfoRequest,
  getInfoRequest,
  listInfoRequests,
  resolveInfoRequest,
} from "@/lib/db/matter-workflow";
import { recordAudit } from "@/lib/db/repo";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["CLIENT", "STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const all = (await listInfoRequests(matter.id));
    if (authed.account.role === "CLIENT") {
      return Response.json({
        requests: all
          .filter((r) => r.status === "OPEN")
          .map((r) => ({ id: r.id, label: r.label, createdAt: r.createdAt })),
      });
    }
    return Response.json({ requests: all });
  } catch (e) {
    return errorResponse(e);
  }
}

const createSchema = z.object({
  label: z.string().trim().min(1).max(300),
  internalNote: z.string().trim().max(4000).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid info-request payload");
    const row = (await createInfoRequest({
          matterId: matter.id,
          label: parsed.data.label,
          internalNote: parsed.data.internalNote,
          createdBy: authed.account.id,
        }));
    (await recordAudit(matter.id, "INFO_REQUEST_CREATED", `request=${row.id}`, authed.account.id));
    return Response.json({ request: row }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

const patchSchema = z.object({ requestId: z.string().trim().min(1) });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid payload");
    const target = (await getInfoRequest(parsed.data.requestId));
    if (!target || target.matterId !== matter.id) throw new HttpError(404, "Request not found");
    (await resolveInfoRequest(target.id));
    (await recordAudit(matter.id, "INFO_REQUEST_RESOLVED", `request=${target.id}`, authed.account.id));
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
