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

export async function recordAccommodation(opts: {
  matterId: string;
  method: AccommodationMethod;
  note?: string;
  recordedBy: string;
}): Promise<AccommodationRow> {
  const id = newId();
  await getDb().run(
    `INSERT INTO accommodation (id, matter_id, method, note, recorded_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    opts.matterId,
    opts.method,
    opts.note ?? null,
    opts.recordedBy,
    nowIso()
  );
  return (await listAccommodations(opts.matterId)).find((a) => a.id === id)!;
}

export async function listAccommodations(matterId: string): Promise<AccommodationRow[]> {
  const rows = await getDb().all(
    `SELECT * FROM accommodation WHERE matter_id = ? ORDER BY created_at DESC`,
    matterId
  );
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

export async function createAssistanceRequest(
  matterId: string,
  requestedBy: string
): Promise<AssistanceRequestRow> {
  const id = newId();
  const t = nowIso();
  await getDb().run(
    `INSERT INTO assistance_request (id, matter_id, requested_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    id,
    matterId,
    requestedBy,
    t,
    t
  );
  return (await listAssistanceRequests(matterId)).find((a) => a.id === id)!;
}

export async function listAssistanceRequests(matterId: string): Promise<AssistanceRequestRow[]> {
  const rows = await getDb().all(
    `SELECT * FROM assistance_request WHERE matter_id = ? ORDER BY created_at DESC`,
    matterId
  );
  return rows.map(rowToAssistance);
}

export async function setAssistanceStatus(
  id: string,
  status: "ACKNOWLEDGED" | "RESOLVED"
): Promise<void> {
  await getDb().run(
    `UPDATE assistance_request SET status = ?, updated_at = ? WHERE id = ?`,
    status,
    nowIso(),
    id
  );
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

export async function createInfoRequest(opts: {
  matterId: string;
  label: string;
  internalNote?: string;
  createdBy: string;
}): Promise<InfoRequestRow> {
  const id = newId();
  const t = nowIso();
  await getDb().run(
    `INSERT INTO info_request (id, matter_id, label, internal_note, status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?)`,
    id,
    opts.matterId,
    opts.label,
    opts.internalNote ?? null,
    opts.createdBy,
    t,
    t
  );
  return (await listInfoRequests(opts.matterId)).find((i) => i.id === id)!;
}

export async function listInfoRequests(matterId: string): Promise<InfoRequestRow[]> {
  const rows = await getDb().all(
    `SELECT * FROM info_request WHERE matter_id = ? ORDER BY created_at DESC`,
    matterId
  );
  return rows.map(rowToInfoRequest);
}

export async function resolveInfoRequest(id: string): Promise<void> {
  await getDb().run(`UPDATE info_request SET status = 'RESOLVED', updated_at = ? WHERE id = ?`, nowIso(), id);
}

export async function getInfoRequest(id: string): Promise<InfoRequestRow | null> {
  const r = await getDb().get(`SELECT * FROM info_request WHERE id = ?`, id);
  return r ? rowToInfoRequest(r) : null;
}
