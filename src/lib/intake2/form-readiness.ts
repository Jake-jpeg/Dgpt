/**
 * Deterministic form-readiness report (B13) — attorney-only, internal.
 * No court form is generated or filed. "READY FOR ATTORNEY FORM
 * PREPARATION" is a preparation signal only; nothing here ever says
 * "ready to file" — that status does not exist in this system and any
 * filing-readiness decision is a separate attorney exact-version approval.
 */
import { matterIntakePhase } from "@/config/intake/phases";
import type { AnswerMap, IntakeSchema } from "./types";
import { deriveChecklist, isAnswered, itemVisible, missingRequired } from "./engine";
import type { MatterRow } from "@/lib/db/matters";
import { listAuthorities } from "@/lib/legal/authority";

export const FORM_READINESS_STATUSES = [
  "READY_FOR_ATTORNEY_FORM_PREPARATION",
  "NOT_READY_MISSING_FACTS",
  "NOT_READY_MISSING_DOCUMENTS",
  "NOT_READY_JURISDICTION_REVIEW",
  "NOT_READY_LEGAL_DETERMINATION_REQUIRED",
  "NOT_READY_FORM_VERSION_REVIEW_REQUIRED",
] as const;

export type FormReadinessStatus = (typeof FORM_READINESS_STATUSES)[number];

export interface FormFamilyReadiness {
  form: string;
  mapped: { questionId: string; field: string; answered: boolean }[];
  missingValues: string[];
  needsAttorneyJudgment: string[];
  needsClientVerification: string[];
  executionNotes: string[]; // notarization/affirmation/signature/court-review
  countyVariationNote: string;
  staleFormRisk: string[];
}

export interface FormReadinessReportData {
  status: FormReadinessStatus;
  reasons: string[];
  families: FormFamilyReadiness[];
  disclaimer: string;
}

export function buildFormReadiness(
  matter: MatterRow,
  schema: IntakeSchema,
  answers: AnswerMap,
  checklistState: Parameters<typeof deriveChecklist>[2]
): FormReadinessReportData {
  const reasons: string[] = [];

  if (!matter.jurisdictionConfirmed || !matter.matterCategory) {
    reasons.push("Attorney jurisdiction/category confirmation is outstanding.");
  }
  const phase = matterIntakePhase(matter);
  const missing = missingRequired(schema, answers, phase);
  if (missing.length > 0) reasons.push(`${missing.length} required factual answer(s) missing.`);

  const checklist = deriveChecklist(schema, answers, checklistState, phase);
  const missingDocs = checklist.filter((e) => e.status === "REQUIRED_NOW" || e.status === "INCOMPLETE");
  if (missingDocs.length > 0) reasons.push(`${missingDocs.length} required document(s) outstanding.`);

  const determinations = schema.items.filter(
    (i) => i.type === "attorney_determination" && itemVisible(i, answers) && !isAnswered(i, answers)
  );
  if (determinations.length > 0) {
    reasons.push(`${determinations.length} attorney determination(s) unresolved.`);
  }

  const jurisdiction = matter.jurisdictionConfirmed as "NY" | null;
  const staleForms = listAuthorities(jurisdiction ?? undefined).filter(
    (a) =>
      a.status === "SUPERSEDED" ||
      a.notes.some((n) => n.toUpperCase().includes("SUPERSEDED")) ||
      a.notes.some((n) => n.includes("needs cite check") && a.authorityType === "official_form")
  );
  if (staleForms.length > 0) {
    reasons.push(
      `Official-form version review required (${staleForms.map((a) => a.id).join(", ")}).`
    );
  }

  let status: FormReadinessStatus = "READY_FOR_ATTORNEY_FORM_PREPARATION";
  if (!matter.jurisdictionConfirmed || !matter.matterCategory) status = "NOT_READY_JURISDICTION_REVIEW";
  else if (missing.length > 0) status = "NOT_READY_MISSING_FACTS";
  else if (missingDocs.length > 0) status = "NOT_READY_MISSING_DOCUMENTS";
  else if (determinations.length > 0) status = "NOT_READY_LEGAL_DETERMINATION_REQUIRED";
  else if (staleForms.length > 0) status = "NOT_READY_FORM_VERSION_REVIEW_REQUIRED";

  // Group output mappings by form family.
  const familyMap = new Map<string, FormFamilyReadiness>();
  for (const item of schema.items) {
    for (const out of item.outputs ?? []) {
      let fam = familyMap.get(out.form);
      if (!fam) {
        fam = {
          form: out.form,
          mapped: [],
          missingValues: [],
          needsAttorneyJudgment: [],
          needsClientVerification: [],
          executionNotes: [
            "Sworn execution (signature/affirmation/notarization) per current official form instructions — attorney to confirm.",
          ],
          countyVariationNote:
            "County/part-specific practices are NOT captured in this build — attorney review required.",
          staleFormRisk: staleForms.map((a) => `${a.id}: ${a.authorityName}`),
        };
        familyMap.set(out.form, fam);
      }
      const answered = isAnswered(item, answers);
      fam.mapped.push({ questionId: item.id, field: out.field, answered });
      if (!answered && itemVisible(item, answers)) fam.missingValues.push(`${out.field} (${item.id})`);
    }
  }
  for (const det of schema.items.filter((i) => i.type === "attorney_determination")) {
    for (const fam of familyMap.values()) fam.needsAttorneyJudgment.push(det.prompt.replace(/^ATTORNEY DETERMINATION:\s*/, ""));
  }
  const cert = answers["shared.review.certification"];
  for (const fam of familyMap.values()) {
    if (!cert) fam.needsClientVerification.push("Client factual certification not yet acknowledged.");
  }

  return {
    status,
    reasons,
    families: [...familyMap.values()],
    disclaimer:
      "Internal case-preparation report. It is not a filing-readiness determination; no document is 'ready to file' unless an attorney affirmatively approves that exact version through the approval workflow.",
  };
}
