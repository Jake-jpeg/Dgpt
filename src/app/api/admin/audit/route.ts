/**
 * Audit review — ADMIN only. Recent events (optionally filtered by ref)
 * plus hash-chain verification status. Rows contain event codes,
 * identifiers, and salted hashes — never raw confidential content.
 */
import { requireAdmin } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getDb } from "@/lib/db/index";
import { verifyAuditChain } from "@/lib/db/repo";

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    await requireAdmin(req);
    const url = new URL(req.url);
    const ref = url.searchParams.get("ref")?.trim();
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "200") || 200, 1000);

    const rows = (
      ref
        ? getDb()
            .prepare(
              `SELECT session_ref, event, detail, actor, created_at FROM audit_event
               WHERE session_ref = ? ORDER BY rowid DESC LIMIT ?`
            )
            .all(ref, limit)
        : getDb()
            .prepare(
              `SELECT session_ref, event, detail, actor, created_at FROM audit_event
               ORDER BY rowid DESC LIMIT ?`
            )
            .all(limit)
    ) as { session_ref: string; event: string; detail: string | null; actor: string | null; created_at: string }[];

    const firstBrokenId = verifyAuditChain();
    return Response.json({
      chainIntact: firstBrokenId === null,
      firstBrokenId,
      events: rows.map((r) => ({
        ref: r.session_ref,
        event: r.event,
        detail: r.detail,
        actor: r.actor,
        at: r.created_at,
      })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
