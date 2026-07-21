/**
 * Attorney dashboard data. ATTORNEY role required — enforced server-side on
 * every request (role + email allowlist). A client session hitting this
 * endpoint gets a 403 and no data, ever.
 */
import { requireRole, errorResponse } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { listSessionsByState, listSessionsByOwner, getIdentity } from "@/lib/db/repo";

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    const user = await requireRole(req, "ATTORNEY");

    const ready = await Promise.all(
      ((await listSessionsByState("READY_FOR_REVIEW")).map(async (s) => ({
                id: s.id,
                tier: s.tier,
                county: s.county,
                initiatedBy: s.initiatedBy,
                qdroFlag: s.qdroFlag,
                attorneyFlags: s.attorneyFlags,
                updatedAt: s.updatedAt,
                clientName: (await getIdentity(s.id))?.clientParty.fullLegalName ?? "(unknown)",
              })))
    );

    // The attorney's own in-progress (attorney-initiated) intakes.
    const mine = (await listSessionsByOwner(user.subject))
      .filter((s) => s.state !== "READY_FOR_REVIEW")
      .map((s) => ({ id: s.id, state: s.state, tier: s.tier, updatedAt: s.updatedAt }));

    return Response.json({ ready, inProgress: mine });
  } catch (e) {
    return errorResponse(e);
  }
}
