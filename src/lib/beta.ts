/**
 * Beta access gate.
 *
 * Design (locked with Jake): the gate is active whenever FREE_ACCESS_KEYS is
 * non-empty. Visitors clear a CAPTCHA (Cloudflare Turnstile, skipped if not
 * configured), then enter an access key. The KEY ITSELF is stored in an
 * httpOnly cookie and re-validated against FREE_ACCESS_KEYS on EVERY request
 * in middleware — so the cookie can live effectively forever, but removing a
 * key from the env var locks out everyone who used it instantly.
 *
 * The key unlocks the door; it is not a login. Google/Microsoft sign-in
 * still governs identity behind the gate.
 *
 * This module is edge-safe (pure env reads, no Node APIs) so middleware can
 * import it.
 */

export const BETA_COOKIE = "dgpt_beta_key";

export function betaKeys(): string[] {
  return (process.env.FREE_ACCESS_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

export function betaGateEnabled(): boolean {
  return betaKeys().length > 0;
}

export function isValidBetaKey(key: string | undefined | null): boolean {
  if (!key) return false;
  return betaKeys().includes(key.trim());
}

/** Paths reachable WITHOUT clearing the beta gate. */
export function betaGateExempt(pathname: string): boolean {
  return (
    pathname === "/beta" ||
    pathname.startsWith("/api/beta/") ||
    // Machine endpoint with its own bearer auth (retention cron must keep working).
    pathname === "/api/admin/purge"
  );
}

export function turnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}

export function betaCookieHeader(key: string, secure: boolean): string {
  const parts = [
    `${BETA_COOKIE}=${encodeURIComponent(key.trim())}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    // Effectively perpetual (1 year, renewed on re-entry). Revocation happens
    // by removing the key from FREE_ACCESS_KEYS, which takes effect on the
    // very next request — not by cookie expiry.
    `Max-Age=${60 * 60 * 24 * 365}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
