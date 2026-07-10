/**
 * Server-side validation of intake answers against the attorney-controlled
 * field config. Unknown field IDs, wrong-tier fields, and malformed values
 * are all rejected — the client is never trusted.
 */
import { z } from "zod";
import {
  getFieldDef,
  sectionsForTier,
  type FieldDef,
} from "@/config/intake-fields";
import { RETIREMENT_TYPES, RETIREMENT_DIVISIONS } from "@/config/intake-fields";

const retirementAccountSchema = z
  .array(
    z.object({
      accountType: z.enum(
        RETIREMENT_TYPES.map((o) => o.value) as [string, ...string[]]
      ),
      holder: z.enum(["CLIENT", "SPOUSE"]),
      division: z.enum(
        RETIREMENT_DIVISIONS.map((o) => o.value) as [string, ...string[]]
      ),
    })
  )
  .min(1)
  .max(20);

function schemaFor(field: FieldDef): z.ZodTypeAny {
  switch (field.type) {
    case "text":
      return z.string().trim().min(1).max(field.maxLen ?? 200);
    case "date":
      return z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
        .refine((s) => !Number.isNaN(Date.parse(s)), "invalid date");
    case "boolean":
      return z.boolean();
    case "select":
      return z.enum((field.options ?? []).map((o) => o.value) as [string, ...string[]]);
    case "currency":
      return z.number().nonnegative().max(100_000_000);
    case "integer":
      return z.number().int().nonnegative().max(1200);
    case "retirementAccounts":
      return retirementAccountSchema;
  }
}

export interface ValidatedAnswer {
  fieldId: string;
  value: unknown;
}

/**
 * Validate one submitted answer for a given tier. Throws with a VALIDATION:
 * prefix on any problem.
 */
export function validateAnswer(
  tier: "TIER1" | "TIER2",
  fieldId: unknown,
  value: unknown
): ValidatedAnswer {
  if (typeof fieldId !== "string") throw new Error("VALIDATION: fieldId must be a string");
  const def = getFieldDef(tier, fieldId);
  if (!def) throw new Error(`VALIDATION: unknown or out-of-tier field ${fieldId}`);
  const parsed = schemaFor(def.field).safeParse(value);
  if (!parsed.success) {
    throw new Error(`VALIDATION: ${fieldId}: ${parsed.error.issues[0]?.message ?? "invalid"}`);
  }
  if (def.field.mustBeTrue && parsed.data !== true) {
    throw new Error(`VALIDATION: ${fieldId} must be confirmed to continue`);
  }
  return { fieldId, value: parsed.data };
}

function dependencySatisfied(field: FieldDef, answers: Record<string, unknown>): boolean {
  if (!field.dependsOn) return true;
  const actual = answers[field.dependsOn.fieldId];
  if ("equals" in field.dependsOn && field.dependsOn.equals !== undefined) {
    return actual === field.dependsOn.equals;
  }
  if ("notEquals" in field.dependsOn && field.dependsOn.notEquals !== undefined) {
    return actual !== undefined && actual !== field.dependsOn.notEquals;
  }
  return true;
}

/**
 * Which required fields are still missing for this tier, given the answers
 * persisted so far. Empty array ⇒ the intake is complete and may move to
 * READY_FOR_REVIEW.
 */
export function missingRequiredFields(
  tier: "TIER1" | "TIER2",
  answers: Record<string, unknown>
): string[] {
  const missing: string[] = [];
  for (const section of sectionsForTier(tier)) {
    for (const field of section.fields) {
      if (!field.required) continue;
      if (!dependencySatisfied(field, answers)) continue;
      if (answers[field.id] === undefined) missing.push(field.id);
    }
  }
  return missing;
}
