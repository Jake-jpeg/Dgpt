/**
 * Test sign-in availability — LOCAL DEVELOPMENT ONLY (pilot hardening).
 *
 * The development login exists only when ALL of these hold:
 *   1. APP_STAGE is "local" (unset/unknown counts as local);
 *   2. NODE_ENV is not "production";
 *   3. DEV_AUTH_STUB=true.
 *
 * In production, staging, or the closed pilot the route answers a neutral
 * 404, the UI shows no test accounts (it keys off this same check via
 * /api/auth/me), and nothing seeds synthetic credentials automatically.
 * Setting DEV_AUTH_STUB or the legacy BETA_TEST_LOGIN outside local
 * triggers a loud startup warning (src/instrumentation.ts) and still does
 * NOT enable the route.
 *
 * The legacy beta-era production test login (BETA_TEST_LOGIN) is retired:
 * no combination of flags exposes a test sign-in outside local development.
 */
import { devAuthStubEnabled } from "@/lib/env";
import { isLocalStage } from "@/config/stage";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- request kept for call-site compatibility
export function testLoginAllowed(_req?: Request): boolean {
  return isLocalStage() && devAuthStubEnabled();
}
