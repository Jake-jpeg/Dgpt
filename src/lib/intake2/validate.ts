/**
 * Startup schema validation — the application REFUSES TO START when the
 * intake configuration is structurally unsound:
 *   1. duplicated question IDs;
 *   2. a condition referencing a nonexistent question;
 *   3. a referenced legal-authority ID missing from the snapshot;
 *   4. a required choice question with no allowed values;
 *   5. a client-audience question typed attorney_determination
 *      (client/attorney-only output conflict);
 *   6. an active schema referencing a RETIRED authority;
 *   7. an active schema without a version.
 * Plus: document references must exist in the schema's catalog.
 */
import type { Condition, IntakeSchema } from "./types";
import { listSchemas } from "@/config/intake/schemas";
import { getAuthority, isKnownAuthorityId } from "@/lib/legal/authority";

function conditionQuestionIds(cond: Condition): string[] {
  switch (cond.kind) {
    case "all":
    case "any":
      return cond.conditions.flatMap(conditionQuestionIds);
    default:
      return [cond.questionId];
  }
}

export function validateSchema(schema: IntakeSchema): string[] {
  const errors: string[] = [];
  if (!schema.version || !schema.version.trim()) {
    errors.push(`${schema.id}: active schema lacks a version`);
  }
  const ids = new Set<string>();
  const sectionIds = new Set(schema.sections.map((s) => s.id));
  const docIds = new Set(schema.documents.map((d) => d.id));

  for (const item of schema.items) {
    if (ids.has(item.id)) errors.push(`${schema.id}: duplicated question ID ${item.id}`);
    ids.add(item.id);
    if (!sectionIds.has(item.section)) {
      errors.push(`${schema.id}: ${item.id} references unknown section ${item.section}`);
    }
    if ((item.type === "single_select" || item.type === "multi_select") && !(item.options && item.options.length > 0)) {
      errors.push(`${schema.id}: ${item.id} is a choice question with no allowed values`);
    }
    if (item.type === "attorney_determination" && item.audience === "CLIENT") {
      errors.push(`${schema.id}: ${item.id} is an attorney-only determination marked client-visible`);
    }
    for (const authorityId of item.authorityIds) {
      if (!isKnownAuthorityId(authorityId)) {
        errors.push(`${schema.id}: ${item.id} references missing legal-source ID ${authorityId}`);
      } else if (getAuthority(authorityId)!.status === "RETIRED") {
        errors.push(`${schema.id}: ${item.id} references RETIRED authority ${authorityId}`);
      }
    }
    for (const d of item.documentIds ?? []) {
      if (!docIds.has(d)) errors.push(`${schema.id}: ${item.id} references unknown document ${d}`);
    }
  }
  // Conditions may reference any question in the composed schema.
  for (const item of schema.items) {
    if (!item.condition) continue;
    for (const qid of conditionQuestionIds(item.condition)) {
      if (!ids.has(qid)) {
        errors.push(`${schema.id}: ${item.id} condition references nonexistent question ${qid}`);
      }
    }
  }
  return errors;
}

export function validateIntakeConfig(): string[] {
  return listSchemas().flatMap(validateSchema);
}

export function validateIntakeConfigOrThrow(): void {
  const errors = validateIntakeConfig();
  if (errors.length > 0) {
    throw new Error(
      `INTAKE_SCHEMA_GUARD: refusing to start — ${errors.length} schema error(s):\n` +
        errors.slice(0, 20).join("\n")
    );
  }
}
