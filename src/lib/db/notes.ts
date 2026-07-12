/**
 * Internal notes + staff→attorney escalations. Internal work product:
 * no client-facing code path reads this table, and no client route may
 * ever expose it.
 */
import { getDb, newId, nowIso } from "./index";

export interface InternalNoteRow {
  id: string;
  matterId: string;
  author: string;
  kind: "NOTE" | "ESCALATION";
  body: string;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
}

function rowToNote(r: Record<string, unknown>): InternalNoteRow {
  return {
    id: r.id as string,
    matterId: r.matter_id as string,
    author: r.author as string,
    kind: r.kind as InternalNoteRow["kind"],
    body: r.body as string,
    status: r.status as InternalNoteRow["status"],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function createInternalNote(opts: {
  matterId: string;
  author: string;
  kind: "NOTE" | "ESCALATION";
  body: string;
}): InternalNoteRow {
  const id = newId();
  const t = nowIso();
  getDb()
    .prepare(
      `INSERT INTO internal_note (id, matter_id, author, kind, body, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, opts.matterId, opts.author, opts.kind, opts.body, t, t);
  return listInternalNotes(opts.matterId).find((n) => n.id === id)!;
}

export function listInternalNotes(matterId: string): InternalNoteRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM internal_note WHERE matter_id = ? ORDER BY created_at DESC`)
    .all(matterId) as Record<string, unknown>[];
  return rows.map(rowToNote);
}

export function resolveInternalNote(id: string): void {
  getDb()
    .prepare(`UPDATE internal_note SET status = 'RESOLVED', updated_at = ? WHERE id = ?`)
    .run(nowIso(), id);
}
