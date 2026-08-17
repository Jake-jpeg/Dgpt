/**
 * Versioned, data-driven intake schema — types.
 *
 * Questions are DATA (src/config/intake/**), not page components. The
 * client path is deterministic: conditions are evaluated by the engine,
 * never by a model. Items that require legal judgment are
 * `attorney_determination` records and are never client-visible.
 */

export type Jurisdiction = "SHARED" | "NY" | "NJ";

export const MATTER_CATEGORIES = [
  // New York categories — DivorceGPT began as a New York product.
  "NY_SUPREME_UNCONTESTED_JOINT",
  "NY_SUPREME_UNCONTESTED",
  "NY_SUPREME_CONTESTED",
  "NY_SUPREME_POST_JUDGMENT",
  "NY_FAMILY_COURT_CUSTODY_VISITATION",
  "NY_FAMILY_COURT_SUPPORT_PARENTAGE",
  "NY_UCCJEA_INTERSTATE",
  "NY_FAMILY_OFFENSE_OR_EMERGENCY_ESCALATION",
  // New Jersey. ONE category, deliberately: the NJ scope is the uncontested
  // Superior Court / Chancery Division, Family Part dissolution, pleaded on
  // irreconcilable differences only. There is no NJ contested track and no
  // NJ fault-grounds track, mirroring the NY § 170(7) decision.
  "NJ_SUPER_UNCONTESTED",
] as const;

export type MatterCategory = (typeof MATTER_CATEGORIES)[number];

export type AnswerType =
  | "short_text"
  | "long_text"
  | "date"
  | "date_range"
  | "money"
  | "percent"
  | "integer"
  | "yes_no"
  | "single_select"
  | "multi_select"
  | "address"
  | "person"
  | "entity"
  | "repeat_child"
  | "repeat_asset"
  | "repeat_debt"
  | "repeat_case"
  | "repeat_employer"
  | "repeat_income"
  | "repeat_insurance"
  | "document_request"
  | "attorney_determination";

/** Deterministic display conditions — evaluated by the engine only. */
export type Condition =
  | { kind: "eq"; questionId: string; value: unknown }
  | { kind: "ne"; questionId: string; value: unknown }
  | { kind: "in"; questionId: string; values: unknown[] }
  | { kind: "answered"; questionId: string }
  | { kind: "truthy"; questionId: string }
  | { kind: "all"; conditions: Condition[] }
  | { kind: "any"; conditions: Condition[] };

export type ReviewStatus = "DRAFT" | "COUNSEL_REVIEW_REQUIRED" | "APPROVED";

export interface IntakeItem {
  /** Stable, globally unique question ID (never reused). */
  id: string;
  jurisdiction: Jurisdiction;
  /** Categories this item applies to; empty = every category in scope. */
  categories?: MatterCategory[];
  section: string;
  /** Plain-language client prompt (or internal prompt for internal items). */
  prompt: string;
  /** Static, pre-approved explanatory help text (never generated). */
  helpText?: string;
  type: AnswerType;
  required: boolean;
  options?: { value: string; label: string }[];
  condition?: Condition;
  /** Sensitive data (safety, DOB, confidential identifiers): restricted display + handling. */
  sensitive?: boolean;
  /** internal items never render to clients (staff-only questions, attorney determinations). */
  audience: "CLIENT" | "STAFF" | "ATTORNEY";
  /** Legal-authority snapshot IDs this item is grounded on ([] = purely factual). */
  authorityIds: string[];
  /** Document catalog IDs this item can trigger (with condition = trigger rule). */
  documentIds?: string[];
  /** Output mappings (form-readiness): official form family field labels. */
  outputs?: { form: string; field: string }[];
  reviewStatus: ReviewStatus;
  deprecated?: boolean;
}

export interface IntakeSection {
  id: string;
  title: string;
  /** Client-facing static description of why the firm asks. */
  description?: string;
  order: number;
}

export interface DocumentCatalogItem {
  id: string;
  title: string;
  /** Plain-language request text shown to the client. */
  requestText: string;
  sensitive?: boolean;
}

export interface IntakeSchema {
  /** e.g. "NY_SUPREME_UNCONTESTED@2026.07.1", "NJ_SUPER_UNCONTESTED@2026.08.1" */
  id: string;
  category: MatterCategory;
  jurisdiction: "NY" | "NJ";
  version: string;
  effectiveDate: string;
  reviewStatus: ReviewStatus;
  sections: IntakeSection[];
  items: IntakeItem[];
  documents: DocumentCatalogItem[];
}

/** Stored answers: questionId → JSON value (repeat types: array of records). */
export type AnswerMap = Record<string, unknown>;

export type ChecklistStatus =
  | "REQUIRED_NOW"
  | "REQUESTED"
  | "RECEIVED"
  | "INCOMPLETE"
  | "NOT_APPLICABLE"
  | "ATTORNEY_WAIVED"
  | "ATTORNEY_REVIEW_REQUIRED";
