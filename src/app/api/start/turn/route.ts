/**
 * June's conversation (2026-10-30, second cut). PUBLIC behind the beta gate.
 *
 * GET  — opening + transcript + state for this visitor (cookie id, minted
 *        here on first contact; HttpOnly, Lax, 30 days).
 * POST — one visitor message → June's reply via src/lib/june/turn (Opus on
 *        the intake tier, or the scripted fallback when the kill switch is
 *        off). Caged: the intake-chat rate rule per IP, 40 turns per visitor,
 *        1000 chars. The AI layer is reached only through src/lib/june.
 */
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { parseCookies } from "@/lib/auth/session";
import { isProduction } from "@/lib/env";
import { juneOpen, juneTranscript, runJuneTurn, JUNE_MAX_MESSAGE_CHARS, JUNE_MAX_TURNS_PER_VISITOR } from "@/lib/june/turn";

export const VISITOR_COOKIE = "dgpt_june_v";

function visitorFrom(req: Request): { id: string; setCookie: string | null } {
  const existing = parseCookies(req)[VISITOR_COOKIE];
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return { id: existing, setCookie: null };
  const id = randomUUID();
  const parts = [`${VISITOR_COOKIE}=${id}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${30 * 86400}`];
  if (isProduction()) parts.push("Secure");
  return { id, setCookie: parts.join("; ") };
}

function json(body: unknown, setCookie: string | null): Response {
  const headers = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
  if (setCookie) headers.append("Set-Cookie", setCookie);
  return new Response(JSON.stringify(body), { status: 200, headers });
}

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    const v = visitorFrom(req);
    const { transcript, state } = await juneOpen(v.id);
    return json({ transcript: transcript.filter((m) => m.role !== "SYSTEM"), ...state }, v.setCookie);
  } catch (e) {
    return errorResponse(e);
  }
}

const postSchema = z.object({ message: z.string().trim().min(1).max(JUNE_MAX_MESSAGE_CHARS) });

export async function POST(req: Request) {
  try {
    assertRateLimit(req, "intake-chat");
    const v = visitorFrom(req);
    const parsed = postSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: say something (up to 1000 characters)");
    const turns = (await juneTranscript(v.id)).filter((m) => m.role === "VISITOR").length;
    if (turns >= JUNE_MAX_TURNS_PER_VISITOR) {
      return json(
        { say: "I've gone as far as I can before you sign in — the attorney will take everything else at your meeting.", lang: "en", capped: true },
        v.setCookie
      );
    }
    const r = await runJuneTurn(v.id, parsed.data.message);
    return json(r, v.setCookie);
  } catch (e) {
    return errorResponse(e);
  }
}
