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
 * Clients (Google / Outlook·Hotmail) — ATTORNEY-CONTROLLED CONNECTION
 * (2026-07-26 operator directive, replacing the invitation-link flow): a
 * client simply signs in and a CLIENT account is created on the spot —
 * "make them make an ID." That account is a shell: it is linked to NOTHING
 * and can see NOTHING until the ATTORNEY connects it to a matter from the
 * firm portal (accept), or declines/deletes it. No tokens, no invite
 * cookies, no email-matching through OAuth redirects — the previous
 * link-based flow died in live testing because the invite cookie did not
 * reliably survive the provider round-trip, and the attorney could not see
 * or control any of it. Now the attorney sees every registration and makes
 * the call.
 */
import { completeOAuth, OAUTH_TX_COOKIE, type ProviderId } from "@/lib/auth/oauth";
import {
  createSessionToken,
  parseCookies,
  sessionCookieHeader,
} from "@/lib/auth/session";
import { attorneyEmailAllowlist, adminBootstrapEmails } from "@/lib/env";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertRateLimit, clientKey } from "@/lib/security/rate-limit";
import { findAccountForSession, provisionClientAccount, recordLogin } from "@/lib/db/users";
import { decideLoginDestination } from "@/lib/auth/authorize-login";
import { JOIN_RETURN_COOKIE, START_RETURN_COOKIE } from "@/lib/june/links";
import { SIGNUP_RETURN_COOKIE } from "@/config/signup-copy";
import { getSignup } from "@/lib/db/signups";
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
    const cookies = parseCookies(req);
    const identity = await completeOAuth(provider as ProviderId, url, cookies[OAUTH_TX_COOKIE]);

    // Look up (never invent a role for) the account bound to this stable
    // identity. The one narrow exception inside findAccountForSession is
    // ADMIN_EMAILS bootstrap.
    const account = (await findAccountForSession({
          subject: identity.subject,
          email: identity.email,
          name: identity.name,
          adminBootstrapEmails: adminBootstrapEmails(),
        }));
    let boundAccount =
      account && account.subject === identity.subject ? account : null;

    // ── CLIENT REGISTRATION AT SIGN-IN (attorney-controlled connection) ──
    // A brand-new Google/Outlook identity becomes an UNLINKED CLIENT shell:
    // provider subject, email, display name — the absolute minimum, nothing
    // else. It confers no access to anything; the attorney connects it to a
    // matter (or declines it) from the firm portal. Entra never registers.
    if (!boundAccount && (provider === "google" || provider === "msa")) {
      try {
        const created = await provisionClientAccount({
          subject: identity.subject,
          email: identity.email,
          name: identity.name,
        });
        if (created.role === "CLIENT") {
          boundAccount = created;
          (await recordAudit(
                  "auth",
                  "CLIENT_REGISTERED",
                  `provider=${provider} subjectHash=${hashNameForAudit(identity.email)}`
                ));
        }
      } catch {
        // The email is already bound to a DIFFERENT sign-in identity.
        // Nothing is created or relinked; send them to the help page.
        (await recordAudit(
                "auth",
                "CLIENT_REGISTRATION_CONFLICT",
                `provider=${provider} subjectHash=${hashNameForAudit(identity.email)}`
              ));
        const headers = new Headers({ Location: "/invite?e=account_conflict" });
        headers.append("Set-Cookie", `${OAUTH_TX_COOKIE}=; Path=/; HttpOnly; Max-Age=0`);
        return new Response(null, { status: 302, headers });
      }
    }

    // 2026-11-08: a BANNED client is told so at the door (an ordinary
    // deactivation would only 403 on the next API call, which reads as a
    // broken site). The ban itself is enforced by requireUser on every
    // request; this is the message, not the lock.
    if (boundAccount && boundAccount.role === "CLIENT" && !boundAccount.active) {
      await recordAudit("auth", "AUTH_LOGIN_REFUSED_BANNED", `provider=${provider} subjectHash=${hashNameForAudit(identity.email)}`);
      throw new HttpError(403, boundAccount.bannedAt ? "This account has been suspended. Contact the firm if you believe this is a mistake." : "Account is deactivated");
    }

    // Providers authenticate; the DB authorizes. Firm-role accounts pass the
    // active + attorney-allowlist gate; clients land on their portal (linked
    // or not — the waiting room handles the unlinked state).
    let dest = decideLoginDestination({
      provider: provider as ProviderId,
      boundAccount,
      attorneyAllowlist: attorneyEmailAllowlist(),
    });
    // 2026-10-30: the invited spouse signed in from /join/<token>. Send them
    // straight back to that link so it can seat them. The token itself
    // stays in the URL they were sent — this cookie is only a return
    // address, and if it did not survive the round-trip they simply open
    // the link again (the join page accepts while signed in).
    const joinReturn = cookies[JOIN_RETURN_COOKIE];
    if (joinReturn && boundAccount?.role === "CLIENT" && /^[A-Za-z0-9_-]{16,200}$/.test(joinReturn)) {
      dest = `/join/${joinReturn}`;
    }
    // 2026-11-07: the reader signed in from /signup → back to finish sign-up.
    const signupReturn = cookies[SIGNUP_RETURN_COOKIE];
    if (signupReturn === "1" && boundAccount?.role === "CLIENT") {
      dest = "/signup/details";
    }
    // 2026-11-08: "Start with June" → sign in → back to June; a client who has
    // not left a name and number yet finishes sign-up first, then June.
    const startReturn = cookies[START_RETURN_COOKIE];
    if (startReturn === "1" && boundAccount?.role === "CLIENT") {
      dest = (await getSignup(boundAccount.id)) ? "/start" : "/signup/details?next=start";
    }
    if (boundAccount) {
      const ip = clientKey(req);
      await recordLogin(boundAccount.id, ip === "local" ? null : ip);
    }

    const token = await createSessionToken({
      subject: identity.subject,
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
    if (joinReturn) headers.append("Set-Cookie", `${JOIN_RETURN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    if (signupReturn) headers.append("Set-Cookie", `${SIGNUP_RETURN_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`);
    if (startReturn) headers.append("Set-Cookie", `${START_RETURN_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`);
    return new Response(null, { status: 302, headers });
  } catch (e) {
    return errorResponse(e);
  }
}
