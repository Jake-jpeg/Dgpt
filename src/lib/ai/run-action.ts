/**
 * Internal AI action orchestrator (B7/B8): guards → context assembly →
 * Responses API structured call → three-layer validation → materialize as
 * an AI_DRAFT document version in ATTORNEY_REVIEW_REQUIRED.
 *
 * Guarantees:
 *  - STAFF/ATTORNEY only, role re-read from the DB at invocation;
 *  - AI_FEATURES_ENABLED=false ⇒ AiDisabledError BEFORE any network call —
 *    the rest of the portal is untouched;
 *  - invalid output (schema/citation/provenance) is NEVER saved as work
 *    product: invocation recorded REJECTED_OUTPUT with a privacy-minimizing
 *    audit event;
 *  - metadata-only logging (response ID, model, prompt version, latency,
 *    tokens) — never prompts, contents, or responses;
 *  - the client-follow-up draft cannot send itself: it is a document
 *    version like every other artifact and follows the attorney approval →
 *    release path.
 */
import { getDb, newId, nowIso } from "@/lib/db/index";
import { recordAudit } from "@/lib/db/repo";
import { getUserById } from "@/lib/db/users";
import { getMatter } from "@/lib/db/matters";
import { getMatterAnswers, schemaForMatter } from "@/lib/db/intake2";
import { deriveChecklist, jurisdictionSignals, missingRequired } from "@/lib/intake2/engine";
import { getConfigChecklistState } from "@/lib/db/checklist";
import { listDocumentsForMatter, listVersions, addDocumentVersion, createDocument } from "@/lib/db/documents";
import { getExtraction } from "./extract";
import { listAuthorities } from "@/lib/legal/authority";
import { getFileStorage } from "@/lib/storage";
import { AiDisabledError } from "./types";
import { callStructured, aiModel, AiConfigError } from "./responses";
import { ACTION_KIND, AI_ACTIONS, reportJsonSchema, validateAiReport, type AiAction, type AiReport } from "./schemas2";
import { ACTION_TITLES, PROMPT_VERSION, systemPrompt, userPrompt } from "./actions";

function aiEnabled(): boolean {
  return process.env.AI_FEATURES_ENABLED === "true" && Boolean(process.env.ANTHROPIC_API_KEY);
}

