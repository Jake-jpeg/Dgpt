/**
 * Approve ONE exact document version — ATTORNEY only.
 *
 * The approval binds to the version id and its SHA-256 content hash at the
 * moment of approval. There is no bulk approval; a request approves exactly
 * one version. STAFF/ADMIN are refused here AND by the structural role
 * re-check inside the persistence layer.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { approveVersion, getDocument, getVersion } from "@/lib/db/documents";
import { recordAudit } from "@/lib/db/repo";

const schema = z.object({
  approvalType: z.enum(["FOR_CLIENT", "FOR_SIGNATURE", "FOR_FILING"]),
  destination: z.enum(["CLIENT_PORTAL", "SIGNATURE", "FILING"]),
  note: z.string().trim().max(4000).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY"]);
    const { id } = await ctx.params;
    const version = getVersion(id);
    if (!version) throw new HttpError(404, "Not found");
    const doc = getDocument(version.documentId)!;
    const matter = requireMatterAccess(authed, doc.matterId);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid approval payload");

    const approval = approveVersion({
      versionId: version.id,
      actingUserId: authed.account.id,
      approvalType: parsed.data.approvalType,
      destination: parsed.data.destination,
      note: parsed.data.note,
    });
    recordAudit(
      matter.id,
      "DOCUMENT_APPROVED",
      `version=${version.id} type=${approval.approvalType} sha256=${approval.sha256}`,
      authed.account.id
    );
    return Response.json({
      approval: {
        id: approval.id,
        versionId: approval.documentVersionId,
        sha256: approval.sha256,
        approvalType: approval.approvalType,
        destination: approval.destination,
        createdAt: approval.createdAt,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
