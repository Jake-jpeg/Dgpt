/**
 * Meeting of the minds (2026-10-30) — compare the two spouses' answers.
 *
 * Operator: "First spouse and second spouse, they do the same questionnaire.
 * If there are inconsistencies, I flag it." This is that flag. It is
 * deterministic: the same two answer maps always produce the same report,
 * no model is involved, and nothing here decides anything — the attorney
 * reads the report and makes the call.
 *
 * WHAT IS COMPARED: the facts both spouses were asked about the SAME thing —
 * the marriage, the children, the parenting arrangement, assets, debts,
 * property history, retirement, insurance, business interests, prior
 * court matters, and the state-specific case items (grounds, agreement
 * posture, county). Questions that are naturally about the answering person
 * (their identity, their own income and expenses, their goals, the private
 * safety screen) are NOT compared — two different people are supposed to
 * answer those differently, and the safety answers are never placed side by
 * side with anything.
 *
 * HOW VALUES ARE COMPARED: normalized — strings trimmed and case-folded,
 * yes/no coerced, arrays of records compared as sets of their normalized
 * JSON. Free-text (long_text) items are not compared for equality (two
 * honest people never type the same paragraph); they are listed as
 * "both answered" for the attorney to read side by side.
 */
import type { AnswerMap, IntakeItem, IntakeSchema } from "@/lib/intake2/types";
import { isAnswered } from "@/lib/intake2/engine";

/** Sections whose items are each spouse's own facts, never compared. */
export const UNCOMPARED_SECTIONS = new Set(["safety", "identity", "income", "expenses", "goals", "documents", "review", "taxes", "voluntary"]);

export type TermStatus = "MATCH" | "MISMATCH" | "ONLY_A" | "ONLY_B" | "NARRATIVE" | "UNANSWERED";

export interface TermComparison {
  questionId: string;
  section: string;
  prompt: string;
  type: string;
  status: TermStatus;
  /** Display values — already JSON-stringified for the attorney's panel. */
  a: string | null;
  b: string | null;
}

export interface ComparisonReport {
  terms: TermComparison[];
  counts: Record<TermStatus, number>;
  /** True when every compared term that both answered matches and nothing is one-sided. */
  agreed: boolean;
}

function normalize(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") {
    const s = v.trim().toLowerCase().replace(/\s+/g, " ");
    if (s === "true" || s === "y") return "yes";
    if (s === "false" || s === "n") return "no";
    return s;
  }
  if (Array.isArray(v)) {
    return JSON.stringify(v.map((x) => normalizeDeep(x)).sort());
  }
  return JSON.stringify(normalizeDeep(v));
}

function normalizeDeep(v: unknown): unknown {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim().toLowerCase().replace(/\s+/g, " ");
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (Array.isArray(v)) return v.map(normalizeDeep);
  if (typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) {
      out[k] = normalizeDeep((v as Record<string, unknown>)[k]);
    }
    return out;
  }
  return String(v);
}

function display(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  try {
    const s = JSON.stringify(v);
    return s.length > 400 ? s.slice(0, 400) + "…" : s;
  } catch {
    return String(v);
  }
}

export function isComparedItem(item: IntakeItem): boolean {
  if (item.audience !== "CLIENT") return false;
  if (item.type === "document_request" || item.type === "attorney_determination") return false;
  if (item.deprecated) return false;
  return !UNCOMPARED_SECTIONS.has(item.section);
}

export function compareParties(schema: IntakeSchema, a: AnswerMap, b: AnswerMap): ComparisonReport {
  const terms: TermComparison[] = [];
  for (const item of schema.items) {
    if (!isComparedItem(item)) continue;
    const aHas = isAnswered(item, a);
    const bHas = isAnswered(item, b);
    if (!aHas && !bHas) continue; // neither reached it — nothing to say
    let status: TermStatus;
    if (aHas && !bHas) status = "ONLY_A";
    else if (!aHas && bHas) status = "ONLY_B";
    else if (item.type === "long_text") status = "NARRATIVE";
    else status = normalize(a[item.id]) === normalize(b[item.id]) ? "MATCH" : "MISMATCH";
    terms.push({
      questionId: item.id,
      section: item.section,
      prompt: item.prompt,
      type: item.type,
      status,
      a: display(a[item.id]),
      b: display(b[item.id]),
    });
  }
  const counts: Record<TermStatus, number> = { MATCH: 0, MISMATCH: 0, ONLY_A: 0, ONLY_B: 0, NARRATIVE: 0, UNANSWERED: 0 };
  for (const t of terms) counts[t.status]++;
  const agreed = terms.length > 0 && counts.MISMATCH === 0 && counts.ONLY_A === 0 && counts.ONLY_B === 0;
  return { terms, counts, agreed };
}
