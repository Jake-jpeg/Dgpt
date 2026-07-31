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
import {
  readIntakeLock,
  lockIntake,
  reopenIntake,
  ATTORNEY_LOCK_REASONS,
  LOCK_REASONS,
  type LockReason,
} from "@/lib/intake/lock";

const schema = z.object({
  action: z.enum(["LOCK", "REOPEN"]),
  // Required on LOCK: the attorney cites WHY, because they are the one who
  // has to say it out loud when they call the client (operator, 2026-07-31).
  reason: z.string().trim().optional(),
  note: z.string().trim().max(300).optional(),
});

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = await requireMatterAccess(authed, id);
    return Response.json({
      lock: await readIntakeLock(matter.id),
      // The picker the attorney chooses from when locking by hand.
      reasons: ATTORNEY_LOCK_REASONS.map((r) => ({ code: r, label: LOCK_REASONS[r].label })),
    });
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

    let lock;
    if (action === "LOCK") {
      const reason = parsed.data.reason ?? "";
      if (!(ATTORNEY_LOCK_REASONS as readonly string[]).includes(reason)) {
        throw new HttpError(
          400,
          `VALIDATION: cite a reason — one of ${ATTORNEY_LOCK_REASONS.join(", ")}`
        );
      }
      lock = await lockIntake({
        matterId: matter.id,
        actingUserId: authed.account.id,
        reason: reason as LockReason,
        note,
      });
    } else {
      lock = await reopenIntake({ matterId: matter.id, actingUserId: authed.account.id, note });
    }

    return Response.json({ lock });
  } catch (e) {
    return errorResponse(e);
  }
}
