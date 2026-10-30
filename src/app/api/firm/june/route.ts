/**
 * The firm reads June's conversations (2026-10-30). Operator: "The lawyer
 * login portal should stay because I need to see what happened during these
 * chats." STAFF/ATTORNEY only. Lists the most recent visitors — attached
 * matter if any, the email June captured, whether the eight facts are in,
 * and the full transcript. Verbatim and firm-side only; never a client route.
 */
import { errorResponse } from "@/lib/auth/rbac";
import { requireUser } from "@/lib/auth/authz";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getDb } from "@/lib/db/index";
import { juneTranscript } from "@/lib/june/turn";

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    await requireUser(req, ["STAFF", "ATTORNEY"]);
    const limit = Math.min(50, Math.max(1, Number(new URL(req.url).searchParams.get("limit") ?? "25") || 25));
    const visitors = await getDb().all<{ visitor_id: string; last: string; first: string; matter_id: string | null; turns: number }>(
      `SELECT visitor_id, MAX(created_at) AS last, MIN(created_at) AS first, MAX(matter_id) AS matter_id,
              SUM(CASE WHEN role = 'VISITOR' THEN 1 ELSE 0 END) AS turns
       FROM start_chat GROUP BY visitor_id ORDER BY last DESC LIMIT ?`,
      limit
    );
    const conversations = await Promise.all(
      visitors.map(async (v) => {
        const draft = await getDb().get<{ email: string; complete: number; consumed_matter: string | null }>(
          `SELECT email, complete, consumed_matter FROM start_draft WHERE visitor_id = ? ORDER BY created_at DESC LIMIT 1`,
          v.visitor_id
        );
        return {
          visitorId: v.visitor_id,
          startedAt: v.first,
          lastAt: v.last,
          visitorTurns: Number(v.turns) || 0,
          email: draft?.email || null,
          complete: draft?.complete === 1,
          matterId: v.matter_id ?? draft?.consumed_matter ?? null,
          transcript: await juneTranscript(v.visitor_id),
        };
      })
    );
    return Response.json({ conversations });
  } catch (e) {
    return errorResponse(e);
  }
}
