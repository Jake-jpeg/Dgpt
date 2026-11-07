/** The firm's sign-up list (2026-11-07): who signed up, name and number; clear or reject after the conflict check. ATTORNEY/ADMIN. */
import { z } from "zod";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { requireUser } from "@/lib/auth/authz";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { listSignups, setSignupStatus } from "@/lib/db/signups";

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["ATTORNEY", "ADMIN"]);
    const rows = await listSignups(authed.account.role === "ADMIN" ? null : authed.account.firmId ?? "firm_default");
    return Response.json({
      signups: rows.map((s) => ({ userId: s.userId, fullName: s.fullName, phone: s.phoneDisplay, email: s.email ?? "", status: s.status, notes: s.notes, signedUpAt: s.createdAt, statusAt: s.statusAt, disclaimerVersion: s.disclaimerVersion })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

const schema = z.object({ userId: z.string().min(1), status: z.enum(["NEW", "CLEARED", "REJECTED"]), notes: z.string().max(500).optional() });

export async function PUT(req: Request) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY", "ADMIN"]);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid status change");
    const s = await setSignupStatus(parsed.data.userId, parsed.data.status, authed.account.id, parsed.data.notes);
    return Response.json({ signup: { userId: s.userId, status: s.status, notes: s.notes, statusAt: s.statusAt } });
  } catch (e) {
    return errorResponse(e);
  }
}
