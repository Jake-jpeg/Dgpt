/**
 * Disclosure acknowledgment for a matter — the client's affirmative consent.
 *
 * - `acknowledge` must be the literal boolean true, sent explicitly by the
 *   client after an unchecked-by-default checkbox (see the intake UI). A
 *   missing/false value is rejected — consent is never presumed.
 * - The version must match the CURRENT disclosure version, so stale UIs
 *   cannot record acknowledgment of superseded text.
 * - IP / user-agent are captured only when CONSENT_CAPTURE_IP_UA=true
 *   (default off).
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getDisclosure } from "@/config/disclosure";
import { hasAcknowledged, recordDisclosureAck } from "@/lib/db/disclosure";
import { clientKey } from "@/lib/security/rate-limit";
import { recordAudit } from "@/lib/db/repo";

const schema = z.object({
  version: z.string().trim().min(1).max(40),
  acknowledge: z.literal(true),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["CLIENT"]);
    const { id } = await ctx.params;
    const matter = requireMatterAccess(authed, id);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      throw new HttpError(400, "VALIDATION: an explicit acknowledgment is required");
    }
    const current = getDisclosure();
    if (parsed.data.version !== current.version) {
      throw new HttpError(409, "The disclosure has been updated — please review the current version");
    }

    const ack = recordDisclosureAck({
      matterRef: matter.id,
      userRef: authed.account.id,
      version: current.version,
      ip: clientKey(req),
      userAgent: req.headers.get("user-agent"),
    });
    recordAudit(matter.id, "CONSENT_RECORDED", `version=${current.version}`, authed.account.id);
    return Response.json({
      acknowledged: true,
      version: ack.version,
      acknowledgedAt: ack.acknowledgedAt,
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["CLIENT"]);
    const { id } = await ctx.params;
    const matter = requireMatterAccess(authed, id);
    const current = getDisclosure();
    return Response.json({
      version: current.version,
      acknowledged: hasAcknowledged(matter.id, authed.account.id, current.version),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
