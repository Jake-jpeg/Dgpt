/**
 * Retention/deletion policy enforcement (run via cron or manually).
 *
 * 2.0: two sweeps run —
 *  1. legacy session sweep: unlinked stale sessions (pre-matter era);
 *  2. matter sweep: PROSPECTIVE/ABANDONED matters past their configurable
 *     inactivity thresholds. ENGAGED/CLOSED matters are exempt from this
 *     path and LEGAL HOLD blocks purge absolutely (enforced inside
 *     src/lib/retention, not here).
 *
 * Guarded by a bearer secret, not a user session (it's a machine endpoint).
 */
import { env, retentionAbandonedDays } from "@/lib/env";
import { sweepAbandoned } from "@/lib/db/repo";
import { sweepMatters } from "@/lib/retention";
import { errorResponse, HttpError } from "@/lib/auth/rbac";

export async function POST(req: Request) {
  try {
    // Fail closed (not 500) when the secret isn't configured yet.
    if (!process.env.ADMIN_SECRET) {
      throw new HttpError(503, "Retention purge is not configured (set ADMIN_SECRET)");
    }
    const auth = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${env("ADMIN_SECRET")}`;
    if (!auth || auth !== expected) throw new HttpError(401, "Unauthorized");

    const purgedSessions = (await sweepAbandoned(retentionAbandonedDays()));
    const matterReports = await sweepMatters();
    return Response.json({
      purged: purgedSessions.length,
      matters: matterReports.map((r) => ({
        matterId: r.matterId,
        sessionsPurged: r.sessionsPurged,
        documentsPurged: r.documentsPurged,
      })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
