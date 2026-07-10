/**
 * Beta gate unlock: CAPTCHA (if configured) → access key → cookie.
 *
 * The cookie stores the key itself; middleware re-validates it against
 * FREE_ACCESS_KEYS on every request, so revoking a key in the env locks its
 * holders out immediately.
 *
 * Hardened like a login endpoint: strict rate limit, CSRF header, generic
 * error messages (no oracle for which part failed beyond captcha vs key).
 */
import { z } from "zod";
import { betaGateEnabled, isValidBetaKey, turnstileConfigured, betaCookieHeader } from "@/lib/beta";
import { isProduction } from "@/lib/env";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit, clientKey } from "@/lib/security/rate-limit";

async function verifyTurnstile(token: string, remoteIp: string): Promise<boolean> {
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: token,
      ...(remoteIp !== "local" ? { remoteip: remoteIp } : {}),
    }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

export async function POST(req: Request) {
  try {
    if (!betaGateEnabled()) throw new HttpError(404, "Not found");
    assertRateLimit(req, "beta");
    assertCsrf(req);

    const parsed = z
      .object({
        code: z.string().trim().min(1).max(200),
        captchaToken: z.string().max(5000).optional(),
      })
      .safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid request");

    if (turnstileConfigured()) {
      if (!parsed.data.captchaToken) {
        throw new HttpError(400, "Please complete the verification challenge");
      }
      const human = await verifyTurnstile(parsed.data.captchaToken, clientKey(req));
      if (!human) throw new HttpError(403, "Verification failed — please try again");
    }

    if (!isValidBetaKey(parsed.data.code)) {
      throw new HttpError(403, "That access code is not valid");
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "Set-Cookie": betaCookieHeader(parsed.data.code, isProduction()),
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
