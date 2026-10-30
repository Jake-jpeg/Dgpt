/**
 * The two spouses' interview transcripts — firm-side only (2026-10-30).
 * Operator: "The chat logs will be saved. It's up to me to delete them. But
 * I gotta see what's going on." GET returns each party's conversation in
 * order; DELETE (ATTORNEY) purges the words — CLIENT and ASSISTANT rows —
 * for one party or both, leaving the machine events the intake lock reads.
 */
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { listSessionsByMatter, recordAudit } from "@/lib/db/repo";
import { listChatMessages } from "@/lib/db/intake-chat";
import { getDb } from "@/lib/db/index";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = await requireMatterAccess(authed, id);
    const sessions = await listSessionsByMatter(matter.id);
    const transcripts = await Promise.all(
      sessions.map(async (s) => ({
        party: s.partyId,
        sessionId: s.id,
        state: s.state,
        messages: (await listChatMessages(s.id)).map((m) => ({ role: m.role, content: m.content, lang: m.lang, at: m.createdAt })),
      }))
    );
    return Response.json({ transcripts });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = await requireMatterAccess(authed, id);
    const party = new URL(req.url).searchParams.get("party");
    if (party && party !== "A" && party !== "B") throw new HttpError(400, "VALIDATION: party must be A or B");
    const sessions = (await listSessionsByMatter(matter.id)).filter((s) => !party || s.partyId === party);
    let removed = 0;
    for (const s of sessions) {
      const r = await getDb().run(`DELETE FROM intake_chat_message WHERE session_id = ? AND role IN ('CLIENT','ASSISTANT')`, s.id);
      removed += Number((r as { changes?: number }).changes ?? 0);
    }
    await recordAudit(matter.id, "TRANSCRIPT_DELETED", `party=${party ?? "both"} rows=${removed}`, authed.account.id);
    return Response.json({ deleted: true, removed });
  } catch (e) {
    return errorResponse(e);
  }
}
