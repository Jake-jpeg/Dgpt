"use client";

/**
 * Firm matter working view — STAFF/ATTORNEY (grant-scoped by the server).
 *
 * Attorney-only controls (conflict disposition, lifecycle/legal hold,
 * approve / release / request changes / withdraw) render only for the
 * ATTORNEY role. Hiding is convenience: every control calls the protected
 * API, which re-checks the CURRENT role and the structural guards
 * regardless of what this page shows.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Shell, useMe, StatusBadge, ErrorNotice, AccordionPanel, type PanelOpenSignal } from "@/components/shell";
import { api, fmtWhen, STATE_LABELS } from "@/lib/ui/client-api";
import { ALLOWED_RENDERS } from "@/lib/pdf-service/types";
import Workbench from "./workbench";

interface MatterDetail {
  id: string;
  label: string;
  lifecycle: string;
  conflictStatus: string;
  legalHold: boolean;
  clientUserId: string | null;
  createdAt: string;
  updatedAt: string;
  sessions: { id: string; state: string; tier: string | null; updatedAt: string }[];
}
interface Approval {
  id: string;
  approvalType: string;
  destination: string;
  sha256: string;
  approvedBy: string;
  revoked: boolean;
  createdAt: string;
}
interface Version {
  id: string;
  versionNo: number;
  status: string;
  sha256: string;
  mime: string;
  sizeBytes: number;
  originalFilename: string | null;
  source: string;
  createdAt: string;
  approvals: Approval[];
}
interface Doc {
  id: string;
  title: string;
  docKind: string;
  createdAt: string;
  versions: Version[];
}
interface AuditEvent {
  ref: string;
  event: string;
  detail: string | null;
  at: string;
}

export default function FirmMatterDetail() {
  const params = useParams<{ id: string }>();
  const matterId = params.id;
  const { me, loading } = useMe();
  const role = me?.user?.role;
  const authorized = role === "STAFF" || role === "ATTORNEY";
  const isAttorney = role === "ATTORNEY";

  const [matter, setMatter] = useState<MatterDetail | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  // Jurisdiction confirmation drives one triage item; undefined = not loaded.
  const [jurisConfirmed, setJurisConfirmed] = useState<string | null | undefined>(undefined);
  // An attention-item click asks a specific panel to open + scroll. The nonce
  // makes a repeat click on the same target re-fire.
  const [openSignal, setOpenSignal] = useState<PanelOpenSignal | null>(null);
  const requestOpen = (id: string) =>
    setOpenSignal((s) => ({ id, nonce: (s?.nonce ?? 0) + 1 }));

  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [revisionFor, setRevisionFor] = useState<string | null>(null);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [approveFor, setApproveFor] = useState<string | null>(null);
  const [approveType, setApproveType] = useState("FOR_CLIENT");
  const [releaseFor, setReleaseFor] = useState<string | null>(null);
  const [aiFeature, setAiFeature] = useState("INTERNAL_SUMMARY");

  const load = useCallback(async () => {
    if (!authorized || !matterId) return;
    setErr(null);
    try {
      const m = (await api.get(`/api/matters/${matterId}`)) as { matter: MatterDetail };
      setMatter(m.matter);
      const d = await api.get(`/api/matters/${matterId}/documents`);
      setDocs((d as unknown as { documents: Doc[] }).documents);
      if (role === "ATTORNEY") {
        const a = (await api.get(`/api/matters/${matterId}/audit`)) as {
          events: AuditEvent[];
        };
        setAudit(a.events);
        // Existing endpoint — powers the "jurisdiction unset" triage item.
        const j = (await api.get(`/api/matters/${matterId}/jurisdiction`)) as {
          attorneyDetermination?: { jurisdictionConfirmed: string | null };
        };
        setJurisConfirmed(j.attorneyDetermination?.jurisdictionConfirmed ?? null);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load the matter");
    }
  }, [authorized, matterId, role]);

  useEffect(() => {
    // Hydrate the working view once the role is known.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function act(fn: () => Promise<void>, done?: string) {
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      await fn();
      if (done) setInfo(done);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The action failed");
    } finally {
      setBusy(false);
    }
  }

  // ── Triage derivations (all from already-loaded data; no extra calls) ──
  const allVersions = docs.flatMap((d) => d.versions.map((v) => ({ v, doc: d })));
  const unapproved = allVersions.filter(({ v }) =>
    ["DRAFT", "ATTORNEY_REVIEW_REQUIRED", "CHANGES_REQUESTED"].includes(v.status)
  );
  const unapprovedAi = unapproved.filter(({ v }) => v.source === "AI");
  const readySessions = (matter?.sessions ?? []).filter((s) => s.state === "READY_FOR_REVIEW");

  // "Needs your attention" — exactly the items awaiting attorney action.
  // In-page targets carry `panel` (click opens + scrolls that panel);
  // cross-page targets carry `href` (a normal navigation).
  const attention: {
    key: string;
    text: string;
    link: string;
    panel?: string;
    href?: string;
  }[] = [];
  if (isAttorney) {
    if (jurisConfirmed === null) {
      attention.push({
        key: "jurisdiction",
        text: "Jurisdiction & scope not yet determined",
        panel: "jurisdiction",
        link: "Set jurisdiction",
      });
    }
    for (const s of readySessions) {
      attention.push({
        key: `ready-${s.id}`,
        text: "Client intake is complete — transcript and answers ready for your review",
        panel: "transcript",
        link: "Open transcript",
      });
    }
  }
  for (const { v, doc } of unapprovedAi) {
    attention.push({
      key: `ai-${v.id}`,
      text: `AI draft "${doc.title}" (v${v.versionNo}) awaits attorney review`,
      panel: "documents",
      link: "Open documents",
    });
  }

  const chips: { label: string; value: string; sub?: string; alert?: boolean }[] = [
    {
      label: "Intake",
      value: readySessions.length > 0 ? "Ready" : String((matter?.sessions ?? []).length || 0),
      sub:
        readySessions.length > 0
          ? `${readySessions.length} ready for review`
          : `${(matter?.sessions ?? []).length} session(s)`,
    },
    {
      label: "Docs outstanding",
      value: String(unapproved.length),
      sub: unapproved.length ? "unapproved versions" : "all reviewed",
      alert: unapproved.length > 0,
    },
  ];

  return (
    <Shell title={matter ? matter.label : "Matter"}>
      <ErrorNotice message={err} />
      {info && <div className="notice notice-good mb-4">{info}</div>}
      {!loading && !authorized && (
        <div className="notice notice-info">This area is for firm staff and attorneys.</div>
      )}

      {authorized && matter && (
        <>
          {/* ── Status board (triage-first, always visible) ──────── */}
          <div className="panel board">
            <div className="board-head">
              <p className="board-title">{matter.label}</p>
              <StatusBadge value={matter.lifecycle} />
              {matter.legalHold && <span className="badge badge-stop">LEGAL HOLD</span>}
            </div>
            <p className="board-sub">
              Uncontested divorce workflow · created {fmtWhen(matter.createdAt)} · last
              updated {fmtWhen(matter.updatedAt)}
            </p>

            <div className="chips">
              {chips.map((c) => (
                <div className="chip" key={c.label}>
                  <span className="chip-label">{c.label}</span>
                  <span className={`chip-value${c.alert ? " chip-alert" : ""}`}>{c.value}</span>
                  {c.sub && <span className="chip-sub">{c.sub}</span>}
                </div>
              ))}
            </div>

            <div className="attention">
              <p className="attention-h">Needs your attention</p>
              {attention.length === 0 ? (
                <p className="attention-clear">✓ Nothing needs attention right now.</p>
              ) : (
                <ul className="attention-list">
                  {attention.map((a) => (
                    <li className="attention-item" key={a.key}>
                      <span className="attention-text">{a.text}</span>
                      {a.panel ? (
                        <button
                          type="button"
                          className="attention-link"
                          onClick={() => requestOpen(a.panel!)}
                        >
                          {a.link}
                        </button>
                      ) : (
                        <Link href={a.href!}>{a.link}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Invite the client ────────────────────────────────── */}
          <ConnectClientPanel matterId={matterId} isAttorney={isAttorney} onLinked={load} />

          {/* ── Matter status & lifecycle ────────────────────────── */}
          <AccordionPanel
            title="Matter status & lifecycle"
            summary={`${(matter.sessions ?? []).length} session(s) · ${matter.lifecycle.toLowerCase()}`}
          >
            {matter.sessions.length > 0 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Intake session</th>
                    <th>Status</th>
                    <th>Tier</th>
                    <th>Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {matter.sessions.map((s) => (
                    <tr key={s.id}>
                      <td className="mono">{s.id.slice(0, 8)}…</td>
                      <td>{STATE_LABELS[s.state] ?? s.state}</td>
                      <td>{s.tier ?? "—"}</td>
                      <td>{fmtWhen(s.updatedAt)}</td>
                      <td>
                        {s.state === "READY_FOR_REVIEW" && isAttorney && (
                          <span className="text-sm text-slate-500">complete — see transcript &amp; documents</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {isAttorney && (
              <div className="mt-4 flex flex-wrap gap-3">
                {(["PROSPECTIVE", "ENGAGED", "ABANDONED", "CLOSED"] as const)
                  .filter((l) => l !== matter.lifecycle)
                  .map((l) => (
                    <button
                      key={l}
                      className="btn btn-quiet"
                      disabled={busy}
                      onClick={() =>
                        act(async () => {
                          await api.post(`/api/matters/${matterId}/lifecycle`, { lifecycle: l });
                        })
                      }
                    >
                      Mark {l.toLowerCase()}
                    </button>
                  ))}
                <button
                  className={matter.legalHold ? "btn btn-quiet" : "btn btn-danger"}
                  disabled={busy}
                  onClick={() =>
                    act(async () => {
                      await api.post(`/api/matters/${matterId}/lifecycle`, {
                        legalHold: !matter.legalHold,
                        legalHoldReason: matter.legalHold ? undefined : "Set from matter view",
                      });
                    })
                  }
                >
                  {matter.legalHold ? "Release legal hold" : "Place legal hold"}
                </button>
              </div>
            )}
          </AccordionPanel>

          {/* ── Documents ────────────────────────────────────────── */}
          <AccordionPanel
            panelId="documents"
            openSignal={openSignal}
            title="Documents"
            summary={
              docs.length === 0
                ? "None yet"
                : `${docs.length} doc(s)${unapproved.length ? ` · ${unapproved.length} unapproved` : " · all reviewed"}`
            }
          >
            <p className="panel-sub">
              Uploads, internal drafts, and AI work product. Every new version
              begins unapproved; approval and release are attorney-only and bind
              to the exact version and its content hash.
            </p>

            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="field-label">Title</span>
                <input
                  className="text-input"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Internal draft — synthetic"
                  maxLength={200}
                />
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              <button
                className="btn btn-primary"
                disabled={!uploadFile || busy}
                onClick={() =>
                  act(async () => {
                    await api.upload(
                      `/api/matters/${matterId}/documents`,
                      uploadFile!,
                      uploadTitle || undefined
                    );
                    setUploadFile(null);
                    setUploadTitle("");
                  }, "Document added — it begins unapproved.")
                }
              >
                Add document
              </button>
            </div>

            {docs.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No documents yet.</p>
            ) : (
              docs.map((d) => (
                <div key={d.id} className="mt-5 rounded-lg border border-[var(--line)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="mr-auto font-semibold">{d.title}</p>
                    <span className="badge">{d.docKind.replaceAll("_", " ")}</span>
                    {(role === "STAFF" || isAttorney) && (
                      <button
                        className="btn btn-quiet"
                        style={{ padding: "4px 12px", fontSize: ".8rem" }}
                        onClick={() => setRevisionFor(revisionFor === d.id ? null : d.id)}
                      >
                        New version
                      </button>
                    )}
                  </div>
                  {revisionFor === d.id && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 rounded bg-slate-50 p-3">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                        onChange={(e) => setRevisionFile(e.target.files?.[0] ?? null)}
                        className="text-sm"
                      />
                      <button
                        className="btn btn-primary"
                        disabled={!revisionFile || busy}
                        onClick={() =>
                          act(async () => {
                            const form = new FormData();
                            form.set("file", revisionFile!);
                            const res = await fetch(`/api/documents/${d.id}/versions`, {
                              method: "POST",
                              headers: { "x-dgpt-csrf": "1" },
                              body: form,
                            });
                            if (!res.ok) {
                              const body = (await res.json().catch(() => ({}))) as {
                                error?: string;
                              };
                              throw new Error(body.error ?? "Revision failed");
                            }
                            setRevisionFile(null);
                            setRevisionFor(null);
                          }, "Revision added — prior approvals do not carry forward.")
                        }
                      >
                        Upload revision
                      </button>
                    </div>
                  )}

                  <table className="tbl mt-3">
                    <thead>
                      <tr>
                        <th>Ver</th>
                        <th>State</th>
                        <th>Provenance</th>
                        <th>Content hash</th>
                        <th>Added</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.versions.map((v) => (
                        <tr key={v.id}>
                          <td className="font-semibold">v{v.versionNo}</td>
                          <td>
                            <StatusBadge value={v.status} />
                            {v.source === "AI" &&
                              !v.status.startsWith("APPROVED") &&
                              v.status !== "RELEASED" && (
                                <div className="mt-1 text-xs text-amber-700">
                                  AI-generated — not attorney-reviewed
                                </div>
                              )}
                          </td>
                          <td className="text-xs">
                            {v.source}
                            {v.originalFilename && (
                              <div className="text-slate-500">{v.originalFilename}</div>
                            )}
                          </td>
                          <td className="mono" title={v.sha256}>
                            {v.sha256.slice(0, 12)}…
                          </td>
                          <td>{fmtWhen(v.createdAt)}</td>
                          <td>
                            <div className="flex flex-wrap gap-2">
                              <a
                                className="btn btn-quiet"
                                style={{ padding: "4px 10px", fontSize: ".78rem" }}
                                href={`/api/document-versions/${v.id}/download`}
                              >
                                Download
                              </a>
                              {isAttorney &&
                                ["DRAFT", "ATTORNEY_REVIEW_REQUIRED", "CHANGES_REQUESTED"].includes(
                                  v.status
                                ) && (
                                  <>
                                    <button
                                      className="btn btn-quiet"
                                      style={{ padding: "4px 10px", fontSize: ".78rem" }}
                                      disabled={busy}
                                      onClick={() =>
                                        act(async () => {
                                          await api.post(
                                            `/api/document-versions/${v.id}/status`,
                                            { status: "CHANGES_REQUESTED" }
                                          );
                                        })
                                      }
                                    >
                                      Request changes
                                    </button>
                                    <button
                                      className="btn btn-primary"
                                      style={{ padding: "4px 10px", fontSize: ".78rem" }}
                                      onClick={() =>
                                        setApproveFor(approveFor === v.id ? null : v.id)
                                      }
                                    >
                                      Approve…
                                    </button>
                                    <button
                                      className="btn btn-danger"
                                      style={{ padding: "4px 10px", fontSize: ".78rem" }}
                                      disabled={busy}
                                      onClick={() =>
                                        act(async () => {
                                          await api.post(
                                            `/api/document-versions/${v.id}/status`,
                                            { status: "WITHDRAWN" }
                                          );
                                        })
                                      }
                                    >
                                      Withdraw
                                    </button>
                                  </>
                                )}
                              {isAttorney && v.status.startsWith("APPROVED") && (
                                <button
                                  className="btn btn-primary"
                                  style={{ padding: "4px 10px", fontSize: ".78rem" }}
                                  onClick={() => setReleaseFor(releaseFor === v.id ? null : v.id)}
                                >
                                  Release…
                                </button>
                              )}
                            </div>

                            {isAttorney && approveFor === v.id && (
                              <div className="mt-2 rounded bg-slate-50 p-3 text-sm">
                                <p className="font-semibold">
                                  Approve exactly v{v.versionNo} —{" "}
                                  <span className="mono">{v.sha256.slice(0, 16)}…</span>
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <select
                                    className="text-input"
                                    style={{ width: "auto" }}
                                    value={approveType}
                                    onChange={(e) => setApproveType(e.target.value)}
                                  >
                                    <option value="FOR_CLIENT">Approve for client</option>
                                    <option value="FOR_SIGNATURE">Approve for signature</option>
                                    <option value="FOR_FILING">Approve for filing</option>
                                  </select>
                                  <button
                                    className="btn btn-primary"
                                    disabled={busy}
                                    onClick={() =>
                                      act(async () => {
                                        const destination =
                                          approveType === "FOR_CLIENT"
                                            ? "CLIENT_PORTAL"
                                            : approveType === "FOR_SIGNATURE"
                                              ? "SIGNATURE"
                                              : "FILING";
                                        await api.post(
                                          `/api/document-versions/${v.id}/approve`,
                                          { approvalType: approveType, destination }
                                        );
                                        setApproveFor(null);
                                      }, "Approved — the approval binds to this exact version and hash.")
                                    }
                                  >
                                    Confirm approval
                                  </button>
                                </div>
                              </div>
                            )}

                            {isAttorney && releaseFor === v.id && (
                              <ReleaseConfirm
                                version={v}
                                docTitle={d.title}
                                busy={busy}
                                onRelease={(destination) =>
                                  act(async () => {
                                    await api.post(`/api/document-versions/${v.id}/release`, {
                                      destination,
                                    });
                                    setReleaseFor(null);
                                  }, "Released.")
                                }
                              />
                            )}

                            {v.approvals.length > 0 && (
                              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                                {v.approvals.map((a) => (
                                  <li key={a.id}>
                                    {a.revoked ? "⛔ revoked — " : "✓ "}
                                    {a.approvalType.replaceAll("_", " ").toLowerCase()} →{" "}
                                    {a.destination} by {a.approvedBy} on {fmtWhen(a.createdAt)}{" "}
                                    <span className="mono">({a.sha256.slice(0, 10)}…)</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}

            <div className="mt-5 rounded-lg border border-dashed border-[var(--line)] p-4">
              <p className="text-sm font-semibold">Internal AI tools (staff/attorney only)</p>
              <p className="panel-sub">
                Output is internal work product: it lands as an AI document
                version requiring attorney review and is never visible to the
                client. Unavailable when AI features are disabled. The NY
                structured actions live in the AI workbench panel below.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  className="text-input"
                  style={{ width: "auto" }}
                  value={aiFeature}
                  onChange={(e) => setAiFeature(e.target.value)}
                >
                  <option value="INTERNAL_SUMMARY">Internal summary</option>
                  <option value="ISSUE_LIST">Issue list</option>
                  <option value="INCONSISTENCY_REVIEW">Inconsistency review</option>
                  <option value="DOCUMENT_DRAFT">Internal document draft</option>
                </select>
                <button
                  className="btn btn-quiet"
                  disabled={busy}
                  onClick={() =>
                    act(async () => {
                      await api.post(`/api/matters/${matterId}/ai`, { feature: aiFeature });
                    }, "AI draft created — review required before any use.")
                  }
                >
                  Run
                </button>
              </div>
            </div>
          </AccordionPanel>

          {/* ── Court forms: deterministic renders from confirmed answers ── */}
          <CourtFormsPanel matterId={matterId} isAttorney={isAttorney} onArtifactCreated={load} />

          {/* ── NY lawyer workbench (B10) — each panel is its own accordion ── */}
          <Workbench
            matterId={matterId}
            isAttorney={isAttorney}
            onArtifactCreated={load}
            openSignal={openSignal}
          />

          {/* ── Audit (attorney) ─────────────────────────────────── */}
          {isAttorney && (
            <AccordionPanel
              title="Audit trail"
              summary={`${audit.length} event(s)`}
              empty={audit.length === 0}
              emptyText="No audit events yet"
            >
              <p className="panel-sub">
                Tamper-evident event record for this matter and its intake
                sessions. Identifiers and salted hashes only.
              </p>
              <div className="max-h-80 overflow-y-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Event</th>
                      <th>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit.map((e, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap">{fmtWhen(e.at)}</td>
                        <td className="mono">{e.event}</td>
                        <td className="mono break-all text-xs">{e.detail ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionPanel>
          )}

          {/* ── Danger zone: attorney matter deletion ─────────────── */}
          {isAttorney && matter && (
            <DeleteMatterPanel matterId={matterId} matterLabel={matter.label} />
          )}
        </>
      )}
    </Shell>
  );
}

/**
 * Invite the client — email-bound, single-use, frictionless. The attorney
 * enters the client's email; the returned link works ONLY for that account,
 * exactly once. The raw link is shown once at creation (never stored).
 */
/**
 * Court forms — one button per allowlisted (state, form) render. The payload
 * is a deterministic mapping from SAVED intake answers (no AI input); the
 * click IS the attorney's confirmation of that data, and every render lands
 * as a document version in ATTORNEY_REVIEW_REQUIRED. Grouped by case phase:
 * commencement (Summons + Verified Complaint) and finalization (UD-14/UD-15,
 * post-judgment — entry date / server identity are completed by the firm at
 * service time and render as blanks).
 */
function CourtFormsPanel({
  matterId,
  isAttorney,
  onArtifactCreated,
}: {
  matterId: string;
  isAttorney: boolean;
  onArtifactCreated: () => void | Promise<void>;
}) {
  const [busyForm, setBusyForm] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [phase, setPhase] = useState<number | null>(null);

  const loadPhase = useCallback(async () => {
    try {
      const r = (await api.get(`/api/matters/${matterId}/phase`)) as { phase: number };
      setPhase(r.phase);
    } catch {
      setPhase(null);
    }
  }, [matterId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPhase();
  }, [loadPhase]);

  async function advancePhase(next: 1 | 2 | 3) {
    setErr(null);
    setDone(null);
    try {
      const r = (await api.post(`/api/matters/${matterId}/phase`, { phase: next })) as {
        phase: number;
      };
      setPhase(r.phase);
      setDone(
        next === 2
          ? "Matter advanced to Phase 2 — the client's interview now includes the settlement questions."
          : next === 3
            ? "Matter advanced to Phase 3 — finalization. Generate UD-14/UD-15 below after the judgment is entered."
            : "Matter set back to Phase 1."
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not change the phase");
    }
  }

  async function render(state: string, form: string, label: string) {
    setBusyForm(form);
    setErr(null);
    setDone(null);
    try {
      const r = (await api.post(`/api/matters/${matterId}/render-pdf`, {
        state,
        form,
        confirmFormData: true,
      })) as { artifact: { title: string } };
      setDone(`${label} generated — it's in Documents as "${r.artifact.title}".`);
      await onArtifactCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The form could not be generated");
    } finally {
      setBusyForm(null);
    }
  }

  const phase1 = ALLOWED_RENDERS.filter((r) => r.form === "ud1" || r.form === "complaint");
  const phase2 = ALLOWED_RENDERS.filter((r) =>
    ["stipulation", "ud4", "ud5", "ud6", "ud7", "ud9", "ud10", "ud11", "ud12"].includes(r.form)
  );
  const phase3 = ALLOWED_RENDERS.filter((r) => r.form === "ud14" || r.form === "ud15");

  const group = (
    title: string,
    renders: ReadonlyArray<{ state: string; form: string; label: string }>,
    note?: string,
    primary?: boolean
  ) => (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {renders.map((r) => (
          <button
            key={r.form}
            className={primary ? "btn btn-primary" : "btn btn-quiet"}
            disabled={busyForm !== null}
            onClick={() => render(r.state, r.form, r.label)}
          >
            {busyForm === r.form ? "Generating…" : `Generate ${r.label}`}
          </button>
        ))}
      </div>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  );

  return (
    <AccordionPanel
      title="Case phase & court forms"
      summary={phase ? `Phase ${phase} · ${ALLOWED_RENDERS.length} forms` : `${ALLOWED_RENDERS.length} forms`}
    >
      <p className="panel-sub">
        Forms are filled deterministically from the client&apos;s confirmed intake answers —
        generating one is your confirmation of that data. Every generated form starts in
        attorney review; nothing is released to the client from here.
      </p>
      {!isAttorney && (
        <p className="panel-sub">Only the attorney can change the phase or generate court forms.</p>
      )}
      {isAttorney && (
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Intake phase — controls which questions the client sees
            </div>
            <div className="flex flex-wrap gap-2">
              {([1, 2, 3] as const).map((p) => (
                <button
                  key={p}
                  className={phase === p ? "btn btn-primary" : "btn btn-quiet"}
                  disabled={phase === p}
                  onClick={() => advancePhase(p)}
                >
                  {p === 1 ? "1 · Commencement" : p === 2 ? "2 · Settlement" : "3 · Finalization"}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Advancing to Phase 2 opens the settlement questions (assets, debts, incomes,
              agreed division) in the client&apos;s interview. Phase 3 asks the client nothing
              new — it unlocks your finalization work after the judgment.
            </p>
          </div>
          {group("Phase 1 — commencement", phase1, undefined, true)}
          {group(
            "Phase 2 — uncontested packet & stipulation",
            phase2,
            "The Stipulation prints the parties' agreed division verbatim and computes the § 236(B)(6) guideline recital from their stated incomes. UD-4 is for religious ceremonies only. Court dates, SSNs, and service details render blank for the firm."
          )}
          {group(
            "Phase 3 — finalization (post-judgment)",
            phase3,
            "Entry date and the server's identity are completed by the firm at service time — they render as blanks on purpose."
          )}
          {done && <div className="notice notice-good">{done}</div>}
          {err && <ErrorNotice message={err} />}
        </div>
      )}
    </AccordionPanel>
  );
}

/**
 * Attorney-controlled client connection (2026-07-26 — replaces invitation
 * links). The client registers by signing in at the site; every registration
 * appears here and the ATTORNEY makes the call: connect it to this matter,
 * or decline it. No links, no tokens, nothing for a client to lose.
 */
function ConnectClientPanel({
  matterId,
  isAttorney,
  onLinked,
}: {
  matterId: string;
  isAttorney: boolean;
  onLinked: () => void | Promise<void>;
}) {
  const [clients, setClients] = useState<
    { id: string; email: string; name: string; createdAt: string; registered: boolean; linked: boolean }[]
  >([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    try {
      const r = (await api.get(`/api/clients`)) as { clients: typeof clients };
      setClients(r.clients);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load registrations");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClients();
  }, [loadClients]);

  const unlinked = clients.filter((c) => !c.linked && c.registered);

  async function connect(userId: string, email: string) {
    setBusy(userId);
    setErr(null);
    setInfo(null);
    try {
      await api.post(`/api/matters/${matterId}/client`, { userId });
      setInfo(`${email} is connected — their intake is open.`);
      await loadClients();
      await onLinked();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not connect the client");
    } finally {
      setBusy(null);
    }
  }

  async function decline(userId: string, email: string) {
    if (!window.confirm(`Decline and remove the registration for ${email}?`)) return;
    setBusy(userId);
    setErr(null);
    setInfo(null);
    try {
      await api.del(`/api/clients/${userId}`);
      setInfo(`${email} declined and removed.`);
      await loadClients();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not decline the registration");
    } finally {
      setBusy(null);
    }
  }

  const mailBody = encodeURIComponent(
    "Hello,\n\nTo get started with your case, please:\n\n" +
      "1. Go to https://divorcegpt.com\n" +
      "2. Sign in with THIS email address using Google or Microsoft (Outlook/Hotmail)\n\n" +
      "That is all — once you have signed in, I will connect your case on my end and " +
      "your questionnaire will be ready the next time you log in.\n\n" +
      "Jake Kim, Esq.\nJake Kim Law Firm"
  );

  return (
    <AccordionPanel
      title="Connect the client"
      defaultOpen
      summary={unlinked.length > 0 ? `${unlinked.length} waiting` : "none waiting"}
    >
      <p className="panel-sub">
        Clients register by signing in at divorcegpt.com with Google or Outlook — no links,
        no codes. Every registration shows up here, and you decide: connect it to this
        matter, or decline it. Nothing is visible to a client until you connect them.
      </p>
      <a
        className="btn btn-quiet"
        href={`mailto:?subject=${encodeURIComponent("Getting started with your case — Jake Kim Law Firm")}&body=${mailBody}`}
      >
        ✉ Email sign-in instructions to the client
      </a>
      {unlinked.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">
          No registrations waiting. When your client signs in, they&apos;ll appear here —
          refresh the page.
        </p>
      )}
      {unlinked.length > 0 && (
        <table className="tbl mt-3">
          <thead>
            <tr>
              <th>Registered client</th>
              <th>Signed up</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {unlinked.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.email}
                  {c.name && <div className="text-xs text-slate-500">{c.name}</div>}
                </td>
                <td>{fmtWhen(c.createdAt)}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {isAttorney ? (
                      <>
                        <button
                          className="btn btn-primary"
                          style={{ padding: "4px 12px", fontSize: ".8rem" }}
                          disabled={busy !== null}
                          onClick={() => connect(c.id, c.email)}
                        >
                          {busy === c.id ? "Connecting…" : "Connect to this matter"}
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: "4px 12px", fontSize: ".8rem" }}
                          disabled={busy !== null}
                          onClick={() => decline(c.id, c.email)}
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">attorney decides</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {info && <div className="notice notice-good mt-3">{info}</div>}
      {err && <ErrorNotice message={err} />}
    </AccordionPanel>
  );
}

/**
 * Attorney matter deletion (operator directive 2026-07-22: the lawyer runs
 * their own book). Cascades the matter and everything it owns; an orphaned
 * client login goes with it; the audit trail survives. Guarded by a
 * typed-label confirmation, and the server refuses legal holds regardless.
 */
function DeleteMatterPanel({ matterId, matterLabel }: { matterId: string; matterLabel: string }) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const match = typed.trim() === matterLabel.trim();

  async function doDelete() {
    if (!match) return;
    setBusy(true);
    setErr(null);
    try {
      const r = (await api.del(`/api/matters/${matterId}`)) as {
        deleted: boolean;
        clientAccountDeleted: boolean;
      };
      window.location.href = `/firm?deleted=1${r.clientAccountDeleted ? "&account=1" : ""}`;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The matter could not be deleted");
      setBusy(false);
    }
  }

  return (
    <AccordionPanel title="Delete this matter" summary="danger zone">
      <p className="panel-sub">
        Permanently deletes this matter and everything in it — intake answers, chat
        transcript, documents, invitations. If the client&apos;s login has no other case
        here, it is removed too. The audit trail is retained. This cannot be undone.
        Matters under legal hold cannot be deleted.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-64 flex-1 text-sm">
          <span className="field-label">Type the matter label to confirm: “{matterLabel}”</span>
          <input
            className="text-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={matterLabel}
          />
        </label>
        <button className="btn btn-danger" disabled={!match || busy} onClick={doDelete}>
          {busy ? "Deleting…" : "Delete matter permanently"}
        </button>
      </div>
      {err && <ErrorNotice message={err} />}
    </AccordionPanel>
  );
}

function ReleaseConfirm({
  version,
  docTitle,
  busy,
  onRelease,
}: {
  version: Version;
  docTitle: string;
  busy: boolean;
  onRelease: (destination: string) => void;
}) {
  const live = version.approvals.find((a) => !a.revoked && a.sha256 === version.sha256);
  const destination = live?.destination ?? "CLIENT_PORTAL";
  return (
    <div className="mt-2 rounded bg-slate-50 p-3 text-sm">
      <p className="font-semibold">Release — please confirm</p>
      <table className="tbl mt-1">
        <tbody>
          <tr>
            <td className="w-44 font-semibold">Document</td>
            <td>{docTitle}</td>
          </tr>
          <tr>
            <td className="font-semibold">Exact version</td>
            <td>
              v{version.versionNo} · <span className="mono">{version.sha256.slice(0, 16)}…</span>
            </td>
          </tr>
          <tr>
            <td className="font-semibold">Approval type</td>
            <td>{live?.approvalType.replaceAll("_", " ") ?? "—"}</td>
          </tr>
          <tr>
            <td className="font-semibold">Approving attorney</td>
            <td>{live?.approvedBy ?? "—"}</td>
          </tr>
          <tr>
            <td className="font-semibold">Approved</td>
            <td>{live ? fmtWhen(live.createdAt) : "—"}</td>
          </tr>
          <tr>
            <td className="font-semibold">Destination</td>
            <td>{destination}</td>
          </tr>
        </tbody>
      </table>
      <button
        className="btn btn-primary mt-3"
        disabled={busy || !live}
        onClick={() => onRelease(destination)}
      >
        Release this exact version
      </button>
      {!live && (
        <p className="mt-2 text-xs text-red-700">
          No live approval matches this version&apos;s content hash — release will be
          refused by the server.
        </p>
      )}
    </div>
  );
}
