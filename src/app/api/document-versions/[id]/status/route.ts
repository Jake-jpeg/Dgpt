/**
 * Attorney review-status changes on a version (never an approval):
 * request changes, withdraw, or send back to review.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getDocument, getVersion, setVersionWorkingStatus } from "@/lib/db/documents";
import { recordAudit } from "@/lib/db/repo";

const schema = z.object({
  status: z.enum(["CHANGES_REQUESTED", "WITHDRAWN", "ATTORNEY_REVIEW_REQUIRED"]),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY"]);
    const { id } = await ctx.params;
    const version = (await getVersion(id));
    if (!version) throw new HttpError(404, "Not found");
    const doc = (await getDocument(version.documentId))!;
    const matter = (await requireMatterAccess(authed, doc.matterId));

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid status payload");

    const updated = (await setVersionWorkingStatus({
          versionId: version.id,
          actingUserId: authed.account.id,
          status: parsed.data.status,
        }));
    (await recordAudit(
            matter.id,
            "DOCUMENT_STATUS_CHANGED",
            `version=${version.id} status=${updated.status}`,
            authed.account.id
          ));
    return Response.json({ version: { id: updated.id, status: updated.status } });
  } catch (e) {
    return errorResponse(e);
  }
}
