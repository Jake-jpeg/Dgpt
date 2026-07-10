/**
 * Typed repository over the split data classes. Every write path in the app
 * goes through these functions — this file plus index.ts is the complete
 * persistence surface, which is what makes the guardrail tests meaningful.
 *
 * IMPORTANT INVARIANT (acceptance criterion 2): `insertAnswer` refuses to
 * write unless the session row itself says conflict_clear=1 AND the state is
 * an in-scope intake state. The API layer enforces this too; this is the
 * belt-and-suspenders at the persistence boundary.
 */
import { getDb, newId, nowIso } from "./index";
import type { MachineState } from "@/lib/intake/machine";
import { ANSWER_WRITABLE_STATES } from "@/lib/intake/machine";

export interface PartyName {
  fullLegalName: string;
  priorNames: string[];
}

export interface SessionRow {
  id: string;
  state: MachineState;
  tier: "TIER1" | "TIER2" | null;
  initiatedBy: "CLIENT" | "ATTORNEY";
  ownerSubject: string;
  conflictClear: boolean;
  county: string | null;
  qdroFlag: boolean;
  attorneyFlags: string[];
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

function rowToSession(r: Record<string, unknown>): SessionRow {
  return {
    id: r.id as string,
    state: r.state as MachineState,
    tier: (r.tier as SessionRow["tier"]) ?? null,
    initiatedBy: r.initiated_by as SessionRow["initiatedBy"],
    ownerSubject: r.owner_subject as string,
    conflictClear: r.conflict_clear === 1,
    county: (r.county as string | null) ?? null,
    qdroFlag: r.qdro_flag === 1,
    attorneyFlags: JSON.parse((r.attorney_flags as string) || "[]"),
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    lastActivityAt: r.last_activity_at as string,
  };
}

export function createSession(opts: {
  initiatedBy: "CLIENT" | "ATTORNEY";
  ownerSubject: string;
  initialState: MachineState;
}): SessionRow {
  const db = getDb();
  const id = newId();
  const t = nowIso();
  db.prepare(
    `INSERT INTO intake_session
     (id, state, initiated_by, owner_subject, created_at, updated_at, last_activity_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, opts.initialState, opts.initiatedBy, opts.ownerSubject, t, t, t);
  return getSession(id)!;
}

export function getSession(id: string): SessionRow | null {
  const r = getDb()
    .prepare(`SELECT * FROM intake_session WHERE id = ?`)
    .get(id) as Record<string, unknown> | undefined;
  return r ? rowToSession(r) : null;
}

export function updateSession(
  id: string,
  patch: Partial<{
    state: MachineState;
    tier: "TIER1" | "TIER2";
    conflictClear: boolean;
    county: string;
    qdroFlag: boolean;
    attorneyFlags: string[];
  }>
): void {
  const db = getDb();
  const sets: string[] = ["updated_at = ?", "last_activity_at = ?"];
  const vals: (string | number)[] = [nowIso(), nowIso()];
  if (patch.state !== undefined) {
    sets.push("state = ?");
    vals.push(patch.state);
  }
  if (patch.tier !== undefined) {
    sets.push("tier = ?");
    vals.push(patch.tier);
  }
  if (patch.conflictClear !== undefined) {
    sets.push("conflict_clear = ?");
    vals.push(patch.conflictClear ? 1 : 0);
  }
  if (patch.county !== undefined) {
    sets.push("county = ?");
    vals.push(patch.county);
  }
  if (patch.qdroFlag !== undefined) {
    sets.push("qdro_flag = ?");
    vals.push(patch.qdroFlag ? 1 : 0);
  }
  if (patch.attorneyFlags !== undefined) {
    sets.push("attorney_flags = ?");
    vals.push(JSON.stringify(patch.attorneyFlags));
  }
  db.prepare(`UPDATE intake_session SET ${sets.join(", ")} WHERE id = ?`).run(
    ...vals,
    id
  );
}

export function addAttorneyFlag(id: string, flag: string): void {
  const s = getSession(id);
  if (!s) return;
  if (!s.attorneyFlags.includes(flag)) {
    updateSession(id, { attorneyFlags: [...s.attorneyFlags, flag] });
  }
}

export function touchSession(id: string): void {
  getDb()
    .prepare(`UPDATE intake_session SET last_activity_at = ? WHERE id = ?`)
    .run(nowIso(), id);
}

// ── Party identity (pre-gate data class) ─────────────────────────────

export function setIdentity(
  sessionId: string,
  clientParty: PartyName,
  adverseParty: PartyName
): void {
  const db = getDb();
  db.prepare(`DELETE FROM party_identity WHERE session_id = ?`).run(sessionId);
  db.prepare(
    `INSERT INTO party_identity (id, session_id, client_party, adverse_party)
     VALUES (?, ?, ?, ?)`
  ).run(newId(), sessionId, JSON.stringify(clientParty), JSON.stringify(adverseParty));
}

export function getIdentity(
  sessionId: string
): { clientParty: PartyName; adverseParty: PartyName } | null {
  const r = getDb()
    .prepare(`SELECT * FROM party_identity WHERE session_id = ?`)
    .get(sessionId) as Record<string, unknown> | undefined;
  if (!r) return null;
  return {
    clientParty: JSON.parse(r.client_party as string),
    adverseParty: JSON.parse(r.adverse_party as string),
  };
}

// ── Intake answers (substantive data class) ──────────────────────────

/**
 * The ONLY code path that writes substantive intake data.
 * Refuses unless the session has a server-side conflict CLEAR and is in an
 * answer-writable machine state.
 */
export function insertAnswer(sessionId: string, fieldId: string, value: unknown): void {
  const s = getSession(sessionId);
  if (!s) throw new Error("PERSISTENCE_GUARD: session not found");
  if (!s.conflictClear) {
    throw new Error(
      "PERSISTENCE_GUARD: refusing to persist substantive data without conflict CLEAR"
    );
  }
  if (!ANSWER_WRITABLE_STATES.includes(s.state)) {
    throw new Error(
      `PERSISTENCE_GUARD: refusing to persist substantive data in state ${s.state}`
    );
  }
  const db = getDb();
  const t = nowIso();
  db.prepare(
    `INSERT INTO intake_answer (id, session_id, field_id, value, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(session_id, field_id)
     DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(newId(), sessionId, fieldId, JSON.stringify(value), t, t);
}

export function getAnswers(sessionId: string): Record<string, unknown> {
  const rows = getDb()
    .prepare(`SELECT field_id, value FROM intake_answer WHERE session_id = ?`)
    .all(sessionId) as { field_id: string; value: string }[];
  const out: Record<string, unknown> = {};
  for (const r of rows) out[r.field_id] = JSON.parse(r.value);
  return out;
}

// ── Bot interaction log (UPL defense; PII-free by construction) ──────

export function logBotInteraction(
  sessionRef: string,
  direction: "USER" | "BOT",
  kind: string,
  contentId: string
): void {
  getDb()
    .prepare(
      `INSERT INTO bot_interaction_log (id, session_ref, direction, kind, content_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(newId(), sessionRef, direction, kind, contentId, nowIso());
}

export function getBotLog(sessionRef: string) {
  return getDb()
    .prepare(
      `SELECT direction, kind, content_id, created_at FROM bot_interaction_log
       WHERE session_ref = ? ORDER BY created_at ASC, id ASC`
    )
    .all(sessionRef) as {
    direction: string;
    kind: string;
    content_id: string;
    created_at: string;
  }[];
}

// ── Audit events (minimal; survives purges) ──────────────────────────

export function recordAudit(sessionRef: string, event: string, detail?: string): void {
  getDb()
    .prepare(
      `INSERT INTO audit_event (id, session_ref, event, detail, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(newId(), sessionRef, event, detail ?? null, nowIso());
}

export function getAuditEvents(sessionRef: string) {
  return getDb()
    .prepare(
      `SELECT event, detail, created_at FROM audit_event
       WHERE session_ref = ? ORDER BY created_at ASC, id ASC`
    )
    .all(sessionRef) as { event: string; detail: string | null; created_at: string }[];
}

// ── Purge (retention policy) ─────────────────────────────────────────

/**
 * Remove ALL substantive + identity data for a session, keeping only the
 * minimal audit trail (and the PII-free bot log). Used on conflict HIT,
 * scope-gate trips, and the abandoned-session sweep.
 */
export function purgeSession(sessionId: string, reason: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM intake_answer WHERE session_id = ?`).run(sessionId);
  db.prepare(`DELETE FROM party_identity WHERE session_id = ?`).run(sessionId);
  db.prepare(`DELETE FROM intake_session WHERE id = ?`).run(sessionId);
  recordAudit(sessionId, "SESSION_PURGED", reason);
}

export function sweepAbandoned(olderThanDays: number): string[] {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
  const rows = getDb()
    .prepare(
      `SELECT id FROM intake_session
       WHERE last_activity_at < ? AND state != 'READY_FOR_REVIEW'`
    )
    .all(cutoff) as { id: string }[];
  for (const r of rows) purgeSession(r.id, "ABANDONED_RETENTION_SWEEP");
  return rows.map((r) => r.id);
}

export function listSessionsByState(state: MachineState): SessionRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM intake_session WHERE state = ? ORDER BY updated_at DESC`)
    .all(state) as Record<string, unknown>[];
  return rows.map(rowToSession);
}

export function listSessionsByOwner(ownerSubject: string): SessionRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM intake_session WHERE owner_subject = ? ORDER BY updated_at DESC`)
    .all(ownerSubject) as Record<string, unknown>[];
  return rows.map(rowToSession);
}

/** Test helper: raw row counts for DB-level persistence assertions. */
export function countRows(table: "intake_session" | "party_identity" | "intake_answer" | "bot_interaction_log" | "audit_event", sessionRef?: string): number {
  const db = getDb();
  if (sessionRef) {
    const col =
      table === "intake_session" ? "id" : table === "party_identity" || table === "intake_answer" ? "session_id" : "session_ref";
    const r = db
      .prepare(`SELECT COUNT(*) AS c FROM ${table} WHERE ${col} = ?`)
      .get(sessionRef) as { c: number };
    return r.c;
  }
  const r = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number };
  return r.c;
}
