/**
 * The second spouse's link (2026-10-30). GET previews the invitation —
 * state only, the firm's name, a masked target address; never the other
 * spouse's name or any case content. POST accepts: CLIENT only, verified
 * email must match, single use. Beta-gate exempt: the invited spouse has
 * no access key — the link IS their access.
 */
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { requireUser } from "@/lib/auth/authz";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { acceptSpouseInvitation, findSpouseInvitation, invitationState } from "@/lib/db/spouse-invites";
import { maskEmail } from "@/lib/db/invitations";
import { operatingFirmName } from "@/config/branding";
import { SPOUSE_NOTICE_VERSION } from "@/config/door-copy";
import { betaCookieHeader, betaGateEnabled, betaKeys } from "@/lib/beta";
import { isProduction } from "@/lib/env";

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    assertRateLimit(req, "login");
    const { token } = await ctx.params;
    const inv = await findSpouseInvitation(token);
    const state = invitationState(inv);
    const headers = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
    // A valid, open invitation IS the firm's access grant: it unlocks the
    // beta gate for this browser so the sign-in that follows is reachable.
    // (The gate stays for everyone else — operator, 2026-10-30.)
    if (state === "OPEN" && betaGateEnabled()) {
      headers.append("Set-Cookie", betaCookieHeader(betaKeys()[0], isProduction()));
    }
    return new Response(
      JSON.stringify({
        state,
        firm: operatingFirmName(),
        invitedEmailMasked: inv ? maskEmail(inv.targetEmail) : null,
        expiresAt: inv?.expiresAt ?? null,
      }),
      { status: 200, headers }
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    assertRateLimit(req, "login");
    assertCsrf(req);
    const authed = await requireUser(req, ["CLIENT"]);
    const { token } = await ctx.params;
    // The notice ("the firm represents your spouse, not you") must be
    // acknowledged in the same request that seats the spouse. The client
    // sends the version it displayed; anything else is refused.
    const body = (await req.json().catch(() => null)) as { acknowledgedNotice?: unknown } | null;
    const ack = body?.acknowledgedNotice === SPOUSE_NOTICE_VERSION ? SPOUSE_NOTICE_VERSION : null;
    const r = await acceptSpouseInvitation(token, authed.account, ack);
    if (!r.ok) {
      if (r.reason === "NOTICE_NOT_ACKNOWLEDGED") throw new HttpError(400, "VALIDATION: please read and acknowledge the notice to continue.");
      const msg: Record<Exclude<typeof r.reason, "NOTICE_NOT_ACKNOWLEDGED">, string> = {
        UNKNOWN: "This link isn't valid. Ask your spouse to send a new one.",
        EXPIRED: "This link has expired. Ask your spouse to send a new one.",
        USED: "This link was already used.",
        REVOKED: "This link was cancelled. Ask your spouse to send a new one.",
        WRONG_EMAIL: `This link was sent to a different email address. Sign in with the address your spouse gave the firm.`,
        NOT_A_CLIENT: "Please sign in with a personal Google or Microsoft account.",
        SEAT_TAKEN: "Someone has already joined this case with this link.",
      };
      throw new HttpError(409, msg[r.reason]);
    }
    return Response.json({ joined: true, matterId: r.matterId });
  } catch (e) {
    return errorResponse(e);
  }
}
