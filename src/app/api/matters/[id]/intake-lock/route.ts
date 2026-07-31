/**
 * Intake lock / reopen — ATTORNEY ONLY (operator directive 2026-07-31).
 *
 * GET  → current lock state for the firm matter page.
 * POST { action: "LOCK" | "REOPEN", note? } → flip it.
 *
 * STAFF can read but cannot flip: reopening a client past a domestic-violence
 * or children gate is a licensed judgment, so it carries an attorney's name
 * in the audit trail and nobody else's.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { readIntakeLock, lockIntake, reopenIntake } from "@/lib/intake/lock";

const schema = z.object({
  action: z.enum(["LOCK", "REOPEN"]),
  note: z.string().trim().max(300).optional(),
});

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = await requireMatterAccess(authed, id);
    return Response.json({ lock: await readIntakeLock(matter.id) });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = await requireMatterAccess(authed, id);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: action must be LOCK or REOPEN");
    const { action, note } = parsed.data;

    const lock =
      action === "LOCK"
        ? await lockIntake({ matterId: matter.id, actingUserId: authed.account.id, note })
        : await reopenIntake({ matterId: matter.id, actingUserId: authed.account.id, note });

    return Response.json({ lock });
  } catch (e) {
    return errorResponse(e);
  }
}
