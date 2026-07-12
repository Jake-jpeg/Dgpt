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
import { createHash } from "node:crypto";
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
  initiatedBy: "CLIENT" | "STAFF" | "ATTORNEY";
  ownerSubject: string;
  matterId: string | null;
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
    matterId: (r.matter_id as string | null) ?? null,
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
  initiatedBy: "CLIENT" | "STAFF" | "ATTORNEY";
  ownerSubject: string;
  initialState: MachineState;
  matterId?: string;
}): SessionRow {
  const db = getDb();
  const id = newId();
  const t = nowIso();
  db.prepare(
    `INSERT INTO intake_session
     (id, state, initiated_by, owner_subject, matter_id, created_at, updated_at, last_activity_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, opts.initialState, opts.initiatedBy, opts.ownerSubject, opts.matterId ?? null, t, t, t);
  return getSession(id)!;
}

export function listSessionsByMatter(matterId: string): SessionRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM intake_session WHERE matter_id = ? ORDER BY updated_at DESC`)
    .all(matterId) as Record<string, unknown>[];
  return rows.map(rowToSession);
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
  if (s.matterId) {
    // 2.0: a matter-linked session additionally requires the matter itself to
    // hold an ATTORNEY-set CLEARED disposition — automated screening cannot
    // produce it (see src/lib/db/matters.ts).
    const m = getDb()
      .prepare(`SELECT conflict_status FROM matter WHERE id = ?`)
      .get(s.matterId) as { conflict_status: string } | undefined;
    if (!m || m.conflict_status !== "CLEARED") {
      throw new Error(
        "PERSISTENCE_GUARD: refusing to persist substantive data before the matter is CLEARED by an attorney"
      );
    }
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

// ── Audit events (hash-chained; survives purges) ─────────────────────

/**
 * Tamper-evident audit trail: every event carries
 * hash = SHA-256(prev_hash | id | ref | event | detail | actor | created_at).
 * Editing or deleting any historical row breaks every later hash
 * (verifyAuditChain). Raw confidential content NEVER goes in `detail` —
 * names appear only as salted HMAC hashes (src/lib/security/audit-hash.ts),
 * documents only as IDs/content hashes.
 */
export function recordAudit(
  sessionRef: string,
  event: string,
  detail?: string,
  actor?: string
): void {
  const db = getDb();
  const last = db
    .prepare(`SELECT hash FROM audit_event ORDER BY rowid DESC LIMIT 1`)
    .get() as { hash: string | null } | undefined;
  const prev = last?.hash ?? "GENESIS";
  const id = newId();
  const t = nowIso();
  const hash = createHash("sha256")
    .update([prev, id, sessionRef, event, detail ?? "", actor ?? "", t].join("|"))
    .digest("hex");
  db.prepare(
    `INSERT INTO audit_event (id, session_ref, event, detail, actor, prev_hash, hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, sessionRef, event, detail ?? null, actor ?? null, prev, hash, t);
}

/** Walk the whole chain; returns the first broken row id, or null if intact. */
export function verifyAuditChain(): string | null {
  const rows = getDb()
    .prepare(
      `SELECT id, session_ref, event, detail, actor, prev_hash, hash, created_at
       FROM audit_event ORDER BY rowid ASC`
    )
    .all() as {
    id: string;
    session_ref: string;
    event: string;
    detail: string | null;
    actor: string | null;
    prev_hash: string | null;
    hash: string | null;
    created_at: string;
  }[];
  let prev = "GENESIS";
  for (const r of rows) {
    const expect = createHash("sha256")
      .update(
        [prev, r.id, r.session_ref, r.event, r.detail ?? "", r.actor ?? "", r.created_at].join("|")
      )
      .digest("hex");
    if (r.prev_hash !== prev || r.hash !== expect) return r.id;
    prev = r.hash ?? "";
  }
  return null;
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
