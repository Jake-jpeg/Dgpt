import { completeOAuth, OAUTH_TX_COOKIE, type ProviderId } from "@/lib/auth/oauth";
import {
  createSessionToken,
  parseCookies,
  sessionCookieHeader,
} from "@/lib/auth/session";
import { attorneyEmailAllowlist } from "@/lib/env";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { recordAudit } from "@/lib/db/repo";
import { hashNameForAudit } from "@/lib/security/audit-hash";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ provider: string }> }
) {
  try {
    assertRateLimit(req, "login");
    const { provider } = await ctx.params;
    if (provider !== "google" && provider !== "entra") {
      throw new HttpError(404, "Unknown provider");
    }
    const url = new URL(req.url);
    const tx = parseCookies(req)[OAUTH_TX_COOKIE];
    const identity = await completeOAuth(provider as ProviderId, url, tx);

    // Attorney logins are checked against the allowlist AT LOGIN as well as
    // on every subsequent request — tenant membership alone is not enough.
    if (identity.role === "ATTORNEY") {
      const allow = attorneyEmailAllowlist();
      if (!allow.includes(identity.email.toLowerCase())) {
        throw new HttpError(403, "This account is not authorized for attorney access");
      }
    }

    const token = await createSessionToken(identity);
    recordAudit(
      "auth",
      "AUTH_LOGIN",
      `provider=${provider} role=${identity.role} subjectHash=${hashNameForAudit(identity.email)}`
    );
    const dest = identity.role === "ATTORNEY" ? "/attorney" : "/intake";
    const headers = new Headers({ Location: dest });
    headers.append("Set-Cookie", sessionCookieHeader(token));
    headers.append("Set-Cookie", `${OAUTH_TX_COOKIE}=; Path=/; HttpOnly; Max-Age=0`);
    return new Response(null, { status: 302, headers });
  } catch (e) {
    return errorResponse(e);
  }
}
