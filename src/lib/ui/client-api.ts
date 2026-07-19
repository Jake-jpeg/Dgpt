/**
 * Browser-side API helper for portal pages. Adds the CSRF header on every
 * state-changing call and normalizes error messages. All enforcement is
 * server-side — this is convenience plumbing only.
 */

export type Json = Record<string, unknown>;

async function parse(res: Response): Promise<Json> {
  const data = (await res.json().catch(() => ({}))) as Json;
  if (!res.ok) {
    // Beta gate: a 403 "Beta access required" means this browser has not
    // cleared the access-code wall (e.g. it loaded a stale/edge-cached page
    // shell). Send it to the gate instead of surfacing a misleading
    // "not configured" state.
    if (
      res.status === 403 &&
      String(data.error ?? "") === "Beta access required" &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/beta"
    ) {
      window.location.href = "/beta";
    }
    throw new Error(String(data.error ?? `Request failed (${res.status})`));
  }
  return data;
}

export const api = {
  async get(path: string): Promise<Json> {
    return parse(await fetch(path, { headers: { accept: "application/json" } }));
  },
  async send(method: string, path: string, body?: unknown): Promise<Json> {
    return parse(
      await fetch(path, {
        method,
        headers: { "content-type": "application/json", "x-dgpt-csrf": "1" },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    );
  },
  post(path: string, body?: unknown) {
    return this.send("POST", path, body);
  },
  patch(path: string, body?: unknown) {
    return this.send("PATCH", path, body);
  },
  put(path: string, body?: unknown) {
    return this.send("PUT", path, body);
  },
  async upload(path: string, file: File, title?: string): Promise<Json> {
    const form = new FormData();
    form.set("file", file);
    if (title) form.set("title", title);
    return parse(
      await fetch(path, { method: "POST", headers: { "x-dgpt-csrf": "1" }, body: form })
    );
  },
};

export function fmtWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Plain-language labels for machine states shown to firm users. */
export const STATE_LABELS: Record<string, string> = {
  NOT_STARTED: "Not started",
  PRE_GATE: "Awaiting conflict information",
  CONFLICT_REVIEW_PENDING: "Conflict review pending",
  GATE_RESIDENCY: "Scope questions",
  GATE_VENUE: "Scope questions",
  GATE_DV: "Scope questions",
  GATE_CHILDREN: "Scope questions",
  GATE_COMPLEXITY: "Scope questions",
  TIER_BRANCH: "Scope questions",
  INTAKE: "Intake in progress",
  READY_FOR_REVIEW: "Ready for review",
};
