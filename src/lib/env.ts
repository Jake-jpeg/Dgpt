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

export function envOptional(name: string): string | undefined {
  const v = process.env[name];
  return v === "" ? undefined : v;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Dev auth stub: opt-in via env AND structurally impossible in production. */
export function devAuthStubEnabled(): boolean {
  return process.env.DEV_AUTH_STUB === "true" && !isProduction();
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
