/**
 * Sign-up (2026-11-07). GET: the signed-in reader's sign-up state (or
 * { signedIn: false }). POST: name + phone + acknowledgment of the current
 * disclaimer version → profile. CLIENT accounts only (Google / Microsoft).
 * Public path (the sign-up is how the public gets in).
 */
import { z } from "zod";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { getSessionUser } from "@/lib/auth/session";
import { requireUser } from "@/lib/auth/authz";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit, clientKey } from "@/lib/security/rate-limit";
import { getSignup, upsertSignup } from "@/lib/db/signups";
import { SIGNUP_DISCLAIMER_VERSION, normalizeUsPhone } from "@/config/signup-copy";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(32),
  acknowledgedVersion: z.literal(SIGNUP_DISCLAIMER_VERSION),
});

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    const session = await getSessionUser(req);
    if (!session) return Response.json({ signedIn: false, signup: null, disclaimerVersion: SIGNUP_DISCLAIMER_VERSION });
    let authed;
    try {
      authed = await requireUser(req, ["CLIENT"]);
    } catch {
      return Response.json({ signedIn: true, client: false, signup: null, disclaimerVersion: SIGNUP_DISCLAIMER_VERSION });
    }
    const s = await getSignup(authed.account.id);
    return Response.json({
      signedIn: true,
      client: true,
      name: authed.account.name,
      email: authed.account.email,
      signup: s ? { fullName: s.fullName, phoneDisplay: s.phoneDisplay, status: s.status, acknowledgedAt: s.acknowledgedAt } : null,
      disclaimerVersion: SIGNUP_DISCLAIMER_VERSION,
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    assertRateLimit(req, "login");
    assertCsrf(req);
    const authed = await requireUser(req, ["CLIENT"]);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: please give your full name, a US mobile number, and acknowledge the notices");
    const phone = normalizeUsPhone(parsed.data.phone);
    if (!phone) throw new HttpError(400, "VALIDATION: please enter a 10-digit US phone number, e.g. (201) 123-1234");
    // The sign-up address is kept for abuse prevention (disclosed in the notices); "local" means the proxy sent none.
    const ip = clientKey(req);
    const s = await upsertSignup({ userId: authed.account.id, fullName: parsed.data.fullName, phone: phone.digits, phoneDisplay: phone.display, disclaimerVersion: parsed.data.acknowledgedVersion, ip: ip === "local" ? null : ip });
    return Response.json({ signup: { fullName: s.fullName, phoneDisplay: s.phoneDisplay, status: s.status } });
  } catch (e) {
    return errorResponse(e);
  }
}
