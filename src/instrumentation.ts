/**
 * Next.js instrumentation hook.
 *
 * The public root is currently an informational landing page. The underlying
 * prototype remains preserved, but placeholder copy inside the private intake
 * must not take the entire public website offline. We therefore warn at boot
 * rather than throwing. The attorney-controlled release gates remain the
 * proper place to prevent incomplete intake copy from reaching real users.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || !process.env.NEXT_RUNTIME) {
    const { assertCriticalCopyReady } = await import("@/lib/config-guard");
    try {
      assertCriticalCopyReady();
    } catch (error) {
      console.error(
        "CONFIGURATION WARNING: the private intake is not ready for public use. " +
          "The informational landing page will remain available.",
        error
      );
    }

    // Pilot hardening: the development login is LOCAL-ONLY. If either flag
    // is set outside the local stage (or in production), warn loudly at
    // startup — the flags do NOT re-enable the route (see
    // src/lib/auth/test-login.ts), but their presence indicates a
    // misconfigured environment that must be cleaned up.
    const { isLocalStage, appStage } = await import("@/config/stage");
    const devFlagsSet =
      process.env.DEV_AUTH_STUB === "true" || process.env.BETA_TEST_LOGIN === "true";
    if (devFlagsSet && (!isLocalStage() || process.env.NODE_ENV === "production")) {
      console.warn(
        `⚠ STARTUP WARNING: DEV_AUTH_STUB/BETA_TEST_LOGIN is set but APP_STAGE=` +
          `${appStage()} / NODE_ENV=${process.env.NODE_ENV}. The development ` +
          `login stays DISABLED outside local development — remove these ` +
          `flags from this environment.`
      );
    }
  }
}
