/**
 * Practice continuity (2026-11-02): transfer every OPEN matter of the
 * caller's firm to its named successor firm, in one audited action.
 * ATTORNEY or ADMIN of the firm. The successor must already be named on the
 * firm profile — this endpoint never picks one.
 */
import { requireUser } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getFirm, transferOpenMatters } from "@/lib/db/firms";
import { DEFAULT_FIRM_ID } from "@/lib/db/matters";
import { recordAudit } from "@/lib/db/repo";

export async function POST(req: Request) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY", "ADMIN"]);
    const firmId = authed.account.firmId ?? DEFAULT_FIRM_ID;
    const firm = await getFirm(firmId);
    if (!firm) throw new HttpError(404, "Firm not found");
    if (!firm.successorFirmId) throw new HttpError(409, "CONTINUITY_GUARD: name a successor firm on the firm profile first");
    const moved = await transferOpenMatters(firmId, firm.successorFirmId, authed.account.id);
    await recordAudit(firmId, "PRACTICE_TRANSFERRED", `${moved.length} open matter(s) to firm=${firm.successorFirmId}`, authed.account.id);
    return Response.json({ moved: moved.length, toFirmId: firm.successorFirmId });
  } catch (e) {
    return errorResponse(e);
  }
}
