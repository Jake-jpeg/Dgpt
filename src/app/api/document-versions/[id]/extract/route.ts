/**
 * Explicit STAFF/ATTORNEY document text-extraction action (B9).
 * GET returns the pre-call summary (title/version/type/size/matter +
 * internal-use warning); POST performs the bounded local extraction.
 * Nothing is sent to any external service by this route.
 */
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getDocument, getVersion } from "@/lib/db/documents";
import { extractDocumentText, getExtraction } from "@/lib/ai/extract";
import { recordAudit } from "@/lib/db/repo";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const version = getVersion(id);
    if (!version) throw new HttpError(404, "Not found");
    const doc = getDocument(version.documentId)!;
    const matter = requireMatterAccess(authed, doc.matterId);
    return Response.json({
      preCallSummary: {
        documentTitle: doc.title,
        versionNo: version.versionNo,
        fileType: version.mime,
        sizeBytes: version.sizeBytes,
        matterId: matter.id,
        requestedAnalysis: "Local bounded text extraction (no external call from this action)",
        warning: "INTERNAL USE ONLY — extracted text becomes available to internal AI actions as untrusted data.",
      },
      extraction: getExtraction(version.id),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const version = getVersion(id);
    if (!version) throw new HttpError(404, "Not found");
    const doc = getDocument(version.documentId)!;
    const matter = requireMatterAccess(authed, doc.matterId);
    const extraction = await extractDocumentText(version.id);
    recordAudit(matter.id, "DOCUMENT_EXTRACTED", `version=${version.id} status=${extraction.status}`, authed.account.id);
    return Response.json({ extraction });
  } catch (e) {
    return errorResponse(e);
  }
}
