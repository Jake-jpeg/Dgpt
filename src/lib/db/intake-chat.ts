/**
 * Conversational intake transcript — append-only.
 *
 * Three roles share one ordered story so the attorney reads a single
 * chronological record:
 *   CLIENT       — the client's own words, in the language they wrote them.
 *   ASSISTANT    — what the intake assistant said back.
 *   SYSTEM_EVENT — machine moments ("gate GATE_DV passed", "answer recorded
 *                  q=...", "stopped: scope"). These are written by the
 *                  server from facts it already applied, never by the model.
 *
 * `seq` is allocated under the session and enforced UNIQUE(session_id, seq),
 * so a concurrent double-post cannot silently interleave two turns.
 *
 * Rows CASCADE with the intake_session, so the existing retention sweep
 * purges a transcript exactly when it purges the session.
 *
 * The AUDIT trail gets counts and ids only — transcript content is client
 * confidential and never leaves this table.
 */
import { getDb, newId, nowIso } from "./index";

export const CHAT_ROLES = ["CLIENT", "ASSISTANT", "SYSTEM_EVENT"] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

export const CHAT_LANGS = ["en", "ko"] as const;
export type ChatLang = (typeof CHAT_LANGS)[number];

/** A client turn is bounded; the API rejects longer before reaching here. */
export const MAX_CHAT_MESSAGE_CHARS = 4000;

export interface ChatMessageRow {
  id: string;
  sessionId: string;
  seq: number;
  role: ChatRole;
  content: string;
  lang: ChatLang;
  createdAt: string;
}

function rowToMessage(r: Record<string, unknown>): ChatMessageRow {
  return {
    id: r.id as string,
    sessionId: r.session_id as string,
    seq: r.seq as number,
    role: r.role as ChatRole,
    content: r.content as string,
    lang: (r.lang as ChatLang) ?? "en",
    createdAt: r.created_at as string,
  };
}

export function appendChatMessage(opts: {
  sessionId: string;
  role: ChatRole;
  content: string;
  lang?: ChatLang;
}): ChatMessageRow {
  if (!(CHAT_ROLES as readonly string[]).includes(opts.role)) {
    throw new Error("VALIDATION: unknown chat role");
  }
  const lang: ChatLang = opts.lang ?? "en";
  if (!(CHAT_LANGS as readonly string[]).includes(lang)) {
    throw new Error("VALIDATION: unsupported language");
  }
  if (opts.content.length > MAX_CHAT_MESSAGE_CHARS) {
    throw new Error("VALIDATION: message too long");
  }
  const db = getDb();
  const next =
    ((
      db
        .prepare(`SELECT MAX(seq) AS m FROM intake_chat_message WHERE session_id = ?`)
        .get(opts.sessionId) as { m: number | null } | undefined
    )?.m ?? 0) + 1;
  const id = newId();
  db.prepare(
    `INSERT INTO intake_chat_message (id, session_id, seq, role, content, lang, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, opts.sessionId, next, opts.role, opts.content, lang, nowIso());
  return getChatMessage(id)!;
}

/** Convenience for machine markers — always English, always SYSTEM_EVENT. */
export function appendSystemEvent(sessionId: string, content: string): ChatMessageRow {
  return appendChatMessage({ sessionId, role: "SYSTEM_EVENT", content, lang: "en" });
}

export function getChatMessage(id: string): ChatMessageRow | null {
  const r = getDb().prepare(`SELECT * FROM intake_chat_message WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | undefined;
  return r ? rowToMessage(r) : null;
}

/** The full transcript in order — what both the client pane and the
 *  attorney's read-only panel render. */
export function listChatMessages(sessionId: string): ChatMessageRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM intake_chat_message WHERE session_id = ? ORDER BY seq ASC`)
    .all(sessionId) as Record<string, unknown>[];
  return rows.map(rowToMessage);
}

export function countChatMessages(sessionId: string): number {
  const r = getDb()
    .prepare(`SELECT COUNT(*) AS c FROM intake_chat_message WHERE session_id = ?`)
    .get(sessionId) as { c: number } | undefined;
  return r?.c ?? 0;
}
