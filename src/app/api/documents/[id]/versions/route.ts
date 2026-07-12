/**
 * Add a revised version to an existing document — STAFF/ATTORNEY only.
 * Every new version begins unapproved; prior approvals never carry forward.
 */
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getFileStorage } from "@/lib/storage";
import { assertUploadAllowed, sanitizeDisplayFilename } from "@/lib/storage/upload-policy";
import { addDocumentVersion, getDocument } from "@/lib/db/documents";
import { recordAudit } from "@/lib/db/repo";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const doc = getDocument(id);
    if (!doc) throw new HttpError(404, "Document not found");
    const matter = requireMatterAccess(authed, doc.matterId);

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!form || !(file instanceof File)) {
      throw new HttpError(400, "VALIDATION: multipart upload with a 'file' field is required");
    }
    const mime = file.type || "application/octet-stream";
    const bytes = new Uint8Array(await file.arrayBuffer());
    assertUploadAllowed(mime, bytes.byteLength);

    const stored = await getFileStorage().put(bytes);
    const version = addDocumentVersion({
      documentId: doc.id,
      storageKey: stored.storageKey,
      sha256: stored.sha256,
      mime,
      sizeBytes: stored.sizeBytes,
      originalFilename: sanitizeDisplayFilename(file.name ?? doc.title),
      source: "INTERNAL",
      createdBy: authed.account.id,
      initialStatus: "ATTORNEY_REVIEW_REQUIRED",
    });
    recordAudit(
      matter.id,
      "DOCUMENT_REVISED",
      `document=${doc.id} version=${version.id} sha256=${stored.sha256}`,
      authed.account.id
    );
    return Response.json(
      { version: { id: version.id, versionNo: version.versionNo, status: version.status } },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}
