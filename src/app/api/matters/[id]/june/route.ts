/** The June conversation that produced this matter — firm-side only (2026-10-30). */
import { errorResponse } from "@/lib/auth/rbac";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getDb } from "@/lib/db/index";
import type { JuneChatRow } from "@/lib/june/turn";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = await requireMatterAccess(authed, id);
    const rows = await getDb().all<Record<string, unknown>>(
      `SELECT id, role, content, lang, created_at FROM start_chat WHERE matter_id = ? ORDER BY seq ASC`,
      matter.id
    );
    const transcript: JuneChatRow[] = rows.map((r) => ({
      id: r.id as string,
      role: r.role as JuneChatRow["role"],
      content: r.content as string,
      lang: r.lang === "ko" ? "ko" : "en",
      createdAt: r.created_at as string,
    }));
    return Response.json({ transcript });
  } catch (e) {
    return errorResponse(e);
  }
}
