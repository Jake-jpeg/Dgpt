/**
 * The firm of record's own profile (2026-11-02).
 *
 * GET  — ATTORNEY/STAFF/ADMIN: the caller's firm (platform-level users: the
 *        default firm), plus the list of firms a successor may be chosen from.
 * PUT  — ATTORNEY or ADMIN: name, legal name, tiers, fees, successor.
 *        These are the FIRM's business terms; the platform displays them and
 *        takes no payment.
 */
import { z } from "zod";
import { requireUser } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getFirm, listFirms, updateFirm } from "@/lib/db/firms";
import { DEFAULT_FIRM_ID } from "@/lib/db/matters";
import { recordAudit } from "@/lib/db/repo";

const schema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  legalName: z.string().trim().min(2).max(160).optional(),
  defaultTier: z.enum(["REVIEW", "REVIEW_AND_FILE"]).optional(),
  reviewFee: z.number().int().min(0).max(100_000).optional(),
  fileBaseFee: z.number().int().min(0).max(100_000).optional(),
  fileChildrenFee: z.number().int().min(0).max(100_000).optional(),
  fileAssetsFee: z.number().int().min(0).max(100_000).optional(),
  offersFiling: z.boolean().optional(),
  successorFirmId: z.string().trim().max(64).nullable().optional(),
});

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["STAFF", "ATTORNEY", "ADMIN"]);
    const firm = await getFirm(authed.account.firmId ?? DEFAULT_FIRM_ID);
    if (!firm) throw new HttpError(404, "Firm not found");
    const firms = (await listFirms()).filter((f) => f.id !== firm.id && f.status === "ACTIVE").map((f) => ({ id: f.id, name: f.name }));
    return Response.json({ firm, successorChoices: firms });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: Request) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY", "ADMIN"]);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid firm profile");
    const firmId = authed.account.firmId ?? DEFAULT_FIRM_ID;
    const firm = await updateFirm(firmId, parsed.data);
    await recordAudit(firmId, "FIRM_PROFILE_UPDATED", Object.keys(parsed.data).join(","), authed.account.id);
    return Response.json({ firm });
  } catch (e) {
    return errorResponse(e);
  }
}
