/**
 * Checklist override state (received/incomplete/waived/review flags) —
 * feeds the deterministic engine in src/lib/intake2/engine.ts. Waives are
 * attorney-only (enforced at the API; the engine records whatever state the
 * authorized route set).
 */
import { getDb, nowIso } from "./index";

export const CHECKLIST_DISCLAIMER =
  "This checklist is an internal case-preparation tool and does not replace attorney review of filing, discovery, or evidentiary requirements.";

const KEY = (matterId: string) => `checklist.${matterId}`;

interface ChecklistState {
  receivedDocumentIds: string[];
  incompleteDocumentIds: string[];
  waivedDocumentIds: string[];
  attorneyReviewDocumentIds: string[];
}

const EMPTY: ChecklistState = {
  receivedDocumentIds: [],
  incompleteDocumentIds: [],
  waivedDocumentIds: [],
  attorneyReviewDocumentIds: [],
};

export function getConfigChecklistState(matterId: string): ChecklistState {
  const r = getDb()
    .prepare(`SELECT value FROM app_config WHERE key = ?`)
    .get(KEY(matterId)) as { value: string } | undefined;
  if (!r) return { ...EMPTY };
  try {
    return { ...EMPTY, ...(JSON.parse(r.value) as Partial<ChecklistState>) };
  } catch {
    return { ...EMPTY };
  }
}

export function setChecklistOverride(opts: {
  matterId: string;
  documentId: string;
  override: "RECEIVED" | "INCOMPLETE" | "ATTORNEY_WAIVED" | "ATTORNEY_REVIEW_REQUIRED" | "CLEAR";
  actingUserId: string;
}): void {
  const state = getConfigChecklistState(opts.matterId);
  const remove = (arr: string[]) => arr.filter((d) => d !== opts.documentId);
  state.receivedDocumentIds = remove(state.receivedDocumentIds);
  state.incompleteDocumentIds = remove(state.incompleteDocumentIds);
  state.waivedDocumentIds = remove(state.waivedDocumentIds);
  state.attorneyReviewDocumentIds = remove(state.attorneyReviewDocumentIds);
  if (opts.override === "RECEIVED") state.receivedDocumentIds.push(opts.documentId);
  if (opts.override === "INCOMPLETE") state.incompleteDocumentIds.push(opts.documentId);
  if (opts.override === "ATTORNEY_WAIVED") state.waivedDocumentIds.push(opts.documentId);
  if (opts.override === "ATTORNEY_REVIEW_REQUIRED") state.attorneyReviewDocumentIds.push(opts.documentId);
  getDb()
    .prepare(
      `INSERT INTO app_config (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at`
    )
    .run(KEY(opts.matterId), JSON.stringify(state), opts.actingUserId, nowIso());
}
