/**
 * Role / activation management for a single user — ADMIN only.
 * Deactivation is preferred over deletion (nothing is hard-deleted here).
 */
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { clearUserSubject, getUserById, setUserActive, setUserRole } from "@/lib/db/users";
import { recordAudit } from "@/lib/db/repo";

const patchSchema = z
  .object({
    role: z.enum(["CLIENT", "STAFF", "ATTORNEY", "ADMIN"]).optional(),
    active: z.boolean().optional(),
    /**
     * Manual account recovery/relink (docs/ACCOUNT-RECOVERY.md): after
     * firm-side identity verification, clear the stored provider subject so
     * the user's next sign-in re-binds by email. Always audited.
     */
    clearSubject: z.literal(true).optional(),
  })
  .refine((v) => v.role !== undefined || v.active !== undefined || v.clearSubject, {
    message: "nothing to update",
  });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const { account } = await requireAdmin(req);
    const { id } = await ctx.params;
    const target = getUserById(id);
    if (!target) throw new HttpError(404, "User not found");

    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid patch");

    if (parsed.data.role !== undefined && parsed.data.role !== target.role) {
      setUserRole(id, parsed.data.role);
      recordAudit(
        id,
        "USER_ROLE_CHANGED",
        JSON.stringify({ from: target.role, to: parsed.data.role }),
        account.id
      );
    }
    if (parsed.data.active !== undefined && parsed.data.active !== target.active) {
      setUserActive(id, parsed.data.active);
      recordAudit(
        id,
        parsed.data.active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        undefined,
        account.id
      );
    }
    if (parsed.data.clearSubject) {
      clearUserSubject(id);
      recordAudit(id, "USER_RELINK_AUTHORIZED", "subject cleared for re-bind", account.id);
    }
    const updated = getUserById(id)!;
    return Response.json({
      user: { id: updated.id, email: updated.email, role: updated.role, active: updated.active },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
