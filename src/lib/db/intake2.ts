/**
 * Schema-driven intake answers (matter-scoped) + attorney jurisdiction/scope
 * determinations.
 *
 * STRUCTURAL GUARDS (same pattern as the rest of the persistence layer):
 *  - substantive answers require an attorney-CLEARED matter;
 *  - clients may answer only CLIENT-audience questions of the matter's
 *    schema; staff may also answer STAFF items; attorney determinations are
 *    written only through the attorney determination path;
 *  - jurisdiction/category/scope are ATTORNEY-only, role re-read at write
 *    time — STAFF/ADMIN (and any automated path, including the AI layer) cannot
 *    set them.
 */
import { getDb, newId, nowIso } from "./index";
import { getMatter, type MatterRow } from "./matters";
import { getUserById } from "./users";
import type { AnswerMap, IntakeSchema, MatterCategory } from "@/lib/intake2/types";
import { MATTER_CATEGORIES } from "@/lib/intake2/types";
import { getSchemaForCategory, INTAKE_SCHEMA_VERSION } from "@/config/intake/schemas";
import { SHARED_DOCUMENTS, SHARED_ITEMS, SHARED_SECTIONS } from "@/config/intake/shared/core";

/** Pre-confirmation schema: the shared factual core only. */
export function sharedCoreSchema(): IntakeSchema {
  return {
    id: `SHARED_CORE@${INTAKE_SCHEMA_VERSION}`,
    category: "NJ_FM_DIVORCE_UNCONTESTED", // placeholder category; not used pre-confirmation
    jurisdiction: "NJ",
    version: INTAKE_SCHEMA_VERSION,
    effectiveDate: "2026-07-12",
    reviewStatus: "COUNSEL_REVIEW_REQUIRED",
    sections: SHARED_SECTIONS,
    items: SHARED_ITEMS,
    documents: SHARED_DOCUMENTS,
  };
}

/** The schema a matter currently uses (assigned category, else shared core). */
export function schemaForMatter(matter: MatterRow): IntakeSchema {
  if (matter.matterCategory && (MATTER_CATEGORIES as readonly string[]).includes(matter.matterCategory)) {
    return getSchemaForCategory(matter.matterCategory as MatterCategory);
  }
  return sharedCoreSchema();
}

export function getMatterAnswers(matterId: string): AnswerMap {
  const rows = getDb()
    .prepare(`SELECT question_id, value FROM matter_intake_answer WHERE matter_id = ?`)
    .all(matterId) as { question_id: string; value: string }[];
  const out: AnswerMap = {};
  for (const r of rows) out[r.question_id] = JSON.parse(r.value);
  return out;
}

export function getAnswerHistory(matterId: string, questionId?: string) {
  const db = getDb();
  const rows = (
    questionId
      ? db.prepare(`SELECT question_id, value, changed_at, changed_by FROM matter_intake_answer_history WHERE matter_id = ? AND question_id = ? ORDER BY changed_at ASC`).all(matterId, questionId)
      : db.prepare(`SELECT question_id, value, changed_at, changed_by FROM matter_intake_answer_history WHERE matter_id = ? ORDER BY changed_at ASC`).all(matterId)
  ) as { question_id: string; value: string; changed_at: string; changed_by: string }[];
  return rows.map((r) => ({ questionId: r.question_id, value: JSON.parse(r.value), changedAt: r.changed_at, changedBy: r.changed_by }));
}

/**
 * Persist answers. THE guard for substantive schema-driven intake:
 * refuses without an attorney-CLEARED matter; refuses unknown questions;
 * enforces audience by the writer's CURRENT role.
 */
