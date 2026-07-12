/**
 * Internal AI features for a matter — STAFF/ATTORNEY only.
 *
 * Every AI output is materialized as an AI_DRAFT document version in
 * ATTORNEY_REVIEW_REQUIRED status. It is internal work product: invisible
 * to the client, and it can only ever reach a client / signature / filing
 * through the attorney's version-exact approve → release path.
 *
 * When AI_FEATURES_ENABLED != "true" this endpoint answers 503 and the rest
 * of the portal is unaffected (no other code path touches OpenAI).
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { invokeInternalAi } from "@/lib/ai/openai";
import { AiDisabledError, AI_FEATURES } from "@/lib/ai/types";
import { getFileStorage } from "@/lib/storage";
import { addDocumentVersion, createDocument } from "@/lib/db/documents";
import { listSessionsByMatter, getAnswers, getIdentity } from "@/lib/db/repo";

const schema = z.object({
  feature: z.enum(AI_FEATURES),
  instruction: z.string().trim().max(4000).optional(),
});

const FEATURE_TITLES: Record<(typeof AI_FEATURES)[number], string> = {
  INTERNAL_SUMMARY: "AI internal summary (review required)",
  ISSUE_LIST: "AI issue list (review required)",
  INCONSISTENCY_REVIEW: "AI inconsistency review (review required)",
  DOCUMENT_DRAFT: "AI document draft (review required)",
};

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "bot");
    assertCsrf(req);
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = requireMatterAccess(authed, id);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid AI request");

    // Assemble structured context server-side (never raw client payloads).
    const sessions = listSessionsByMatter(matter.id);
    const context = {
      matter: { lifecycle: matter.lifecycle, conflictStatus: matter.conflictStatus },
      sessions: sessions.map((s) => ({
        state: s.state,
        tier: s.tier,
        county: s.county,
        qdroFlag: s.qdroFlag,
        attorneyFlags: s.attorneyFlags,
        identity: getIdentity(s.id),
        answers: getAnswers(s.id),
      })),
    };

    const result = await invokeInternalAi({
      feature: parsed.data.feature,
      matterId: matter.id,
      actingUserId: authed.account.id,
      context,
      instruction: parsed.data.instruction,
    });

    // Materialize as internal work product requiring attorney review.
    const bytes = new TextEncoder().encode(result.text);
    const stored = await getFileStorage().put(bytes);
    const doc = createDocument({
      matterId: matter.id,
      title: FEATURE_TITLES[parsed.data.feature],
      docKind: "AI_DRAFT",
      createdBy: authed.account.id,
    });
    const version = addDocumentVersion({
      documentId: doc.id,
      storageKey: stored.storageKey,
      sha256: stored.sha256,
      mime: "text/plain",
      sizeBytes: stored.sizeBytes,
      source: "AI",
      createdBy: authed.account.id,
      initialStatus: "ATTORNEY_REVIEW_REQUIRED",
    });

    return Response.json(
      {
        artifact: {
          documentId: doc.id,
          versionId: version.id,
          status: version.status, // ATTORNEY_REVIEW_REQUIRED — always
          title: doc.title,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof AiDisabledError) {
      return Response.json(
        { error: "Internal AI features are currently disabled. Manual workflows are unaffected." },
        { status: 503 }
      );
    }
    if (e instanceof Error && e.message.startsWith("AI_GUARD:")) {
      return Response.json({ error: e.message }, { status: 502 });
    }
    return errorResponse(e);
  }
}
