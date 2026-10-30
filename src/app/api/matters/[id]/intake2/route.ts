/**
 * Schema-driven NY intake.
 *
 * GET — role-shaped view: sections, visible items (client sees CLIENT items
 *       only — no statutes, no internal source records, no attorney
 *       determinations), current answers, progress, missing items. Before
 *       the attorney assigns a workflow, the shared factual core is served
 *       with neutral "the firm is reviewing which workflow applies" copy.
 * PUT — save answers (client: own matter, CLIENT items; staff: +STAFF
 *       items). Structurally blocked before attorney conflict clearance.
 */
import { matterIntakePhase } from "@/config/intake/phases";
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import {
  getMatterAnswers,
  saveMatterAnswers,
  schemaForMatter,
} from "@/lib/db/intake2";
import { missingRequired, sectionProgress, visibleItems } from "@/lib/intake2/engine";
import { recordAudit } from "@/lib/db/repo";
import { partyRoleForUser, type PartyRole } from "@/lib/db/parties";
import type { AuthedUser } from "@/lib/auth/authz";
import type { MatterRow } from "@/lib/db/matters";

/**
 * Whose answers (2026-10-30). A CLIENT is always their own party — the
 * query string is ignored for them, so no client can read the other
 * spouse's answers by editing a URL. The firm picks ?party=A|B (default A).
 */
async function resolveParty(req: Request, authed: AuthedUser, matter: MatterRow): Promise<PartyRole> {
  if (authed.account.role === "CLIENT") {
    const role = await partyRoleForUser(matter, authed.account.id);
    if (!role) throw new HttpError(404, "Matter not found");
    return role;
  }
  const q = new URL(req.url).searchParams.get("party");
  return q === "B" ? "B" : "A";
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["CLIENT", "STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const role = authed.account.role;

    if (role === "CLIENT" && matter.conflictStatus !== "CLEARED" && matter.conflictStatus !== "EXTERNAL") {
      return Response.json({
        status:
          "Your information has been submitted for review. The firm will contact you regarding the next step.",
        available: false,
      });
    }

    const schema = schemaForMatter(matter);
    const party = await resolveParty(req, authed, matter);
    const answers = (await getMatterAnswers(matter.id, party));
    const audience = role === "CLIENT" ? "CLIENT" : role === "STAFF" ? "STAFF" : "ATTORNEY";
    const phase = matterIntakePhase(matter);
    const items = visibleItems(schema, answers, audience, phase).map((i) => ({
      id: i.id,
      section: i.section,
      prompt: i.prompt,
      helpText: i.helpText,
      type: i.type,
      required: i.required,
      options: i.options,
      sensitive: i.sensitive,
      // authorityIds and reviewStatus are INTERNAL — never sent to clients.
      ...(role !== "CLIENT" ? { authorityIds: i.authorityIds, audience: i.audience } : {}),
    }));
    const clientAnswers: Record<string, unknown> = {};
    for (const i of items) {
      if (answers[i.id] !== undefined) clientAnswers[i.id] = answers[i.id];
    }
    return Response.json({
      available: true,
      party,
      workflowAssigned: Boolean(matter.matterCategory),
      workflowMessage: matter.matterCategory
        ? `Your attorney has assigned this matter to the New York intake workflow.`
        : "The firm is reviewing which workflow applies. Please answer the residence and case-history questions so your attorney can determine the appropriate jurisdiction and process.",
      schema: {
        id: schema.id,
        version: schema.version,
        sections: schema.sections,
      },
      items,
      answers: clientAnswers,
      progress: sectionProgress(schema, answers, phase),
      missingRequired: missingRequired(schema, answers, phase).map((i) => ({
        id: i.id,
        section: i.section,
        prompt: i.prompt,
      })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

const putSchema = z.object({
  answers: z
    .array(z.object({ questionId: z.string().trim().min(1), value: z.unknown() }))
    .min(1)
    .max(120),
});

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["CLIENT", "STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const parsed = putSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid answers payload");
    const party = await resolveParty(req, authed, matter);
    const result = (await saveMatterAnswers({
          matterId: matter.id,
          partyId: party,
          actingUserId: authed.account.id,
          answers: parsed.data.answers.map((a) => ({ questionId: a.questionId, value: a.value ?? null })),
        }));
    (await recordAudit(matter.id, "INTAKE2_ANSWERS_SAVED", `party=${party} count=${result.saved}`, authed.account.id));
    return Response.json({ saved: result.saved });
  } catch (e) {
    return errorResponse(e);
  }
}
