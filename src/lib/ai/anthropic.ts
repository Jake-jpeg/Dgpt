/**
 * Anthropic service layer — SERVER-ONLY, the single place the legacy
 * feature path talks to the application's ONLY AI provider (Anthropic,
 * Claude Sonnet family). The structured workbench path lives in
 * ./responses.ts; both use the same Messages endpoint and guards.
 *
 * Hard rules enforced here:
 *  - Server-only: importing/invoking from a browser context throws.
 *  - Secrets come from ANTHROPIC_API_KEY. No NEXT_PUBLIC_* variable is
 *    read, ever.
 *  - Only STAFF and ATTORNEY may invoke: the acting user's CURRENT role is
 *    re-read from the database inside this function.
 *  - Kill switch: AI_FEATURES_ENABLED must be exactly "true" — otherwise
 *    AiDisabledError is thrown BEFORE any network call, and the rest of the
 *    portal (intake, uploads, document review, manual workflows) is
 *    untouched because nothing else imports this client.
 *  - NOTHING confidential is logged: no prompts, no document contents, no
 *    responses, no keys/tokens/cookies. Only metadata reaches the audit
 *    trail (src/lib/ai/audit.ts is metadata-only by schema).
 *  - AI never communicates with clients, controls permissions, clears
 *    conflicts, approves/releases documents, or claims attorney review —
 *    those are separate structural guards that do not consult this layer.
 */
import { envOptional } from "@/lib/env";
import { getUserById } from "@/lib/db/users";
import { logAiInvocation } from "./audit";
import { AiDisabledError, type AiFeature, type AiInvocationInput, type AiInvocationResult } from "./types";
import { messagesUrl, aiMaxOutputTokens, safetyIdentifier, DEFAULT_ANTHROPIC_MODEL } from "./responses";
import * as internalSummary from "./prompts/internal-summary";
import * as issueList from "./prompts/issue-list";
import * as inconsistencyReview from "./prompts/inconsistency-review";
import * as documentDraft from "./prompts/document-draft";

const ANTHROPIC_VERSION = "2023-06-01";

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

function promptFor(feature: AiFeature, context: Record<string, unknown>, instruction?: string): { system: string; user: string } {
  switch (feature) {
    case "INTERNAL_SUMMARY":
      return { system: internalSummary.SYSTEM_PROMPT, user: internalSummary.buildPrompt(context) };
    case "ISSUE_LIST":
      return { system: issueList.SYSTEM_PROMPT, user: issueList.buildPrompt(context) };
    case "INCONSISTENCY_REVIEW":
      return { system: inconsistencyReview.SYSTEM_PROMPT, user: inconsistencyReview.buildPrompt(context) };
    case "DOCUMENT_DRAFT":
      return { system: documentDraft.SYSTEM_PROMPT, user: documentDraft.buildPrompt(context, instruction) };
  }
}

/**
 * The ONLY function on this path that calls the provider. Everything an
 * internal feature needs funnels through here so the guards cannot be
 * skipped.
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
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-api-key": envOptional("ANTHROPIC_API_KEY") ?? "",
    "anthropic-version": ANTHROPIC_VERSION,
  };

  try {
    const res = await fetch(messagesUrl(), {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        max_tokens: aiMaxOutputTokens(),
        system,
        messages: [{ role: "user", content: user }],
        temperature: 0.2,
        metadata: { user_id: safetyIdentifier(input.matterId) },
      }),
    });
    if (!res.ok) {
      // Status code only — response bodies can echo prompt content.
      logAiInvocation({ matterId: input.matterId, userId: actor.id, feature: input.feature, model, status: "ERROR" });
      throw new Error(`AI_GUARD: provider request failed (HTTP ${res.status})`);
    }
    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text = data.content
      ?.filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("");
    if (!text) {
      logAiInvocation({ matterId: input.matterId, userId: actor.id, feature: input.feature, model, status: "ERROR" });
      throw new Error("AI_GUARD: provider returned no content");
    }
    logAiInvocation({ matterId: input.matterId, userId: actor.id, feature: input.feature, model, status: "OK" });
    return { feature: input.feature, model, text };
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("AI_GUARD:")) throw e;
    // Network-level failure: metadata only, never the error payload (it can
    // contain request fragments).
    logAiInvocation({ matterId: input.matterId, userId: actor.id, feature: input.feature, model, status: "ERROR" });
    throw new Error("AI_GUARD: provider request failed");
  }
}
