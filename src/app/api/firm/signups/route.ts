/**
 * The firm's sign-up list (2026-11-07): who signed up, name and number; clear
 * or reject after the conflict check. ATTORNEY/ADMIN.
 *
 * 2026-11-08 — the operator's admin portal: the ADMIN (the software company,
 * admin@…) additionally sees the sign-up and last sign-in addresses and can
 * BAN / UNBAN an account. A ban deactivates the account: every open session
 * is refused on its next request and the login callback refuses it by name.
 * Attorneys see names, numbers and status only — the conflict check is
 * theirs; the platform's abuse controls are not.
 */
import { z } from "zod";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { requireUser } from "@/lib/auth/authz";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { listSignups, setSignupStatus } from "@/lib/db/signups";
import { banUser, unbanUser } from "@/lib/db/users";
import { recordAudit } from "@/lib/db/repo";

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["ATTORNEY", "ADMIN"]);
    const admin = authed.account.role === "ADMIN";
    const rows = await listSignups(admin ? null : authed.account.firmId ?? "firm_default");
    return Response.json({
      admin,
      signups: rows.map((s) => ({
        userId: s.userId,
        fullName: s.fullName,
        phone: s.phoneDisplay,
        email: s.email ?? "",
        status: s.status,
        notes: s.notes,
        signedUpAt: s.createdAt,
        statusAt: s.statusAt,
        disclaimerVersion: s.disclaimerVersion,
        banned: Boolean(s.bannedAt),
        ...(admin
          ? {
              signupIp: s.signupIp,
              lastLoginIp: s.lastLoginIp ?? null,
              lastLoginAt: s.lastLoginAt ?? null,
              banReason: s.banReason ?? null,
              bannedAt: s.bannedAt ?? null,
            }
          : {}),
      })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

const statusSchema = z.object({ userId: z.string().min(1), status: z.enum(["NEW", "CLEARED", "REJECTED"]), notes: z.string().max(500).optional() });
const banSchema = z.object({ userId: z.string().min(1), action: z.enum(["BAN", "UNBAN"]), reason: z.string().max(500).optional() });

export async function PUT(req: Request) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY", "ADMIN"]);
    const body = await req.json().catch(() => null);

    const ban = banSchema.safeParse(body);
    if (ban.success) {
      if (authed.account.role !== "ADMIN") throw new HttpError(403, "Only the platform administrator can ban or unban accounts");
      if (ban.data.userId === authed.account.id) throw new HttpError(400, "VALIDATION: you cannot ban yourself");
      let u;
      try {
        u = ban.data.action === "BAN" ? await banUser(ban.data.userId, authed.account.id, ban.data.reason ?? "") : await unbanUser(ban.data.userId);
      } catch (e) {
        throw new HttpError(400, e instanceof Error ? e.message : "Could not update the account");
      }
      await recordAudit("auth", ban.data.action === "BAN" ? "ACCOUNT_BANNED" : "ACCOUNT_UNBANNED", `user=${u.id}`, authed.account.id);
      return Response.json({ user: { userId: u.id, active: u.active, banned: Boolean(u.bannedAt), banReason: u.banReason } });
    }

    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid status change");
    const s = await setSignupStatus(parsed.data.userId, parsed.data.status, authed.account.id, parsed.data.notes);
    return Response.json({ signup: { userId: s.userId, status: s.status, notes: s.notes, statusAt: s.statusAt } });
  } catch (e) {
    return errorResponse(e);
  }
}
