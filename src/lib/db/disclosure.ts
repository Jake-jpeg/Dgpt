/**
 * Disclosure acknowledgments (consent records).
 *
 * - Affirmative act required: the API layer only calls this when the client
 *   explicitly acknowledged (never a preselected checkbox — see the intake UI).
 * - Stored: matter ref, user ref, disclosure version, timestamp.
 * - IP / user-agent capture is OPTIONAL and DISABLED by default
 *   (CONSENT_CAPTURE_IP_UA=true to enable).
 * - No foreign keys: consent history must survive matter purges.
 */
import { getDb, newId, nowIso } from "./index";

export interface DisclosureAckRow {
  id: string;
  matterRef: string;
  userRef: string;
  version: string;
  acknowledgedAt: string;
  ip: string | null;
  userAgent: string | null;
}

export function consentCaptureIpUaEnabled(): boolean {
  return process.env.CONSENT_CAPTURE_IP_UA === "true";
}

export async function recordDisclosureAck(opts: {
  matterRef: string;
  userRef: string;
  version: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<DisclosureAckRow> {
  const id = newId();
  const capture = consentCaptureIpUaEnabled();
  await getDb().run(
    `INSERT INTO disclosure_ack (id, matter_ref, user_ref, version, acknowledged_at, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(matter_ref, user_ref, version) DO NOTHING`,
    id,
    opts.matterRef,
    opts.userRef,
    opts.version,
    nowIso(),
    capture ? opts.ip ?? null : null,
    capture ? opts.userAgent ?? null : null
  );
  return (await getAck(opts.matterRef, opts.userRef, opts.version))!;
}

export async function getAck(
  matterRef: string,
  userRef: string,
  version: string
): Promise<DisclosureAckRow | null> {
  const r = await getDb().get(
    `SELECT * FROM disclosure_ack WHERE matter_ref = ? AND user_ref = ? AND version = ?`,
    matterRef,
    userRef,
    version
  );
  if (!r) return null;
  return {
    id: r.id as string,
    matterRef: r.matter_ref as string,
    userRef: r.user_ref as string,
    version: r.version as string,
    acknowledgedAt: r.acknowledged_at as string,
    ip: (r.ip as string | null) ?? null,
    userAgent: (r.user_agent as string | null) ?? null,
  };
}

export async function hasAcknowledged(
  matterRef: string,
  userRef: string,
  version: string
): Promise<boolean> {
  return Boolean(await getAck(matterRef, userRef, version));
}
