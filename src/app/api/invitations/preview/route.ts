/**
 * Public, minimal preview for the /invite landing page — so a client who
 * hasn't signed in yet can be shown "this invitation is for ja***@gmail.com,
 * sign in with that account." Returns ONLY the masked email and whether the
 * token is live; never the matter, the client's identity, or anything a
 * stranger could exploit. Rate-limited. An invalid/expired/revoked/used token
 * returns { valid: false } — indistinguishable, no enumeration.
 */
import { z } from "zod";
import { errorResponse } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { previewInvitation, maskEmail } from "@/lib/db/invitations";
import { operatingFirmName } from "@/config/branding";

const schema = z.object({ token: z.string().trim().min(16).max(512) });

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "login");
    const token = new URL(req.url).searchParams.get("token") ?? "";
    const parsed = schema.safeParse({ token });
    if (!parsed.success) return Response.json({ valid: false });
    const inv = await previewInvitation(parsed.data.token);
    if (!inv) return Response.json({ valid: false });
    return Response.json({
      valid: true,
      firmName: operatingFirmName(),
      emailMasked: maskEmail(inv.targetEmail),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
