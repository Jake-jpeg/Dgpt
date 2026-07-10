/**
 * Data layer — ALL SQL in this app lives in this directory.
 *
 * Data classes are deliberately split (design standard: "okay even if we get
 * hacked" — minimize what exists to steal, and keep the UPL-defense record
 * separable from identifying data):
 *
 *   A. intake_session      — state-machine skeleton, no substantive facts
 *   B. party_identity      — pre-gate bare identity ONLY (purged for
 *                            conflicted / out-of-scope / abandoned sessions)
 *   C. intake_answer       — substantive intake data; only ever written after
 *                            a conflict CLEAR + in-scope (enforced in the
 *                            state machine and verified by tests at DB level)
 *   D. bot_interaction_log — UPL-defense record of what the bot said.
 *                            Content IDs only — never free text, never PII.
 *                            No foreign key: survives session purges, linked
 *                            only by an opaque session ref.
 *   E. audit_event         — minimal audit trail. No FK; survives purges.
 *                            PII appears only as salted HMAC hashes.
 *
 * Engine: node:sqlite (built into Node ≥22, zero native dependencies).
 * Portability: schema uses TEXT/INTEGER only and `?` placeholders; migrating
 * to Postgres is a driver swap confined to this directory.
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DDL = `
CREATE TABLE IF NOT EXISTS intake_session (
  id               TEXT PRIMARY KEY,
  state            TEXT NOT NULL,
  tier             TEXT,
  initiated_by     TEXT NOT NULL,            -- CLIENT | ATTORNEY
  owner_subject    TEXT NOT NULL,            -- opaque auth subject (provider|sub)
  conflict_clear   INTEGER NOT NULL DEFAULT 0,
  county           TEXT,
  qdro_flag        INTEGER NOT NULL DEFAULT 0,
  attorney_flags   TEXT NOT NULL DEFAULT '[]',
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  last_activity_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_state ON intake_session(state);
CREATE INDEX IF NOT EXISTS idx_session_owner ON intake_session(owner_subject);

CREATE TABLE IF NOT EXISTS party_identity (
  id            TEXT PRIMARY KEY,
  session_id    TEXT NOT NULL UNIQUE REFERENCES intake_session(id) ON DELETE CASCADE,
  client_party  TEXT NOT NULL,               -- JSON { fullLegalName, priorNames[] }
  adverse_party TEXT NOT NULL                -- JSON { fullLegalName, priorNames[] }
);

CREATE TABLE IF NOT EXISTS intake_answer (
  id         TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES intake_session(id) ON DELETE CASCADE,
  field_id   TEXT NOT NULL,
  value      TEXT NOT NULL,                  -- JSON-encoded validated value
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(session_id, field_id)
);

CREATE TABLE IF NOT EXISTS bot_interaction_log (
  id          TEXT PRIMARY KEY,
  session_ref TEXT NOT NULL,                 -- opaque; intentionally no FK
  direction   TEXT NOT NULL,                 -- USER | BOT
  kind        TEXT NOT NULL,
  content_id  TEXT NOT NULL,                 -- approved copy/card/term/question ID or intent code
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_botlog_ref ON bot_interaction_log(session_ref);

CREATE TABLE IF NOT EXISTS audit_event (
  id          TEXT PRIMARY KEY,
  session_ref TEXT NOT NULL,                 -- opaque; intentionally no FK
  event       TEXT NOT NULL,
  detail      TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_ref ON audit_event(session_ref);
CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_event(event);
`;

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (_db) return _db;
  const p = process.env.DATABASE_PATH ?? "./data/dev.db";
  if (p !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(p)), { recursive: true });
  }
  _db = new DatabaseSync(p === ":memory:" ? p : path.resolve(p));
  _db.exec("PRAGMA foreign_keys = ON;");
  _db.exec(DDL);
  return _db;
}

/** Test helper: close and forget the singleton (e.g. between suites). */
export function resetDbForTests(): void {
  if (_db) {
    try {
      _db.close();
    } catch {
      /* already closed */
    }
    _db = null;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return crypto.randomUUID();
}
