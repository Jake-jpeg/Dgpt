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

export async function createSession(opts: {
  initiatedBy: "CLIENT" | "STAFF" | "ATTORNEY";
  ownerSubject: string;
  initialState: MachineState;
  matterId?: string;
  /** Open-signup flow: the firm runs conflicts in its own system, so a
   *  session may be born past the (retired) in-app conflict wall. */
  conflictClear?: boolean;
}): Promise<SessionRow> {
  const db = getDb();
  const id = newId();
  const t = nowIso();
  await db.run(
    `INSERT INTO intake_session
     (id, state, initiated_by, owner_subject, matter_id, conflict_clear, created_at, updated_at, last_activity_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    opts.initialState,
    opts.initiatedBy,
    opts.ownerSubject,
    opts.matterId ?? null,
    opts.conflictClear ? 1 : 0,
    t,
    t,
    t
  );
  return (await getSession(id))!;
}

export async function listSessionsByMatter(matterId: string): Promise<SessionRow[]> {
  const rows = await getDb().all(
    `SELECT * FROM intake_session WHERE matter_id = ? ORDER BY updated_at DESC`,
    matterId
  );
  return rows.map(rowToSession);
}

export async function getSession(id: string): Promise<SessionRow | null> {
  const r = await getDb().get(`SELECT * FROM intake_session WHERE id = ?`, id);
  return r ? rowToSession(r) : null;
}

export async function updateSession(
  id: string,
  patch: Partial<{
    state: MachineState;
    tier: "TIER1" | "TIER2";
    conflictClear: boolean;
    county: string;
    qdroFlag: boolean;
    attorneyFlags: string[];
  }>
): Promise<void> {
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
  await db.run(`UPDATE intake_session SET ${sets.join(", ")} WHERE id = ?`, ...vals, id);
}

export async function addAttorneyFlag(id: string, flag: string): Promise<void> {
  const s = await getSession(id);
  if (!s) return;
  if (!s.attorneyFlags.includes(flag)) {
    await updateSession(id, { attorneyFlags: [...s.attorneyFlags, flag] });
  }
}

export async function touchSession(id: string): Promise<void> {
  await getDb().run(`UPDATE intake_session SET last_activity_at = ? WHERE id = ?`, nowIso(), id);
}

// ── Party identity (pre-gate data class) ─────────────────────────────

export async function setIdentity(
  sessionId: string,
  clientParty: PartyName,
  adverseParty: PartyName
): Promise<void> {
  const db = getDb();
  await db.run(`DELETE FROM party_identity WHERE session_id = ?`, sessionId);
  await db.run(
    `INSERT INTO party_identity (id, session_id, client_party, adverse_party)
     VALUES (?, ?, ?, ?)`,
    newId(),
    sessionId,
    JSON.stringify(clientParty),
    JSON.stringify(adverseParty)
  );
}

export async function getIdentity(
  sessionId: string
): Promise<{ clientParty: PartyName; adverseParty: PartyName } | null> {
  const r = await getDb().get(`SELECT * FROM party_identity WHERE session_id = ?`, sessionId);
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
export async function insertAnswer(
  sessionId: string,
  fieldId: string,
  value: unknown
): Promise<void> {
  const s = await getSession(sessionId);
  if (!s) throw new Error("PERSISTENCE_GUARD: session not found");
  if (!s.conflictClear) {
    throw new Error(
      "PERSISTENCE_GUARD: refusing to persist substantive data without conflict CLEAR"
    );
  }
  if (s.matterId) {
    // A matter-linked session requires the matter to be past conflicts:
    // either the attorney-set CLEARED disposition, or EXTERNAL (open signup —
    // the firm runs conflicts in its own system before directing the client
    // here). Automated screening can produce neither.
    const m = await getDb().get<{ conflict_status: string }>(
      `SELECT conflict_status FROM matter WHERE id = ?`,
      s.matterId
    );
    if (!m || (m.conflict_status !== "CLEARED" && m.conflict_status !== "EXTERNAL")) {
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
  await db.run(
    `INSERT INTO intake_answer (id, session_id, field_id, value, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(session_id, field_id)
     DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    newId(),
    sessionId,
    fieldId,
    JSON.stringify(value),
    t,
    t
  );
}

export async function getAnswers(sessionId: string): Promise<Record<string, unknown>> {
  const rows = await getDb().all<{ field_id: string; value: string }>(
    `SELECT field_id, value FROM intake_answer WHERE session_id = ?`,
    sessionId
  );
  const out: Record<string, unknown> = {};
  for (const r of rows) out[r.field_id] = JSON.parse(r.value);
  return out;
}

// ── Bot interaction log (UPL defense; PII-free by construction) ──────

export async function logBotInteraction(
  sessionRef: string,
  direction: "USER" | "BOT",
  kind: string,
  contentId: string
): Promise<void> {
  await getDb().run(
    `INSERT INTO bot_interaction_log (id, session_ref, direction, kind, content_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    newId(),
    sessionRef,
    direction,
    kind,
    contentId,
    nowIso()
  );
}

export async function getBotLog(sessionRef: string) {
  return getDb().all<{
    direction: string;
    kind: string;
    content_id: string;
    created_at: string;
  }>(
    `SELECT direction, kind, content_id, created_at FROM bot_interaction_log
     WHERE session_ref = ? ORDER BY created_at ASC, id ASC`,
    sessionRef
  );
}

// ── Audit events (hash-chained; survives purges) ─────────────────────

/**
 * Tamper-evident audit trail: every event carries
 * hash = SHA-256(prev_hash | id | ref | event | detail | actor | created_at).
 * Editing or deleting any historical row breaks every later hash
 * (verifyAuditChain). Raw confidential content NEVER goes in `detail` —
 * names appear only as salted HMAC hashes (src/lib/security/audit-hash.ts),
 * documents only as IDs/content hashes.
 *
 * The read-tail-then-insert pair runs inside `serialized()`: on Postgres,
 * concurrent requests would otherwise read the same tail and fork the chain.
 */
export async function recordAudit(
  sessionRef: string,
  event: string,
  detail?: string,
  actor?: string
): Promise<void> {
  await getDb().serialized(async (tx) => {
    const last = await tx.get<{ hash: string | null }>(
      `SELECT hash FROM audit_event ORDER BY rowid DESC LIMIT 1`
    );
    const prev = last?.hash ?? "GENESIS";
    const id = newId();
    const t = nowIso();
    const hash = createHash("sha256")
      .update([prev, id, sessionRef, event, detail ?? "", actor ?? "", t].join("|"))
      .digest("hex");
    await tx.run(
      `INSERT INTO audit_event (id, session_ref, event, detail, actor, prev_hash, hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      sessionRef,
      event,
      detail ?? null,
      actor ?? null,
      prev,
      hash,
      t
    );
  });
}

