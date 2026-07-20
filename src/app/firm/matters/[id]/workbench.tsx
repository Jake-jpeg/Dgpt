"use client";

/**
 * NJ/NY lawyer workbench (B10) — STAFF/ATTORNEY panels mounted inside the
 * firm matter view. Everything here is INTERNAL work product; nothing in
 * this file renders for clients, and hiding is convenience only — every
 * mutation calls a protected API that re-checks the CURRENT role and the
 * structural guards.
 *
 * Panels: attorney jurisdiction & scope review · intake review ·
 * document checklist · form readiness (attorney) · legal source status ·
 * AI actions + AI report viewer (review required, always).
 */
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/shell";
import { api, fmtWhen } from "@/lib/ui/client-api";

/* ── shared shapes (mirrors of the API responses) ─────────────────── */

interface JurisdictionView {
  factsCollected: Record<string, unknown>;
  signals: {
    njImplicated: boolean;
    nyImplicated: boolean;
    multiJurisdiction: boolean;
    note: string;
  };
  attorneyDetermination: {
    jurisdictionCandidate: string | null;
    jurisdictionConfirmed: string | null;
    jurisdictionConfirmedBy: string | null;
    jurisdictionConfirmedAt: string | null;
    matterCategory: string | null;
    scopeStatus: string;
    scopeNotes: string | null;
    intakeSchemaVersion: string | null;
  };
}

interface IntakeItemView {
  id: string;
  section: string;
  prompt: string;
  helpText?: string;
  type: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  sensitive?: boolean;
  authorityIds?: string[];
  audience?: string;
}

interface IntakeView {
  available: boolean;
  workflowAssigned: boolean;
  workflowMessage: string;
  schema: { id: string; version: string; sections: { id: string; title: string }[] };
  items: IntakeItemView[];
  answers: Record<string, unknown>;
  progress: { sectionId: string; title: string; total: number; answered: number; missingRequired: number }[];
  missingRequired: { id: string; section: string; prompt: string }[];
}

interface ChecklistEntry {
  documentId: string;
  title: string;
  requestText: string;
  status: string;
  reason: string;
  overriddenBy?: string | null;
}

interface ReadinessReport {
  status: string;
  reasons: string[];
  disclaimer: string;
  families: {
    form: string;
    mapped: { questionId: string; field: string; answered: boolean }[];
    missingValues: string[];
    needsAttorneyJudgment: string[];
    needsClientVerification: string[];
    executionNotes: string[];
    countyVariationNote: string;
    staleFormRisk: string[];
  }[];
}

interface AuthorityView {
  id: string;
  jurisdiction: string;
  topic: string;
  authorityType: string;
  authorityName: string;
  section: string;
  proposition: string;
  officialSource: string;
  retrievedAt: string;
  status: string;
  notes: string[];
}

interface LegalSources {
  snapshot: { version: string; reviewedAt: string; maxAgeDays: number };
  warnings: { code: string; message: string }[];
  records: AuthorityView[];
}

interface AiReportView {
  kind: string;
  title: string;
  summary: string;
  factualAssertions: {
    assertion: string;
    supportStatus: string;
    intakeAnswerIds: string[];
    documentVersionIds: string[];
    documentLocations: string[];
    sourceQuoteOrSummary: string;
    notes: string;
  }[];
  legalPropositions: {
    proposition: string;
    legalAuthorityIds: string[];
    jurisdiction: string;
    authorityReviewStatus: string;
    attorneyReviewRequired: boolean;
  }[];
  items: { label: string; detail: string; flag: string }[];
  followUpQuestions: { question: string; reason: string; audience: string }[];
}

