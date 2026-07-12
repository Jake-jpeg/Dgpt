/**
 * Document lifecycle — attorney-supervised, version-exact.
 *
 * STRUCTURAL GUARDS (same belt-and-suspenders pattern as the conflict
 * dispositions; none of this is configurable):
 *
 *  - `approveVersion` and `releaseVersion` re-read the acting user's CURRENT
 *    role from app_user at write time and refuse unless it is ATTORNEY.
 *  - An approval binds to ONE exact document_version id AND its SHA-256
 *    content hash. A new/revised version starts unapproved; nothing carries
 *    over.
 *  - Release re-verifies: current ATTORNEY role, exact approved version, a
 *    live (unrevoked) approval whose stored hash equals the version's hash
 *    AND equals a fresh hash of the actual stored bytes, and an authorized
 *    destination matching the approval.
 *  - There is deliberately NO bulk-approval, auto-approval, or presumed
 *    approval code path: one version id per call, always explicit.
 */
import { getDb, newId, nowIso } from "./index";
import { getUserById } from "./users";

export type DocumentVersionStatus =
  | "DRAFT"
  | "ATTORNEY_REVIEW_REQUIRED"
  | "CHANGES_REQUESTED"
  | "APPROVED_FOR_CLIENT"
  | "APPROVED_FOR_SIGNATURE"
  | "APPROVED_FOR_FILING"
  | "RELEASED"
  | "SUPERSEDED"
  | "WITHDRAWN";

export type ApprovalType = "FOR_CLIENT" | "FOR_SIGNATURE" | "FOR_FILING";

export const APPROVAL_STATUS: Record<ApprovalType, DocumentVersionStatus> = {
  FOR_CLIENT: "APPROVED_FOR_CLIENT",
  FOR_SIGNATURE: "APPROVED_FOR_SIGNATURE",
  FOR_FILING: "APPROVED_FOR_FILING",
};

/** Destinations an attorney may authorize. */
export const RELEASE_DESTINATIONS = ["CLIENT_PORTAL", "SIGNATURE", "FILING"] as const;
export type ReleaseDestination = (typeof RELEASE_DESTINATIONS)[number];

