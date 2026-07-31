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

/**
 * THE VERBATIM TRANSCRIPT IS NOT RETAINED (operator directive 2026-07-31:
 * "Nuke the transcript… The assumption is that I'll get hacked somewhere for
 * divorcegpt.").
 *
 * CLIENT and ASSISTANT turns are held in memory for the length of one
 * request and never written to disk. What persists is SYSTEM_EVENT rows —
 * machine facts the server wrote about actions it already took ("gate
 * GATE_DV passed", "answer recorded q=…", "stopped: dv") — plus the
 * structured `intake_answer` rows, which are the actual record: they are
 * what buildRenderPayload turns into the pleadings.
 *
 * The reasoning, in the operator's own words and his own design standard
 * (README, "okay even if we get hacked"): the verbatim log is a byproduct of
 * the INTERVIEW METHOD, not the record of it. A phone intake produces notes,
 * not a wiretap. What the verbatim added was narrative that never becomes a
 * form field — abuse disclosures, affairs, medical history — and that is
 * exactly the material that turns a breach from embarrassing into
 * catastrophic. Retention is a decision the attorney makes deliberately,
 * after review, not a default the database makes for him.
 *
 * `intake_chat_message` was never in the README data-class table at all; it
 * was added with the chat intake and never run through the standard.
 */
export function isRetainedRole(role: ChatRole): boolean {
  return role === "SYSTEM_EVENT";
}

export async function appendChatMessage(opts: {
  sessionId: string;
  role: ChatRole;
  content: string;
  lang?: ChatLang;
}): Promise<ChatMessageRow> {
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
  // Client words and model words leave no trace on disk. The row is returned
  // so callers keep working with a message object for THIS request only.
  if (!isRetainedRole(opts.role)) {
    return {
      id: newId(),
      sessionId: opts.sessionId,
      seq: -1, // never persisted, so it holds no place in the sequence
      role: opts.role,
      content: opts.content,
      lang,
      createdAt: nowIso(),
    };
  }
  const db = getDb();
  const next =
    ((
      await db.get<{ m: number | null }>(
        `SELECT MAX(seq) AS m FROM intake_chat_message WHERE session_id = ?`,
        opts.sessionId
      )
    )?.m ?? 0) + 1;
  const id = newId();
  await db.run(
    `INSERT INTO intake_chat_message (id, session_id, seq, role, content, lang, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    opts.sessionId,
    next,
    opts.role,
    opts.content,
    lang,
    nowIso()
  );
  return (await getChatMessage(id))!;
}

/** Convenience for machine markers — always English, always SYSTEM_EVENT. */
export async function appendSystemEvent(sessionId: string, content: string): Promise<ChatMessageRow> {
  return appendChatMessage({ sessionId, role: "SYSTEM_EVENT", content, lang: "en" });
}

export async function getChatMessage(id: string): Promise<ChatMessageRow | null> {
  const r = await getDb().get(`SELECT * FROM intake_chat_message WHERE id = ?`, id);
  return r ? rowToMessage(r) : null;
}

/** The full transcript in order — what both the client pane and the
 *  attorney's read-only panel render. */
export async function listChatMessages(sessionId: string): Promise<ChatMessageRow[]> {
  const rows = await getDb().all(
    `SELECT * FROM intake_chat_message WHERE session_id = ? ORDER BY seq ASC`,
    sessionId
  );
  return rows.map(rowToMessage);
}

export async function countChatMessages(sessionId: string): Promise<number> {
  const r = await getDb().get<{ c: number }>(
    `SELECT COUNT(*) AS c FROM intake_chat_message WHERE session_id = ?`,
    sessionId
  );
  return r?.c ?? 0;
}