const AI_ACTION_OPTIONS: { value: string; label: string; purpose: string }[] = [
  { value: "GENERATE_INTAKE_MEMO", label: "Attorney intake memo", purpose: "Organizes parties, posture, facts by topic, and open questions." },
  { value: "GENERATE_FACTUAL_CHRONOLOGY", label: "Factual chronology", purpose: "Dated events, each mapped to its intake/document sources." },
  { value: "GENERATE_ISSUE_INVENTORY", label: "Issue inventory", purpose: "Apparent legal/factual issues, each flagged for attorney evaluation." },
  { value: "GENERATE_MISSING_FACTS_REPORT", label: "Missing-facts report", purpose: "Facts the record does not answer, beyond the deterministic list." },
  { value: "GENERATE_INCONSISTENCY_REPORT", label: "Inconsistency report", purpose: "Contradictions between answers and documents (dates, amounts)." },
  { value: "GENERATE_DOCUMENT_GAP_REPORT", label: "Document-gap report", purpose: "What uploads appear to contain vs. the authoritative checklist." },
  { value: "GENERATE_JURISDICTION_FACTS_SUMMARY", label: "Jurisdiction facts summary", purpose: "Jurisdiction-relevant FACTS only — never picks the state." },
  { value: "GENERATE_ATTORNEY_FOLLOW_UP_QUESTIONS", label: "Follow-up questions (attorney)", purpose: "Suggested questions for the firm; never alters the client path." },
  { value: "GENERATE_CLIENT_FOLLOW_UP_DRAFT", label: "Client follow-up DRAFT", purpose: "Internal draft message — cannot send itself; approval path only." },
  { value: "GENERATE_FORM_READINESS_REPORT", label: "Form-readiness narrative", purpose: "Narrative over the deterministic readiness report (which governs)." },
];

const SUPPORT_BADGE: Record<string, string> = {
  SUPPORTED: "badge badge-good",
  INFERRED: "badge badge-warn",
  NOT_FOUND: "badge badge-stop",
  CONFLICTING: "badge badge-stop",
  ATTORNEY_CONFIRMATION_REQUIRED: "badge badge-warn",
};

/**
 * Collapsible workbench panel. Collapsed by default with a one-line `summary`
 * of its state in the header, so the attorney reads status without opening
 * every heavy table. Native <details> — keyboard- and zoom-friendly, and its
 * children stay mounted while collapsed so each panel's data still loads and
 * its summary stays live.
 */
function Panel({
  title,
  sub,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  sub?: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="panel accordion" open={defaultOpen}>
      <summary>
        <span className="accordion-title">{title}</span>
        {summary && <span className="accordion-state">{summary}</span>}
      </summary>
      <div className="accordion-body">
        {sub && <p className="panel-sub">{sub}</p>}
        {children}
      </div>
    </details>
  );
}

/* ── main export ──────────────────────────────────────────────────── */

export default function Workbench({
  matterId,
  isAttorney,
  onArtifactCreated,
}: {
  matterId: string;
  isAttorney: boolean;
  onArtifactCreated: () => void;
}) {
  return (
    <>
      <JurisdictionPanel matterId={matterId} isAttorney={isAttorney} />
      <IntakeReviewPanel matterId={matterId} />
      <ChecklistPanel matterId={matterId} isAttorney={isAttorney} />
      {isAttorney && <FormReadinessPanel matterId={matterId} />}
      <LegalSourcesPanel />
      <AiActionsPanel matterId={matterId} onArtifactCreated={onArtifactCreated} />
    </>
  );
}

/* ── jurisdiction & scope (B6 UI) ─────────────────────────────────── */

