/**
 * Invitation acceptance — the client's entry into the portal.
 *
 * - Requires an authenticated CLIENT (identity first, then the token binds
 *   that identity to the matter).
 * - ONE neutral response for every failure mode: invalid, expired, revoked,
 *   and used tokens are indistinguishable.
 * - The token travels in the request BODY, not the URL.
 */
import { z } from "zod";
import { requireUser } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { acceptInvitation } from "@/lib/db/invitations";
import { recordAudit } from "@/lib/db/repo";

const NEUTRAL_MESSAGE =
  "This invitation is not available. Please contact the firm for a new invitation.";

const schema = z.object({ token: z.string().trim().min(16).max(200) });

export async function POST(req: Request) {
  try {
    // Strict limit: invitation acceptance is a shared-secret door.
    assertRateLimit(req, "beta");
    assertCsrf(req);
    const { account } = await requireUser(req, ["CLIENT"]);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, NEUTRAL_MESSAGE);

    const accepted = acceptInvitation({
      rawToken: parsed.data.token,
      clientUserId: account.id,
    });
    if (!accepted) throw new HttpError(400, NEUTRAL_MESSAGE);

    recordAudit(
      accepted.matterId,
      "INVITATION_ACCEPTED",
      `invitation=${accepted.id}`,
      account.id
    );
    return Response.json({ ok: true, matterId: accepted.matterId });
  } catch (e) {
    return errorResponse(e);
  }
}
