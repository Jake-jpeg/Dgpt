/**
 * June parks what the starting spouse told her (2026-10-30). PUBLIC behind
 * the beta gate: no account exists yet. The draft grants nothing — it is a
 * quote and eight facts, keyed by the email that will sign in. Rate-limited
 * like a login attempt; validated by the same zod schema finishStart uses.
 */
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { saveStartDraft, startDraftSchema } from "@/lib/june/start";

export async function POST(req: Request) {
  try {
    assertRateLimit(req, "login");
    const parsed = startDraftSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: please answer every question June asked");
    if (parsed.data.yourEmail === parsed.data.spouseEmail) {
      throw new HttpError(400, "VALIDATION: you and your spouse need two different email addresses");
    }
    const row = await saveStartDraft(parsed.data);
    return Response.json({ saved: true, email: row.email, quote: row.quote });
  } catch (e) {
    return errorResponse(e);
  }
}