function logInvocation(opts: {
  matterId: string;
  userId: string;
  action: AiAction;
  model: string;
  status: "OK" | "ERROR" | "DISABLED" | "DENIED" | "REJECTED_OUTPUT";
  responseId?: string | null;
  latencyMs?: number | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
}): void {
  getDb()
    .prepare(
      `INSERT INTO ai_invocation (id, matter_ref, user_ref, feature, model, status, response_id, prompt_version, latency_ms, tokens_in, tokens_out, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      newId(),
      opts.matterId,
      opts.userId,
      opts.action,
      opts.model,
      opts.status,
      opts.responseId ?? null,
      PROMPT_VERSION,
      opts.latencyMs ?? null,
      opts.tokensIn ?? null,
      opts.tokensOut ?? null,
      nowIso()
    );
  recordAudit(
    opts.matterId,
    "AI_INVOCATION",
    `feature=${opts.action} model=${opts.model} status=${opts.status} promptVersion=${PROMPT_VERSION}${opts.responseId ? ` responseId=${opts.responseId}` : ""}`,
    opts.userId
  );
}

/** Assemble the matter context the model may see (all IDs are citable). */
export function buildMatterContext(matterId: string): {
  contextJson: string;
  answerIds: Set<string>;
  documentVersionIds: Set<string>;
} {
  const matter = getMatter(matterId);
  if (!matter) throw new Error("VALIDATION: matter not found");
  const schema = schemaForMatter(matter);
  const answers = getMatterAnswers(matterId);
  const prompts = new Map(schema.items.map((i) => [i.id, i.prompt]));

  const documents = listDocumentsForMatter(matterId).flatMap((d) =>
    listVersions(d.id).map((v) => {
      const ex = getExtraction(v.id);
      return {
        documentVersionId: v.id,
        title: d.title,
        kind: d.docKind,
        versionNo: v.versionNo,
        status: v.status,
        filename: v.originalFilename,
        extraction: ex
          ? { status: ex.status, locator: ex.locatorNote, text: ex.text?.slice(0, 6000) ?? null }
          : null,
      };
    })
  );

  const context = {
    matter: {
      category: matter.matterCategory,
      jurisdictionConfirmed: matter.jurisdictionConfirmed,
      scopeStatus: matter.scopeStatus,
      conflictStatus: matter.conflictStatus,
      schemaVersion: schema.version,
    },
    jurisdictionFacts: jurisdictionSignals(answers),
    intakeAnswers: Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      question: prompts.get(questionId) ?? questionId,
      value,
    })),
    missingRequired: missingRequired(schema, answers).map((i) => ({ questionId: i.id, question: i.prompt })),
    checklist: deriveChecklist(schema, answers, getConfigChecklistState(matterId)).map((e) => ({
      documentId: e.documentId,
      title: e.title,
      status: e.status,
    })),
    documents,
    allowedLegalAuthoritySnapshot: listAuthorities(
      (matter.jurisdictionConfirmed as "NJ" | "NY" | null) ?? undefined
    ).map((a) => ({ id: a.id, section: a.section, proposition: a.proposition, status: a.status, jurisdiction: a.jurisdiction })),
  };

  return {
    contextJson: JSON.stringify(context, null, 1),
    answerIds: new Set(Object.keys(answers)),
    documentVersionIds: new Set(documents.map((d) => d.documentVersionId)),
  };
}

export interface RunActionResult {
  report: AiReport;
  documentId: string;
  versionId: string;
  status: string;
  responseId: string | null;
  model: string;
}

export async function runAiAction(opts: {
  matterId: string;
  actingUserId: string;
  action: AiAction;
  instruction?: string;
}): Promise<RunActionResult> {
  if (!(AI_ACTIONS as readonly string[]).includes(opts.action)) {
    throw new Error("VALIDATION: unknown AI action");
  }
  const model = aiModel();
  const actor = getUserById(opts.actingUserId);
  if (!actor || !actor.active || (actor.role !== "STAFF" && actor.role !== "ATTORNEY")) {
    logInvocation({ matterId: opts.matterId, userId: opts.actingUserId, action: opts.action, model, status: "DENIED" });
    throw new Error("AI_GUARD: only STAFF or ATTORNEY may invoke internal AI features");
  }
  if (!aiEnabled()) {
    logInvocation({ matterId: opts.matterId, userId: actor.id, action: opts.action, model, status: "DISABLED" });
    throw new AiDisabledError();
  }

  const { contextJson, answerIds, documentVersionIds } = buildMatterContext(opts.matterId);
  const kind = ACTION_KIND[opts.action];

  let call;
  try {
    call = await callStructured({
      model,
      system: systemPrompt(),
      user: userPrompt(opts.action, contextJson, opts.instruction),
      schemaName: kind,
      jsonSchema: reportJsonSchema(kind),
      matterId: opts.matterId,
    });
  } catch (e) {
    logInvocation({ matterId: opts.matterId, userId: actor.id, action: opts.action, model, status: "ERROR" });
    if (e instanceof AiConfigError) throw e;
    throw e instanceof Error ? e : new Error("AI_GUARD: provider request failed");
  }

  const { report, problems } = validateAiReport(kind, call.parsed, { answerIds, documentVersionIds });
  if (!report) {
    // Unknown citation / bad shape / bad provenance: reject, never save.
    logInvocation({
      matterId: opts.matterId,
      userId: actor.id,
      action: opts.action,
      model: call.model,
      status: "REJECTED_OUTPUT",
      responseId: call.responseId,
      latencyMs: call.latencyMs,
      tokensIn: call.tokensIn,
      tokensOut: call.tokensOut,
    });
    recordAudit(
      opts.matterId,
      "AI_OUTPUT_REJECTED",
      `feature=${opts.action} problems=${problems.map((p) => p.code).join(",")}`,
      actor.id
    );
    throw new Error(`AI_GUARD: structured output rejected (${problems[0]?.code}: ${problems[0]?.detail?.slice(0, 140)})`);
  }

  // Materialize as internal work product — ATTORNEY_REVIEW_REQUIRED, always.
  const bytes = new TextEncoder().encode(JSON.stringify(report, null, 2));
  const stored = await getFileStorage().put(bytes);
  const doc = createDocument({
    matterId: opts.matterId,
    title: ACTION_TITLES[opts.action],
    docKind: "AI_DRAFT",
    createdBy: actor.id,
  });
  const version = addDocumentVersion({
    documentId: doc.id,
    storageKey: stored.storageKey,
    sha256: stored.sha256,
    mime: "application/json",
    sizeBytes: stored.sizeBytes,
    source: "AI",
    createdBy: actor.id,
    initialStatus: "ATTORNEY_REVIEW_REQUIRED",
  });

  logInvocation({
    matterId: opts.matterId,
    userId: actor.id,
    action: opts.action,
    model: call.model,
    status: "OK",
    responseId: call.responseId,
    latencyMs: call.latencyMs,
    tokensIn: call.tokensIn,
    tokensOut: call.tokensOut,
  });

  return {
    report,
    documentId: doc.id,
    versionId: version.id,
    status: version.status,
    responseId: call.responseId,
    model: call.model,
  };
}
