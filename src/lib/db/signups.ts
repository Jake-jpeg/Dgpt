/** Sign-up profiles (2026-11-07): name + phone + acknowledged disclaimers; the firm clears or rejects. */
import { getDb, nowIso } from "./index";
import { recordAudit } from "./repo";
import { DEFAULT_FIRM_ID } from "./matters";

export type SignupStatus = "NEW" | "CLEARED" | "REJECTED";

export interface SignupRow {
  userId: string;
  firmId: string | null;
  fullName: string;
  phone: string;
  phoneDisplay: string;
  disclaimerVersion: string;
  acknowledgedAt: string;
  status: SignupStatus;
  statusBy: string | null;
  statusAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  /** joined */
  email?: string;
}

function rowToSignup(r: Record<string, unknown>): SignupRow {
  return {
    userId: r.user_id as string,
    firmId: (r.firm_id as string | null) ?? null,
    fullName: r.full_name as string,
    phone: r.phone as string,
    phoneDisplay: r.phone_display as string,
    disclaimerVersion: r.disclaimer_version as string,
    acknowledgedAt: r.acknowledged_at as string,
    status: (r.status as SignupStatus) ?? "NEW",
    statusBy: (r.status_by as string | null) ?? null,
    statusAt: (r.status_at as string | null) ?? null,
    notes: (r.notes as string) ?? "",
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    email: (r.email as string | undefined) ?? undefined,
  };
}

export async function getSignup(userId: string): Promise<SignupRow | null> {
  const r = await getDb().get(`SELECT * FROM signup_profile WHERE user_id = ?`, userId);
  return r ? rowToSignup(r) : null;
}

export async function upsertSignup(opts: { userId: string; fullName: string; phone: string; phoneDisplay: string; disclaimerVersion: string; firmId?: string }): Promise<SignupRow> {
  const t = nowIso();
  const existing = await getSignup(opts.userId);
  if (existing) {
    await getDb().run(
      `UPDATE signup_profile SET full_name = ?, phone = ?, phone_display = ?, disclaimer_version = ?, acknowledged_at = ?, updated_at = ? WHERE user_id = ?`,
      opts.fullName.trim(),
      opts.phone,
      opts.phoneDisplay,
      opts.disclaimerVersion,
      t,
      t,
      opts.userId
    );
  } else {
    await getDb().run(
      `INSERT INTO signup_profile (user_id, firm_id, full_name, phone, phone_display, disclaimer_version, acknowledged_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      opts.userId,
      opts.firmId ?? DEFAULT_FIRM_ID,
      opts.fullName.trim(),
      opts.phone,
      opts.phoneDisplay,
      opts.disclaimerVersion,
      t,
      t,
      t
    );
  }
  await recordAudit("auth", existing ? "SIGNUP_UPDATED" : "SIGNUP_COMPLETED", `disclaimers=${opts.disclaimerVersion}`, opts.userId);
  return (await getSignup(opts.userId))!;
}

export async function listSignups(firmId: string | null): Promise<SignupRow[]> {
  const rows = firmId
    ? await getDb().all<Record<string, unknown>>(
        `SELECT sp.*, u.email FROM signup_profile sp JOIN app_user u ON u.id = sp.user_id WHERE sp.firm_id = ? OR (sp.firm_id IS NULL AND ? = ?) ORDER BY sp.created_at DESC`,
        firmId,
        firmId,
        DEFAULT_FIRM_ID
      )
    : await getDb().all<Record<string, unknown>>(`SELECT sp.*, u.email FROM signup_profile sp JOIN app_user u ON u.id = sp.user_id ORDER BY sp.created_at DESC`);
  return rows.map(rowToSignup);
}

export async function setSignupStatus(userId: string, status: SignupStatus, actingUserId: string, notes?: string): Promise<SignupRow> {
  const t = nowIso();
  await getDb().run(
    `UPDATE signup_profile SET status = ?, status_by = ?, status_at = ?, notes = COALESCE(?, notes), updated_at = ? WHERE user_id = ?`,
    status,
    actingUserId,
    t,
    notes ?? null,
    t,
    userId
  );
  await recordAudit("auth", `SIGNUP_${status}`, `user=${userId}`, actingUserId);
  return (await getSignup(userId))!;
}

/** The guide is for signed-up readers the firm has not rejected. */
export async function mayUseGuide(userId: string): Promise<{ ok: boolean; reason: "NO_SIGNUP" | "REJECTED" | null }> {
  const s = await getSignup(userId);
  if (!s) return { ok: false, reason: "NO_SIGNUP" };
  if (s.status === "REJECTED") return { ok: false, reason: "REJECTED" };
  return { ok: true, reason: null };
}
