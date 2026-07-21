import { beginOAuth, isProviderConfigured, type ProviderId } from "@/lib/auth/oauth";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";

/**
 * Short-lived cookie that carries a pending invitation token THROUGH the
 * OAuth round-trip, so the callback can auto-accept it (frictionless — the
 * client never pastes a code). SameSite=Lax so it survives the provider's
 * top-level redirect back, HttpOnly so page scripts can't read it.
 */
export const PENDING_INVITE_COOKIE = "dgpt_pending_invite";

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
    if (!isProviderConfigured(provider as ProviderId)) {
      throw new HttpError(
        503,
        `The ${provider} login is not configured yet (set its client ID/secret in the environment)`
      );
    }
    const { redirectUrl, txCookie } = await beginOAuth(provider as ProviderId);

    const headers = new Headers({ Location: redirectUrl });
    headers.append("Set-Cookie", txCookie);

    // An invitation link sends the client here as
    // /api/auth/login/<provider>?invite=<token>. Stash the token so the
    // callback can bind it to the (email-matched) identity. Entra is
    // firm-only and never carries a client invite.
    const invite = new URL(req.url).searchParams.get("invite");
    if (invite && provider !== "entra") {
      const value = encodeURIComponent(invite.slice(0, 512));
      headers.append(
        "Set-Cookie",
        `${PENDING_INVITE_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`
      );
    }
    return new Response(null, { status: 302, headers });
  } catch (e) {
    return errorResponse(e);
  }
}
