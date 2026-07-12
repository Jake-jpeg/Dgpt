/**
 * Strict structured-output schemas + provenance (B8).
 *
 * Every action returns a common REPORT ENVELOPE with a distinct `kind`:
 * factual assertions carry provenance to intake answers / document
 * versions; legal propositions carry snapshot authority IDs. Validation is
 * three-layered: zod shape → citation allowlist (unknown citation ⇒ reject)
 * → provenance reference check (unknown answer/document IDs ⇒ reject).
 * Malformed output is never saved as work product.
 */
import { z } from "zod";
import { isKnownAuthorityId, getAuthority } from "@/lib/legal/authority";

export const SUPPORT_STATUSES = [
  "SUPPORTED",
  "INFERRED",
  "NOT_FOUND",
  "CONFLICTING",
  "ATTORNEY_CONFIRMATION_REQUIRED",
] as const;

export const AI_ACTIONS = [
  "GENERATE_INTAKE_MEMO",
  "GENERATE_FACTUAL_CHRONOLOGY",
  "GENERATE_ISSUE_INVENTORY",
  "GENERATE_MISSING_FACTS_REPORT",
  "GENERATE_INCONSISTENCY_REPORT",
  "GENERATE_DOCUMENT_GAP_REPORT",
  "GENERATE_JURISDICTION_FACTS_SUMMARY",
  "GENERATE_ATTORNEY_FOLLOW_UP_QUESTIONS",
  "GENERATE_CLIENT_FOLLOW_UP_DRAFT",
  "GENERATE_FORM_READINESS_REPORT",
] as const;

export type AiAction = (typeof AI_ACTIONS)[number];

/** kind literal per action — the model must echo it. */
export const ACTION_KIND: Record<AiAction, string> = {
  GENERATE_INTAKE_MEMO: "AttorneyIntakeMemo",
  GENERATE_FACTUAL_CHRONOLOGY: "FactualChronology",
  GENERATE_ISSUE_INVENTORY: "IssueInventory",
  GENERATE_MISSING_FACTS_REPORT: "MissingFactsReport",
  GENERATE_INCONSISTENCY_REPORT: "InconsistencyReport",
  GENERATE_DOCUMENT_GAP_REPORT: "DocumentGapReport",
  GENERATE_JURISDICTION_FACTS_SUMMARY: "JurisdictionFactsSummary",
  GENERATE_ATTORNEY_FOLLOW_UP_QUESTIONS: "AttorneyFollowUpQuestions",
  GENERATE_CLIENT_FOLLOW_UP_DRAFT: "ClientFollowUpDraft",
  GENERATE_FORM_READINESS_REPORT: "FormReadinessReport",
};

const factualAssertion = z.object({
  assertion: z.string().min(1).max(2000),
  supportStatus: z.enum(SUPPORT_STATUSES),
  intakeAnswerIds: z.array(z.string()).max(40),
  documentVersionIds: z.array(z.string()).max(40),
  documentLocations: z.array(z.string()).max(40),
  sourceQuoteOrSummary: z.string().max(2000),
  notes: z.string().max(2000),
});

const legalProposition = z.object({
  proposition: z.string().min(1).max(2000),
  legalAuthorityIds: z.array(z.string()).min(1).max(20),
  jurisdiction: z.enum(["NJ", "NY", "GENERAL"]),
  authorityReviewStatus: z.string().max(80),
  attorneyReviewRequired: z.boolean(),
});

const reportItem = z.object({
  label: z.string().max(300),
  detail: z.string().max(4000),
  flag: z.enum(["", "[not found]", "[inferred]", "[needs cite check]", "[TREATMENT?]"]),
});

const followUp = z.object({
  question: z.string().min(1).max(1000),
  reason: z.string().max(1000),
  audience: z.enum(["ATTORNEY", "CLIENT_DRAFT"]),
});

export function reportSchema(kind: string) {
  return z.object({
    kind: z.literal(kind),
    title: z.string().min(1).max(300),
    summary: z.string().max(8000),
    factualAssertions: z.array(factualAssertion).max(200),
    legalPropositions: z.array(legalProposition).max(60),
    items: z.array(reportItem).max(200),
    followUpQuestions: z.array(followUp).max(60),
  });
}

export type AiReport = z.infer<ReturnType<typeof reportSchema>>;
export type FactualAssertion = z.infer<typeof factualAssertion>;
export type LegalProposition = z.infer<typeof legalProposition>;

// Named schemas (directive-required names)
export const AttorneyIntakeMemo = reportSchema("AttorneyIntakeMemo");
export const FactualChronology = reportSchema("FactualChronology");
export const IssueInventory = reportSchema("IssueInventory");
export const MissingFactsReport = reportSchema("MissingFactsReport");
export const InconsistencyReport = reportSchema("InconsistencyReport");
export const DocumentGapReport = reportSchema("DocumentGapReport");
export const JurisdictionFactsSummary = reportSchema("JurisdictionFactsSummary");
export const AttorneyFollowUpQuestions = reportSchema("AttorneyFollowUpQuestions");
export const ClientFollowUpDraft = reportSchema("ClientFollowUpDraft");
export const FormReadinessReport = reportSchema("FormReadinessReport");

