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
    category: "NY_SUPREME_UNCONTESTED", // placeholder category; not used pre-confirmation
    jurisdiction: "NY",
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

export async function getMatterAnswers(matterId: string): Promise<AnswerMap> {
  const rows = await getDb().all<{ question_id: string; value: string }>(
    `SELECT question_id, value FROM matter_intake_answer WHERE matter_id = ?`,
    matterId
  );
  const out: AnswerMap = {};
  for (const r of rows) out[r.question_id] = JSON.parse(r.value);
  return out;
}

/**
 * Persist answers. THE guard for substantive schema-driven intake:
 * refuses without an attorney-CLEARED matter; refuses unknown questions;
 * enforces audience by the writer's CURRENT role.
 */
export async function saveMatterAnswers(opts: {
  matterId: string;
  actingUserId: string;
  answers: { questionId: string; value: unknown }[];
}): Promise<{ saved: number }> {
  const matter = await getMatter(opts.matterId);
  if (!matter) throw new Error("PERSISTENCE_GUARD: matter not found");
  if (matter.conflictStatus !== "CLEARED" && matter.conflictStatus !== "EXTERNAL") {
    throw new Error(
      "PERSISTENCE_GUARD: refusing to persist substantive intake before the matter is CLEARED by an attorney"
    );
  }
  const actor = await getUserById(opts.actingUserId);
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
    await db.run(
      `INSERT INTO matter_intake_answer (matter_id, question_id, value, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(matter_id, question_id)
       DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
      opts.matterId,
      a.questionId,
      value,
      t,
      actor.id
    );
    await db.run(
      `INSERT INTO matter_intake_answer_history (id, matter_id, question_id, value, changed_at, changed_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      newId(),
      opts.matterId,
      a.questionId,
      value,
      t,
      actor.id
    );
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
export async function attorneySetJurisdictionAndScope(opts: {
  matterId: string;
  actingUserId: string;
  jurisdictionConfirmed?: "NY" | "NJ" | null;
  matterCategory?: MatterCategory | null;
  scopeStatus?: ScopeStatus;
  scopeNotes?: string;
  jurisdictionCandidate?: string;
}): Promise<MatterRow> {
  const actor = await getUserById(opts.actingUserId);
  if (!actor || !actor.active || actor.role !== "ATTORNEY") {
    throw new Error("JURISDICTION_GUARD: only an active ATTORNEY may confirm jurisdiction, category, or scope");
  }
  const matter = await getMatter(opts.matterId);
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
    await db.run(
      `UPDATE matter SET jurisdiction_candidate = ?, updated_at = ? WHERE id = ?`,
      opts.jurisdictionCandidate,
      t,
      opts.matterId
    );
  }
  if (opts.jurisdictionConfirmed !== undefined) {
    await db.run(
      `UPDATE matter SET jurisdiction_confirmed = ?, jurisdiction_confirmed_by = ?, jurisdiction_confirmed_at = ?, updated_at = ? WHERE id = ?`,
      opts.jurisdictionConfirmed,
      actor.id,
      t,
      t,
      opts.matterId
    );
  }
  if (opts.matterCategory !== undefined) {
    // Pin the version the CATEGORY's schema actually carries — NY and NJ are
    // versioned independently (their counsel-review histories are separate),
    // so pinning NY's date on an NJ matter would misstate what the client
    // was interviewed under.
    const pinnedVersion = opts.matterCategory
      ? getSchemaForCategory(opts.matterCategory as MatterCategory).version
      : null;
    await db.run(
      `UPDATE matter SET matter_category = ?, matter_category_confirmed_by = ?, intake_schema_version = ?, updated_at = ? WHERE id = ?`,
      opts.matterCategory,
      actor.id,
      pinnedVersion,
      t,
      opts.matterId
    );
  }
  if (opts.scopeStatus !== undefined) {
    await db.run(
      `UPDATE matter SET scope_status = ?, updated_at = ? WHERE id = ?`,
      opts.scopeStatus,
      t,
      opts.matterId
    );
  }
  if (opts.scopeNotes !== undefined) {
    await db.run(
      `UPDATE matter SET scope_notes = ?, updated_at = ? WHERE id = ?`,
      opts.scopeNotes,
      t,
      opts.matterId
    );
  }
  return (await getMatter(opts.matterId))!;
}
