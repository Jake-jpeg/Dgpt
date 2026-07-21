/**
 * Download a document version.
 *
 *  - STAFF/ATTORNEY (granted on the matter): any version.
 *  - CLIENT (own matter): ONLY versions released to the client portal, plus
 *    their own uploads. Drafts, internal and AI documents are unreachable —
 *    404, never a hint of existence.
 * Matter-level authorization on every request; no cross-matter access.
 */
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getFileStorage } from "@/lib/storage";
import {
  getDocument,
  getVersion,
  isVersionReleasedToClient,
} from "@/lib/db/documents";
import { recordAudit } from "@/lib/db/repo";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["CLIENT", "STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const version = (await getVersion(id));
    if (!version) throw new HttpError(404, "Not found");
    const doc = (await getDocument(version.documentId))!;
    const matter = (await requireMatterAccess(authed, doc.matterId));

    if (authed.account.role === "CLIENT") {
      const isOwnUpload =
        doc.docKind === "CLIENT_UPLOAD" && doc.createdBy === authed.account.id;
      if (!(await isVersionReleasedToClient(version.id)) && !isOwnUpload) {
        throw new HttpError(404, "Not found"); // unreleased work is invisible
      }
    }

    const bytes = await getFileStorage().get(version.storageKey);
    (await recordAudit(
            matter.id,
            "DOCUMENT_DOWNLOADED",
            `version=${version.id}`,
            authed.account.id
          ));
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "content-type": version.mime,
        "content-length": String(version.sizeBytes),
        "content-disposition": `attachment; filename="${(version.originalFilename ?? "document").replace(/"/g, "")}"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