export interface DocumentRow {
  id: string;
  matterId: string;
  title: string;
  docKind: "GENERAL" | "CLIENT_UPLOAD" | "INTERNAL_DRAFT" | "AI_DRAFT" | "RENDERED_FORM";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersionRow {
  id: string;
  documentId: string;
  versionNo: number;
  status: DocumentVersionStatus;
  storageKey: string;
  sha256: string;
  mime: string;
  sizeBytes: number;
  originalFilename: string | null;
  source: "UPLOAD" | "INTERNAL" | "AI";
  createdBy: string;
  createdAt: string;
}

export interface DocumentApprovalRow {
  id: string;
  documentVersionId: string;
  sha256: string;
  approvedBy: string;
  approvalType: ApprovalType;
  destination: ReleaseDestination;
  note: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface DocumentReleaseRow {
  id: string;
  documentVersionId: string;
  approvalId: string;
  matterId: string;
  sha256: string;
  destination: ReleaseDestination;
  releasedBy: string;
  createdAt: string;
}

function rowToDocument(r: Record<string, unknown>): DocumentRow {
  return {
    id: r.id as string,
    matterId: r.matter_id as string,
    title: r.title as string,
    docKind: r.doc_kind as DocumentRow["docKind"],
    createdBy: r.created_by as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function rowToVersion(r: Record<string, unknown>): DocumentVersionRow {
  return {
    id: r.id as string,
    documentId: r.document_id as string,
    versionNo: r.version_no as number,
    status: r.status as DocumentVersionStatus,
    storageKey: r.storage_key as string,
    sha256: r.sha256 as string,
    mime: r.mime as string,
    sizeBytes: r.size_bytes as number,
    originalFilename: (r.original_filename as string | null) ?? null,
    source: r.source as DocumentVersionRow["source"],
    createdBy: r.created_by as string,
    createdAt: r.created_at as string,
  };
}

function rowToApproval(r: Record<string, unknown>): DocumentApprovalRow {
  return {
    id: r.id as string,
    documentVersionId: r.document_version_id as string,
    sha256: r.sha256 as string,
    approvedBy: r.approved_by as string,
    approvalType: r.approval_type as ApprovalType,
    destination: r.destination as ReleaseDestination,
    note: (r.note as string | null) ?? null,
    revokedAt: (r.revoked_at as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}

// ── Documents + versions ─────────────────────────────────────────────

export function createDocument(opts: {
  matterId: string;
  title: string;
  docKind: DocumentRow["docKind"];
  createdBy: string;
}): DocumentRow {
  const id = newId();
  const t = nowIso();
  getDb()
    .prepare(
      `INSERT INTO document (id, matter_id, title, doc_kind, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, opts.matterId, opts.title, opts.docKind, opts.createdBy, t, t);
  return getDocument(id)!;
}

export function getDocument(id: string): DocumentRow | null {
  const r = getDb()
    .prepare(`SELECT * FROM document WHERE id = ?`)
    .get(id) as Record<string, unknown> | undefined;
  return r ? rowToDocument(r) : null;
}

export function listDocumentsForMatter(matterId: string): DocumentRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM document WHERE matter_id = ? ORDER BY updated_at DESC`)
    .all(matterId) as Record<string, unknown>[];
  return rows.map(rowToDocument);
}

/**
 * Add a new version. EVERY new or revised version begins unapproved
 * (DRAFT or ATTORNEY_REVIEW_REQUIRED — nothing else is accepted), and all
 * prior non-terminal versions become SUPERSEDED, which kills any pending
 * approval path for them (release checks live status AND hash).
 */
export function addDocumentVersion(opts: {
  documentId: string;
  storageKey: string;
  sha256: string;
  mime: string;
  sizeBytes: number;
  originalFilename?: string;
  source: DocumentVersionRow["source"];
  createdBy: string;
  initialStatus?: "DRAFT" | "ATTORNEY_REVIEW_REQUIRED";
}): DocumentVersionRow {
  const status = opts.initialStatus ?? "DRAFT";
  if (status !== "DRAFT" && status !== "ATTORNEY_REVIEW_REQUIRED") {
    throw new Error("DOCUMENT_GUARD: a new version must begin unapproved");
  }
  const db = getDb();
  const doc = getDocument(opts.documentId);
  if (!doc) throw new Error("VALIDATION: document not found");

  const prev = listVersions(opts.documentId);
  const versionNo = (prev[0]?.versionNo ?? 0) + 1;
  // Supersede prior non-terminal versions — approvals never carry forward.
  db.prepare(
    `UPDATE document_version SET status = 'SUPERSEDED'
     WHERE document_id = ? AND status NOT IN ('RELEASED','WITHDRAWN','SUPERSEDED')`
  ).run(opts.documentId);

  const id = newId();
  db.prepare(
    `INSERT INTO document_version
     (id, document_id, version_no, status, storage_key, sha256, mime, size_bytes,
      original_filename, source, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    opts.documentId,
    versionNo,
    status,
    opts.storageKey,
    opts.sha256,
    opts.mime,
    opts.sizeBytes,
    opts.originalFilename ?? null,
    opts.source,
    opts.createdBy,
    nowIso()
  );
  db.prepare(`UPDATE document SET updated_at = ? WHERE id = ?`).run(nowIso(), opts.documentId);
  return getVersion(id)!;
}

export function getVersion(id: string): DocumentVersionRow | null {
  const r = getDb()
    .prepare(`SELECT * FROM document_version WHERE id = ?`)
    .get(id) as Record<string, unknown> | undefined;
  return r ? rowToVersion(r) : null;
}

export function listVersions(documentId: string): DocumentVersionRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM document_version WHERE document_id = ? ORDER BY version_no DESC`)
    .all(documentId) as Record<string, unknown>[];
  return rows.map(rowToVersion);
}

/** ATTORNEY-only working statuses (never an approval): request changes / withdraw. */
export function setVersionWorkingStatus(opts: {
  versionId: string;
  actingUserId: string;
  status: "CHANGES_REQUESTED" | "WITHDRAWN" | "ATTORNEY_REVIEW_REQUIRED";
}): DocumentVersionRow {
  const actor = getUserById(opts.actingUserId);
  if (!actor || !actor.active || actor.role !== "ATTORNEY") {
    throw new Error("DOCUMENT_GUARD: only an active ATTORNEY may set review statuses");
  }
  const v = getVersion(opts.versionId);
  if (!v) throw new Error("VALIDATION: version not found");
  if (v.status === "RELEASED") {
    throw new Error("DOCUMENT_GUARD: a released version's record is immutable");
  }
  getDb()
    .prepare(`UPDATE document_version SET status = ? WHERE id = ?`)
    .run(opts.status, opts.versionId);
  return getVersion(opts.versionId)!;
}

// ── Approval (attorney-only, version-exact, hash-bound) ──────────────

export function approveVersion(opts: {
  versionId: string;
  actingUserId: string;
  approvalType: ApprovalType;
  destination: ReleaseDestination;
  note?: string;
}): DocumentApprovalRow {
  const actor = getUserById(opts.actingUserId);
  if (!actor || !actor.active || actor.role !== "ATTORNEY") {
    throw new Error("DOCUMENT_GUARD: only an active ATTORNEY may approve a document version");
  }
  const v = getVersion(opts.versionId);
  if (!v) throw new Error("VALIDATION: version not found");
  if (!["DRAFT", "ATTORNEY_REVIEW_REQUIRED", "CHANGES_REQUESTED"].includes(v.status)) {
    throw new Error(`DOCUMENT_GUARD: version in status ${v.status} cannot be approved`);
  }
  const destinationOk =
    (opts.approvalType === "FOR_CLIENT" && opts.destination === "CLIENT_PORTAL") ||
    (opts.approvalType === "FOR_SIGNATURE" && opts.destination === "SIGNATURE") ||
    (opts.approvalType === "FOR_FILING" && opts.destination === "FILING");
  if (!destinationOk) {
    throw new Error("DOCUMENT_GUARD: approval type and destination do not match");
  }

  const id = newId();
  getDb()
    .prepare(
      `INSERT INTO document_approval
       (id, document_version_id, sha256, approved_by, approval_type, destination, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, v.id, v.sha256, actor.id, opts.approvalType, opts.destination, opts.note ?? null, nowIso());
  getDb()
    .prepare(`UPDATE document_version SET status = ? WHERE id = ?`)
    .run(APPROVAL_STATUS[opts.approvalType], v.id);
  return getApproval(id)!;
}

export function getApproval(id: string): DocumentApprovalRow | null {
  const r = getDb()
    .prepare(`SELECT * FROM document_approval WHERE id = ?`)
    .get(id) as Record<string, unknown> | undefined;
  return r ? rowToApproval(r) : null;
}

export function listApprovalsForVersion(versionId: string): DocumentApprovalRow[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM document_approval WHERE document_version_id = ? ORDER BY created_at DESC`
    )
    .all(versionId) as Record<string, unknown>[];
  return rows.map(rowToApproval);
}

export function revokeApproval(opts: { approvalId: string; actingUserId: string }): void {
  const actor = getUserById(opts.actingUserId);
  if (!actor || !actor.active || actor.role !== "ATTORNEY") {
    throw new Error("DOCUMENT_GUARD: only an active ATTORNEY may revoke an approval");
  }
  getDb()
    .prepare(`UPDATE document_approval SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL`)
    .run(nowIso(), opts.approvalId);
}

// ── Release (attorney-only; verifies everything again) ───────────────

export function releaseVersion(opts: {
  versionId: string;
  actingUserId: string;
  destination: ReleaseDestination;
  /** Fresh SHA-256 of the ACTUAL stored bytes, computed by the caller. */
  contentSha256: string;
}): DocumentReleaseRow {
  const actor = getUserById(opts.actingUserId);
  if (!actor || !actor.active || actor.role !== "ATTORNEY") {
    throw new Error("DOCUMENT_GUARD: only an active ATTORNEY may release a document version");
  }
  const v = getVersion(opts.versionId);
  if (!v) throw new Error("VALIDATION: version not found");

  const expectedStatus: DocumentVersionStatus =
    opts.destination === "CLIENT_PORTAL"
      ? "APPROVED_FOR_CLIENT"
      : opts.destination === "SIGNATURE"
        ? "APPROVED_FOR_SIGNATURE"
        : "APPROVED_FOR_FILING";
  if (v.status !== expectedStatus) {
    throw new Error(
      `DOCUMENT_GUARD: version is ${v.status}; release to ${opts.destination} requires ${expectedStatus}`
    );
  }

  const approval = listApprovalsForVersion(v.id).find(
    (a) =>
      !a.revokedAt &&
      a.destination === opts.destination &&
      a.sha256 === v.sha256
  );
  if (!approval) {
    throw new Error("DOCUMENT_GUARD: no live approval for this exact version and destination");
  }
  if (opts.contentSha256 !== v.sha256) {
    throw new Error("DOCUMENT_GUARD: stored content hash does not match the approved version");
  }

  const doc = getDocument(v.documentId)!;
  const id = newId();
  getDb()
    .prepare(
      `INSERT INTO document_release
       (id, document_version_id, approval_id, matter_id, sha256, destination, released_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, v.id, approval.id, doc.matterId, v.sha256, opts.destination, actor.id, nowIso());
  getDb().prepare(`UPDATE document_version SET status = 'RELEASED' WHERE id = ?`).run(v.id);

  const r = getDb()
    .prepare(`SELECT * FROM document_release WHERE id = ?`)
    .get(id) as Record<string, unknown>;
  return {
    id: r.id as string,
    documentVersionId: r.document_version_id as string,
    approvalId: r.approval_id as string,
    matterId: r.matter_id as string,
    sha256: r.sha256 as string,
    destination: r.destination as ReleaseDestination,
    releasedBy: r.released_by as string,
    createdAt: r.created_at as string,
  };
}

/** Client-visible set: ONLY versions released to the client portal. */
export function listReleasedForMatter(matterId: string): {
  document: DocumentRow;
  version: DocumentVersionRow;
  releasedAt: string;
}[] {
  const rows = getDb()
    .prepare(
      `SELECT dv.id AS version_id, d.id AS doc_id, dr.created_at AS released_at
       FROM document_release dr
       JOIN document_version dv ON dv.id = dr.document_version_id
       JOIN document d ON d.id = dv.document_id
       WHERE dr.matter_id = ? AND dr.destination = 'CLIENT_PORTAL'
       ORDER BY dr.created_at DESC`
    )
    .all(matterId) as { version_id: string; doc_id: string; released_at: string }[];
  return rows.map((r) => ({
    document: getDocument(r.doc_id)!,
    version: getVersion(r.version_id)!,
    releasedAt: r.released_at,
  }));
}

export function isVersionReleasedToClient(versionId: string): boolean {
  const r = getDb()
    .prepare(
      `SELECT 1 x FROM document_release WHERE document_version_id = ? AND destination = 'CLIENT_PORTAL'`
    )
    .get(versionId);
  return Boolean(r);
}
