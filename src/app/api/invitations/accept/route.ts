/**
 * Invitation acceptance — the client's entry into the portal, and THE ONLY
 * code path that turns a Google (or local-test) identity into a CLIENT
 * account.
 *
 * Invitation-first flow (pilot hardening):
 *   valid matter invitation → authenticated identity (Google OIDC) → the UI
 *   shows the selected account for confirmation → this endpoint validates
 *   the token FIRST (a generic sign-in with an invalid token creates
 *   NOTHING) → binds the invitation to the stable identity → CLIENT access
 *   to that matter only.
 *
 * - ONE neutral response for every failure mode: invalid, expired, revoked,
 *   and used tokens are indistinguishable.
 * - The token travels in the request BODY, not the URL.
 * - Firm accounts (STAFF/ATTORNEY/ADMIN) never accept client invitations.
 * - No silent relinking: an email match with a DIFFERENT stable subject is
 *   refused (manual recovery is documented in docs/ACCOUNT-RECOVERY.md).
 */
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { acceptInvitation, previewInvitation } from "@/lib/db/invitations";
import {
  findAccountForSession,
  provisionClientAccount,
} from "@/lib/db/users";
import { adminBootstrapEmails } from "@/lib/env";
import { recordAudit } from "@/lib/db/repo";

const NEUTRAL_MESSAGE =
  "This invitation is not available. Please contact the firm for a new invitation.";

const schema = z.object({ token: z.string().trim().min(16).max(200) });

export async function POST(req: Request) {
  try {
    // Strict limit: invitation acceptance is a shared-secret door.
    assertRateLimit(req, "beta");
    assertCsrf(req);
    const session = await getSessionUser(req);
    if (!session) throw new HttpError(401, "Not signed in");

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, NEUTRAL_MESSAGE);

    // Existing account, if any. Firm accounts never accept invitations.
    const existing = findAccountForSession({
      subject: session.subject,
      email: session.email,
      name: session.name,
      adminBootstrapEmails: adminBootstrapEmails(),
    });
    if (existing && existing.subject !== session.subject) {
      // Email collision with a different stable identity — never silently
      // relink; the firm's manual recovery process handles this.
      throw new HttpError(400, NEUTRAL_MESSAGE);
    }
    if (existing && existing.role !== "CLIENT") {
      throw new HttpError(403, "Firm accounts do not accept client invitations");
    }
    if (existing && !existing.active) {
      throw new HttpError(403, "Account is deactivated");
    }

    // Validate the token BEFORE any account creation.
    if (!previewInvitation(parsed.data.token)) {
      throw new HttpError(400, NEUTRAL_MESSAGE);
    }

    const account =
      existing ??
      provisionClientAccount({
        subject: session.subject,
        email: session.email,
        name: session.name,
      });

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
