/**
 * Single-matter view, shaped by role:
 *  - CLIENT: plain-language status only. Never internal notes, never
 *    conflict reasoning, never unreleased work product.
 *  - STAFF/ATTORNEY (with a grant): working view.
 * 404 for anyone else — existence is never leaked.
 */
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { deleteMatterCascade } from "@/lib/db/matters";
import { recordAudit } from "@/lib/db/repo";
import { errorResponse } from "@/lib/auth/rbac";
import { readIntakeLock } from "@/lib/intake/lock";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { listSessionsByMatter } from "@/lib/db/repo";
import { clientMatterStatus } from "@/lib/matters/client-view";
import { listInfoRequests } from "@/lib/db/matter-workflow";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["CLIENT", "STAFF", "ATTORNEY", "ADMIN"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));

    if (authed.account.role === "CLIENT") {
      // Plain-language view only: open requested items and the client's own
      // intake session (the chat rides it). No internal notes, no conflict
      // machinery, no unreleased work product.
      const openRequests = (await listInfoRequests(matter.id))
        .filter((r) => r.status === "OPEN")
        .map((r) => ({ id: r.id, label: r.label, createdAt: r.createdAt }));
      const ownSession = (await listSessionsByMatter(matter.id)).find(
        (s) => s.ownerSubject === authed.account.subject
      );
      return Response.json({
        matter: {
          id: matter.id,
          status: clientMatterStatus(matter),
          canProceed:
            matter.conflictStatus === "CLEARED" || matter.conflictStatus === "EXTERNAL",
          intakeSessionId: ownSession?.id ?? null,
          requestedItems: openRequests,
          helpAvailable: true,
          helpLabel: "I need help completing this intake.",
        },
      });
    }

    return Response.json({
      matter: {
        id: matter.id,
        label: matter.label,
        lifecycle: matter.lifecycle,
        conflictStatus: matter.conflictStatus,
        conflictStatusSetBy: matter.conflictStatusSetBy,
        conflictStatusSetAt: matter.conflictStatusSetAt,
        legalHold: matter.legalHold,
        clientUserId: matter.clientUserId,
        expectedClientEmail: matter.expectedClientEmail,
        createdAt: matter.createdAt,
        updatedAt: matter.updatedAt,
        sessions: (await listSessionsByMatter(matter.id)).map((s) => ({
          id: s.id,
          state: s.state,
          tier: s.tier,
          updatedAt: s.updatedAt,
        })),
        // A locked-out client is the single most urgent thing on a matter and
        // used to be invisible: the session sits at its gate state, which the
        // matter list labels "Scope questions" exactly like a client who is
        // merely mid-interview (2026-07-31). REASON CODE ONLY — never the
        // client's words.
        intakeLock: await readIntakeLock(matter.id),
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

/**
 * ATTORNEY matter deletion (2026-07-22 operator directive: the lawyer runs
 * their own book — deletion is not admin-only). Cascades everything the
 * matter owns (see deleteMatterCascade); the tamper-evident audit trail is
 * retained, and the deletion itself is audited with metadata only. An
 * orphaned CLIENT account (no other case data) is removed with it.
 * LEGAL HOLD is absolute: a held matter cannot be deleted by anyone.
 */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = await requireMatterAccess(authed, id);
    if (matter.legalHold) {
      throw new HttpError(409, "This matter is under legal hold and cannot be deleted.");
    }
    const result = await deleteMatterCascade(matter.id);
    if (!result.deleted) throw new HttpError(404, "Matter not found");
    await recordAudit(
      id,
      "MATTER_DELETED",
      JSON.stringify({ label: matter.label, lifecycle: matter.lifecycle }),
      authed.account.id
    );
    if (result.clientAccountDeleted && result.clientEmail) {
      await recordAudit(
        id,
        "USER_DELETED",
        JSON.stringify({ email: result.clientEmail, role: "CLIENT", reason: "orphaned by matter deletion" }),
        authed.account.id
      );
    }
    return Response.json({ deleted: true, clientAccountDeleted: result.clientAccountDeleted });
  } catch (e) {
    return errorResponse(e);
  }
}