export function saveMatterAnswers(opts: {
  matterId: string;
  actingUserId: string;
  answers: { questionId: string; value: unknown }[];
}): { saved: number } {
  const matter = getMatter(opts.matterId);
  if (!matter) throw new Error("PERSISTENCE_GUARD: matter not found");
  if (matter.conflictStatus !== "CLEARED") {
    throw new Error(
      "PERSISTENCE_GUARD: refusing to persist substantive intake before the matter is CLEARED by an attorney"
    );
  }
  const actor = getUserById(opts.actingUserId);
  if (!actor || !actor.active) throw new Error("PERSISTENCE_GUARD: unknown or inactive user");

  const schema = schemaForMatter(matter);
  const byId = new Map(schema.items.map((i) => [i.id, i]));
  const db = getDb();
  const t = nowIso();
  let saved = 0;
  for (const a of opts.answers) {
    const item = byId.get(a.questionId);
    if (!item) throw new Error(`VALIDATION: unknown question ${a.questionId}`);
    if (item.type === "attorney_determination") {
      // Determinations are written only via the attorney determination path.
      if (actor.role !== "ATTORNEY") {
        throw new Error("PERSISTENCE_GUARD: attorney-only determination");
      }
    } else if (item.audience === "STAFF" && actor.role === "CLIENT") {
      throw new Error("PERSISTENCE_GUARD: staff-only question");
    } else if (item.audience === "ATTORNEY" && actor.role !== "ATTORNEY") {
      throw new Error("PERSISTENCE_GUARD: attorney-only question");
    }
    const value = JSON.stringify(a.value);
    db.prepare(
      `INSERT INTO matter_intake_answer (matter_id, question_id, value, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(matter_id, question_id)
       DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`
    ).run(opts.matterId, a.questionId, value, t, actor.id);
    db.prepare(
      `INSERT INTO matter_intake_answer_history (id, matter_id, question_id, value, changed_at, changed_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(newId(), opts.matterId, a.questionId, value, t, actor.id);
    saved++;
  }
  return { saved };
}

// ── Attorney jurisdiction / category / scope (B6) ─────────────────────

const SCOPE_STATUSES = [
  "UNREVIEWED",
  "UNDER_REVIEW",
  "ACCEPTED",
  "DECLINED",
  "MULTI_JURISDICTION_REVIEW_REQUIRED",
] as const;

export type ScopeStatus = (typeof SCOPE_STATUSES)[number];

/**
 * THE ONLY code path that sets jurisdiction/category/scope. Re-reads the
 * actor's CURRENT role: only an active ATTORNEY may confirm. The AI layer has no
 * route here — the AI layer cannot call this (and client routes cannot
 * import it, enforced by tests).
 */
export function attorneySetJurisdictionAndScope(opts: {
  matterId: string;
  actingUserId: string;
  jurisdictionConfirmed?: "NJ" | "NY" | null;
  matterCategory?: MatterCategory | null;
  scopeStatus?: ScopeStatus;
  scopeNotes?: string;
  jurisdictionCandidate?: string;
}): MatterRow {
  const actor = getUserById(opts.actingUserId);
  if (!actor || !actor.active || actor.role !== "ATTORNEY") {
    throw new Error("JURISDICTION_GUARD: only an active ATTORNEY may confirm jurisdiction, category, or scope");
  }
  const matter = getMatter(opts.matterId);
  if (!matter) throw new Error("VALIDATION: matter not found");
  if (opts.matterCategory && !(MATTER_CATEGORIES as readonly string[]).includes(opts.matterCategory)) {
    throw new Error("VALIDATION: unknown matter category");
  }
  if (opts.scopeStatus && !SCOPE_STATUSES.includes(opts.scopeStatus)) {
    throw new Error("VALIDATION: unknown scope status");
  }
  const db = getDb();
  const t = nowIso();
  if (opts.jurisdictionCandidate !== undefined) {
    db.prepare(`UPDATE matter SET jurisdiction_candidate = ?, updated_at = ? WHERE id = ?`).run(
      opts.jurisdictionCandidate,
      t,
      opts.matterId
    );
  }
  if (opts.jurisdictionConfirmed !== undefined) {
    db.prepare(
      `UPDATE matter SET jurisdiction_confirmed = ?, jurisdiction_confirmed_by = ?, jurisdiction_confirmed_at = ?, updated_at = ? WHERE id = ?`
    ).run(opts.jurisdictionConfirmed, actor.id, t, t, opts.matterId);
  }
  if (opts.matterCategory !== undefined) {
    db.prepare(
      `UPDATE matter SET matter_category = ?, matter_category_confirmed_by = ?, intake_schema_version = ?, updated_at = ? WHERE id = ?`
    ).run(opts.matterCategory, actor.id, opts.matterCategory ? INTAKE_SCHEMA_VERSION : null, t, opts.matterId);
  }
  if (opts.scopeStatus !== undefined) {
    db.prepare(`UPDATE matter SET scope_status = ?, updated_at = ? WHERE id = ?`).run(
      opts.scopeStatus,
      t,
      opts.matterId
    );
  }
  if (opts.scopeNotes !== undefined) {
    db.prepare(`UPDATE matter SET scope_notes = ?, updated_at = ? WHERE id = ?`).run(
      opts.scopeNotes,
      t,
      opts.matterId
    );
  }
  return getMatter(opts.matterId)!;
}
