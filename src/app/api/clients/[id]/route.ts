/**
 * Decline (delete) a client registration — ATTORNEY only (2026-07-26).
 * Only a SHELL can be declined here: a CLIENT account with zero case data
 * (no matter, no sessions, no submissions). A client with case history is
 * managed through their matter (danger zone) or the admin console — this
 * route will not silently destroy case data.
 */
import { requireUser } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getUserById, countUserReferences } from "@/lib/db/users";
import { getDb } from "@/lib/db/index";
import { recordAudit } from "@/lib/db/repo";
import { hashNameForAudit } from "@/lib/security/audit-hash";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY"]);
    const { id } = await ctx.params;
    const target = await getUserById(id);
    if (!target) throw new HttpError(404, "Registration not found");
    if (target.role !== "CLIENT") {
      throw new HttpError(409, "Only client registrations can be declined here.");
    }
    if ((await countUserReferences(target)) > 0) {
      throw new HttpError(
        409,
        "This client has case data. Delete their matter (danger zone) instead."
      );
    }
    await getDb().run(`DELETE FROM app_user WHERE id = ?`, id);
    await recordAudit(
      id,
      "CLIENT_DECLINED",
      `subjectHash=${hashNameForAudit(target.email)}`,
      authed.account.id
    );
    return Response.json({ declined: true });
  } catch (e) {
    return errorResponse(e);
  }
}
