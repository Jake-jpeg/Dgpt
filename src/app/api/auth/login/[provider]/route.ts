import { beginOAuth, isProviderConfigured, type ProviderId } from "@/lib/auth/oauth";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";

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

    return new Response(null, { status: 302, headers });
  } catch (e) {
    return errorResponse(e);
  }
}
