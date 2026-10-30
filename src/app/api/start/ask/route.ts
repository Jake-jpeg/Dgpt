/**
 * Ask June a question before signing in (2026-10-30). PUBLIC behind the
 * beta gate, so caged hard: the intake kill switch, the strict rate limit
 * (the beta rule — a shared-secret-door pace), a per-visitor turn cap kept
 * in a signed-less counter cookie (soft; the IP rule is the real limit),
 * and a 600-char question. The AI layer is reached only through
 * src/lib/june (same shape as the intake assistant's exception).
 */
import { z } from "zod";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { parseCookies } from "@/lib/auth/session";
import { askJune, juneEnabled, JUNE_MAX_QUESTION_CHARS, JUNE_MAX_QUESTIONS_PER_VISITOR } from "@/lib/june/ask";

const COUNTER = "dgpt_june_q";
const schema = z.object({ question: z.string().trim().min(1).max(JUNE_MAX_QUESTION_CHARS) });

export async function POST(req: Request) {
  try {
    assertRateLimit(req, "beta");
    if (!juneEnabled()) {
      return Response.json(
        { answer: "I can explain how this works, but my question-answering is switched off right now. The attorney will answer anything at the meeting.", flagged: false, disabled: true },
        { status: 200 }
      );
    }
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: ask a short question");
    const count = Number(parseCookies(req)[COUNTER] ?? "0") || 0;
    if (count >= JUNE_MAX_QUESTIONS_PER_VISITOR) {
      return Response.json({
        answer: "I've answered as much as I can before you sign in — the attorney will take every other question at your meeting.",
        flagged: false,
        capped: true,
      });
    }
    const r = await askJune(parsed.data.question);
    const headers = new Headers({ "cache-control": "no-store" });
    headers.append("Set-Cookie", `${COUNTER}=${count + 1}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`);
    return new Response(JSON.stringify(r), { status: 200, headers: Object.assign(headers, { "content-type": "application/json" }) });
  } catch (e) {
    return errorResponse(e);
  }
}
