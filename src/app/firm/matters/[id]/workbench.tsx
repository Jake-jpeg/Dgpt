"use client";

/**
 * NY lawyer workbench (B10) — STAFF/ATTORNEY panels mounted inside the
 * firm matter view. Everything here is INTERNAL work product; nothing in
 * this file renders for clients, and hiding is convenience only — every
 * mutation calls a protected API that re-checks the CURRENT role and the
 * structural guards.
 *
 * Panels: attorney jurisdiction & scope review · intake review ·
 * document checklist · form readiness (attorney) · legal source status ·
 * AI actions + AI report viewer (review required, always).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { StatusBadge, type PanelOpenSignal } from "@/components/shell";
import { api, fmtWhen } from "@/lib/ui/client-api";

/* ── shared shapes (mirrors of the API responses) ─────────────────── */

interface JurisdictionView {
  residency: {
    verdict: "PASS" | "REVIEW";
    prong: string;
    reasons: string[];
    citations: string[];
  };
  guidelines: { maintenance: string; childSupport: string };
  attorneyDetermination: {
    matterCategory: string | null;
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
  /** Server-computed: false when nothing in the client's answers calls for it. */
  applicable: boolean;
  /** Plain-English WHY, assembled server-side from the triggering questions. */
  reason: string;
  triggeredBy?: string[];
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
  panelId,
  openSignal,
  children,
}: {
  title: string;
  sub?: string;
  summary?: string;
  defaultOpen?: boolean;
  panelId?: string;
  openSignal?: PanelOpenSignal | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (!panelId || !openSignal || openSignal.id !== panelId) return;
    setOpen(true);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openSignal, panelId]);
  return (
    <details
      ref={ref}
      className="panel accordion"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
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
  openSignal,
}: {
  matterId: string;
  isAttorney: boolean;
  onArtifactCreated: () => void;
  openSignal?: PanelOpenSignal | null;
}) {
  return (
    <>
      <CaseCheckPanel matterId={matterId} openSignal={openSignal} />
      <IntakeTranscriptPanel matterId={matterId} openSignal={openSignal} />
      <ChecklistPanel matterId={matterId} isAttorney={isAttorney} />
      {isAttorney && <FormReadinessPanel matterId={matterId} />}
      <LegalSourcesPanel />
      <AiActionsPanel matterId={matterId} onArtifactCreated={onArtifactCreated} />
    </>
  );
}

/* ── case check: can this be filed? ───────────────────────────────────
 *
 * Replaces the old "Jurisdiction & scope (attorney determination)" panel,
 * which asked the attorney to fill in a state, a workflow category, and a
 * scope status before it would tell them anything. Operator directive
 * (2026-07-26): "Jurisdiction should be simple: either they passed or there
 * is a yellow warning sign… IF PASS (GREEN) -> list WHY."
 *
 * So: one card, two colors, the reasons spelled out, nothing to fill in.
 * The verdict is computed server-side by evaluateResidency() — the SAME
 * function the Verified Complaint uses to pick its § 230 prong, so the card
 * and the pleading can never disagree. It also prints which year's
 * maintenance and child-support guidelines this build applies.
 */
function CaseCheckPanel({
  matterId,
  openSignal,
}: {
  matterId: string;
  openSignal?: PanelOpenSignal | null;
}) {
  const [view, setView] = useState<JurisdictionView | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const v = (await api.get(`/api/matters/${matterId}/jurisdiction`)) as unknown as JurisdictionView;
      setView(v);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "load failed");
    }
  }, [matterId]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (err) return <Panel title="Case check">{<p className="text-sm text-red-700">{err}</p>}</Panel>;
  if (!view) return null;

  const pass = view.residency.verdict === "PASS";

  return (
    <Panel
      panelId="jurisdiction"
      openSignal={openSignal}
      title="Case check — can this be filed?"
      summary={pass ? "PASS" : "REVIEW"}
      defaultOpen={!pass}
    >
      <div
        className="rounded border-l-4 p-3"
        style={
          pass
            ? { borderColor: "#15803d", background: "#f0fdf4" }
            : { borderColor: "#ca8a04", background: "#fefce8" }
        }
      >
        <div
          className="text-sm font-bold uppercase tracking-wide"
          style={{ color: pass ? "#15803d" : "#a16207" }}
        >
          {pass ? "✓ Passed — clear to file in New York" : "⚠ Needs your review before filing"}
        </div>
        <ul className="mt-2 space-y-1 text-sm">
          {view.residency.reasons.map((r, i) => (
            <li key={i}>— {r}</li>
          ))}
        </ul>
        {view.residency.citations.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">{view.residency.citations.join(" · ")}</p>
        )}
      </div>

      <div className="mt-3 rounded bg-slate-50 p-3 text-xs text-slate-600">
        <div className="mb-1 font-semibold uppercase tracking-wide text-slate-500">
          Guidelines applied by this build
        </div>
        <p>Spousal maintenance — {view.guidelines.maintenance}</p>
        <p className="mt-1">Child support — {view.guidelines.childSupport}</p>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        This is a deterministic read of the client&apos;s own answers, not legal advice and not a
        determination. You correct anything that is wrong — the card only tells you where to look.
        {view.attorneyDetermination.intakeSchemaVersion && (
          <> Intake schema {view.attorneyDetermination.intakeSchemaVersion}.</>
        )}
      </p>
    </Panel>
  );
}

