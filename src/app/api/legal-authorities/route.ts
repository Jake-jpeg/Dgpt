/**
 * Legal source status (B10) — STAFF/ATTORNEY only, internal.
 * Exposes the dated local authority snapshot with review statuses and the
 * deterministic freshness warnings. Clients never see this route: legal
 * source records are internal work product.
 */
import { requireUser } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import {
  legalContentMaxAgeDays,
  legalContentReviewedAt,
  legalContentVersion,
  legalContentWarnings,
  listAuthorities,
} from "@/lib/legal/authority";

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    await requireUser(req, ["STAFF", "ATTORNEY"]);
    const url = new URL(req.url);
    const j = url.searchParams.get("jurisdiction");
    const jurisdiction = j === "NJ" || j === "NY" ? j : undefined;
    return Response.json({
      snapshot: {
        version: legalContentVersion(),
        reviewedAt: legalContentReviewedAt(),
        maxAgeDays: legalContentMaxAgeDays(),
      },
      warnings: legalContentWarnings(),
      records: listAuthorities(jurisdiction).map((r) => ({
        id: r.id,
        jurisdiction: r.jurisdiction,
        topic: r.topic,
        authorityType: r.authorityType,
        authorityName: r.authorityName,
        section: r.section,
        proposition: r.proposition,
        officialSource: r.officialSource,
        retrievedAt: r.retrievedAt,
        status: r.status,
        notes: r.notes,
      })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
