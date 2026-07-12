/**
 * Admin-managed configuration (app_config table).
 *
 * DELIBERATE LIMIT: only the allowlisted keys below are settable. Attorney-
 * only rules (conflict dispositions, approval, release) have NO
 * configuration surface at all — an ADMIN cannot weaken them from here or
 * anywhere else.
 *
 * Retention periods are configuration, not code: final firm policy values
 * are [COUNSEL REVIEW REQUIRED] and the defaults below are provisional
 * development values only.
 */
import { getDb, nowIso } from "./index";

export const CONFIG_KEYS = {
  /** Days of inactivity before a PROSPECTIVE (never engaged) matter's content may purge. */
  RETENTION_PROSPECTIVE_DAYS: "retention.prospective_days",
  /** Days of inactivity before an ABANDONED matter's content may purge. */
  RETENTION_ABANDONED_DAYS: "retention.abandoned_days",
  /** Master switch for the automated retention sweep. */
  RETENTION_SWEEP_ENABLED: "retention.sweep_enabled",
} as const;

const ALLOWED_KEYS = new Set<string>(Object.values(CONFIG_KEYS));

const DEFAULTS: Record<string, string> = {
  [CONFIG_KEYS.RETENTION_PROSPECTIVE_DAYS]: "30", // [COUNSEL REVIEW REQUIRED]
  [CONFIG_KEYS.RETENTION_ABANDONED_DAYS]: "14", // [COUNSEL REVIEW REQUIRED]
  [CONFIG_KEYS.RETENTION_SWEEP_ENABLED]: "true",
};

export function getConfigValue(key: string): string {
  if (!ALLOWED_KEYS.has(key)) throw new Error(`VALIDATION: unknown config key ${key}`);
  const r = getDb()
    .prepare(`SELECT value FROM app_config WHERE key = ?`)
    .get(key) as { value: string } | undefined;
  return r?.value ?? DEFAULTS[key];
}

export function getConfigNumber(key: string): number {
  const n = Number(getConfigValue(key));
  return Number.isFinite(n) && n > 0 ? n : Number(DEFAULTS[key]);
}

export function setConfigValue(key: string, value: string, updatedBy: string): void {
  if (!ALLOWED_KEYS.has(key)) {
    throw new Error(`VALIDATION: '${key}' is not an admin-configurable setting`);
  }
  getDb()
    .prepare(
      `INSERT INTO app_config (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value,
         updated_by = excluded.updated_by, updated_at = excluded.updated_at`
    )
    .run(key, value, updatedBy, nowIso());
}

export function listConfig(): { key: string; value: string }[] {
  return Object.values(CONFIG_KEYS).map((key) => ({ key, value: getConfigValue(key) }));
}
