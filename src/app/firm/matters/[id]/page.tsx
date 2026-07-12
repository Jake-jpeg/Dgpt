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
import { Shell, useMe, StatusBadge, ErrorNotice } from "@/components/shell";
import { api, fmtWhen, STATE_LABELS } from "@/lib/ui/client-api";
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
interface Invitation {
  id: string;
  expiresAt: string;
  revoked: boolean;
  used: boolean;
  createdAt: string;
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
interface InfoRequest {
  id: string;
  label: string;
  internalNote: string | null;
  status: string;
  createdAt: string;
}
interface Assistance {
  id: string;
  status: string;
  createdAt: string;
}
interface Accommodation {
  id: string;
  method: string;
  note: string | null;
  createdAt: string;
}
interface Note {
  id: string;
  kind: string;
  body: string;
  status: string;
  createdAt: string;
}
interface Submission {
  id: string;
  screenResult: string;
  createdAt: string;
  disposition: string | null;
  clientParty: { fullLegalName: string; priorNames: string[] };
  adverseParty: { fullLegalName: string; priorNames: string[] };
}
interface AuditEvent {
  ref: string;
  event: string;
  detail: string | null;
  at: string;
}

const ACCOMMODATION_OPTIONS = [
  ["TELEPHONE", "Telephone intake"],
  ["VIDEO", "Video intake"],
  ["IN_PERSON", "In-person intake"],
  ["PAPER", "Paper intake"],
  ["ASSISTED_PORTAL", "Assisted portal intake"],
  ["OTHER_APPROVED", "Other attorney-approved method"],
] as const;

export default function FirmMatterDetail() {
  const params = useParams<{ id: string }>();
  const matterId = params.id;
  const { me, loading } = useMe();
  const role = me?.user?.role;
  const authorized = role === "STAFF" || role === "ATTORNEY";
  const isAttorney = role === "ATTORNEY";

  const [matter, setMatter] = useState<MatterDetail | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [infoReqs, setInfoReqs] = useState<InfoRequest[]>([]);
  const [assists, setAssists] = useState<Assistance[]>([]);
  const [accoms, setAccoms] = useState<Accommodation[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);

  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [newInfoLabel, setNewInfoLabel] = useState("");
  const [newNote, setNewNote] = useState("");
  const [noteKind, setNoteKind] = useState<"NOTE" | "ESCALATION">("NOTE");
  const [accomMethod, setAccomMethod] = useState("TELEPHONE");
  const [accomNote, setAccomNote] = useState("");
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
      const [inv, d, ir, as_, ac, nt] = await Promise.all([
        api.get(`/api/matters/${matterId}/invitations`),
        api.get(`/api/matters/${matterId}/documents`),
        api.get(`/api/matters/${matterId}/info-requests`),
        api.get(`/api/matters/${matterId}/assistance`),
        api.get(`/api/matters/${matterId}/accommodations`),
        api.get(`/api/matters/${matterId}/notes`),
      ]);
      setInvitations((inv as { invitations: Invitation[] }).invitations);
      setDocs((d as unknown as { documents: Doc[] }).documents);
      setInfoReqs((ir as { requests: InfoRequest[] }).requests);
      setAssists((as_ as { requests: Assistance[] }).requests);
      setAccoms((ac as { accommodations: Accommodation[] }).accommodations);
      setNotes((nt as { notes: Note[] }).notes);
      if (role === "ATTORNEY") {
        const c = (await api.get(`/api/matters/${matterId}/conflict`)) as {
          submissions: Submission[];
        };
        setSubs(c.submissions);
        const a = (await api.get(`/api/matters/${matterId}/audit`)) as {
          events: AuditEvent[];
        };
        setAudit(a.events);
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

  const createInvitation = () =>
    act(async () => {
      const res = await api.post(`/api/matters/${matterId}/invitations`, {});
      setNewToken(String(res.token));
    });

  const inviteUrl = newToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite?token=${newToken}`
    : null;

  return (
    <Shell title={matter ? matter.label : "Matter"}>
      <ErrorNotice message={err} />
      {info && <div className="notice notice-good mb-4">{info}</div>}
      {!loading && !authorized && (
        <div className="notice notice-info">This area is for firm staff and attorneys.</div>
      )}

      {authorized && matter && (
        <>
          {/* ── Overview ─────────────────────────────────────────── */}
          <div className="panel">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="mr-auto">Overview</h2>
              <StatusBadge value={matter.conflictStatus} />
              <StatusBadge value={matter.lifecycle} />
              {matter.legalHold && <span className="badge badge-stop">LEGAL HOLD</span>}
            </div>
            <p className="panel-sub">
              Uncontested divorce workflow · created {fmtWhen(matter.createdAt)} · last
              updated {fmtWhen(matter.updatedAt)}
            </p>
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
                          <Link
                            className="text-sm text-[#1f4ca8] hover:underline"
                            href={`/attorney/session/${s.id}`}
                          >
                            Open intake review
                          </Link>
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
          </div>

          {/* ── Conflict (attorney) ──────────────────────────────── */}
          {isAttorney && (
            <div className="panel">
              <h2>Conflict screening</h2>
              <p className="panel-sub">
                Internal record — never shown to the client. Dispositions are an
                attorney determination; use the{" "}
                <Link href="/firm/conflicts" className="text-[#1f4ca8] hover:underline">
                  conflict review queue
                </Link>{" "}
                for pending items.
              </p>
              {subs.length === 0 ? (
                <p className="text-sm text-slate-500">No conflict submissions yet.</p>
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Submitted</th>
                      <th>Prospective client</th>
                      <th>Adverse party</th>
                      <th>Screen</th>
                      <th>Disposition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((s) => (
                      <tr key={s.id}>
                        <td>{fmtWhen(s.createdAt)}</td>
                        <td>{s.clientParty.fullLegalName}</td>
                        <td>{s.adverseParty.fullLegalName}</td>
                        <td><StatusBadge value={s.screenResult} /></td>
                        <td>{s.disposition ? <StatusBadge value={s.disposition} /> : "pending"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Invitations ──────────────────────────────────────── */}
          <div className="panel">
            <h2>Invitations</h2>
            <p className="panel-sub">
              Single-use, expiring. The code is shown ONCE at creation — copy the
              local URL and convey it to the client through an appropriate channel.
            </p>
            <button className="btn btn-primary" onClick={createInvitation} disabled={busy}>
              Create invitation
            </button>
            {newToken && inviteUrl && (
              <div className="notice notice-info mt-3">
                <p className="font-semibold">One-time invitation URL (local):</p>
                <p className="mono break-all">{inviteUrl}</p>
                <button
                  className="btn btn-quiet mt-2"
                  onClick={() => navigator.clipboard?.writeText(inviteUrl)}
                >
                  Copy URL
                </button>
              </div>
            )}
            {invitations.length > 0 && (
              <table className="tbl mt-4">
                <thead>
                  <tr>
                    <th>Created</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((i) => (
                    <tr key={i.id}>
                      <td>{fmtWhen(i.createdAt)}</td>
                      <td>{fmtWhen(i.expiresAt)}</td>
                      <td>
                        <StatusBadge
                          value={i.used ? "USED" : i.revoked ? "REVOKED" : "OPEN"}
                        />
                      </td>
                      <td>
                        {!i.used && !i.revoked && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: "4px 12px", fontSize: ".8rem" }}
                            disabled={busy}
                            onClick={() =>
                              act(async () => {
                                await api.post(`/api/invitations/${i.id}/revoke`);
                              }, "Invitation revoked.")
                            }
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Documents ────────────────────────────────────────── */}
          <div className="panel">
            <h2>Documents</h2>
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
                client. Unavailable when AI features are disabled. The NJ/NY
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
          </div>

          {/* ── NJ/NY lawyer workbench (B10) ─────────────────────── */}
          <Workbench matterId={matterId} isAttorney={isAttorney} onArtifactCreated={load} />

          {/* ── Requests, accommodations, notes ─────────────────── */}
          <div className="panel">
            <h2>Requests &amp; assistance</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="field-label">Missing-information requests</p>
                <div className="flex items-end gap-2">
                  <input
                    className="text-input"
                    placeholder="e.g. A copy of your marriage certificate"
                    value={newInfoLabel}
                    onChange={(e) => setNewInfoLabel(e.target.value)}
                    maxLength={300}
                  />
                  <button
                    className="btn btn-primary"
                    disabled={busy || !newInfoLabel.trim()}
                    onClick={() =>
                      act(async () => {
                        await api.post(`/api/matters/${matterId}/info-requests`, {
                          label: newInfoLabel.trim(),
                        });
                        setNewInfoLabel("");
                      })
                    }
                  >
                    Request
                  </button>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {infoReqs.map((r) => (
                    <li key={r.id} className="flex items-center gap-2">
                      <StatusBadge value={r.status} />
                      <span className="mr-auto">{r.label}</span>
                      {r.status === "OPEN" && (
                        <button
                          className="btn btn-quiet"
                          style={{ padding: "2px 10px", fontSize: ".75rem" }}
                          disabled={busy}
                          onClick={() =>
                            act(async () => {
                              await api.patch(`/api/matters/${matterId}/info-requests`, {
                                requestId: r.id,
                              });
                            })
                          }
                        >
                          Resolve
                        </button>
                      )}
                    </li>
                  ))}
                </ul>

                <p className="field-label mt-5">Client help requests</p>
                {assists.length === 0 ? (
                  <p className="text-sm text-slate-500">None.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {assists.map((a) => (
                      <li key={a.id} className="flex items-center gap-2">
                        <StatusBadge value={a.status} />
                        <span className="mr-auto">requested {fmtWhen(a.createdAt)}</span>
                        {a.status !== "RESOLVED" && (
                          <button
                            className="btn btn-quiet"
                            style={{ padding: "2px 10px", fontSize: ".75rem" }}
                            disabled={busy}
                            onClick={() =>
                              act(async () => {
                                await api.patch(`/api/matters/${matterId}/assistance`, {
                                  requestId: a.id,
                                  status: a.status === "OPEN" ? "ACKNOWLEDGED" : "RESOLVED",
                                });
                              })
                            }
                          >
                            {a.status === "OPEN" ? "Acknowledge" : "Resolve"}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="field-label">Record an accommodation</p>
                <div className="flex flex-wrap items-end gap-2">
                  <select
                    className="text-input"
                    style={{ width: "auto" }}
                    value={accomMethod}
                    onChange={(e) => setAccomMethod(e.target.value)}
                  >
                    {ACCOMMODATION_OPTIONS.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <input
                    className="text-input flex-1"
                    placeholder="note (optional)"
                    value={accomNote}
                    onChange={(e) => setAccomNote(e.target.value)}
                    maxLength={2000}
                  />
                  <button
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={() =>
                      act(async () => {
                        await api.post(`/api/matters/${matterId}/accommodations`, {
                          method: accomMethod,
                          note: accomNote.trim() || undefined,
                        });
                        setAccomNote("");
                      })
                    }
                  >
                    Record
                  </button>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {accoms.map((a) => (
                    <li key={a.id}>
                      <span className="badge">{a.method.replaceAll("_", " ")}</span>{" "}
                      {a.note ?? ""}{" "}
                      <span className="text-xs text-slate-500">{fmtWhen(a.createdAt)}</span>
                    </li>
                  ))}
                </ul>

                <p className="field-label mt-5">Internal notes &amp; escalations</p>
                <p className="text-xs text-slate-500">
                  Internal work product — never visible to the client.
                </p>
                <div className="mt-1 flex flex-wrap items-end gap-2">
                  <select
                    className="text-input"
                    style={{ width: "auto" }}
                    value={noteKind}
                    onChange={(e) => setNoteKind(e.target.value as "NOTE" | "ESCALATION")}
                  >
                    <option value="NOTE">Note</option>
                    <option value="ESCALATION">Escalate to attorney</option>
                  </select>
                  <input
                    className="text-input flex-1"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    maxLength={8000}
                  />
                  <button
                    className="btn btn-primary"
                    disabled={busy || !newNote.trim()}
                    onClick={() =>
                      act(async () => {
                        await api.post(`/api/matters/${matterId}/notes`, {
                          kind: noteKind,
                          body: newNote.trim(),
                        });
                        setNewNote("");
                      })
                    }
                  >
                    Add
                  </button>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {notes.map((n) => (
                    <li key={n.id}>
                      <span
                        className={n.kind === "ESCALATION" ? "badge badge-warn" : "badge"}
                      >
                        {n.kind}
                      </span>{" "}
                      {n.body}{" "}
                      <span className="text-xs text-slate-500">{fmtWhen(n.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ── Audit (attorney) ─────────────────────────────────── */}
          {isAttorney && (
            <div className="panel">
              <h2>Audit trail</h2>
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
            </div>
          )}
        </>
      )}
    </Shell>
  );
}

/**
 * Release confirmation — surfaces exactly what the directive requires before
 * the attorney commits: title, exact version, approval type, approving
 * attorney, approval timestamp, and destination.
 */
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