function JurisdictionPanel({ matterId, isAttorney }: { matterId: string; isAttorney: boolean }) {
  const [view, setView] = useState<JurisdictionView | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [scope, setScope] = useState<string>("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    try {
      const v = (await api.get(`/api/matters/${matterId}/jurisdiction`)) as unknown as JurisdictionView;
      setView(v);
      setConfirmed(v.attorneyDetermination.jurisdictionConfirmed ?? "");
      setCategory(v.attorneyDetermination.matterCategory ?? "");
      setScope(v.attorneyDetermination.scopeStatus);
      setNotes(v.attorneyDetermination.scopeNotes ?? "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "load failed");
    }
  }, [matterId]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (err) return <Panel title="Jurisdiction & scope">{<p className="text-sm text-red-700">{err}</p>}</Panel>;
  if (!view) return null;
  const det = view.attorneyDetermination;
  const categories = AI_CATEGORY_LIST.filter((c) => !confirmed || c.startsWith(confirmed + "_"));

  return (
    <Panel
      title="Jurisdiction & scope (attorney determination)"
      sub="FACTS COLLECTED are shown separately from the determination. Nothing is auto-selected from a mailing address; multi-state facts flag the matter for review."
      summary={
        det.jurisdictionConfirmed
          ? `${det.jurisdictionConfirmed}${det.matterCategory ? ` · ${det.matterCategory}` : ""} · scope ${det.scopeStatus.replaceAll("_", " ").toLowerCase()}`
          : "Not yet determined"
      }
    >
      {view.signals.multiJurisdiction && (
        <div className="notice notice-warn mb-3 font-semibold">
          MULTI-JURISDICTION REVIEW REQUIRED — facts implicate both New Jersey and New York.
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="field-label">Facts collected</p>
          <table className="tbl">
            <tbody>
              {Object.entries(view.factsCollected).map(([q, v]) => (
                <tr key={q}>
                  <td className="mono text-xs">{q.replace(/^shared\./, "")}</td>
                  <td className="text-sm">{v === null ? <span className="text-slate-400">— unanswered</span> : formatAnswer(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-500">
            Signals — NJ: {view.signals.njImplicated ? "implicated" : "none"} · NY:{" "}
            {view.signals.nyImplicated ? "implicated" : "none"}
            {view.signals.multiJurisdiction && <> · multi-jurisdiction</>}
          </p>
          <p className="mt-1 text-xs text-slate-500">{view.signals.note}</p>
        </div>
        <div>
          <p className="field-label">Attorney determination</p>
          <table className="tbl">
            <tbody>
              <tr>
                <td className="w-44 font-semibold">Confirmed state</td>
                <td>{det.jurisdictionConfirmed ?? <span className="text-slate-400">not confirmed</span>}</td>
              </tr>
              <tr>
                <td className="font-semibold">Workflow category</td>
                <td>{det.matterCategory ?? <span className="text-slate-400">not assigned</span>}</td>
              </tr>
              <tr>
                <td className="font-semibold">Scope status</td>
                <td><StatusBadge value={det.scopeStatus} /></td>
              </tr>
              <tr>
                <td className="font-semibold">Schema version</td>
                <td className="mono">{det.intakeSchemaVersion ?? "—"}</td>
              </tr>
              {det.jurisdictionConfirmedBy && (
                <tr>
                  <td className="font-semibold">Confirmed by</td>
                  <td>
                    {det.jurisdictionConfirmedBy} on {fmtWhen(det.jurisdictionConfirmedAt)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {isAttorney ? (
            <div className="mt-3 space-y-2 rounded bg-slate-50 p-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <label>
                  <span className="field-label">State</span>
                  <select className="text-input" style={{ width: "auto" }} value={confirmed} onChange={(e) => { setConfirmed(e.target.value); setCategory(""); }}>
                    <option value="">— not confirmed —</option>
                    <option value="NJ">New Jersey</option>
                    <option value="NY">New York</option>
                  </select>
                </label>
                <label className="flex-1">
                  <span className="field-label">Workflow category</span>
                  <select className="text-input" value={category} onChange={(e) => setCategory(e.target.value)} disabled={!confirmed}>
                    <option value="">— none —</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">Scope</span>
                  <select className="text-input" style={{ width: "auto" }} value={scope} onChange={(e) => setScope(e.target.value)}>
                    {["UNREVIEWED", "UNDER_REVIEW", "ACCEPTED", "DECLINED", "MULTI_JURISDICTION_REVIEW_REQUIRED"].map((s) => (
                      <option key={s} value={s}>{s.replaceAll("_", " ").toLowerCase()}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="field-label">Scope notes (internal)</span>
                <input className="text-input" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} />
              </label>
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setErr(null);
                  try {
                    await api.post(`/api/matters/${matterId}/jurisdiction`, {
                      jurisdictionConfirmed: confirmed === "NJ" || confirmed === "NY" ? confirmed : null,
                      matterCategory: category || null,
                      scopeStatus: scope,
                      scopeNotes: notes || undefined,
                    });
                    await load();
                  } catch (e) {
                    setErr(e instanceof Error ? e.message : "save failed");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Record determination
              </button>
              <p className="text-xs text-slate-500">
                Assigning a category re-pins the intake schema version for this matter and changes which
                state-specific questions the client sees.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Jurisdiction, category, and scope are attorney determinations.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}

const AI_CATEGORY_LIST = [
  "NJ_FM_DIVORCE_UNCONTESTED",
  "NJ_FM_DIVORCE_CONTESTED",
  "NJ_FM_POST_JUDGMENT",
  "NJ_FD_CUSTODY_PARENTING",
  "NJ_FD_SUPPORT_PARENTAGE",
  "NJ_UCCJEA_INTERSTATE",
  "NJ_EMERGENCY_OR_DV_ESCALATION",
  "NY_SUPREME_UNCONTESTED_JOINT",
  "NY_SUPREME_UNCONTESTED",
  "NY_SUPREME_CONTESTED",
  "NY_SUPREME_POST_JUDGMENT",
  "NY_FAMILY_COURT_CUSTODY_VISITATION",
  "NY_FAMILY_COURT_SUPPORT_PARENTAGE",
  "NY_UCCJEA_INTERSTATE",
  "NY_FAMILY_OFFENSE_OR_EMERGENCY_ESCALATION",
];

function formatAnswer(v: unknown): string {
  if (v === true) return "Yes";
  if (v === false) return "No";
  if (Array.isArray(v)) return v.map(formatAnswer).join("; ");
  if (v && typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/* ── intake review ────────────────────────────────────────────────── */

function IntakeReviewPanel({ matterId }: { matterId: string }) {
  const [view, setView] = useState<IntakeView | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
     
    api
      .get(`/api/matters/${matterId}/intake2`)
      .then((v) => setView(v as unknown as IntakeView))
      .catch((e) => setErr(e instanceof Error ? e.message : "load failed"));
  }, [matterId]);

  if (err) return <Panel title="Intake review">{<p className="text-sm text-red-700">{err}</p>}</Panel>;
  if (!view || !view.available) return null;

  const bySection = new Map<string, IntakeItemView[]>();
  for (const item of view.items) {
    const list = bySection.get(item.section) ?? [];
    list.push(item);
    bySection.set(item.section, list);
  }
  const progressFor = (sectionId: string) => view.progress.find((p) => p.sectionId === sectionId);

  return (
    <Panel
      title={`Intake review — schema ${view.schema.id} v${view.schema.version}`}
      sub="Attorney/staff view: includes internal items, authority mappings, and attorney determinations the client never sees. Facts are collected as facts; conclusions stay with the attorney."
      summary={
        view.missingRequired.length > 0
          ? `${view.missingRequired.length} required item${view.missingRequired.length === 1 ? "" : "s"} open`
          : "All required items answered"
      }
    >
      {view.missingRequired.length > 0 && (
        <div className="notice notice-warn mb-3 text-sm">
          {view.missingRequired.length} required item(s) unanswered:{" "}
          {view.missingRequired.slice(0, 6).map((m) => m.prompt).join(" · ")}
          {view.missingRequired.length > 6 && " · …"}
        </div>
      )}
      <div className="space-y-2">
        {view.schema.sections
          .filter((s) => (bySection.get(s.id) ?? []).length > 0)
          .map((s) => {
            const items = bySection.get(s.id)!;
            const prog = progressFor(s.id);
            const expanded = open === s.id;
            return (
              <div key={s.id} className="rounded-lg border border-[var(--line)]">
                <button
                  className="flex w-full items-center gap-3 p-3 text-left"
                  onClick={() => setOpen(expanded ? null : s.id)}
                  aria-expanded={expanded}
                >
                  <span className="mr-auto font-semibold">{s.title}</span>
                  {prog && (
                    <span className="text-xs text-slate-500">
                      {prog.answered}/{prog.total} answered
                      {prog.missingRequired > 0 && (
                        <span className="ml-1 text-amber-700">· {prog.missingRequired} required open</span>
                      )}
                    </span>
                  )}
                  <span aria-hidden>{expanded ? "▾" : "▸"}</span>
                </button>
                {expanded && (
                  <table className="tbl mx-3 mb-3">
                    <tbody>
                      {items.map((i) => (
                        <tr key={i.id}>
                          <td className="w-1/2 align-top">
                            <span className={i.type === "attorney_determination" ? "font-semibold text-[#7c3aed]" : ""}>
                              {i.prompt}
                            </span>
                            <div className="mt-1 flex flex-wrap gap-1 text-xs">
                              {i.required && <span className="badge">required</span>}
                              {i.sensitive && <span className="badge badge-warn">sensitive</span>}
                              {i.audience && i.audience !== "CLIENT" && (
                                <span className="badge">{i.audience}</span>
                              )}
                              {(i.authorityIds ?? []).map((a) => (
                                <span key={a} className="badge mono" title="internal authority mapping">
                                  {a}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="align-top text-sm">
                            {view.answers[i.id] === undefined ? (
                              <span className="text-slate-400">— unanswered</span>
                            ) : (
                              formatAnswer(view.answers[i.id])
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
      </div>
    </Panel>
  );
}

/* ── document checklist (B12 UI) ──────────────────────────────────── */

function ChecklistPanel({ matterId, isAttorney }: { matterId: string; isAttorney: boolean }) {
  const [entries, setEntries] = useState<ChecklistEntry[] | null>(null);
  const [disclaimer, setDisclaimer] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const v = (await api.get(`/api/matters/${matterId}/checklist`)) as unknown as {
        entries: ChecklistEntry[];
        disclaimer: string;
      };
      setEntries(v.entries);
      setDisclaimer(v.disclaimer);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "load failed");
    }
  }, [matterId]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (err) return <Panel title="Document checklist">{<p className="text-sm text-red-700">{err}</p>}</Panel>;
  if (!entries) return null;

  const override = async (documentId: string, o: string) => {
    setBusy(true);
    setErr(null);
    try {
      await api.patch(`/api/matters/${matterId}/checklist`, { documentId, override: o });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "update failed");
    } finally {
      setBusy(false);
    }
  };

  // One-line header summary — read the checklist without opening it.
  const requiredNow = entries.filter((e) => e.status === "REQUIRED_NOW").length;
  const notApplicable = entries.filter((e) => e.status === "NOT_APPLICABLE").length;
  const summaryParts = [`${requiredNow} required now`];
  if (notApplicable > 0) summaryParts.push(`${notApplicable} not applicable`);
  const summary = `${entries.length} item${entries.length === 1 ? "" : "s"} — ${summaryParts.join(", ")}`;

  return (
    <Panel title="Document checklist (deterministic)" sub={disclaimer} summary={summary}>
      <table className="tbl">
        <thead>
          <tr>
            <th>Document</th>
            <th>Status</th>
            <th>Why it applies</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.documentId}>
              <td className="font-semibold">{e.title}</td>
              <td><StatusBadge value={e.status} /></td>
              <td className="text-xs text-slate-600">{e.reason}</td>
              <td>
                {/* De-noised: the status badge above carries the state; the
                    five override buttons are revealed on demand, one row at a
                    time, instead of 5×N buttons shouting at once. */}
                <ChecklistOverride
                  open={menuFor === e.documentId}
                  busy={busy}
                  isAttorney={isAttorney}
                  onToggle={() => setMenuFor(menuFor === e.documentId ? null : e.documentId)}
                  onPick={(o) => {
                    setMenuFor(null);
                    override(e.documentId, o);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

/**
 * Single compact control that reveals the override options on demand. Same
 * options and the same `override()` call as before — purely a presentation
 * change from an always-on five-button row to one "Change" affordance.
 */
function ChecklistOverride({
  open,
  busy,
  isAttorney,
  onToggle,
  onPick,
}: {
  open: boolean;
  busy: boolean;
  isAttorney: boolean;
  onToggle: () => void;
  onPick: (override: string) => void;
}) {
  const options: string[] = ["RECEIVED", "INCOMPLETE", "ATTORNEY_REVIEW_REQUIRED"];
  if (isAttorney) options.push("ATTORNEY_WAIVED");
  options.push("CLEAR");
  return (
    <div className="chk-change">
      <button
        className="btn btn-quiet"
        style={{ padding: "2px 10px", fontSize: ".75rem" }}
        disabled={busy}
        aria-expanded={open}
        onClick={onToggle}
      >
        Change ▾
      </button>
      {open && (
        <div className="chk-menu" role="menu">
          {options.map((o) => (
            <button
              key={o}
              className="btn btn-quiet"
              style={{ padding: "2px 8px", fontSize: ".72rem" }}
              disabled={busy}
              role="menuitem"
              onClick={() => onPick(o)}
            >
              {o === "CLEAR" ? "clear override" : o.replaceAll("_", " ").toLowerCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── form readiness (B13 UI, attorney) ────────────────────────────── */

function FormReadinessPanel({ matterId }: { matterId: string }) {
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
     
    api
      .get(`/api/matters/${matterId}/form-readiness`)
      .then((v) => setReport((v as unknown as { report: ReadinessReport }).report))
      .catch((e) => setErr(e instanceof Error ? e.message : "load failed"));
  }, [matterId]);

  if (err) return <Panel title="Form readiness">{<p className="text-sm text-red-700">{err}</p>}</Panel>;
  if (!report) return null;

  return (
    <Panel
      title="Form readiness (attorney)"
      sub={report.disclaimer}
      summary={report.status.replaceAll("_", " ").toLowerCase()}
    >
      <div className="mb-2 flex items-center gap-3">
        <StatusBadge value={report.status} />
      </div>
      {report.reasons.length > 0 && (
        <ul className="mb-3 list-inside list-disc space-y-1 text-sm">
          {report.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      {report.families.map((f) => (
        <details key={f.form} className="mb-2 rounded-lg border border-[var(--line)] p-3">
          <summary className="cursor-pointer font-semibold">
            {f.form} — {f.mapped.filter((m) => m.answered).length}/{f.mapped.length} mapped values present
          </summary>
          <div className="mt-2 space-y-2 text-sm">
            {f.missingValues.length > 0 && (
              <p><span className="font-semibold">Missing values:</span> {f.missingValues.join(" · ")}</p>
            )}
            {f.needsAttorneyJudgment.length > 0 && (
              <p><span className="font-semibold">Attorney judgment required:</span> {f.needsAttorneyJudgment.join(" · ")}</p>
            )}
            {f.needsClientVerification.length > 0 && (
              <p><span className="font-semibold">Client verification:</span> {f.needsClientVerification.join(" · ")}</p>
            )}
            <p className="text-xs text-slate-600">{f.executionNotes.join(" ")}</p>
            <p className="text-xs text-slate-600">{f.countyVariationNote}</p>
            {f.staleFormRisk.length > 0 && (
              <p className="text-xs text-amber-700">Form-version review: {f.staleFormRisk.join(" · ")}</p>
            )}
          </div>
        </details>
      ))}
    </Panel>
  );
}

/* ── legal source status ──────────────────────────────────────────── */

function LegalSourcesPanel() {
  const [data, setData] = useState<LegalSources | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
     
    api
      .get(`/api/legal-authorities`)
      .then((v) => setData(v as unknown as LegalSources))
      .catch((e) => setErr(e instanceof Error ? e.message : "load failed"));
  }, []);

  if (err) return <Panel title="Legal source status">{<p className="text-sm text-red-700">{err}</p>}</Panel>;
  if (!data) return null;
  const records = data.records.filter((r) => !filter || r.jurisdiction === filter);

  return (
    <Panel
      title="Legal source status (internal)"
      sub={`Dated local snapshot ${data.snapshot.version}, last counsel review ${data.snapshot.reviewedAt}, max age ${data.snapshot.maxAgeDays} days. Runtime never browses the web; the model may cite only these records.`}
      summary={
        data.warnings.length > 0
          ? `${data.warnings.length} warning${data.warnings.length === 1 ? "" : "s"} · snapshot ${data.snapshot.version}`
          : `snapshot ${data.snapshot.version}`
      }
    >
      {data.warnings.length > 0 && (
        <div className="notice notice-warn mb-3 text-sm">
          {data.warnings.map((w, i) => (
            <p key={i}>
              <span className="mono">{w.code}</span> — {w.message}
            </p>
          ))}
        </div>
      )}
      <div className="mb-2 flex gap-2">
        {["", "NJ", "NY"].map((j) => (
          <button
            key={j || "ALL"}
            className={filter === j ? "btn btn-primary" : "btn btn-quiet"}
            style={{ padding: "2px 12px", fontSize: ".78rem" }}
            onClick={() => setFilter(j)}
          >
            {j || "All"}
          </button>
        ))}
      </div>
      <div className="max-h-96 overflow-y-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>Authority</th>
              <th>Proposition</th>
              <th>Retrieved</th>
              <th>Review status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td className="mono text-xs">{r.id}</td>
                <td className="text-xs">
                  {r.authorityName} <span className="text-slate-500">({r.section})</span>
                  <div className="text-slate-500">{r.topic} · {r.jurisdiction}</div>
                </td>
                <td className="text-xs">{r.proposition}</td>
                <td className="whitespace-nowrap text-xs">{r.retrievedAt}</td>
                <td>
                  <StatusBadge value={r.status} />
                  {r.notes.some((n) => n.includes("[needs cite check]") || n.includes("[not found]")) && (
                    <div className="mt-1 text-xs text-amber-700">open research item</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ── AI actions + report viewer ───────────────────────────────────── */

function AiActionsPanel({ matterId, onArtifactCreated }: { matterId: string; onArtifactCreated: () => void }) {
  const [action, setAction] = useState(AI_ACTION_OPTIONS[0].value);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastArtifact, setLastArtifact] = useState<{ versionId: string; title: string; status: string } | null>(null);
  const [report, setReport] = useState<AiReportView | null>(null);
  const [stored, setStored] = useState<{ versionId: string; title: string; status: string; createdAt: string }[]>([]);

  const chosen = AI_ACTION_OPTIONS.find((o) => o.value === action)!;

  const loadStored = useCallback(async () => {
    try {
      const res = (await api.get(`/api/matters/${matterId}/documents`)) as unknown as {
        documents: { docKind: string; title: string; versions: { id: string; status: string; mime: string; createdAt: string }[] }[];
      };
      setStored(
        (res.documents ?? [])
          .filter((d) => d.docKind === "AI_DRAFT")
          .flatMap((d) =>
            d.versions
              .filter((v) => v.mime === "application/json")
              .map((v) => ({ versionId: v.id, title: d.title, status: v.status, createdAt: v.createdAt }))
          )
      );
    } catch {
      /* stored-report list is a convenience; the run flow stands alone */
    }
  }, [matterId]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStored();
  }, [loadStored]);

  const run = async () => {
    setBusy(true);
    setErr(null);
    setReport(null);
    try {
      const res = (await api.post(`/api/matters/${matterId}/ai`, {
        feature: action,
        instruction: instruction.trim() || undefined,
      })) as unknown as { artifact: { versionId: string; title: string; status: string } };
      setLastArtifact(res.artifact);
      onArtifactCreated();
      await loadStored();
      await openReport(res.artifact.versionId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "AI action failed");
    } finally {
      setBusy(false);
    }
  };

  const openReport = async (versionId: string) => {
    const res = await fetch(`/api/document-versions/${versionId}/download`);
    if (!res.ok) throw new Error("Could not load the AI report");
    setReport((await res.json()) as AiReportView);
  };

  return (
    <Panel
      title="AI workbench actions (staff/attorney only)"
      sub="Structured internal work product from the firm's AI integration (Anthropic Claude). Every output lands as an AI document version in ATTORNEY REVIEW REQUIRED and can only reach a client through the attorney's exact-version approval and release path. Legal citations are restricted to the local authority snapshot; outputs with unknown citations are rejected and never saved."
      summary="Internal drafts — review required"
    >
      {err && <div className="notice notice-warn mb-3 text-sm">{err}</div>}
      <div className="flex flex-wrap items-end gap-3">
        <label>
          <span className="field-label">Action</span>
          <select className="text-input" style={{ width: "auto" }} value={action} onChange={(e) => setAction(e.target.value)}>
            {AI_ACTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="min-w-64 flex-1">
          <span className="field-label">Optional focus instruction (internal)</span>
          <input
            className="text-input"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            maxLength={4000}
            placeholder="e.g. focus on the parenting-time facts"
          />
        </label>
        <button className="btn btn-primary" disabled={busy} onClick={run}>
          {busy ? "Running…" : "Run action"}
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">{chosen.purpose}</p>

      {lastArtifact && (
        <div className="notice notice-info mt-3 text-sm">
          Created “{lastArtifact.title}” — status <StatusBadge value={lastArtifact.status} />. It appears in
          the Documents panel as an AI_DRAFT version.
        </div>
      )}

      {stored.length > 0 && (
        <div className="mt-4">
          <p className="field-label">Stored AI reports (this matter)</p>
          <ul className="space-y-1 text-sm">
            {stored.map((s) => (
              <li key={s.versionId} className="flex flex-wrap items-center gap-2">
                <span className="mr-auto">{s.title}</span>
                <StatusBadge value={s.status} />
                <span className="text-xs text-slate-500">{fmtWhen(s.createdAt)}</span>
                <button
                  className="btn btn-quiet"
                  style={{ padding: "2px 10px", fontSize: ".75rem" }}
                  onClick={() => openReport(s.versionId).catch((e) => setErr(e instanceof Error ? e.message : "load failed"))}
                >
                  Open report
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report && <AiReportViewer report={report} />}
    </Panel>
  );
}

export function AiReportViewer({ report }: { report: AiReportView }) {
  return (
    <div className="mt-4 rounded-lg border border-[var(--line)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto font-semibold">{report.title}</p>
        <span className="badge">{report.kind}</span>
        <span className="badge badge-warn">ATTORNEY REVIEW REQUIRED</span>
      </div>
      {report.summary && <p className="mt-2 text-sm">{report.summary}</p>}

      {report.factualAssertions.length > 0 && (
        <>
          <p className="field-label mt-4">Factual assertions ({report.factualAssertions.length})</p>
          <table className="tbl">
            <thead>
              <tr>
                <th>Assertion</th>
                <th>Support</th>
                <th>Provenance</th>
              </tr>
            </thead>
            <tbody>
              {report.factualAssertions.map((a, i) => (
                <tr key={i}>
                  <td className="text-sm">
                    {a.assertion}
                    {a.notes && <div className="text-xs text-slate-500">{a.notes}</div>}
                  </td>
                  <td>
                    <span className={SUPPORT_BADGE[a.supportStatus] ?? "badge"}>{a.supportStatus.replaceAll("_", " ")}</span>
                  </td>
                  <td className="text-xs">
                    {a.intakeAnswerIds.map((id) => (
                      <span key={id} className="badge mono mr-1" title="intake answer">{id}</span>
                    ))}
                    {a.documentVersionIds.map((id, j) => (
                      <span key={id} className="badge mono mr-1" title={a.documentLocations[j] ?? "document version"}>
                        doc:{id.slice(0, 8)}…
                      </span>
                    ))}
                    {a.sourceQuoteOrSummary && (
                      <div className="mt-1 text-slate-500">“{a.sourceQuoteOrSummary}”</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {report.legalPropositions.length > 0 && (
        <>
          <p className="field-label mt-4">Legal propositions ({report.legalPropositions.length}) — snapshot citations only</p>
          <table className="tbl">
            <tbody>
              {report.legalPropositions.map((p, i) => (
                <tr key={i}>
                  <td className="text-sm">
                    {p.proposition}
                    <div className="mt-1">
                      {p.legalAuthorityIds.map((id) => (
                        <span key={id} className="badge mono mr-1">{id}</span>
                      ))}
                      <span className="badge">{p.jurisdiction}</span>
                      <span className="badge badge-warn ml-1">{p.authorityReviewStatus || "COUNSEL_REVIEW_REQUIRED"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {report.items.length > 0 && (
        <>
          <p className="field-label mt-4">Items</p>
          <ul className="space-y-2 text-sm">
            {report.items.map((it, i) => (
              <li key={i}>
                <span className="font-semibold">{it.label}</span>
                {it.flag && <span className="badge badge-warn ml-2">{it.flag}</span>}
                <div className="text-slate-600">{it.detail}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      {report.followUpQuestions.length > 0 && (
        <>
          <p className="field-label mt-4">Suggested follow-ups (suggestions only — never sent automatically)</p>
          <ul className="space-y-2 text-sm">
            {report.followUpQuestions.map((q, i) => (
              <li key={i}>
                <span className="badge">{q.audience === "CLIENT_DRAFT" ? "client draft" : "attorney"}</span>{" "}
                {q.question}
                {q.reason && <div className="text-xs text-slate-500">{q.reason}</div>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
