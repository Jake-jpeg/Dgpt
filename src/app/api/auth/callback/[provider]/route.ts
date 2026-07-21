/**
 * OAuth callback — providers authenticate identity; the DATABASE authorizes.
 *
 * Microsoft Entra (firm side): tokens are fully validated (issuer, audience,
 * signature, expiry, nonce, state, single-tenant tid) in completeOAuth, and
 * then the user MUST already hold an ACTIVE firm account in app_user —
 * successful Microsoft authentication alone confers nothing, and never the
 * ATTORNEY role. Attorney-role accounts are additionally re-checked against
 * ATTORNEY_EMAILS here and on every later request.
 *
 * Google (clients): a session is minted for the authenticated IDENTITY, but
 * no user/account/matter/data access is created by signing in. A brand-new
 * identity lands on the invitation page; only a valid invitation binds it
 * (see /api/invitations/accept).
 */
import { completeOAuth, OAUTH_TX_COOKIE, type ProviderId } from "@/lib/auth/oauth";
import {
  createSessionToken,
  parseCookies,
  sessionCookieHeader,
} from "@/lib/auth/session";
import { attorneyEmailAllowlist, adminBootstrapEmails } from "@/lib/env";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { findAccountForSession } from "@/lib/db/users";
import { decideLoginDestination } from "@/lib/auth/authorize-login";
import { recordAudit } from "@/lib/db/repo";
import { hashNameForAudit } from "@/lib/security/audit-hash";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ provider: string }> }
) {
  try {
    assertRateLimit(req, "login");
    const { provider } = await ctx.params;
    if (provider !== "google" && provider !== "entra" && provider !== "msa") {
      throw new HttpError(404, "Unknown provider");
    }
    const url = new URL(req.url);
    const tx = parseCookies(req)[OAUTH_TX_COOKIE];
    const identity = await completeOAuth(provider as ProviderId, url, tx);

    // Look up (never create) the account for this stable identity. The one
    // narrow exception inside findAccountForSession is ADMIN_EMAILS
    // bootstrap/recovery.
    const account = (await findAccountForSession({
          subject: identity.subject,
          email: identity.email,
          name: identity.name,
          adminBootstrapEmails: adminBootstrapEmails(),
        }));
    const boundAccount =
      account && account.subject === identity.subject ? account : null;

    // Providers authenticate; the DB authorizes. A firm-role account is a
    // firm login on EITHER provider (Microsoft, or a Google Workspace firm
    // mailbox) and passes the same active + attorney-allowlist gate that
    // authz.ts re-runs on every later request. Microsoft remains firm-only;
    // Google without a firm account stays the client/invitation path.
    const dest = decideLoginDestination({
      provider: provider as ProviderId,
      boundAccount,
      attorneyAllowlist: attorneyEmailAllowlist(),
    });

    const token = await createSessionToken({
      subject: identity.subject,
      // Session role is a HINT; authorization reloads the DB role per request.
      role: boundAccount?.role ?? identity.roleHint,
      email: identity.email,
      name: identity.name,
    });
    (await recordAudit(
            "auth",
            "AUTH_LOGIN",
            `provider=${provider} account=${boundAccount ? boundAccount.role : "none"} subjectHash=${hashNameForAudit(identity.email)}`
          ));
    const headers = new Headers({ Location: dest });
    headers.append("Set-Cookie", sessionCookieHeader(token));
    headers.append("Set-Cookie", `${OAUTH_TX_COOKIE}=; Path=/; HttpOnly; Max-Age=0`);
    return new Response(null, { status: 302, headers });
  } catch (e) {
    return errorResponse(e);
  }
}
