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
 * Engines (src/lib/db/driver.ts — the ONLY place dialects differ):
 *   - DATABASE_URL present  → PostgreSQL. Production. App Platform containers
 *     are ephemeral; a file database dies with every deploy. Postgres is why
 *     deploys no longer destroy data.
 *   - DATABASE_URL absent   → SQLite via node:sqlite (DATABASE_PATH, or
 *     ":memory:" in tests). Local dev and the whole test suite.
 *
 * Portability rules the schema already obeys: TEXT/INTEGER columns only,
 * `?` placeholders, JS-generated UUIDs and ISO timestamps, no RETURNING,
 * no dialect functions. The one engine seam: audit_event ordering uses
 * SQLite's implicit rowid; the Postgres DDL declares a real
 * `rowid BIGSERIAL` column ("rowid" is not reserved in Postgres), so every
 * query string stays byte-identical across engines.
 */
import type { Db, SqlParam } from "./driver";
import { createPostgresDb, createSqliteDb } from "./driver";

function ddl(dialect: "sqlite" | "postgres"): string {
  const pg = dialect === "postgres";
  return `
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
  created_at  TEXT NOT NULL${pg ? ",\n  rowid       BIGSERIAL                  -- insertion order; implicit in SQLite" : ""}
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
                           'NOT_STARTED','EXTERNAL','NO_APPARENT_MATCH','POTENTIAL_MATCH',
                           'NEEDS_MORE_INFORMATION','PENDING_ATTORNEY_REVIEW',
                           'CLEARED','DECLINED')),
  conflict_status_set_by TEXT,
  conflict_status_set_at TEXT,
  legal_hold             INTEGER NOT NULL DEFAULT 0,
  legal_hold_reason      TEXT,
  client_user_id         TEXT REFERENCES app_user(id),
  -- B6 attorney jurisdiction & scope review (facts vs determination)
  jurisdiction_candidate   TEXT,
  jurisdiction_confirmed   TEXT,
  jurisdiction_confirmed_by TEXT,
  jurisdiction_confirmed_at TEXT,
  matter_category          TEXT,
  matter_category_confirmed_by TEXT,
  scope_status             TEXT NOT NULL DEFAULT 'UNREVIEWED'
                           CHECK (scope_status IN ('UNREVIEWED','UNDER_REVIEW','ACCEPTED','DECLINED','MULTI_JURISDICTION_REVIEW_REQUIRED')),
  scope_notes              TEXT,
  intake_schema_version    TEXT,
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
  target_email    TEXT NOT NULL DEFAULT '',  -- lowercased; only this account may accept
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
  doc_kind           TEXT NOT NULL DEFAULT 'GENERAL',  -- GENERAL | CLIENT_UPLOAD | INTERNAL_DRAFT | AI_DRAFT | RENDERED_FORM
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

-- ── P. Schema-driven intake answers (2.0 NY intake engine) ──────────────
CREATE TABLE IF NOT EXISTS matter_intake_answer (
  matter_id   TEXT NOT NULL,
  question_id TEXT NOT NULL,
  value       TEXT NOT NULL,               -- JSON-encoded validated value
  updated_at  TEXT NOT NULL,
  updated_by  TEXT NOT NULL,
  PRIMARY KEY (matter_id, question_id)
);

CREATE TABLE IF NOT EXISTS matter_intake_answer_history (
  id          TEXT PRIMARY KEY,
  matter_id   TEXT NOT NULL,
  question_id TEXT NOT NULL,
  value       TEXT NOT NULL,
  changed_at  TEXT NOT NULL,
  changed_by  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_answer_history ON matter_intake_answer_history(matter_id, question_id);

CREATE TABLE IF NOT EXISTS document_extraction (
  document_version_id TEXT PRIMARY KEY,
  status      TEXT NOT NULL CHECK (status IN ('EXTRACTED','UNSUPPORTED','FAILED')),
  text        TEXT,                        -- bounded extracted text (synthetic proof)
  locator_note TEXT,
  created_at  TEXT NOT NULL
);

-- ── N. AI invocation metadata (NEVER prompts or content) ────────────
CREATE TABLE IF NOT EXISTS ai_invocation (
  id         TEXT PRIMARY KEY,
  matter_ref TEXT,
  user_ref   TEXT NOT NULL,
  feature    TEXT NOT NULL,
  model      TEXT NOT NULL,
  status     TEXT NOT NULL,                  -- OK | ERROR | DISABLED | DENIED | REJECTED_OUTPUT
  response_id TEXT,                          -- provider response ID (metadata)
  prompt_version TEXT,
  latency_ms INTEGER,
  tokens_in  INTEGER,
  tokens_out INTEGER,
  created_at TEXT NOT NULL
);

-- ── N2. Async AI jobs ───────────────────────────────────────────────
-- DigitalOcean's gateway kills HTTP responses at ~30s while Opus
-- generations run longer, so AI work is started, tracked here, and polled.
-- The result and error columns hold METADATA AND IDS ONLY — never prompts,
-- document text, model output, or client content.
CREATE TABLE IF NOT EXISTS ai_job (
  id           TEXT PRIMARY KEY,
  kind         TEXT NOT NULL,               -- AI_ACTION | INTAKE_TURN
  matter_ref   TEXT,
  session_ref  TEXT,
  requested_by TEXT NOT NULL,
  status       TEXT NOT NULL,               -- QUEUED | RUNNING | DONE | FAILED
  result       TEXT,                        -- JSON metadata/ids only
  error        TEXT,                        -- safe message only, never a stack
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_job_matter ON ai_job(matter_ref);
CREATE INDEX IF NOT EXISTS idx_ai_job_session ON ai_job(session_ref);
CREATE INDEX IF NOT EXISTS idx_ai_job_status ON ai_job(status);

-- ── N3. Conversational intake transcript ────────────────────────────
-- Append-only. CASCADEs with its intake_session, so the existing retention
-- sweep purges transcripts with the session it belongs to.
CREATE TABLE IF NOT EXISTS intake_chat_message (
  id         TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES intake_session(id) ON DELETE CASCADE,
  seq        INTEGER NOT NULL,
  role       TEXT NOT NULL,                 -- CLIENT | ASSISTANT | SYSTEM_EVENT
  content    TEXT NOT NULL,
  lang       TEXT NOT NULL DEFAULT 'en',    -- en | ko
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_session_seq
  ON intake_chat_message(session_id, seq);

-- ── O. Admin-managed configuration ──────────────────────────────────
CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;
}

/**
 * Additive migrations for pre-2.0 databases (no migration framework; on a
 * fresh database every statement fails "duplicate column" and is skipped —
 * identical semantics on both engines).
 */
const MIGRATIONS = [
  `ALTER TABLE intake_session ADD COLUMN matter_id TEXT`,
  `ALTER TABLE matter ADD COLUMN jurisdiction_candidate TEXT`,
  `ALTER TABLE matter ADD COLUMN jurisdiction_confirmed TEXT`,
  `ALTER TABLE matter ADD COLUMN jurisdiction_confirmed_by TEXT`,
  `ALTER TABLE matter ADD COLUMN jurisdiction_confirmed_at TEXT`,
  `ALTER TABLE matter ADD COLUMN matter_category TEXT`,
  `ALTER TABLE matter ADD COLUMN matter_category_confirmed_by TEXT`,
  `ALTER TABLE matter ADD COLUMN scope_status TEXT NOT NULL DEFAULT 'UNREVIEWED'`,
  `ALTER TABLE matter ADD COLUMN scope_notes TEXT`,
  `ALTER TABLE matter ADD COLUMN intake_schema_version TEXT`,
  `ALTER TABLE ai_invocation ADD COLUMN response_id TEXT`,
  `ALTER TABLE ai_invocation ADD COLUMN prompt_version TEXT`,
  `ALTER TABLE ai_invocation ADD COLUMN latency_ms INTEGER`,
  `ALTER TABLE ai_invocation ADD COLUMN tokens_in INTEGER`,
  `ALTER TABLE ai_invocation ADD COLUMN tokens_out INTEGER`,
  `ALTER TABLE audit_event ADD COLUMN actor TEXT`,
  `ALTER TABLE audit_event ADD COLUMN prev_hash TEXT`,
  `ALTER TABLE audit_event ADD COLUMN hash TEXT`,
  // 2026-07-21 email-bound invitations: the address the link is locked to.
  `ALTER TABLE invitation ADD COLUMN target_email TEXT NOT NULL DEFAULT ''`,
  // 2026-07-21 EXTERNAL conflict posture (firm runs conflicts externally):
  // databases must widen the CHECK. Postgres-only syntax — on SQLite these
  // fail and are skipped (fresh SQLite DBs get the new CHECK from the DDL).
  `ALTER TABLE matter DROP CONSTRAINT IF EXISTS matter_conflict_status_check`,
  `ALTER TABLE matter ADD CONSTRAINT matter_conflict_status_check CHECK (conflict_status IN (
     'NOT_STARTED','EXTERNAL','NO_APPARENT_MATCH','POTENTIAL_MATCH',
     'NEEDS_MORE_INFORMATION','PENDING_ATTORNEY_REVIEW','CLEARED','DECLINED'))`,
];

let _engine: Db | null = null;
let _ready: Promise<Db> | null = null;
let _facade: Db | null = null;

async function initialize(): Promise<Db> {
  const url = process.env.DATABASE_URL?.trim();
  const engine = url
    ? await createPostgresDb(url)
    : await createSqliteDb(process.env.DATABASE_PATH ?? "./data/dev.db");
  await engine.exec(ddl(engine.dialect));
  for (const m of MIGRATIONS) {
    try {
      await engine.exec(m);
    } catch {
      /* column already exists — fine */
    }
  }
  _engine = engine;
  return engine;
}

function ensure(): Promise<Db> {
  if (!_ready) _ready = initialize();
  return _ready;
}

/**
 * The app-wide database handle. Returns synchronously; the underlying engine
 * (and its DDL/migrations) initializes on first use and every method awaits
 * that initialization. All methods are async — repos await them.
 */
export function getDb(): Db {
  if (_facade) return _facade;
  _facade = {
    get dialect() {
      return _engine?.dialect ?? (process.env.DATABASE_URL?.trim() ? "postgres" : "sqlite");
    },
    async get(sql, ...params) {
      return (await ensure()).get(sql, ...params);
    },
    async all(sql, ...params) {
      return (await ensure()).all(sql, ...params);
    },
    async run(sql, ...params: SqlParam[]) {
      return (await ensure()).run(sql, ...params);
    },
    async exec(sql) {
      return (await ensure()).exec(sql);
    },
    async serialized(fn) {
      return (await ensure()).serialized(fn);
    },
    async close() {
      if (_ready) {
        const engine = await _ready.catch(() => null);
        await engine?.close();
      }
      _engine = null;
      _ready = null;
    },
  };
  return _facade;
}

/** Test helper: close and forget the singleton (e.g. between suites). */
export function resetDbForTests(): void {
  const engine = _engine;
  _engine = null;
  _ready = null;
  _facade = null;
  if (engine) void engine.close();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return crypto.randomUUID();
}

export type { Db, SqlParam } from "./driver";
