/**
 * Async AI jobs — the transport fix for long generations.
 *
 * DigitalOcean's gateway terminates an HTTP response at roughly 30 seconds.
 * Opus generations routinely exceed that, and the work COMPLETES server-side;
 * only the response transport dies, which the browser sees as a failure. So
 * AI work no longer rides the request: the route starts the work, records a
 * job here, and returns a job id immediately. The client polls.
 *
 * PRIVACY: `result` and `error` are METADATA AND IDS ONLY. Never a prompt,
 * never document text, never model output, never a stack trace — the same
 * posture as ai_invocation. What a caller needs is "which document version
 * did this produce", and that is an id.
 *
 * A job whose process dies mid-flight would otherwise sit RUNNING forever;
 * `reapStaleJobs` fails anything that has stopped making progress, so the
 * poller always terminates.
 */
import { getDb, newId, nowIso } from "./index";

export const JOB_KINDS = ["AI_ACTION", "INTAKE_TURN"] as const;
export type JobKind = (typeof JOB_KINDS)[number];

export const JOB_STATUSES = ["QUEUED", "RUNNING", "DONE", "FAILED"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** A job is considered dead if it has not progressed within this window. */
export const JOB_STALE_MS = 10 * 60 * 1000;

export interface JobRow {
  id: string;
  kind: JobKind;
  matterRef: string | null;
  sessionRef: string | null;
  requestedBy: string;
  status: JobStatus;
  result: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToJob(r: Record<string, unknown>): JobRow {
  const raw = (r.result as string | null) ?? null;
  let result: Record<string, unknown> | null = null;
  if (raw) {
    try {
      result = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      result = null; // never let a malformed row crash a poll
    }
  }
  return {
    id: r.id as string,
    kind: r.kind as JobKind,
    matterRef: (r.matter_ref as string | null) ?? null,
    sessionRef: (r.session_ref as string | null) ?? null,
    requestedBy: r.requested_by as string,
    status: r.status as JobStatus,
    result,
    error: (r.error as string | null) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function createJob(opts: {
  kind: JobKind;
  requestedBy: string;
  matterId?: string | null;
  sessionId?: string | null;
}): JobRow {
  if (!(JOB_KINDS as readonly string[]).includes(opts.kind)) {
    throw new Error("VALIDATION: unknown job kind");
  }
  const id = newId();
  const t = nowIso();
  getDb()
    .prepare(
      `INSERT INTO ai_job (id, kind, matter_ref, session_ref, requested_by, status, result, error, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'QUEUED', NULL, NULL, ?, ?)`
    )
    .run(id, opts.kind, opts.matterId ?? null, opts.sessionId ?? null, opts.requestedBy, t, t);
  return getJob(id)!;
}

export function getJob(id: string): JobRow | null {
  const r = getDb().prepare(`SELECT * FROM ai_job WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | undefined;
  return r ? rowToJob(r) : null;
}

export function markJobRunning(id: string): void {
  getDb()
    .prepare(`UPDATE ai_job SET status = 'RUNNING', updated_at = ? WHERE id = ?`)
    .run(nowIso(), id);
}

/** Terminal success. `result` must contain ids/metadata only. */
export function completeJob(id: string, result: Record<string, unknown>): void {
  getDb()
    .prepare(`UPDATE ai_job SET status = 'DONE', result = ?, error = NULL, updated_at = ? WHERE id = ?`)
    .run(JSON.stringify(result), nowIso(), id);
}

/**
 * Terminal failure. The message is truncated and stored as-is, so callers
 * must pass something already safe to show (guard messages, status codes) —
 * never a raw provider body or a stack.
 */
export function failJob(id: string, message: string): void {
  getDb()
    .prepare(`UPDATE ai_job SET status = 'FAILED', error = ?, updated_at = ? WHERE id = ?`)
    .run(message.slice(0, 300), nowIso(), id);
}

/**
 * Fail jobs abandoned by a died/restarted process so pollers terminate.
 * Returns the number reaped.
 */
export function reapStaleJobs(now: number = Date.now()): number {
  const cutoff = new Date(now - JOB_STALE_MS).toISOString();
  const stale = getDb()
    .prepare(
      `SELECT id FROM ai_job WHERE status IN ('QUEUED','RUNNING') AND updated_at < ?`
    )
    .all(cutoff) as { id: string }[];
  for (const s of stale) {
    failJob(s.id, "AI_GUARD: the job did not complete (the server restarted or timed out)");
  }
  return stale.length;
}

export function listJobsForMatter(matterId: string): JobRow[] {
  const rows = getDb()
    .prepare(`SELECT * FROM ai_job WHERE matter_ref = ? ORDER BY created_at DESC`)
    .all(matterId) as Record<string, unknown>[];
  return rows.map(rowToJob);
}
