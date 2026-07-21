/**
 * TEST SIGN-IN — testing without real OAuth credentials. Two distinct paths:
 *
 * 1. DEV AUTH STUB (non-production only): DEV_AUTH_STUB=true and NODE_ENV is
 *    not "production". Unchanged.
 *
 * 2. BETA TEST LOGIN (production, closed testing only): ALL of —
 *      a. BETA_TEST_LOGIN=true set explicitly in the environment, AND
 *      b. the beta access gate is up (FREE_ACCESS_KEYS non-empty), AND
 *      c. the caller has ALREADY cleared the gate (valid beta-key cookie).
 *    A production deployment with the gate off never exposes this endpoint,
 *    no matter what flags are set.
 *
 *    ⚠ While BETA_TEST_LOGIN is on, anyone holding a beta key can sign in as
 *    any email — identity is NOT verified. Closed testing with synthetic
 *    data only. Remove the flag before opening the site.
 *
 * Attorney test-logins still must pass the ATTORNEY_EMAILS allowlist, so the
 * RBAC path exercised here is the same one used with real OAuth.
 */
import { z } from "zod";
import { testLoginAllowed } from "@/lib/auth/test-login";
import { createSessionToken, sessionCookieHeader } from "@/lib/auth/session";
import { recordAudit } from "@/lib/db/repo";
import { hashNameForAudit } from "@/lib/security/audit-hash";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { assertCsrf } from "@/lib/security/csrf";

export async function POST(req: Request) {
  try {
    if (!testLoginAllowed(req)) throw new HttpError(404, "Not found");
    assertRateLimit(req, "login");
    assertCsrf(req);

    const parsed = z
      .object({
        // All four roles accepted for LOCAL testing. The session role is a
        // hint only: authorization re-reads app_user.role, and STAFF/ADMIN
        // are never self-provisioned from a session token — those rows must
        // already exist (seeded or admin-created) and bind by email.
        role: z.enum(["CLIENT", "STAFF", "ATTORNEY", "ADMIN"]),
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
    (await recordAudit("auth", "AUTH_LOGIN", `mode=test subjectHash=${hashNameForAudit(email)}`));
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
