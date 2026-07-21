/**
 * Invitation management for a matter — STAFF/ATTORNEY (firm-wide access).
 * The attorney supplies the CLIENT'S EMAIL; the invitation is bound to it and
 * only that account can ever accept. The raw token — and the shareable link —
 * are returned exactly once at creation; only the token's hash is stored.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { createInvitation, listInvitationsForMatter, maskEmail } from "@/lib/db/invitations";
import { recordAudit } from "@/lib/db/repo";
import { appUrl } from "@/lib/env";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    return Response.json({
      invitations: (await listInvitationsForMatter(matter.id)).map((i) => ({
        id: i.id,
        email: i.targetEmail,
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

const createSchema = z.object({
  email: z.string().trim().email().max(200),
  ttlHours: z.number().int().min(1).max(24 * 90).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      throw new HttpError(400, "VALIDATION: a valid client email is required");
    }
    const { invitation, rawToken } = (await createInvitation({
          matterId: matter.id,
          createdBy: authed.account.id,
          targetEmail: parsed.data.email,
          ttlHours: parsed.data.ttlHours,
        }));
    (await recordAudit(
            matter.id,
            "INVITATION_CREATED",
            `invitation=${invitation.id} to=${maskEmail(invitation.targetEmail)}`,
            authed.account.id
          ));
    // The raw token + link appear here ONCE and are never persisted or logged.
    const link = `${appUrl()}/invite?token=${rawToken}`;
    return Response.json(
      {
        invitation: { id: invitation.id, email: invitation.targetEmail, expiresAt: invitation.expiresAt },
        token: rawToken,
        link,
      },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}
