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
  /** Address the sign-up was completed from (2026-11-08; null when the proxy sent none). */
  signupIp: string | null;
  createdAt: string;
  updatedAt: string;
  /** joined from app_user */
  email?: string;
  active?: boolean;
  bannedAt?: string | null;
  banReason?: string | null;
  lastLoginIp?: string | null;
  lastLoginAt?: string | null;
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
    signupIp: (r.signup_ip as string | null) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    email: (r.email as string | undefined) ?? undefined,
    active: r.active === undefined ? undefined : r.active === 1,
    bannedAt: (r.banned_at as string | null | undefined) ?? null,
    banReason: (r.ban_reason as string | null | undefined) ?? null,
    lastLoginIp: (r.last_login_ip as string | null | undefined) ?? null,
    lastLoginAt: (r.last_login_at as string | null | undefined) ?? null,
  };
}

export async function getSignup(userId: string): Promise<SignupRow | null> {
  const r = await getDb().get(`SELECT * FROM signup_profile WHERE user_id = ?`, userId);
  return r ? rowToSignup(r) : null;
}

export async function upsertSignup(opts: { userId: string; fullName: string; phone: string; phoneDisplay: string; disclaimerVersion: string; firmId?: string; ip?: string | null }): Promise<SignupRow> {
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
      `INSERT INTO signup_profile (user_id, firm_id, full_name, phone, phone_display, disclaimer_version, acknowledged_at, signup_ip, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      opts.userId,
      opts.firmId ?? DEFAULT_FIRM_ID,
      opts.fullName.trim(),
      opts.phone,
      opts.phoneDisplay,
      opts.disclaimerVersion,
      t,
      opts.ip ?? null,
      t,
      t
    );
  }
  await recordAudit("auth", existing ? "SIGNUP_UPDATED" : "SIGNUP_COMPLETED", `disclaimers=${opts.disclaimerVersion}`, opts.userId);
  return (await getSignup(opts.userId))!;
}

const JOINED = `SELECT sp.*, u.email, u.active, u.banned_at, u.ban_reason, u.last_login_ip, u.last_login_at FROM signup_profile sp JOIN app_user u ON u.id = sp.user_id`;

export async function listSignups(firmId: string | null): Promise<SignupRow[]> {
  const rows = firmId
    ? await getDb().all<Record<string, unknown>>(
        `${JOINED} WHERE sp.firm_id = ? OR (sp.firm_id IS NULL AND ? = ?) ORDER BY sp.created_at DESC`,
        firmId,
        firmId,
        DEFAULT_FIRM_ID
      )
    : await getDb().all<Record<string, unknown>>(`${JOINED} ORDER BY sp.created_at DESC`);
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

/**
 * Every CLIENT account (2026-11-12, operator: "I don't see a list of people
 * who made a user account"). A sign-in alone creates the account; the
 * sign-up (name, number, notices) may never follow. The admin sees both
 * kinds — one list, the sign-up columns empty until they finish.
 */
export interface ClientAccountRow {
  userId: string;
  email: string;
  name: string;
  active: boolean;
  bannedAt: string | null;
  banReason: string | null;
  lastLoginIp: string | null;
  lastLoginAt: string | null;
  accountCreatedAt: string;
  signup: SignupRow | null;
}

export async function listClientAccounts(): Promise<ClientAccountRow[]> {
  const rows = await getDb().all<Record<string, unknown>>(
    `SELECT u.id AS u_id, u.email AS u_email, u.name AS u_name, u.active AS u_active, u.banned_at AS u_banned_at, u.ban_reason AS u_ban_reason,
            u.last_login_ip AS u_last_login_ip, u.last_login_at AS u_last_login_at, u.created_at AS u_created_at, sp.*
       FROM app_user u LEFT JOIN signup_profile sp ON sp.user_id = u.id
      WHERE u.role = 'CLIENT'
      ORDER BY u.created_at DESC`
  );
  return rows.map((r) => ({
    userId: r.u_id as string,
    email: r.u_email as string,
    name: (r.u_name as string) ?? "",
    active: r.u_active === 1,
    bannedAt: (r.u_banned_at as string | null) ?? null,
    banReason: (r.u_ban_reason as string | null) ?? null,
    lastLoginIp: (r.u_last_login_ip as string | null) ?? null,
    lastLoginAt: (r.u_last_login_at as string | null) ?? null,
    accountCreatedAt: r.u_created_at as string,
    signup: r.user_id ? rowToSignup({ ...r, email: r.u_email }) : null,
  }));
}
