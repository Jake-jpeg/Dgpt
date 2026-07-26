/**
 * Attorney jurisdiction & scope review (B6).
 *
 * GET  — STAFF/ATTORNEY: FACTS COLLECTED (residence/case-history answers,
 *        deterministic multi-state signals) presented separately from the
 *        ATTORNEY DETERMINATION block. When facts implicate both states the
 *        matter is flagged MULTI-JURISDICTION REVIEW REQUIRED. Nothing is
 *        auto-selected from a mailing address.
 * POST — ATTORNEY ONLY: confirm candidate/confirmed state, court/category,
 *        firm scope, schema version pin. STAFF/ADMIN are refused at the API
 *        AND by the structural role re-check in the persistence layer.
 *        The AI layer has no pathway here.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getMatterAnswers, attorneySetJurisdictionAndScope } from "@/lib/db/intake2";
import { jurisdictionSignals } from "@/lib/intake2/engine";
import { evaluateResidency } from "@/lib/legal/ny-residency";
import { guidelineYearSummary } from "@/config/legal/ny-guidelines-2026";
import { MATTER_CATEGORIES } from "@/lib/intake2/types";
import { recordAudit } from "@/lib/db/repo";
import { getUserById } from "@/lib/db/users";

const FACT_QUESTIONS = [
  "shared.residence.party_history",
  "shared.residence.spouse_history",
  "shared.residence.events_location",
  "shared.residence.military",
  "shared.residence.military_detail",
  "shared.residence.other_proceedings",
  "shared.relationship.marriage_state",
  "shared.children.residence_history",
  "shared.priors.records",
];

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const answers = (await getMatterAnswers(matter.id));
    const signals = jurisdictionSignals(answers);
    return Response.json({
      // The card the attorney actually reads: green PASS or yellow REVIEW,
      // with the WHY spelled out. Deterministic; no attorney form to fill.
      residency: evaluateResidency(answers),
      // Which year's spousal-maintenance and child-support numbers this build
      // applies — printed on the lawyer panel per operator directive.
      guidelines: guidelineYearSummary(),
      factsCollected: Object.fromEntries(
        FACT_QUESTIONS.map((q) => [q, answers[q] ?? null])
      ),
      signals: {
        ...signals,
        note: signals.multiJurisdiction
          ? "MULTI-JURISDICTION REVIEW REQUIRED — facts implicate a state other than New York."
          : "Deterministic residence-history signal only. Confirmation is an attorney determination; nothing is auto-selected from an address.",
      },
      attorneyDetermination: {
        jurisdictionCandidate: matter.jurisdictionCandidate,
        jurisdictionConfirmed: matter.jurisdictionConfirmed,
        jurisdictionConfirmedBy: matter.jurisdictionConfirmedBy
          ? ((await getUserById(matter.jurisdictionConfirmedBy))?.email ?? matter.jurisdictionConfirmedBy)
          : null,
        jurisdictionConfirmedAt: matter.jurisdictionConfirmedAt,
        matterCategory: matter.matterCategory,
        scopeStatus: matter.scopeStatus,
        scopeNotes: matter.scopeNotes,
        intakeSchemaVersion: matter.intakeSchemaVersion,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

const postSchema = z.object({
  jurisdictionCandidate: z.string().trim().max(60).optional(),
  jurisdictionConfirmed: z.enum(["NY"]).nullable().optional(),
  matterCategory: z.enum(MATTER_CATEGORIES).nullable().optional(),
  scopeStatus: z
    .enum(["UNREVIEWED", "UNDER_REVIEW", "ACCEPTED", "DECLINED", "MULTI_JURISDICTION_REVIEW_REQUIRED"])
    .optional(),
  scopeNotes: z.string().trim().max(4000).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const parsed = postSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid jurisdiction payload");

    const updated = (await attorneySetJurisdictionAndScope({
          matterId: matter.id,
          actingUserId: authed.account.id,
          ...parsed.data,
        }));
    (await recordAudit(
            matter.id,
            "JURISDICTION_SCOPE_SET",
            `jurisdiction=${updated.jurisdictionConfirmed ?? "-"} category=${updated.matterCategory ?? "-"} scope=${updated.scopeStatus}`,
            authed.account.id
          ));
    return Response.json({
      matter: {
        id: updated.id,
        jurisdictionConfirmed: updated.jurisdictionConfirmed,
        matterCategory: updated.matterCategory,
        scopeStatus: updated.scopeStatus,
        intakeSchemaVersion: updated.intakeSchemaVersion,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
