/**
 * DEV AUTH STUB — local testing without real OAuth credentials.
 *
 * Two independent locks (see devAuthStubEnabled):
 *   1. DEV_AUTH_STUB=true must be set explicitly, AND
 *   2. NODE_ENV must not be "production" — in production this endpoint is a
 *      404 regardless of env flags.
 *
 * Attorney dev-logins still must pass the ATTORNEY_EMAILS allowlist, so the
 * RBAC path exercised in dev is the same one used in production.
 */
import { z } from "zod";
import { devAuthStubEnabled } from "@/lib/env";
import { createSessionToken, sessionCookieHeader } from "@/lib/auth/session";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { assertCsrf } from "@/lib/security/csrf";

export async function POST(req: Request) {
  try {
    if (!devAuthStubEnabled()) throw new HttpError(404, "Not found");
    assertRateLimit(req, "login");
    assertCsrf(req);

    const parsed = z
      .object({
        role: z.enum(["CLIENT", "ATTORNEY"]),
        email: z.string().email(),
        name: z.string().trim().min(1).max(80).default("Dev User"),
      })
      .safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid dev-login payload");

    const { role, email, name } = parsed.data;
    const token = await createSessionToken({
      subject: `devstub|${role.toLowerCase()}:${email.toLowerCase()}`,
      role,
      email,
      name,
    });
    return new Response(JSON.stringify({ ok: true, role }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "Set-Cookie": sessionCookieHeader(token),
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
