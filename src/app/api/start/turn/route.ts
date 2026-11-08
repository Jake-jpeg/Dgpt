/**
 * June's conversation (2026-10-30, second cut; 2026-11-08 behind sign-in).
 *
 * Operator (2026-11-08): "If anyone wants to start with June? They need to
 * make an account and log in." So the conversation belongs to a signed-in
 * CLIENT who has completed sign-up (name, number, notices) and has not been
 * rejected or banned. The account id is the conversation key — no visitor
 * cookie — and `yourEmail` is seeded from the verified sign-in.
 *
 * GET  — { access } when the caller may not start yet (SIGN_IN, SIGN_UP,
 *        REJECTED, NOT_CLIENT), else opening + transcript + state.
 * POST — one message → June's reply via src/lib/june/turn (Opus on the
 *        intake tier, or the scripted fallback when the kill switch is off).
 *        Caged: the intake-chat rate rule per IP, 40 turns per account,
 *        1000 chars. The AI layer is reached only through src/lib/june.
 */
import { z } from "zod";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { starterAccess } from "@/lib/june/access";
import { juneOpen, juneTranscript, runJuneTurn, JUNE_MAX_MESSAGE_CHARS, JUNE_MAX_TURNS_PER_VISITOR } from "@/lib/june/turn";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    const who = await starterAccess(req);
    if (who.access !== "OK" || !who.authed) return json({ access: who.access, signupUrl: "/signup/details?next=start" });
    const { transcript, state } = await juneOpen(who.authed.account.id, { name: who.name, email: who.authed.account.email });
    return json({ access: "OK", transcript: transcript.filter((m) => m.role !== "SYSTEM"), ...state });
  } catch (e) {
    return errorResponse(e);
  }
}

const postSchema = z.object({ message: z.string().trim().min(1).max(JUNE_MAX_MESSAGE_CHARS) });

export async function POST(req: Request) {
  try {
    assertRateLimit(req, "intake-chat");
    const who = await starterAccess(req);
    if (who.access === "SIGN_IN") throw new HttpError(401, "Sign in to start with June");
    if (who.access !== "OK" || !who.authed) throw new HttpError(403, who.access === "REJECTED" ? "The firm is unable to assist with this matter" : "Finish sign-up to start with June");
    const id = who.authed.account.id;
    const parsed = postSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: say something (up to 1000 characters)");
    // A first POST without a GET still has the seeded email and the opening on file.
    await juneOpen(id, { name: who.name, email: who.authed.account.email });
    const turns = (await juneTranscript(id)).filter((m) => m.role === "VISITOR").length;
    if (turns >= JUNE_MAX_TURNS_PER_VISITOR) {
      return json({ say: "I've gone as far as I can here — the attorney will take everything else at your meeting.", lang: "en", capped: true });
    }
    const r = await runJuneTurn(id, parsed.data.message);
    return json(r);
  } catch (e) {
    return errorResponse(e);
  }
}
