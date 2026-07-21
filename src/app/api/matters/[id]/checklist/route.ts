/**
 * Deterministic document checklist (B12). The AUTHORITATIVE list — derived
 * from the matter's schema, category, and factual answers, never from a
 * model. Clients see plain-language requests for applicable items only;
 * staff/attorney see the full status board and can waive / flag / mark
 * incomplete (waive is attorney-only).
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getMatterAnswers, schemaForMatter } from "@/lib/db/intake2";
import { deriveChecklist } from "@/lib/intake2/engine";
import {
  CHECKLIST_DISCLAIMER,
  getConfigChecklistState,
  setChecklistOverride,
} from "@/lib/db/checklist";
import { recordAudit } from "@/lib/db/repo";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["CLIENT", "STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const schema = schemaForMatter(matter);
    const answers = (await getMatterAnswers(matter.id));
    const state = (await getConfigChecklistState(matter.id));
    const entries = deriveChecklist(schema, answers, state);

    if (authed.account.role === "CLIENT") {
      return Response.json({
        requests: entries
          .filter((e) => e.status === "REQUIRED_NOW" || e.status === "REQUESTED" || e.status === "INCOMPLETE")
          .map((e) => ({ documentId: e.documentId, title: e.title, requestText: e.requestText, status: e.status === "INCOMPLETE" ? "We need a more complete copy" : "Requested" })),
      });
    }
    return Response.json({ disclaimer: CHECKLIST_DISCLAIMER, entries });
  } catch (e) {
    return errorResponse(e);
  }
}

const patchSchema = z.object({
  documentId: z.string().trim().min(1),
  override: z.enum(["RECEIVED", "INCOMPLETE", "ATTORNEY_WAIVED", "ATTORNEY_REVIEW_REQUIRED", "CLEAR"]),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid checklist payload");
    if (parsed.data.override === "ATTORNEY_WAIVED" && authed.account.role !== "ATTORNEY") {
      throw new HttpError(403, "Waiving a checklist item is an attorney determination");
    }
    (await setChecklistOverride({
            matterId: matter.id,
            documentId: parsed.data.documentId,
            override: parsed.data.override,
            actingUserId: authed.account.id,
          }));
    (await recordAudit(matter.id, "CHECKLIST_OVERRIDE", `doc=${parsed.data.documentId} override=${parsed.data.override}`, authed.account.id));
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
