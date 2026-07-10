/**
 * The attorney review view for one completed intake: identity, tier, county,
 * flags, all answers grouped by section, the audit trail, and the PII-free
 * bot interaction log. ATTORNEY role enforced server-side.
 */
import { requireRole, errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import {
  getSession,
  getIdentity,
  getAnswers,
  getAuditEvents,
  getBotLog,
} from "@/lib/db/repo";
import { sectionsForTier } from "@/config/intake-fields";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    await requireRole(req, "ATTORNEY");
    const { id } = await ctx.params;

    const s = getSession(id);
    if (!s) throw new HttpError(404, "Session not found");
    // The attorney reviews completed intakes; in-progress client sessions are
    // not readable until the client finishes (handoff happens at
    // READY_FOR_REVIEW). Attorney-initiated in-progress intakes are accessed
    // through the intake endpoints as the owner, not through review.
    if (s.state !== "READY_FOR_REVIEW") {
      throw new HttpError(409, "This intake is not ready for review yet");
    }

    const answers = getAnswers(id);
    const sections = s.tier
      ? sectionsForTier(s.tier).map((sec) => ({
          id: sec.id,
          title: sec.title,
          fields: sec.fields
            .filter((f) => answers[f.id] !== undefined)
            .map((f) => ({ id: f.id, label: f.label, value: answers[f.id] })),
        }))
      : [];

    return Response.json({
      session: {
        id: s.id,
        state: s.state,
        tier: s.tier,
        county: s.county,
        initiatedBy: s.initiatedBy,
        qdroFlag: s.qdroFlag,
        attorneyFlags: s.attorneyFlags,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      },
      identity: getIdentity(id),
      sections,
      branch: {
        branch_assets: answers["branch_assets"] ?? null,
        branch_alimony: answers["branch_alimony"] ?? null,
      },
      audit: getAuditEvents(id),
      botLog: getBotLog(id),
      // Stage-2 affordance is rendered in the UI but disabled and wired to
      // nothing — there is deliberately NO drafting endpoint in Stage 1.
      stage2: { draftingAvailable: false },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
