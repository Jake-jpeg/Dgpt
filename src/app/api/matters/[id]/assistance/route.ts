/**
 * "I need help completing this intake."
 *
 * POST — CLIENT (own matter): records a help request. There is deliberately
 *        NO reason field: a client never has to disclose why they need help.
 * GET  — STAFF/ATTORNEY (granted): open help requests to act on.
 * PATCH — STAFF/ATTORNEY: acknowledge/resolve.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import {
  createAssistanceRequest,
  listAssistanceRequests,
  setAssistanceStatus,
} from "@/lib/db/matter-workflow";
import { recordAudit } from "@/lib/db/repo";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["CLIENT"]);
    const { id } = await ctx.params;
    const matter = requireMatterAccess(authed, id);
    const request = createAssistanceRequest(matter.id, authed.account.id);
    recordAudit(matter.id, "ASSISTANCE_REQUESTED", `request=${request.id}`, authed.account.id);
    return Response.json(
      {
        ok: true,
        message:
          "Thank you — the firm has been notified and will reach out to help you complete this step.",
      },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = requireMatterAccess(authed, id);
    return Response.json({ requests: listAssistanceRequests(matter.id) });
  } catch (e) {
    return errorResponse(e);
  }
}

const patchSchema = z.object({
  requestId: z.string().trim().min(1),
  status: z.enum(["ACKNOWLEDGED", "RESOLVED"]),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = requireMatterAccess(authed, id);
    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid payload");
    const target = listAssistanceRequests(matter.id).find((r) => r.id === parsed.data.requestId);
    if (!target) throw new HttpError(404, "Request not found");
    setAssistanceStatus(target.id, parsed.data.status);
    recordAudit(matter.id, "ASSISTANCE_STATUS", `request=${target.id} status=${parsed.data.status}`, authed.account.id);
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
