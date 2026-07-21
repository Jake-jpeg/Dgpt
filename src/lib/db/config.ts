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

export async function getConfigValue(key: string): Promise<string> {
  if (!ALLOWED_KEYS.has(key)) throw new Error(`VALIDATION: unknown config key ${key}`);
  const r = await getDb().get<{ value: string }>(`SELECT value FROM app_config WHERE key = ?`, key);
  return r?.value ?? DEFAULTS[key];
}

export async function getConfigNumber(key: string): Promise<number> {
  const n = Number(await getConfigValue(key));
  return Number.isFinite(n) && n > 0 ? n : Number(DEFAULTS[key]);
}

export async function setConfigValue(key: string, value: string, updatedBy: string): Promise<void> {
  if (!ALLOWED_KEYS.has(key)) {
    throw new Error(`VALIDATION: '${key}' is not an admin-configurable setting`);
  }
  await getDb().run(
    `INSERT INTO app_config (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value,
       updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    key,
    value,
    updatedBy,
    nowIso()
  );
}

export async function listConfig(): Promise<{ key: string; value: string }[]> {
  const out: { key: string; value: string }[] = [];
  for (const key of Object.values(CONFIG_KEYS)) {
    out.push({ key, value: await getConfigValue(key) });
  }
  return out;
}
