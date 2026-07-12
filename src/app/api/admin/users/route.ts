/**
 * User management — ADMIN only.
 *
 * ADMIN may manage users and roles here. ADMIN may NOT clear/decline
 * conflicts or approve/release documents: those actions live behind
 * structural attorney-only guards in the persistence layer, so nothing an
 * admin can do through this (or any) endpoint weakens them.
 */
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { createUser, getUserByEmail, listUsers, USER_ROLES } from "@/lib/db/users";
import { recordAudit } from "@/lib/db/repo";

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    await requireAdmin(req);
    return Response.json({
      users: listUsers().map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        active: u.active,
        createdAt: u.createdAt,
      })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

const createSchema = z.object({
  email: z.string().trim().email().max(200),
  name: z.string().trim().max(120).optional(),
  role: z.enum(["CLIENT", "STAFF", "ATTORNEY", "ADMIN"]),
});

export async function POST(req: Request) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const { account } = await requireAdmin(req);
    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid user payload");
    if (!USER_ROLES.includes(parsed.data.role)) {
      throw new HttpError(400, "VALIDATION: unknown role");
    }
    if (getUserByEmail(parsed.data.email)) {
      throw new HttpError(409, "A user with this email already exists");
    }
    const user = createUser(parsed.data);
    recordAudit(
      user.id,
      "USER_CREATED",
      JSON.stringify({ role: user.role }),
      account.id
    );
    return Response.json(
      { user: { id: user.id, email: user.email, role: user.role, active: user.active } },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}
