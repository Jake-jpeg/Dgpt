/**
 * Release ONE exact approved version — ATTORNEY only.
 *
 * Before anything moves, this re-verifies: current ATTORNEY role (from the
 * DB), the exact approved version, a live approval whose hash matches, the
 * authorized destination, AND a fresh SHA-256 of the actual stored bytes.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getFileStorage, sha256Hex } from "@/lib/storage";
import { getDocument, getVersion, releaseVersion } from "@/lib/db/documents";
import { recordAudit } from "@/lib/db/repo";

const schema = z.object({
  destination: z.enum(["CLIENT_PORTAL", "SIGNATURE", "FILING"]),
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
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid release payload");

    // Fresh hash of the actual bytes on disk — content integrity at release.
    const bytes = await getFileStorage().get(version.storageKey);
    const release = (await releaseVersion({
          versionId: version.id,
          actingUserId: authed.account.id,
          destination: parsed.data.destination,
          contentSha256: sha256Hex(bytes),
        }));
    (await recordAudit(
            matter.id,
            "DOCUMENT_RELEASED",
            `version=${version.id} destination=${release.destination} sha256=${release.sha256}`,
            authed.account.id
          ));
    return Response.json({
      release: {
        id: release.id,
        versionId: release.documentVersionId,
        destination: release.destination,
        createdAt: release.createdAt,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
