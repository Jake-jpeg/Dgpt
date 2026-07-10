/**
 * Retention/deletion policy enforcement (run via cron or manually):
 * sessions with no activity for RETENTION_ABANDONED_DAYS (and not yet ready
 * for review) are abandoned — substantive data purged, minimal audit kept.
 *
 * Guarded by a bearer secret, not a user session (it's a machine endpoint).
 */
import { env, retentionAbandonedDays } from "@/lib/env";
import { sweepAbandoned } from "@/lib/db/repo";
import { errorResponse, HttpError } from "@/lib/auth/rbac";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${env("ADMIN_SECRET")}`;
    if (!auth || auth !== expected) throw new HttpError(401, "Unauthorized");
    const purged = sweepAbandoned(retentionAbandonedDays());
    return Response.json({ purged: purged.length });
  } catch (e) {
    return errorResponse(e);
  }
}
