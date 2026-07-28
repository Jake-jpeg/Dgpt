/**
 * Deterministic PDF rendering (Parts 3–4) — ATTORNEY ONLY.
 *
 * POST { state, form, confirmFormData: true }
 *
 * The attorney's request IS the confirmation of the deterministic form
 * data (audited FORM_DATA_CONFIRMED with a payload fingerprint). The
 * rendered PDF is stored as a NEW document version in
 * ATTORNEY_REVIEW_REQUIRED — approval of the source data never approves
 * the PDF; the PDF needs its own exact-version approval before any
 * release. Nothing here releases automatically, and the AI layer has no input
 * into endpoint, state, form, filename, or permissions.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getMatterAnswers, attorneySetJurisdictionAndScope } from "@/lib/db/intake2";
import { UNCONTESTED_CATEGORY } from "@/config/intake/phases";
import type { MatterCategory } from "@/lib/intake2/types";
import { recordAudit } from "@/lib/db/repo";
import { getFileStorage } from "@/lib/storage";
import { addDocumentVersion, createDocument } from "@/lib/db/documents";
import { isAllowedRender, renderLabel, docxAvailable, PdfServiceError, ALLOWED_RENDERS } from "@/lib/pdf-service/types";
import { buildRenderPayload } from "@/lib/pdf-service/mappings";
import { pdfServiceEnabled, renderPdf } from "@/lib/pdf-service/client";
import { auditFormDataConfirmed, auditPdfRendered } from "@/lib/pdf-service/audit";

const schema = z.object({
  state: z.enum(["ny"]),
  form: z.string().trim().min(1).max(40),
  confirmFormData: z.literal(true),
  // "pdf" (default) or "docx" — Word builds exist for the DOCX_FORMS set
  // only (operator directive 2026-07-27: attorneys download forms in Word).
  format: z.enum(["pdf", "docx"]).optional(),
});

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  // Allowlist + readiness inspection for the workbench panel.
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    return Response.json({
      enabled: pdfServiceEnabled(),
      jurisdictionConfirmed: matter.jurisdictionConfirmed,
      allowedRenders: ALLOWED_RENDERS.filter(
        (r) => !matter.jurisdictionConfirmed || r.state === matter.jurisdictionConfirmed.toLowerCase()
      ),
      note:
        "Rendering is an attorney action. The rendered PDF starts ATTORNEY_REVIEW_REQUIRED and needs its own exact-version approval before any release.",
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid render request");
    const { state, form } = parsed.data;
    const format = parsed.data.format === "docx" ? "docx" : "pdf";

    if (!isAllowedRender(state, form)) {
      throw new HttpError(400, "VALIDATION: that state/form pair is not on the render allowlist");
    }
    if (format === "docx" && !docxAvailable(state, form)) {
      throw new HttpError(400, "VALIDATION: no Word build for that form yet — request PDF");
    }
    // NY-only product. A matter opened by staff can reach an attorney with no
    // jurisdiction row set, and there is no jurisdiction form any more to set
    // it (operator directive 2026-07-26). An ATTORNEY asking to render a NY
    // form on a New York-only product IS the determination — so record it,
    // audited, instead of dead-ending the render. A confirmed non-NY matter
    // still refuses: that would be a real conflict, not a blank field.
    if (!matter.jurisdictionConfirmed && state === "ny") {
      await attorneySetJurisdictionAndScope({
        matterId: matter.id,
        actingUserId: authed.account.id,
        jurisdictionConfirmed: "NY",
        matterCategory: UNCONTESTED_CATEGORY as MatterCategory,
      });
      await recordAudit(matter.id, "JURISDICTION_SCOPE_SET", "jurisdiction=NY (confirmed by the attorney's render request on a NY-only product)", authed.account.id);
    } else if (!matter.jurisdictionConfirmed || matter.jurisdictionConfirmed.toLowerCase() !== state) {
      throw new HttpError(
        409,
        "JURISDICTION_GUARD: this matter is confirmed to another state — it cannot render that state's forms"
      );
    }
    if (matter.conflictStatus !== "CLEARED" && matter.conflictStatus !== "EXTERNAL") {
      throw new HttpError(409, "CONFLICT_GUARD: matter is not cleared");
    }
    if (!pdfServiceEnabled()) {
      return Response.json(
        { error: "PDF rendering is currently disabled. Manual document workflows are unaffected." },
        { status: 503 }
      );
    }

    // Deterministic mapping from SAVED answers — the attorney's request is
    // the confirmation of this data (fingerprint audited).
    const payload = buildRenderPayload(state, form, matter, (await getMatterAnswers(matter.id)));
    (await auditFormDataConfirmed({ matterId: matter.id, userId: authed.account.id, state, form, payload }));

    const result = await renderPdf({ state, form, payload, format });

    const stored = await getFileStorage().put(result.bytes);
    if (stored.sha256 !== result.sha256) {
      throw new PdfServiceError("PDF_GUARD: stored bytes do not match the rendered hash");
    }
    // Stage-aware labeling: staging keeps the loud synthetic marker; every
    // other stage uses the production label. Review posture never changes —
    // the version below starts ATTORNEY_REVIEW_REQUIRED regardless of stage.
    const stageMarker =
      process.env.APP_STAGE === "staging"
        ? " — SYNTHETIC STAGING DOCUMENT (attorney review required)"
        : " — attorney review required";
    const doc = (await createDocument({
          matterId: matter.id,
          title: `${renderLabel(state, form)}${format === "docx" ? " (Word)" : ""}${stageMarker}`,
          docKind: "RENDERED_FORM",
          createdBy: authed.account.id,
        }));
    const version = (await addDocumentVersion({
          documentId: doc.id,
          storageKey: stored.storageKey,
          sha256: stored.sha256,
          mime:
            format === "docx"
              ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              : "application/pdf",
          sizeBytes: stored.sizeBytes,
          originalFilename: result.filename,
          source: "INTERNAL",
          createdBy: authed.account.id,
          initialStatus: "ATTORNEY_REVIEW_REQUIRED",
        }));
    (await auditPdfRendered({
            matterId: matter.id,
            userId: authed.account.id,
            state,
            form,
            versionId: version.id,
            sha256: stored.sha256,
            sizeBytes: stored.sizeBytes,
            latencyMs: result.latencyMs,
            retried: result.retried,
          }));

    return Response.json(
      {
        artifact: {
          documentId: doc.id,
          versionId: version.id,
          status: version.status, // ATTORNEY_REVIEW_REQUIRED — always
          title: doc.title,
          sha256: stored.sha256,
          filename: result.filename,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof PdfServiceError) {
      return Response.json({ error: e.message }, { status: 502 });
    }
    return errorResponse(e);
  }
}
