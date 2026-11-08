/**
 * June parks what the starting spouse told her (2026-10-30) — the form
 * fallback to the conversation. 2026-11-08: behind sign-in like the
 * conversation itself (a signed-up CLIENT), and `yourEmail` is the verified
 * sign-in address whatever the body says. The draft grants nothing — it is
 * a quote and eight facts, keyed to the account. Rate-limited like a login
 * attempt; validated by the same zod schema finishStart uses.
 */
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { assertCsrf } from "@/lib/security/csrf";
import { starterAccess } from "@/lib/june/access";
import { saveStartDraft, startDraftSchema } from "@/lib/june/start";

export async function POST(req: Request) {
  try {
    assertRateLimit(req, "login");
    assertCsrf(req);
    const who = await starterAccess(req);
    if (who.access === "SIGN_IN") throw new HttpError(401, "Sign in to start with June");
    if (who.access !== "OK" || !who.authed) throw new HttpError(403, who.access === "REJECTED" ? "The firm is unable to assist with this matter" : "Finish sign-up to start with June");
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const parsed = startDraftSchema.safeParse({ ...(body ?? {}), yourEmail: who.authed.account.email });
    if (!parsed.success) throw new HttpError(400, "VALIDATION: please answer every question June asked");
    if (parsed.data.yourEmail === parsed.data.spouseEmail) {
      throw new HttpError(400, "VALIDATION: you and your spouse need two different email addresses");
    }
    const row = await saveStartDraft(parsed.data, who.authed.account.id);
    return Response.json({ saved: true, email: row.email, quote: row.quote });
  } catch (e) {
    return errorResponse(e);
  }
}
