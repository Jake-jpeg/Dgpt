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

/**
 * Public launch is an explicit act: PUBLIC_LAUNCH=true in the deployment.
 * Nothing else opens the front door.
 */
export function publicLaunch(): boolean {
  return process.env.PUBLIC_LAUNCH === "true";
}

/**
 * THE FRONT DOOR IS LOCKED (operator, 2026-10-30: "the front door is going
 * to need an access key to access, period" — June is up front, and the site
 * opens to the public only after the operator has run it himself).
 *
 *   • Production: the gate is ON unless PUBLIC_LAUNCH=true. No flag can turn
 *     it off by omission. With no FREE_ACCESS_KEYS configured the gate still
 *     stands and nobody gets in (fail CLOSED) — an empty key list is never
 *     an open site.
 *   • Elsewhere (dev, tests): the legacy BETA_GATE_ENABLED=true flag turns
 *     it on, so local work and the suite stay open by default.
 *
 * The invited spouse's /join/<token> link remains exempt: the single-use,
 * email-bound link IS the firm's access grant and sets the key cookie.
 */
export function betaGateEnabled(): boolean {
  if (publicLaunch()) return false;
  if (process.env.NODE_ENV === "production") return true;
  return process.env.BETA_GATE_ENABLED === "true";
}

export function isValidBetaKey(key: string | undefined | null): boolean {
  if (!key) return false;
  return betaKeys().includes(key.trim());
}

/** Paths reachable WITHOUT clearing the beta gate. */
export function betaGateExempt(pathname: string): boolean {
  return (
    pathname === "/beta" ||
    // 2026-11-07: the firm's articles are public information — nothing of
    // June's, no sign-in, no case. The door itself stays locked.
    pathname === "/blog" ||
    pathname.startsWith("/blog/") ||
    pathname === "/forms" ||
    pathname === "/api/guide" ||
    // 2026-11-07: sign-up is how the public gets in — the page, its API, and
    // the OAuth round-trip it needs. The door (/portal, /start, the case)
    // stays behind the key; a signed-up reader without the key still cannot
    // reach it.
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname === "/api/signup" ||
    // 2026-11-12: static brand marks (the Google sign-in mark) — the public
    // sign-up and join pages show the button to people without the key.
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/api/auth/login/") ||
    pathname.startsWith("/api/auth/callback/") ||
    pathname === "/api/auth/me" ||
    pathname === "/api/auth/logout" ||
    // 2026-10-30: the invited spouse has no access key — the single-use
    // link they were sent IS their access. The join page and its API are
    // reachable without the beta cookie; everything after sign-in is not.
    pathname === "/join" ||
    pathname.startsWith("/join/") ||
    pathname.startsWith("/api/join/") ||
    pathname.startsWith("/api/beta/") ||
    // Machine endpoint with its own bearer auth (retention cron must keep working).
    pathname === "/api/admin/purge" ||
    // Boolean-only deployment health check (no session, no client data).
    pathname === "/api/health" ||
    // Staging acceptance: neutral 404 outside synthetic staging and
    // bearer-authorized (constant-time) inside it — its own gate is stricter.
    pathname === "/api/staging/acceptance"
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
