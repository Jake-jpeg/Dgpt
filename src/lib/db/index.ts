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
 *   E. audit_event         — hash-chained audit trail. No FK; survives
 *                            purges. PII appears only as salted HMAC hashes.
 *
 * 2.0 attorney-workflow additions (matter-centered model):
 *
 *   F. app_user            — DB-stored roles (CLIENT | STAFF | ATTORNEY |
 *                            ADMIN). Roles are NEVER trusted from the
 *                            browser; protected actions re-check this table.
 *   G. matter              — the unit of representation. Lifecycle,
 *                            conflict status, legal hold, client binding.
 *   H. matter_access       — STAFF/ATTORNEY grants to specific matters.
 *   I. invitation          — matter-linked, single-use, expiring, revocable.
 *                            Only a SHA-256 hash of the token is stored.
 *   J. disclosure_ack      — versioned relationship-disclosure consent.
 *                            No FK: consent records survive purges.
 *   K. conflict_submission — conflict-screening history. No FK: the minimum
 *                            information needed for FUTURE conflict checks
 *                            is retained even when a matter's substantive
 *                            content is purged.
 *   L. accommodation / assistance_request — alternate-intake records and
 *                            client help requests.
 *   M. document / document_version / document_approval / document_release
 *                            — attorney-supervised document lifecycle.
 *                            Approval binds to an exact version + SHA-256.
 *   N. ai_invocation       — metadata-only log of internal AI use (never
 *                            prompts, never document content).
 *   O. app_config          — admin-managed configuration (retention etc.).
 *                            Attorney-only rules are NOT configurable here.
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
  initiated_by     TEXT NOT NULL,            -- CLIENT | STAFF | ATTORNEY
  owner_subject    TEXT NOT NULL,            -- opaque auth subject (provider|sub)
  matter_id        TEXT,                     -- 2.0: the matter this intake belongs to
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
CREATE INDEX IF NOT EXISTS idx_session_matter ON intake_session(matter_id);

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
  actor       TEXT,                          -- opaque user id/subject; never a name
  prev_hash   TEXT,                          -- hash chain: tamper-evident
  hash        TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_ref ON audit_event(session_ref);
CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_event(event);

