/**
 * Deterministic intake engine. Pure functions over (schema, answers):
 * visibility, missing-required, progress, and the authoritative document
 * checklist. NO model involvement — the AI layer may SUGGEST follow-ups to staff
 * or the attorney, but it cannot alter the client's intake path or the
 * checklist (see docs/AI-PROVENANCE.md).
 */
import type {
  AnswerMap,
  ChecklistStatus,
  Condition,
  IntakeItem,
  IntakeSchema,
} from "./types";

export function evaluateCondition(cond: Condition, answers: AnswerMap): boolean {
  switch (cond.kind) {
    case "eq":
      return answers[cond.questionId] === cond.value;
    case "ne": {
      const v = answers[cond.questionId];
      return v !== undefined && v !== cond.value;
    }
    case "in":
      return cond.values.includes(answers[cond.questionId]);
    case "answered": {
      const v = answers[cond.questionId];
      return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
    }
    case "truthy":
      return Boolean(answers[cond.questionId]);
    case "all":
      return cond.conditions.every((c) => evaluateCondition(c, answers));
    case "any":
      return cond.conditions.some((c) => evaluateCondition(c, answers));
  }
}

export function itemVisible(item: IntakeItem, answers: AnswerMap): boolean {
  if (item.deprecated) return false;
  return item.condition ? evaluateCondition(item.condition, answers) : true;
}

/** Items visible to a given audience under current answers. */
export function visibleItems(
  schema: IntakeSchema,
  answers: AnswerMap,
  audience: "CLIENT" | "STAFF" | "ATTORNEY"
): IntakeItem[] {
  const rank = { CLIENT: 0, STAFF: 1, ATTORNEY: 2 } as const;
  return schema.items.filter(
    (i) => itemVisible(i, answers) && rank[audience] >= rank[i.audience]
  );
}

export function isAnswered(item: IntakeItem, answers: AnswerMap): boolean {
  const v = answers[item.id];
  if (v === undefined || v === null || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

/** Missing required CLIENT-answerable items (visible under current answers). */
export function missingRequired(schema: IntakeSchema, answers: AnswerMap): IntakeItem[] {
  return schema.items.filter(
    (i) =>
      i.audience === "CLIENT" &&
      i.required &&
      i.type !== "document_request" &&
      i.type !== "attorney_determination" &&
      itemVisible(i, answers) &&
      !isAnswered(i, answers)
  );
}

export interface SectionProgress {
  sectionId: string;
  title: string;
  total: number;
  answered: number;
  missingRequired: number;
}

export function sectionProgress(schema: IntakeSchema, answers: AnswerMap): SectionProgress[] {
  return schema.sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((sec) => {
      const items = schema.items.filter(
        (i) =>
          i.section === sec.id &&
          i.audience === "CLIENT" &&
          i.type !== "attorney_determination" &&
          itemVisible(i, answers)
      );
      const answered = items.filter((i) => isAnswered(i, answers)).length;
      const missing = items.filter(
        (i) => i.required && i.type !== "document_request" && !isAnswered(i, answers)
      ).length;
      return {
        sectionId: sec.id,
        title: sec.title,
        total: items.length,
        answered,
        missingRequired: missing,
      };
    });
}

export interface ChecklistEntry {
  documentId: string;
  title: string;
  requestText: string;
  status: ChecklistStatus;
  triggeredBy: string[]; // question IDs whose answers made this applicable
}

/**
 * THE authoritative document checklist — deterministic. Inputs: schema
 * document catalog, trigger rules on items (documentIds + visibility),
 * received/waived state from the document store, attorney overrides.
 */
export function deriveChecklist(
  schema: IntakeSchema,
  answers: AnswerMap,
  state: {
    receivedDocumentIds?: string[];
    incompleteDocumentIds?: string[];
    waivedDocumentIds?: string[];
    attorneyReviewDocumentIds?: string[];
  } = {}
): ChecklistEntry[] {
  const received = new Set(state.receivedDocumentIds ?? []);
  const incomplete = new Set(state.incompleteDocumentIds ?? []);
  const waived = new Set(state.waivedDocumentIds ?? []);
  const review = new Set(state.attorneyReviewDocumentIds ?? []);

  const triggered = new Map<string, string[]>();
  for (const item of schema.items) {
    if (!item.documentIds?.length) continue;
    if (!itemVisible(item, answers)) continue;
    // A document_request item triggers when visible; other items trigger
    // when visible AND answered truthy/answered.
    const fires =
      item.type === "document_request" ? true : isAnswered(item, answers);
    if (!fires) continue;
    for (const d of item.documentIds) {
      triggered.set(d, [...(triggered.get(d) ?? []), item.id]);
    }
  }

  return schema.documents.map((doc) => {
    const triggeredBy = triggered.get(doc.id) ?? [];
    let status: ChecklistStatus;
    if (waived.has(doc.id)) status = "ATTORNEY_WAIVED";
    else if (review.has(doc.id)) status = "ATTORNEY_REVIEW_REQUIRED";
    else if (triggeredBy.length === 0) status = "NOT_APPLICABLE";
    else if (incomplete.has(doc.id)) status = "INCOMPLETE";
    else if (received.has(doc.id)) status = "RECEIVED";
    else status = "REQUIRED_NOW";
    return { documentId: doc.id, title: doc.title, requestText: doc.requestText, status, triggeredBy };
  });
}

/**
 * Multi-jurisdiction signal — deterministic, from residence-history FACTS
 * only. Never auto-selects a state (and never from a mailing address): it
 * only tells the ATTORNEY that review must consider both states.
 */
export function jurisdictionSignals(answers: AnswerMap): {
  nyImplicated: boolean;
  /** Normalized non-NY state tokens found in residence/marriage/children facts. */
  otherStates: string[];
  /** True when facts implicate any state other than New York — attorney review. */
  multiJurisdiction: boolean;
} {
  const states = new Set<string>();
  const collect = (v: unknown) => {
    if (Array.isArray(v)) {
      for (const row of v) {
        const s = (row as Record<string, unknown>)?.state;
        if (typeof s === "string" && s.trim()) states.add(s.trim().toUpperCase());
      }
    }
  };
  collect(answers["shared.residence.party_history"]);
  collect(answers["shared.residence.spouse_history"]);
  collect(answers["shared.children.records"]);
  collect(answers["shared.priors.records"]);
  const marriageState = answers["shared.relationship.marriage_state"];
  if (typeof marriageState === "string" && marriageState.trim()) {
    states.add(marriageState.trim().toUpperCase());
  }
  const NY_TOKENS = new Set(["NY", "NEW YORK"]);
  const ny = [...states].some((t) => NY_TOKENS.has(t));
  const otherStates = [...states].filter((t) => !NY_TOKENS.has(t)).sort();
  // DivorceGPT is a New York product: ANY non-NY state in the facts is an
  // attorney-review signal. Nothing is auto-selected from an address.
  return { nyImplicated: ny, otherStates, multiJurisdiction: otherStates.length > 0 };
}
