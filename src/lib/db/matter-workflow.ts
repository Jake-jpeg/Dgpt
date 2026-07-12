/**
 * Matter workflow records: accommodations (alternate intake methods),
 * client assistance requests, and missing-information requests.
 *
 * Accessibility rule: a client may request help WITHOUT disclosing any
 * reason — `assistance_request` deliberately has no reason/description
 * column, so a sensitive explanation cannot even be stored.
 */
import { getDb, newId, nowIso } from "./index";

export const ACCOMMODATION_METHODS = [
  "TELEPHONE",
  "VIDEO",
  "IN_PERSON",
  "PAPER",
  "ASSISTED_PORTAL",
  "OTHER_APPROVED",
] as const;

export type AccommodationMethod = (typeof ACCOMMODATION_METHODS)[number];

export interface AccommodationRow {
  id: string;
  matterId: string;
  method: AccommodationMethod;
  note: string | null;
  recordedBy: string;
  createdAt: string;
}

export function recordAccommodation(opts: {
  matterId: string;
  method: AccommodationMethod;
  note?: string;
  recordedBy: string;
}): AccommodationRow {
  const id = newId();
  getDb()
    .prepare(
      `INSERT INTO accommodation (id, matter_id, method, note, recorded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, opts.matterId, opts.method, opts.note ?? null, opts.recordedBy, nowIso());
  return listAccommodations(opts.matterId).find((a) => a.id === id)!;
}

export function listAccommodations(matterId: string): AccommodationRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM accommodation WHERE matter_id = ? ORDER BY created_at DESC`)
    .all(matterId) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: r.id as string,
    matterId: r.matter_id as string,
    method: r.method as AccommodationMethod,
    note: (r.note as string | null) ?? null,
    recordedBy: r.recorded_by as string,
    createdAt: r.created_at as string,
  }));
}

// ── Assistance requests (client "I need help") ───────────────────────

export interface AssistanceRequestRow {
  id: string;
  matterId: string;
  requestedBy: string;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
}

function rowToAssistance(r: Record<string, unknown>): AssistanceRequestRow {
  return {
    id: r.id as string,
    matterId: r.matter_id as string,
    requestedBy: r.requested_by as string,
    status: r.status as AssistanceRequestRow["status"],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function createAssistanceRequest(matterId: string, requestedBy: string): AssistanceRequestRow {
  const id = newId();
  const t = nowIso();
  getDb()
    .prepare(
      `INSERT INTO assistance_request (id, matter_id, requested_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(id, matterId, requestedBy, t, t);
  return listAssistanceRequests(matterId).find((a) => a.id === id)!;
}

export function listAssistanceRequests(matterId: string): AssistanceRequestRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM assistance_request WHERE matter_id = ? ORDER BY created_at DESC`)
    .all(matterId) as Record<string, unknown>[];
  return rows.map(rowToAssistance);
}

export function setAssistanceStatus(
  id: string,
  status: "ACKNOWLEDGED" | "RESOLVED"
): void {
  getDb()
    .prepare(`UPDATE assistance_request SET status = ?, updated_at = ? WHERE id = ?`)
    .run(status, nowIso(), id);
}

// ── Missing-information requests ─────────────────────────────────────

export interface InfoRequestRow {
  id: string;
  matterId: string;
  label: string;
  internalNote: string | null;
  status: "OPEN" | "RESOLVED";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

function rowToInfoRequest(r: Record<string, unknown>): InfoRequestRow {
  return {
    id: r.id as string,
    matterId: r.matter_id as string,
    label: r.label as string,
    internalNote: (r.internal_note as string | null) ?? null,
    status: r.status as InfoRequestRow["status"],
    createdBy: r.created_by as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function createInfoRequest(opts: {
  matterId: string;
  label: string;
  internalNote?: string;
  createdBy: string;
}): InfoRequestRow {
  const id = newId();
  const t = nowIso();
  getDb()
    .prepare(
      `INSERT INTO info_request (id, matter_id, label, internal_note, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?)`
    )
    .run(id, opts.matterId, opts.label, opts.internalNote ?? null, opts.createdBy, t, t);
  return listInfoRequests(opts.matterId).find((i) => i.id === id)!;
}

export function listInfoRequests(matterId: string): InfoRequestRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM info_request WHERE matter_id = ? ORDER BY created_at DESC`)
    .all(matterId) as Record<string, unknown>[];
  return rows.map(rowToInfoRequest);
}

export function resolveInfoRequest(id: string): void {
  getDb()
    .prepare(`UPDATE info_request SET status = 'RESOLVED', updated_at = ? WHERE id = ?`)
    .run(nowIso(), id);
}

export function getInfoRequest(id: string): InfoRequestRow | null {
  const r = getDb()
    .prepare(`SELECT * FROM info_request WHERE id = ?`)
    .get(id) as Record<string, unknown> | undefined;
  return r ? rowToInfoRequest(r) : null;
}
