/**
 * Conversational intake API (spec §2.3).
 *
 * GET  — transcript + progress. The CLIENT who owns the session, or
 *        STAFF/ATTORNEY holding matter access (the attorney's read-only
 *        transcript panel uses this).
 * POST — one orchestrator turn. CLIENT-only, own session only, dedicated
 *        bounded rate bucket, message capped at MAX_CHAT_MESSAGE_CHARS.
 *
 * Kill switch: INTAKE_CHAT_ENABLED must be "true" or POST returns 503 with
 * a friendly use-the-form message — the form toggle always works.
 */
import { z } from "zod";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getSession } from "@/lib/db/repo";
import {
  conversationView,
  ensureWelcomed,
  intakeChatEnabled,
  runIntakeTurn,
} from "@/lib/intake-chat/orchestrator";
import { MAX_CHAT_MESSAGE_CHARS } from "@/lib/db/intake-chat";
import { AiDisabledError } from "@/lib/ai/types";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["CLIENT", "STAFF", "ATTORNEY"]);
    const { sessionId } = await ctx.params;
    const session = await getSession(sessionId);
    if (!session) throw new HttpError(404, "Session not found");

    if (authed.account.role === "CLIENT") {
      if (session.ownerSubject !== authed.account.subject) {
        throw new HttpError(404, "Session not found"); // never leak existence
      }
      // The scripted opening greets the client before their first message.
      if (intakeChatEnabled()) await ensureWelcomed(sessionId);
    } else {
      if (!session.matterId) throw new HttpError(404, "Session not found");
      await requireMatterAccess(authed, session.matterId);
    }

    return Response.json({ enabled: intakeChatEnabled(), ...(await conversationView(sessionId)) });
  } catch (e) {
    return errorResponse(e);
  }
}

const postSchema = z.object({
  message: z.string().min(1).max(MAX_CHAT_MESSAGE_CHARS),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  try {
    assertRateLimit(req, "intake-chat");
    assertCsrf(req);
    const authed = await requireUser(req, ["CLIENT"]);
    const { sessionId } = await ctx.params;
    const session = await getSession(sessionId);
    if (!session || session.ownerSubject !== authed.account.subject) {
      throw new HttpError(404, "Session not found");
    }
    if (!intakeChatEnabled()) {
      throw new HttpError(
        503,
        "The chat intake is unavailable right now — please use the form; your progress carries over."
      );
    }

    const parsed = postSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid message");

    const result = await runIntakeTurn({
      sessionId,
      actingUserId: authed.account.id,
      message: parsed.data.message,
    });
    return Response.json(result);
  } catch (e) {
    if (e instanceof AiDisabledError) {
      return Response.json(
        { error: "The chat intake is unavailable right now — please use the form; your progress carries over." },
        { status: 503 }
      );
    }
    return errorResponse(e);
  }
}
