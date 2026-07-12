/**
 * Invitation management for a matter — STAFF/ATTORNEY with a grant on the
 * matter. The raw token is returned exactly once at creation; only its hash
 * is ever stored.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { createInvitation, listInvitationsForMatter } from "@/lib/db/invitations";
import { recordAudit } from "@/lib/db/repo";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = requireMatterAccess(authed, id);
    return Response.json({
      invitations: listInvitationsForMatter(matter.id).map((i) => ({
        id: i.id,
        expiresAt: i.expiresAt,
        revoked: Boolean(i.revokedAt),
        used: Boolean(i.usedAt),
        createdAt: i.createdAt,
      })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

const createSchema = z.object({ ttlHours: z.number().int().min(1).max(24 * 90).optional() });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = requireMatterAccess(authed, id);
    const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid invitation payload");
    const { invitation, rawToken } = createInvitation({
      matterId: matter.id,
      createdBy: authed.account.id,
      ttlHours: parsed.data.ttlHours,
    });
    recordAudit(matter.id, "INVITATION_CREATED", `invitation=${invitation.id}`, authed.account.id);
    // rawToken appears here ONCE and is never persisted or logged.
    return Response.json(
      { invitation: { id: invitation.id, expiresAt: invitation.expiresAt }, token: rawToken },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}
