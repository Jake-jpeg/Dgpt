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

    if (
      process.env.BETA_TEST_LOGIN === "true" &&
      process.env.NODE_ENV === "production"
    ) {
      console.warn(
        "BETA_TEST_LOGIN is enabled in production. Closed testing only; " +
          "remove this flag before opening the intake application."
      );
    }
  }
}