function formatAnswer(v: unknown): string {
  if (v === true) return "Yes";
  if (v === false) return "No";
  if (Array.isArray(v)) return v.map(formatAnswer).join("; ");
  if (v && typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/* ── intake transcript (read-only; spec §2.5) ─────────────────────── */

interface TranscriptMsg {
  id: string;
  role: "CLIENT" | "ASSISTANT" | "SYSTEM_EVENT";
  content: string;
  lang: string;
  createdAt: string;
}

function IntakeTranscriptPanel({
  matterId,
  openSignal,
}: {
  matterId: string;
  openSignal?: PanelOpenSignal | null;
}) {
  const [msgs, setMsgs] = useState<TranscriptMsg[] | null>(null);
  const [state, setState] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const m = (await api.get(`/api/matters/${matterId}`)) as unknown as {
          matter: { sessions?: { id: string }[] };
        };
        const sid = m.matter.sessions?.[0]?.id;
        if (!sid) {
          setMsgs([]);
          return;
        }
        const v = (await api.get(`/api/intake-chat/${sid}`)) as unknown as {
          transcript: TranscriptMsg[];
          state: string;
        };
        setMsgs(v.transcript);
        setState(v.state);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "load failed");
      }
    })();
  }, [matterId]);

  if (err) return <Panel title="Intake transcript">{<p className="text-sm text-red-700">{err}</p>}</Panel>;

  return (
    <Panel
      title="Intake transcript"
      panelId="transcript"
      openSignal={openSignal}
      sub="The client's AI-conducted intake conversation, read-only and chronological. Grey rows are machine events written by the server — gates, recorded answers, stops. The conversation collects facts; every legal determination stays with you."
      summary={
        msgs === null
          ? "loading…"
          : msgs.length === 0
            ? "No conversation yet"
            : `${msgs.filter((m) => m.role !== "SYSTEM_EVENT").length} message(s)${state === "READY_FOR_REVIEW" ? " · intake complete" : ""}`
      }
    >
      {msgs !== null && msgs.length === 0 && (
        <p className="text-sm text-slate-500">The client has not started the conversation.</p>
      )}
      <div className="max-h-[28rem] space-y-2 overflow-y-auto">
        {(msgs ?? []).map((m) =>
          m.role === "SYSTEM_EVENT" ? (
            <p key={m.id} className="text-xs text-slate-400">
              ⚙ {m.content}
            </p>
          ) : (
            <div key={m.id} className={m.role === "CLIENT" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "CLIENT"
                    ? "max-w-[80%] whitespace-pre-wrap rounded bg-[#eef4fb] px-3 py-2 text-sm"
                    : "max-w-[80%] whitespace-pre-wrap rounded bg-slate-100 px-3 py-2 text-sm"
                }
              >
                <span className="mr-2 text-[.65rem] font-semibold uppercase text-slate-500">
                  {m.role === "CLIENT" ? "Client" : "Assistant"}
                  {m.lang === "ko" ? " · KO" : ""}
                </span>
                {m.content}
              </div>
            </div>
          )
        )}
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

  // The list is BUILT, not assembled by the lawyer. Operator directive
  // 2026-07-26: "Make the AI list it automatically. The purpose is for it to
  // save the lawyer's time not to build it." So: the documents this client's
  // own answers call for are the panel. The rest of the catalog — the items
  // nothing in the file triggers — collapses to one line the attorney can
  // open if they want to audit what was left out.
  const live = entries.filter((e) => e.applicable);
  const notApplicable = entries.filter((e) => !e.applicable);
  const requiredNow = live.filter((e) => e.status === "REQUIRED_NOW").length;
  const summary =
    live.length === 0
      ? "Nothing needed yet — the answers so far don't call for a document"
      : `${live.length} document${live.length === 1 ? "" : "s"} needed${requiredNow ? ` · ${requiredNow} now` : ""}`;

  return (
    <Panel title="Documents this case needs" sub={disclaimer} summary={summary}>
      {live.length === 0 ? (
        <p className="text-sm text-slate-600">
          Nothing to collect yet. Documents appear here on their own as the client answers —
          you don&apos;t build this list.
        </p>
      ) : (
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
            {live.map((e) => (
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
      )}

      {notApplicable.length > 0 && (
        <details className="mt-3 rounded bg-slate-50 p-3 text-xs text-slate-600">
          <summary className="cursor-pointer select-none">
            {notApplicable.length} other document{notApplicable.length === 1 ? "" : "s"} in the
            catalog don&apos;t apply to this case
          </summary>
          <ul className="mt-2 space-y-1">
            {notApplicable.map((e) => (
              <li key={e.documentId}>— {e.title}</li>
            ))}
          </ul>
        </details>
      )}
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
        {["", "NY"].map((j) => (
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