/** Walk the whole chain; returns the first broken row id, or null if intact. */
export async function verifyAuditChain(): Promise<string | null> {
  const rows = await getDb().all<{
    id: string;
    session_ref: string;
    event: string;
    detail: string | null;
    actor: string | null;
    prev_hash: string | null;
    hash: string | null;
    created_at: string;
  }>(
    `SELECT id, session_ref, event, detail, actor, prev_hash, hash, created_at
     FROM audit_event ORDER BY rowid ASC`
  );
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

export async function getAuditEvents(sessionRef: string) {
  return getDb().all<{ event: string; detail: string | null; created_at: string }>(
    `SELECT event, detail, created_at FROM audit_event
     WHERE session_ref = ? ORDER BY created_at ASC, id ASC`,
    sessionRef
  );
}

// ── Purge (retention policy) ─────────────────────────────────────────

/**
 * Remove ALL substantive + identity data for a session, keeping only the
 * minimal audit trail (and the PII-free bot log). Used on conflict HIT,
 * scope-gate trips, and the abandoned-session sweep.
 */
export async function purgeSession(sessionId: string, reason: string): Promise<void> {
  const db = getDb();
  await db.run(`DELETE FROM intake_answer WHERE session_id = ?`, sessionId);
  await db.run(`DELETE FROM party_identity WHERE session_id = ?`, sessionId);
  await db.run(`DELETE FROM intake_session WHERE id = ?`, sessionId);
  await recordAudit(sessionId, "SESSION_PURGED", reason);
}

export async function sweepAbandoned(olderThanDays: number): Promise<string[]> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
  const rows = await getDb().all<{ id: string }>(
    `SELECT id FROM intake_session
     WHERE last_activity_at < ? AND state != 'READY_FOR_REVIEW'`,
    cutoff
  );
  for (const r of rows) await purgeSession(r.id, "ABANDONED_RETENTION_SWEEP");
  return rows.map((r) => r.id);
}

export async function listSessionsByState(state: MachineState): Promise<SessionRow[]> {
  const rows = await getDb().all(
    `SELECT * FROM intake_session WHERE state = ? ORDER BY updated_at DESC`,
    state
  );
  return rows.map(rowToSession);
}

export async function listSessionsByOwner(ownerSubject: string): Promise<SessionRow[]> {
  const rows = await getDb().all(
    `SELECT * FROM intake_session WHERE owner_subject = ? ORDER BY updated_at DESC`,
    ownerSubject
  );
  return rows.map(rowToSession);
}

/** Test helper: raw row counts for DB-level persistence assertions. */
export async function countRows(
  table: "intake_session" | "party_identity" | "intake_answer" | "bot_interaction_log" | "audit_event",
  sessionRef?: string
): Promise<number> {
  const db = getDb();
  if (sessionRef) {
    const col =
      table === "intake_session" ? "id" : table === "party_identity" || table === "intake_answer" ? "session_id" : "session_ref";
    const r = (await db.get<{ c: number }>(
      `SELECT COUNT(*) AS c FROM ${table} WHERE ${col} = ?`,
      sessionRef
    ))!;
    return r.c;
  }
  const r = (await db.get<{ c: number }>(`SELECT COUNT(*) AS c FROM ${table}`))!;
  return r.c;
}
