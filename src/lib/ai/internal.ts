/**
 * The four free-text internal features (INTERNAL_SUMMARY, ISSUE_LIST,
 * INCONSISTENCY_REVIEW, DOCUMENT_DRAFT), running on the SINGLE provider
 * client in ./responses.ts.
 *
 * This replaces the former src/lib/ai/anthropic.ts, which duplicated the
 * endpoint, headers, and error handling — and was the last fetch() in the
 * codebase with no AbortController, so a hung provider connection could
 * hang the request indefinitely. Folding it here means one timeout policy,
 * one retry policy, one key-validation path, one place to audit.
 *
 * Every guard the old file enforced is enforced here, in the same order:
 *  - SERVER-ONLY: invoking from a browser context throws before anything.
 *  - Structural role guard: the acting user's CURRENT role is re-read from
 *    the database; STAFF/ATTORNEY only. A demoted staffer is DENIED even
 *    mid-session.
 *  - Kill switch: AI_FEATURES_ENABLED must be exactly "true" AND a key must
 *    be configured, else AiDisabledError BEFORE any network call.
 *  - Audit statuses DENIED / DISABLED / OK / ERROR, metadata only. ERROR
 *    rows now also carry a failure classification (HTTP status, timeout,
 *    no-content) which the old path dropped entirely.
 *
 * These features remain FREE TEXT: the model returns a single `text` field
 * through a minimal forced tool, and the result lands as an AI_DRAFT
 * document version in ATTORNEY_REVIEW_REQUIRED, exactly as before. The
 * forced tool is a transport detail, not a change in what they produce.
 */
import { envOptional } from "@/lib/env";
import { getUserById } from "@/lib/db/users";
import { logAiInvocation } from "./audit";
import {
  AiDisabledError,
  type AiFeature,
  type AiInvocationInput,
  type AiInvocationResult,
} from "./types";
import { callStructured, AiConfigError, DEFAULT_ANTHROPIC_MODEL } from "./responses";
import * as internalSummary from "./prompts/internal-summary";
import * as issueList from "./prompts/issue-list";
import * as inconsistencyReview from "./prompts/inconsistency-review";
import * as documentDraft from "./prompts/document-draft";

export function aiFeaturesEnabled(): boolean {
  return process.env.AI_FEATURES_ENABLED === "true" && Boolean(envOptional("ANTHROPIC_API_KEY"));
}

export function aiModel(): string {
  return envOptional("ANTHROPIC_MODEL") ?? DEFAULT_ANTHROPIC_MODEL;
}

function assertServerOnly(): void {
  if (typeof window !== "undefined") {
    throw new Error("AI_GUARD: the AI layer is server-only");
  }
}

/**
 * Minimal forced-tool schema. These features produce prose for an attorney
 * to read, so the only structure is "give me the prose in one field".
 */
const FREE_TEXT_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    text: {
      type: "string",
      description:
        "The complete internal work product as plain text, for attorney review.",
    },
  },
  required: ["text"],
  additionalProperties: false,
};

function promptFor(
  feature: AiFeature,
  context: Record<string, unknown>,
  instruction?: string
): { system: string; user: string } {
  switch (feature) {
    case "INTERNAL_SUMMARY":
      return { system: internalSummary.SYSTEM_PROMPT, user: internalSummary.buildPrompt(context) };
    case "ISSUE_LIST":
      return { system: issueList.SYSTEM_PROMPT, user: issueList.buildPrompt(context) };
    case "INCONSISTENCY_REVIEW":
      return {
        system: inconsistencyReview.SYSTEM_PROMPT,
        user: inconsistencyReview.buildPrompt(context),
      };
    case "DOCUMENT_DRAFT":
      return { system: documentDraft.SYSTEM_PROMPT, user: documentDraft.buildPrompt(context, instruction) };
  }
}

/** Classify a failure for the audit row — metadata only, never a body. */
function classify(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  const http = msg.match(/HTTP (\d{3})/);
  if (http) return `http-${http[1]}`;
  if (/timed out/i.test(msg)) return "timeout";
  if (/no structured output|no content/i.test(msg)) return "no-content";
  if (e instanceof AiConfigError) return "config";
  return "transport";
}

/**
 * The ONLY entry point for the free-text internal features. Everything
 * funnels through here so the guards cannot be skipped.
 */
export async function invokeInternalAi(input: AiInvocationInput): Promise<AiInvocationResult> {
  assertServerOnly();
  const model = aiModel();

  // Structural role guard — CURRENT role from the DB, STAFF/ATTORNEY only.
  const actor = getUserById(input.actingUserId);
  if (!actor || !actor.active || (actor.role !== "STAFF" && actor.role !== "ATTORNEY")) {
    logAiInvocation({
      matterId: input.matterId,
      userId: input.actingUserId,
      feature: input.feature,
      model,
      status: "DENIED",
    });
    throw new Error("AI_GUARD: only STAFF or ATTORNEY may invoke internal AI features");
  }

  if (!aiFeaturesEnabled()) {
    logAiInvocation({
      matterId: input.matterId,
      userId: actor.id,
      feature: input.feature,
      model,
      status: "DISABLED",
    });
    throw new AiDisabledError();
  }

  const { system, user } = promptFor(input.feature, input.context, input.instruction);

  let call;
  try {
    call = await callStructured({
      model,
      system,
      user,
      schemaName: `INTERNAL_${input.feature}`,
      jsonSchema: FREE_TEXT_SCHEMA,
      matterId: input.matterId,
    });
  } catch (e) {
    logAiInvocation({
      matterId: input.matterId,
      userId: actor.id,
      feature: input.feature,
      model,
      status: "ERROR",
      detail: classify(e),
    });
    // Preserve AiConfigError and AI_GUARD messages; never echo a payload.
    if (e instanceof AiConfigError) throw e;
    if (e instanceof Error && e.message.startsWith("AI_GUARD:")) throw e;
    throw new Error("AI_GUARD: provider request failed");
  }

  const parsed = call.parsed as { text?: unknown } | null;
  const text = typeof parsed?.text === "string" ? parsed.text : "";
  if (!text.trim()) {
    logAiInvocation({
      matterId: input.matterId,
      userId: actor.id,
      feature: input.feature,
      model,
      status: "ERROR",
      detail: "no-content",
    });
    throw new Error("AI_GUARD: provider returned no content");
  }

  logAiInvocation({
    matterId: input.matterId,
    userId: actor.id,
    feature: input.feature,
    model: call.model,
    status: "OK",
  });
  return { feature: input.feature, model: call.model, text };
}
