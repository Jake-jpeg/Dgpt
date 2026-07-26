/**
 * Matter documents.
 *
 * GET — role-shaped list:
 *   CLIENT: their own uploads (metadata) + versions RELEASED to the client
 *           portal. Never drafts, never internal/AI documents, never
 *           approval machinery.
 *   STAFF/ATTORNEY: full working list with version statuses.
 *
 * POST — multipart upload:
 *   CLIENT: allowed on their own matter AFTER attorney conflict clearance
 *           (uploads are "requested documents", part of substantive intake).
 *   STAFF/ATTORNEY: any granted matter (e.g. paper-intake scanning).
 *   All uploads: MIME allowlist, size cap, malware-scan hook, randomized
 *   server-side names outside public/.
 */
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getFileStorage } from "@/lib/storage";
import {
  assertUploadAllowed,
  sanitizeDisplayFilename,
} from "@/lib/storage/upload-policy";
import {
  addDocumentVersion,
  createDocument,
  listApprovalsForVersion,
  listDocumentsForMatter,
  listReleasedForMatter,
  listVersions,
} from "@/lib/db/documents";
import { getUserById } from "@/lib/db/users";
import { recordAudit } from "@/lib/db/repo";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["CLIENT", "STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));

    if (authed.account.role === "CLIENT") {
      const released = (await listReleasedForMatter(matter.id)).map((r) => ({
        documentId: r.document.id,
        versionId: r.version.id,
        title: r.document.title,
        releasedAt: r.releasedAt,
      }));
      const uploads = (await listDocumentsForMatter(matter.id))
        .filter((d) => d.docKind === "CLIENT_UPLOAD" && d.createdBy === authed.account.id)
        .map((d) => ({ documentId: d.id, title: d.title, uploadedAt: d.createdAt }));
      return Response.json({ released, uploads });
    }

    return Response.json({
      documents: await Promise.all(
        ((await listDocumentsForMatter(matter.id)).map(async (d) => ({
                    ...d,
                    versions: await Promise.all(
                      ((await listVersions(d.id)).map(async (v) => ({
                                                id: v.id,
                                                versionNo: v.versionNo,
                                                status: v.status,
                                                sha256: v.sha256,
                                                mime: v.mime,
                                                sizeBytes: v.sizeBytes,
                                                originalFilename: v.originalFilename,
                                                source: v.source, // "AI" flags AI-generated/unreviewed provenance
                                                createdAt: v.createdAt,
                                                approvals: await Promise.all(
                                                  ((await listApprovalsForVersion(v.id)).map(async (a) => ({
                                                                                                        id: a.id,
                                                                                                        approvalType: a.approvalType,
                                                                                                        destination: a.destination,
                                                                                                        sha256: a.sha256,
                                                                                                        approvedBy: (await getUserById(a.approvedBy))?.email ?? a.approvedBy,
                                                                                                        revoked: Boolean(a.revokedAt),
                                                                                                        createdAt: a.createdAt,
                                                                                                      })))
                                                ),
                                              })))
                    ),
                  })))
      ),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["CLIENT", "STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));

    // CLIENT uploads are CLOSED (2026-07-26 operator directive): document
    // exchange happens over email, directly with the firm. What this portal
    // never holds, it can never leak or make discoverable. Firm-side uploads
    // (staff/attorney working documents) are unchanged.
    if (authed.account.role === "CLIENT") {
      throw new HttpError(
        403,
        "This portal does not accept document uploads. Please email your documents to the firm directly."
      );
    }

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!form || !(file instanceof File)) {
      throw new HttpError(400, "VALIDATION: multipart upload with a 'file' field is required");
    }
    const title = sanitizeDisplayFilename(String(form.get("title") ?? file.name ?? "upload"));
    const mime = file.type || "application/octet-stream";
    const bytes = new Uint8Array(await file.arrayBuffer());
    assertUploadAllowed(mime, bytes.byteLength);

    const stored = await getFileStorage().put(bytes);
    const doc = (await createDocument({
          matterId: matter.id,
          title,
          docKind: "GENERAL", // client uploads are closed; only firm-side uploads remain
          createdBy: authed.account.id,
        }));
    const version = (await addDocumentVersion({
          documentId: doc.id,
          storageKey: stored.storageKey,
          sha256: stored.sha256,
          mime,
          sizeBytes: stored.sizeBytes,
          originalFilename: sanitizeDisplayFilename(file.name ?? title),
          source: "UPLOAD",
          createdBy: authed.account.id,
          initialStatus: "DRAFT",
        }));
    (await recordAudit(
            matter.id,
            "DOCUMENT_UPLOADED",
            `document=${doc.id} version=${version.id} sha256=${stored.sha256}`,
            authed.account.id
          ));
    return Response.json(
      {
        document: { id: doc.id, title: doc.title },
        version: { id: version.id, versionNo: version.versionNo, status: version.status },
      },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}
