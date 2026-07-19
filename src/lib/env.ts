/**
 * Environment access. Read at call time (not import time) so tests can set
 * values in setup files. No secrets are ever hardcoded — see .env.example.
 */

export function env(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v !== undefined && v !== "") return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

/**
 * Optional environment value, TRIMMED. Deployment consoles and copy/paste
 * routinely append a trailing newline or stray spaces to a pasted secret;
 * untrimmed, that whitespace reaches an HTTP header and makes fetch() throw.
 * Whitespace-only is treated as unset.
 */
export function envOptional(name: string): string | undefined {
  const v = process.env[name];
  if (v === undefined) return undefined;
  const trimmed = v.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Dev auth stub: opt-in via env AND structurally impossible in production. */
export function devAuthStubEnabled(): boolean {
  return process.env.DEV_AUTH_STUB === "true" && !isProduction();
}

/**
 * ADMIN bootstrap/recovery ONLY (narrow scope by design): lets a listed
 * account self-provision the ADMIN role at first login. Ordinary role
 * management lives in the app_user table via the admin API.
 */
export function adminBootstrapEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function attorneyEmailAllowlist(): string[] {
  return (process.env.ATTORNEY_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function appUrl(): string {
  return env("APP_URL", "http://localhost:3000").replace(/\/$/, "");
}

export function retentionAbandonedDays(): number {
  const n = Number(process.env.RETENTION_ABANDONED_DAYS ?? "14");
  return Number.isFinite(n) && n > 0 ? n : 14;
}
