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
 * Clients (Google / Outlook·Hotmail): INVITE-ONLY. Signing in creates no
 * account by itself. A client enters only by opening an email-bound
 * invitation link — the token rides through the round-trip in the pending
 * invite cookie, and is auto-accepted here ONLY when the verified email
 * matches the invitation's bound address. A leaked link is useless to any
 * other account. No invitation → no account → the "invitation required" page.
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
import { onboardInvitedClient } from "@/lib/db/invitations";
import { PENDING_INVITE_COOKIE } from "@/app/api/auth/login/[provider]/route";

/** Expire the one-time invite cookie no matter how the callback ends. */
function clearInviteCookie(headers: Headers): void {
  headers.append("Set-Cookie", `${PENDING_INVITE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

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
    const pendingInvite = cookies[PENDING_INVITE_COOKIE]
      ? decodeURIComponent(cookies[PENDING_INVITE_COOKIE])
      : null;

    // Look up (never create) the account for this stable identity. The one
    // narrow exception inside findAccountForSession is ADMIN_EMAILS.
    const account = (await findAccountForSession({
          subject: identity.subject,
          email: identity.email,
          name: identity.name,
          adminBootstrapEmails: adminBootstrapEmails(),
        }));
    let boundAccount =
      account && account.subject === identity.subject ? account : null;

    // ── INVITE-ONLY client onboarding (frictionless, email-bound) ──
    // A pending invite means the client arrived via an invitation link on a
    // client provider. Accept ONLY if the verified email matches the bound
    // address; nothing is created on a mismatch, so the real client can still
    // use the link. Entra never carries a client invite.
    //
    // EXISTING accounts accept too (bug fix 2026-07-22): a returning CLIENT
    // — e.g. one provisioned under the retired open-signup flow, or a past
    // client being re-engaged on a new matter — must be able to consume an
    // invitation exactly like a brand-new identity. Requiring !boundAccount
    // silently skipped acceptance for them: the invitation stayed unconsumed,
    // no matter was ever bound, and the portal told an invited client they
    // were not invited. The failure handling now splits:
    //   - no account yet → bounce to /invite with the reason (unchanged);
    //     no session is minted, the link stays usable by the right person;
    //   - account exists → a stale/used/mismatched cookie token must NEVER
    //     lock a client out of their own account: audit it and continue the
    //     normal login (their existing matter bindings are untouched).
    if (pendingInvite && (provider === "google" || provider === "msa")) {
      const outcome = await onboardInvitedClient({
        rawToken: pendingInvite,
        subject: identity.subject,
        email: identity.email,
        name: identity.name,
      });
      if ("error" in outcome) {
        (await recordAudit(
                "auth",
                "INVITATION_ACCEPT_FAILED",
                `provider=${provider} reason=${outcome.error} subjectHash=${hashNameForAudit(identity.email)}`
              ));
        if (!boundAccount) {
          // Send them back to the invite page with a clear, non-leaky reason,
          // carrying the same token they already hold so they can retry with
          // the right account. NO session is minted — an unmatched sign-in is
          // nothing.
          const back = `/invite?e=${outcome.error}&token=${encodeURIComponent(pendingInvite)}`;
          const headers = new Headers({ Location: back });
          headers.append("Set-Cookie", `${OAUTH_TX_COOKIE}=; Path=/; HttpOnly; Max-Age=0`);
          clearInviteCookie(headers);
          return new Response(null, { status: 302, headers });
        }
        // Existing account + failed invite: fall through to normal login.
      } else {
        // Accepted: the client now holds a CLIENT account bound to the matter.
        boundAccount = (await findAccountForSession({
              subject: identity.subject,
              email: identity.email,
              name: identity.name,
              adminBootstrapEmails: adminBootstrapEmails(),
            }));
      }
    }

    // Providers authenticate; the DB authorizes. Firm-role accounts (Entra or
    // a Google Workspace firm mailbox) pass the active + attorney-allowlist
    // gate. A client with no account (no/invalid invite) lands on /invite.
    const dest = decideLoginDestination({
      provider: provider as ProviderId,
      boundAccount,
      attorneyAllowlist: attorneyEmailAllowlist(),
    });

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
    clearInviteCookie(headers);
    return new Response(null, { status: 302, headers });
  } catch (e) {
    return errorResponse(e);
  }
}
