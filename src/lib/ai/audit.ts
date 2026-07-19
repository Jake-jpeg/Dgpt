/**
 * AI invocation audit — METADATA ONLY, by construction.
 *
 * This module's insert writes feature, model, status, matter ref, user ref,
 * timestamp. There are no columns for prompts, document contents, or model
 * responses, so confidential content cannot land in the audit trail even by
 * mistake. Never add such columns.
 */
import { getDb, newId, nowIso } from "@/lib/db/index";
import { recordAudit } from "@/lib/db/repo";
import type { AiFeature } from "./types";

export function logAiInvocation(opts: {
  matterId: string | null;
  userId: string;
  feature: AiFeature;
  model: string;
  status: "OK" | "ERROR" | "DISABLED" | "DENIED";
  /**
   * Failure classification for ERROR rows — an HTTP status code, "timeout",
   * or "no-content". METADATA ONLY: a status code says what happened without
   * saying anything about the request. Never a provider body, which can echo
   * prompt content.
   */
  detail?: string;
}): void {
  getDb()
    .prepare(
      `INSERT INTO ai_invocation (id, matter_ref, user_ref, feature, model, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(newId(), opts.matterId, opts.userId, opts.feature, opts.model, opts.status, nowIso());
  recordAudit(
    opts.matterId ?? "no-matter",
    "AI_INVOCATION",
    `feature=${opts.feature} model=${opts.model} status=${opts.status}` +
      (opts.detail ? ` detail=${opts.detail}` : ""),
    opts.userId
  );
}

export function listAiInvocations(matterId: string) {
  return getDb()
    .prepare(`SELECT feature, model, status, created_at FROM ai_invocation WHERE matter_ref = ? ORDER BY created_at DESC`)
    .all(matterId) as { feature: string; model: string; status: string; created_at: string }[];
}
