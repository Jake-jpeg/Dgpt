/**
 * Invitation acceptance for an ALREADY-SIGNED-IN client. The frictionless
 * path runs in the OAuth callback; this endpoint covers the case where the
 * client was already signed in when they opened the link.
 *
 * Same single-account guarantee: acceptance is refused unless the session's
 * verified email matches the invitation's bound email. One neutral response
 * for every failure mode; a firm account may not accept.
 */
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { findAccountForSession } from "@/lib/db/users";
import { onboardInvitedClient } from "@/lib/db/invitations";
import { adminBootstrapEmails } from "@/lib/env";

const NEUTRAL =
  "This invitation is not available. Please contact the firm for a new invitation.";

const schema = z.object({ token: z.string().trim().min(16).max(512) });

export async function POST(req: Request) {
  try {
    assertRateLimit(req, "beta"); // strict: a shared-secret door
    assertCsrf(req);
    const session = await getSessionUser(req);
    if (!session) throw new HttpError(401, "Not signed in");

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, NEUTRAL);

    // A firm-role account never accepts a client invitation.
    const existing = (await findAccountForSession({
          subject: session.subject,
          email: session.email,
          name: session.name,
          adminBootstrapEmails: adminBootstrapEmails(),
        }));
    if (existing && existing.subject === session.subject && existing.role !== "CLIENT") {
      throw new HttpError(403, "Firm accounts do not accept client invitations");
    }

    const outcome = await onboardInvitedClient({
      rawToken: parsed.data.token,
      subject: session.subject,
      email: session.email,
      name: session.name,
    });
    if ("error" in outcome) {
      if (outcome.error === "wrong_email") {
        throw new HttpError(
          403,
          "This invitation was issued to a different email. Please sign in with the account the firm invited."
        );
      }
      if (outcome.error === "firm_account") {
        throw new HttpError(403, "Firm accounts do not accept client invitations");
      }
      throw new HttpError(400, NEUTRAL); // invalid / account_conflict → neutral
    }
    return Response.json({ ok: true, matterId: outcome.matterId });
  } catch (e) {
    return errorResponse(e);
  }
}