-- ── F. Users (DB-stored roles) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_user (
  id         TEXT PRIMARY KEY,
  subject    TEXT UNIQUE,                    -- opaque auth subject; NULL until first login
  email      TEXT NOT NULL UNIQUE,           -- lowercased
  name       TEXT NOT NULL DEFAULT '',
  role       TEXT NOT NULL DEFAULT 'CLIENT'
             CHECK (role IN ('CLIENT','STAFF','ATTORNEY','ADMIN')),
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ── G. Matters ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matter (
  id                     TEXT PRIMARY KEY,
  label                  TEXT NOT NULL,      -- internal working label; keep non-identifying
  lifecycle              TEXT NOT NULL DEFAULT 'PROSPECTIVE'
                         CHECK (lifecycle IN ('PROSPECTIVE','ENGAGED','ABANDONED','DECLINED','CLOSED')),
  conflict_status        TEXT NOT NULL DEFAULT 'NOT_STARTED'
                         CHECK (conflict_status IN (
                           'NOT_STARTED','NO_APPARENT_MATCH','POTENTIAL_MATCH',
                           'NEEDS_MORE_INFORMATION','PENDING_ATTORNEY_REVIEW',
                           'CLEARED','DECLINED')),
  conflict_status_set_by TEXT,
  conflict_status_set_at TEXT,
  legal_hold             INTEGER NOT NULL DEFAULT 0,
  legal_hold_reason      TEXT,
  client_user_id         TEXT REFERENCES app_user(id),
  created_by             TEXT NOT NULL,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL,
  last_activity_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_matter_client ON matter(client_user_id);
CREATE INDEX IF NOT EXISTS idx_matter_lifecycle ON matter(lifecycle);

CREATE TABLE IF NOT EXISTS matter_access (
  id         TEXT PRIMARY KEY,
  matter_id  TEXT NOT NULL REFERENCES matter(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  granted_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(matter_id, user_id)
);

-- ── I. Invitations (token NEVER stored raw) ─────────────────────────
CREATE TABLE IF NOT EXISTS invitation (
  id              TEXT PRIMARY KEY,
  matter_id       TEXT NOT NULL REFERENCES matter(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,      -- SHA-256(raw token)
  expires_at      TEXT NOT NULL,
  revoked_at      TEXT,
  used_at         TEXT,
  used_by_user_id TEXT,
  created_by      TEXT NOT NULL,
  created_at      TEXT NOT NULL
);

-- ── J. Disclosure acknowledgments (no FK: survives purges) ──────────
CREATE TABLE IF NOT EXISTS disclosure_ack (
  id              TEXT PRIMARY KEY,
  matter_ref      TEXT NOT NULL,
  user_ref        TEXT NOT NULL,
  version         TEXT NOT NULL,
  acknowledged_at TEXT NOT NULL,
  ip              TEXT,                      -- optional capture; OFF by default
  user_agent      TEXT,                      -- optional capture; OFF by default
  UNIQUE(matter_ref, user_ref, version)
);

-- ── K. Conflict-screening history (no FK: survives purges) ──────────
CREATE TABLE IF NOT EXISTS conflict_submission (
  id            TEXT PRIMARY KEY,
  matter_ref    TEXT NOT NULL,
  client_party  TEXT NOT NULL,               -- JSON { fullLegalName, priorNames[] }
  adverse_party TEXT NOT NULL,               -- JSON
  entities      TEXT NOT NULL DEFAULT '[]',  -- JSON: relevant entities, if any
  screen_result TEXT NOT NULL
                CHECK (screen_result IN (
                  'NO_APPARENT_MATCH','POTENTIAL_MATCH',
                  'NEEDS_MORE_INFORMATION','PENDING_ATTORNEY_REVIEW')),
  submitted_by  TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  disposition   TEXT CHECK (disposition IN ('CLEARED','DECLINED','NEEDS_MORE_INFORMATION') OR disposition IS NULL),
  resolved_by   TEXT,
  resolved_at   TEXT,
  internal_note TEXT                         -- attorney/staff only; never shown to clients
);
CREATE INDEX IF NOT EXISTS idx_conflict_matter ON conflict_submission(matter_ref);

-- ── L. Accommodations + assistance requests ─────────────────────────
CREATE TABLE IF NOT EXISTS accommodation (
  id          TEXT PRIMARY KEY,
  matter_id   TEXT NOT NULL REFERENCES matter(id) ON DELETE CASCADE,
  method      TEXT NOT NULL
              CHECK (method IN ('TELEPHONE','VIDEO','IN_PERSON','PAPER','ASSISTED_PORTAL','OTHER_APPROVED')),
  note        TEXT,
  recorded_by TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS info_request (
  id         TEXT PRIMARY KEY,
  matter_id  TEXT NOT NULL REFERENCES matter(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,                 -- plain-language item shown to the client
  internal_note TEXT,                       -- staff/attorney only; never sent to the client
  status     TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','RESOLVED')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_info_request_matter ON info_request(matter_id);

CREATE TABLE IF NOT EXISTS assistance_request (
  id           TEXT PRIMARY KEY,
  matter_id    TEXT NOT NULL REFERENCES matter(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'OPEN'
               CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS internal_note (
  id         TEXT PRIMARY KEY,
  matter_id  TEXT NOT NULL REFERENCES matter(id) ON DELETE CASCADE,
  author     TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'NOTE' CHECK (kind IN ('NOTE','ESCALATION')),
  body       TEXT NOT NULL,                 -- internal work product; NEVER client-visible
  status     TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','RESOLVED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_internal_note_matter ON internal_note(matter_id);

-- ── M. Documents (attorney-supervised lifecycle) ────────────────────
CREATE TABLE IF NOT EXISTS document (
  id                 TEXT PRIMARY KEY,
  matter_id          TEXT NOT NULL REFERENCES matter(id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  doc_kind           TEXT NOT NULL DEFAULT 'GENERAL',  -- GENERAL | CLIENT_UPLOAD | INTERNAL_DRAFT | AI_DRAFT
  created_by         TEXT NOT NULL,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_document_matter ON document(matter_id);

CREATE TABLE IF NOT EXISTS document_version (
  id                TEXT PRIMARY KEY,
  document_id       TEXT NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  version_no        INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN (
                      'DRAFT','ATTORNEY_REVIEW_REQUIRED','CHANGES_REQUESTED',
                      'APPROVED_FOR_CLIENT','APPROVED_FOR_SIGNATURE','APPROVED_FOR_FILING',
                      'RELEASED','SUPERSEDED','WITHDRAWN')),
  storage_key       TEXT NOT NULL,           -- opaque randomized name in FileStorage
  sha256            TEXT NOT NULL,           -- content hash — approval binds to this
  mime              TEXT NOT NULL,
  size_bytes        INTEGER NOT NULL,
  original_filename TEXT,                    -- metadata only; never used as a path
  source            TEXT NOT NULL DEFAULT 'UPLOAD'
                    CHECK (source IN ('UPLOAD','INTERNAL','AI')),
  created_by        TEXT NOT NULL,
  created_at        TEXT NOT NULL,
  UNIQUE(document_id, version_no)
);

CREATE TABLE IF NOT EXISTS document_approval (
  id                  TEXT PRIMARY KEY,
  document_version_id TEXT NOT NULL REFERENCES document_version(id) ON DELETE CASCADE,
  sha256              TEXT NOT NULL,         -- must equal the version's hash at approval AND release
  approved_by         TEXT NOT NULL,         -- app_user.id — role re-checked structurally
  approval_type       TEXT NOT NULL
                      CHECK (approval_type IN ('FOR_CLIENT','FOR_SIGNATURE','FOR_FILING')),
  destination         TEXT NOT NULL,         -- authorized destination, e.g. CLIENT_PORTAL
  note                TEXT,
  revoked_at          TEXT,
  created_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS document_release (
  id                  TEXT PRIMARY KEY,
  document_version_id TEXT NOT NULL REFERENCES document_version(id) ON DELETE CASCADE,
  approval_id         TEXT NOT NULL REFERENCES document_approval(id),
  matter_id           TEXT NOT NULL,
  sha256              TEXT NOT NULL,
  destination         TEXT NOT NULL,
  released_by         TEXT NOT NULL,
  created_at          TEXT NOT NULL
);

-- ── N. AI invocation metadata (NEVER prompts or content) ────────────
CREATE TABLE IF NOT EXISTS ai_invocation (
  id         TEXT PRIMARY KEY,
  matter_ref TEXT,
  user_ref   TEXT NOT NULL,
  feature    TEXT NOT NULL,
  model      TEXT NOT NULL,
  status     TEXT NOT NULL,                  -- OK | ERROR | DISABLED
  created_at TEXT NOT NULL
);

-- ── O. Admin-managed configuration ──────────────────────────────────
CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

/**
 * Additive migrations for pre-2.0 dev databases (node:sqlite has no migration
 * framework; the DB is disposable in dev/beta, but be graceful anyway).
 */
const MIGRATIONS = [
  `ALTER TABLE intake_session ADD COLUMN matter_id TEXT`,
  `ALTER TABLE audit_event ADD COLUMN actor TEXT`,
  `ALTER TABLE audit_event ADD COLUMN prev_hash TEXT`,
  `ALTER TABLE audit_event ADD COLUMN hash TEXT`,
];

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
  for (const m of MIGRATIONS) {
    try {
      _db.exec(m);
    } catch {
      /* column already exists — fine */
    }
  }
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
