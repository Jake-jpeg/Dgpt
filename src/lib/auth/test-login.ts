/**
 * Test sign-in availability — see src/app/api/auth/dev-login/route.ts for
 * the full policy. Two paths:
 *   1. Dev auth stub: non-production only (DEV_AUTH_STUB=true).
 *   2. Beta test login: production closed testing — requires the explicit
 *      BETA_TEST_LOGIN=true flag, an active beta gate (FREE_ACCESS_KEYS),
 *      AND a request that already carries a valid beta-key cookie.
 *
 * ⚠ Remove BETA_TEST_LOGIN before opening the site to the public: while it
 * is on, beta-key holders can sign in as any email (identity unverified).
 */
import { devAuthStubEnabled } from "@/lib/env";
import { betaGateEnabled, isValidBetaKey, BETA_COOKIE } from "@/lib/beta";
import { parseCookies } from "@/lib/auth/session";

export function testLoginAllowed(req: Request): boolean {
  if (devAuthStubEnabled()) return true;
  if (process.env.BETA_TEST_LOGIN !== "true") return false;
  if (!betaGateEnabled()) return false;
  const raw = parseCookies(req)[BETA_COOKIE];
  return isValidBetaKey(raw ? decodeURIComponent(raw) : raw);
}
