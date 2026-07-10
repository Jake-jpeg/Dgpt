/**
 * Next.js instrumentation hook — runs once at server start.
 * Enforces the ship-blocker config guard: a production server will not boot
 * while the DV exit card still contains placeholder copy.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || !process.env.NEXT_RUNTIME) {
    const { assertCriticalCopyReady } = await import("@/lib/config-guard");
    assertCriticalCopyReady();
  }
}