/** Strict JSON Schema for the Responses API (all fields required; no extras). */
export function reportJsonSchema(kind: string) {
  const str = (max = 4000) => ({ type: "string", maxLength: max });
  return {
    type: "object",
    additionalProperties: false,
    required: ["kind", "title", "summary", "factualAssertions", "legalPropositions", "items", "followUpQuestions"],
    properties: {
      kind: { type: "string", enum: [kind] },
      title: str(300),
      summary: str(8000),
      factualAssertions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["assertion", "supportStatus", "intakeAnswerIds", "documentVersionIds", "documentLocations", "sourceQuoteOrSummary", "notes"],
          properties: {
            assertion: str(2000),
            supportStatus: { type: "string", enum: [...SUPPORT_STATUSES] },
            intakeAnswerIds: { type: "array", items: { type: "string" } },
            documentVersionIds: { type: "array", items: { type: "string" } },
            documentLocations: { type: "array", items: { type: "string" } },
            sourceQuoteOrSummary: str(2000),
            notes: str(2000),
          },
        },
      },
      legalPropositions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["proposition", "legalAuthorityIds", "jurisdiction", "authorityReviewStatus", "attorneyReviewRequired"],
          properties: {
            proposition: str(2000),
            legalAuthorityIds: { type: "array", items: { type: "string" } },
            jurisdiction: { type: "string", enum: ["NJ", "NY", "GENERAL"] },
            authorityReviewStatus: str(80),
            attorneyReviewRequired: { type: "boolean" },
          },
        },
      },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["label", "detail", "flag"],
          properties: {
            label: str(300),
            detail: str(4000),
            flag: { type: "string", enum: ["", "[not found]", "[inferred]", "[needs cite check]", "[TREATMENT?]"] },
          },
        },
      },
      followUpQuestions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question", "reason", "audience"],
          properties: {
            question: str(1000),
            reason: str(1000),
            audience: { type: "string", enum: ["ATTORNEY", "CLIENT_DRAFT"] },
          },
        },
      },
    },
  };
}

export interface ValidationProblem {
  code: "SCHEMA" | "UNKNOWN_CITATION" | "UNKNOWN_ANSWER_REF" | "UNKNOWN_DOCUMENT_REF";
  detail: string;
}

/**
 * Full validation pipeline. Returns the parsed report or a problem list —
 * callers must treat ANY problem as a failed invocation (never saved).
 */
export function validateAiReport(
  kind: string,
  raw: unknown,
  known: { answerIds: Set<string>; documentVersionIds: Set<string> }
): { report?: AiReport; problems: ValidationProblem[] } {
  const problems: ValidationProblem[] = [];
  const parsed = reportSchema(kind).safeParse(raw);
  if (!parsed.success) {
    return {
      problems: [
        { code: "SCHEMA", detail: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") },
      ],
    };
  }
  const report = parsed.data;
  for (const prop of report.legalPropositions) {
    for (const id of prop.legalAuthorityIds) {
      if (!isKnownAuthorityId(id)) {
        problems.push({ code: "UNKNOWN_CITATION", detail: `legal citation '${id}' is not in the approved local authority snapshot` });
      } else {
        const rec = getAuthority(id)!;
        if (rec.status === "RETIRED" || rec.status === "SUPERSEDED") {
          problems.push({ code: "UNKNOWN_CITATION", detail: `legal citation '${id}' is ${rec.status}` });
        }
      }
    }
  }
  for (const fa of report.factualAssertions) {
    for (const id of fa.intakeAnswerIds) {
      if (!known.answerIds.has(id)) {
        problems.push({ code: "UNKNOWN_ANSWER_REF", detail: `assertion cites unknown intake answer '${id}'` });
      }
    }
    for (const id of fa.documentVersionIds) {
      if (!known.documentVersionIds.has(id)) {
        problems.push({ code: "UNKNOWN_DOCUMENT_REF", detail: `assertion cites unknown document version '${id}'` });
      }
    }
  }
  return problems.length > 0 ? { problems } : { report, problems: [] };
}

/** supportStatus → visible internal flag. */
export function flagForSupportStatus(s: (typeof SUPPORT_STATUSES)[number]): string {
  switch (s) {
    case "NOT_FOUND":
      return "[not found]";
    case "INFERRED":
      return "[inferred]";
    case "CONFLICTING":
      return "[TREATMENT?]";
    case "ATTORNEY_CONFIRMATION_REQUIRED":
      return "[needs cite check]";
    default:
      return "";
  }
}
