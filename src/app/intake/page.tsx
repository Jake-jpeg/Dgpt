"use client";

/**
 * The intake flow UI. All logic and enforcement is server-side — this page
 * just renders whatever step the server says the session is on and posts
 * answers back. Manipulating this client cannot bypass the conflict wall or
 * scope gate (see the guardrail tests).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Json = Record<string, unknown>;

const api = {
  async post(path: string, body?: unknown): Promise<Json> {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json", "x-dgpt-csrf": "1" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json()) as Json;
    if (!res.ok) throw new Error(String(data.error ?? `Request failed (${res.status})`));
    return data;
  },
  async get(path: string): Promise<Json> {
    const res = await fetch(path);
    const data = (await res.json()) as Json;
    if (!res.ok) throw new Error(String(data.error ?? `Request failed (${res.status})`));
    return data;
  },
};

interface CardData {
  id: string;
  title: string;
  body: string;
  resources?: { label: string; value: string }[];
}

function StaticCardView({ card }: { card: CardData }) {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-white p-6">
      <h2 className="text-lg font-semibold">{card.title}</h2>
      <p className="mt-2 whitespace-pre-wrap text-slate-700">{card.body}</p>
      {card.resources && (
        <ul className="mt-4 space-y-1 text-sm">
          {card.resources.map((r) => (
            <li key={r.label}>
              <span className="font-medium">{r.label}:</span> {r.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface BotReply {
  kind: string;
  id?: string;
  term?: string;
  text?: string;
  card?: CardData;
}

function BotPanel({ sessionId }: { sessionId: string }) {
  const [q, setQ] = useState("");
  const [reply, setReply] = useState<BotReply | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function ask() {
    if (!q.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const data = await api.post(`/api/intake/${sessionId}/bot`, { text: q });
      setReply(data.response as BotReply);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-xl border bg-slate-100 p-4">
      <p className="text-sm font-medium text-slate-700">
        Have a question? I can explain the process or define a term from the
        approved glossary — nothing more.
      </p>
      <div className="mt-2 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          maxLength={500}
          className="flex-1 rounded border px-3 py-2 text-sm"
          placeholder='e.g. "What does QDRO mean?"'
        />
        <button
          onClick={ask}
          disabled={busy}
          className="rounded bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Ask
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      {reply && (
        <div className="mt-3 rounded-lg border bg-white p-3 text-sm">
          {reply.kind === "GLOSSARY_CARD" && (
            <>
              <p className="font-semibold">{reply.term}</p>
              <p className="mt-1 whitespace-pre-wrap">{reply.text}</p>
            </>
          )}
          {(reply.kind === "PROCESS_COPY" || reply.kind === "CLARIFICATION") && (
            <p className="whitespace-pre-wrap">{reply.text}</p>
          )}
          {reply.kind === "STATIC_CARD" && reply.card && (
            <>
              <p className="font-semibold">{reply.card.title}</p>
              <p className="mt-1 whitespace-pre-wrap">{reply.card.body}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── field rendering ──────────────────────────────────────────────────

interface FieldDef {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: { value: string; label: string }[];
  dependsOn?: { fieldId: string; equals?: unknown; notEquals?: unknown };
  maxLen?: number;
}
interface SectionDef {
  id: string;
  title: string;
  fields: FieldDef[];
}
interface RetirementRow {
  accountType: string;
  holder: string;
  division: string;
}

const RETIREMENT_TYPE_OPTIONS = [
  { value: "401K", label: "401(k) / employer plan" },
  { value: "IRA_TRADITIONAL", label: "IRA — Traditional" },
  { value: "IRA_ROTH", label: "IRA — Roth" },
  { value: "PENSION", label: "Pension" },
  { value: "MILITARY", label: "Military retirement" },
  { value: "DEFERRED_COMP", label: "Deferred compensation" },
  { value: "UNSURE", label: "Not sure" },
];
const RETIREMENT_DIVISION_OPTIONS = [
  { value: "KEEP_OWN", label: "Each keeps own" },
  { value: "SPLIT_AGREED", label: "Agreed to divide" },
  { value: "OTHER_AGREED", label: "Other agreed arrangement" },
  { value: "UNSURE", label: "Not sure / no agreement" },
];

function visible(f: FieldDef, values: Record<string, unknown>): boolean {
  if (!f.dependsOn) return true;
  const v = values[f.dependsOn.fieldId];
  if (f.dependsOn.equals !== undefined) return v === f.dependsOn.equals;
  if (f.dependsOn.notEquals !== undefined) return v !== undefined && v !== f.dependsOn.notEquals;
  return true;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.type) {
    case "boolean":
      return (
        <div className="flex gap-4">
          {[
            { v: true, label: "Yes" },
            { v: false, label: "No" },
          ].map((o) => (
            <label key={String(o.v)} className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                checked={value === o.v}
                onChange={() => onChange(o.v)}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    case "select":
      return (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full rounded border px-2 py-1.5 text-sm"
        >
          <option value="">— select —</option>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "date":
      return (
        <input
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="rounded border px-2 py-1.5 text-sm"
        />
      );
    case "currency":
    case "integer":
      return (
        <input
          type="number"
          min={0}
          step={field.type === "integer" ? 1 : 0.01}
          value={typeof value === "number" ? value : ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? undefined : Number(e.target.value))
          }
          className="w-48 rounded border px-2 py-1.5 text-sm"
        />
      );
    case "retirementAccounts": {
      const rows: RetirementRow[] = Array.isArray(value) ? (value as RetirementRow[]) : [];
      const set = (i: number, k: keyof RetirementRow, v: string) => {
        const next = rows.map((r, j) => (j === i ? { ...r, [k]: v } : r));
        onChange(next);
      };
      return (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded border bg-slate-50 p-2">
              <select
                value={r.accountType}
                onChange={(e) => set(i, "accountType", e.target.value)}
                className="rounded border px-2 py-1 text-sm"
              >
                <option value="">type…</option>
                {RETIREMENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={r.holder}
                onChange={(e) => set(i, "holder", e.target.value)}
                className="rounded border px-2 py-1 text-sm"
              >
                <option value="">whose…</option>
                <option value="CLIENT">Mine</option>
                <option value="SPOUSE">My spouse&apos;s</option>
              </select>
              <select
                value={r.division}
                onChange={(e) => set(i, "division", e.target.value)}
                className="rounded border px-2 py-1 text-sm"
              >
                <option value="">division…</option>
                {RETIREMENT_DIVISION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={() => onChange(rows.filter((_, j) => j !== i))}
                className="text-sm text-red-600 hover:underline"
              >
                remove
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange([...rows, { accountType: "", holder: "", division: "" }])}
            className="rounded border px-3 py-1 text-sm hover:bg-slate-100"
          >
            + Add retirement account
          </button>
        </div>
      );
    }
    default:
      return (
        <input
          value={typeof value === "string" ? value : ""}
          maxLength={field.maxLen ?? 200}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full rounded border px-2 py-1.5 text-sm"
        />
      );
  }
}

// ── the flow ─────────────────────────────────────────────────────────

export default function IntakePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [view, setView] = useState<Json | null>(null);
  const [terminatedCard, setTerminatedCard] = useState<CardData | null>(null);
  const [copy, setCopy] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // identity form
  const [clientName, setClientName] = useState("");
  const [clientPrior, setClientPrior] = useState("");
  const [spouseName, setSpouseName] = useState("");
  const [spousePrior, setSpousePrior] = useState("");

  // intake answers being edited locally
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [branchAssets, setBranchAssets] = useState("");
  const [branchAlimony, setBranchAlimony] = useState("");
  const [done, setDone] = useState(false);

  const refresh = useCallback(async (id: string) => {
    const v = await api.get(`/api/intake/${id}`);
    setView(v);
    if (v.answers) setDraft((d) => ({ ...(v.answers as Json), ...d }));
  }, []);

  useEffect(() => {
    // Resume a saved session on mount: validate it against the server first,
    // then adopt it. This is a legitimate mount-time hydration from storage.
    const saved = window.localStorage.getItem("dgpt_session_id");
    if (!saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh(saved)
      .then(() => setSessionId(saved))
      .catch(() => window.localStorage.removeItem("dgpt_session_id"));
  }, [refresh]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const start = () =>
    run(async () => {
      const data = await api.post("/api/intake/start");
      const s = data.session as { id: string };
      setCopy((data.copy as Record<string, string>) ?? {});
      setSessionId(s.id);
      window.localStorage.setItem("dgpt_session_id", s.id);
      await refresh(s.id);
    });

  const submitIdentity = () =>
    run(async () => {
      const data = await api.post(`/api/intake/${sessionId}/identity`, {
        clientParty: {
          fullLegalName: clientName,
          priorNames: clientPrior.trim() ? clientPrior.split(",").map((s) => s.trim()) : [],
        },
        adverseParty: {
          fullLegalName: spouseName,
          priorNames: spousePrior.trim() ? spousePrior.split(",").map((s) => s.trim()) : [],
        },
      });
      if (data.status === "TERMINATED") {
        endSession(data.card as CardData);
        return;
      }
      // 2.0: screening pends attorney review — one neutral message for every
      // outcome. Refresh shows the CONFLICT_REVIEW_PENDING panel.
      await refresh(sessionId!);
    });

  const answerGate = (answer: unknown) =>
    run(async () => {
      const data = await api.post(`/api/intake/${sessionId}/gate`, { answer });
      if (data.status === "TERMINATED") {
        endSession(data.card as CardData);
        return;
      }
      await refresh(sessionId!);
    });

  const submitBranch = () =>
    run(async () => {
      const data = await api.post(`/api/intake/${sessionId}/branch`, {
        branch_assets: branchAssets,
        branch_alimony: branchAlimony,
      });
      if (data.status === "TERMINATED") {
        endSession(data.card as CardData);
        return;
      }
      await refresh(sessionId!);
    });

  const saveAnswers = () =>
    run(async () => {
      const sections = (view?.sections ?? []) as SectionDef[];
      const fieldIds = sections.flatMap((s) => s.fields.map((f) => f.id));
      const answers = fieldIds
        .filter((id) => draft[id] !== undefined)
        .map((fieldId) => ({ fieldId, value: draft[fieldId] }));
      if (answers.length === 0) return;
      const data = await api.post(`/api/intake/${sessionId}/answers`, { answers });
      if (data.status === "TERMINATED") {
        endSession(data.card as CardData);
        return;
      }
      await refresh(sessionId!);
    });

  const complete = () =>
    run(async () => {
      await saveAnswersInline();
      const data = await api.post(`/api/intake/${sessionId}/complete`);
      setCopy((c) => ({ ...c, ...(data.copy as Record<string, string>) }));
      setDone(true);
      window.localStorage.removeItem("dgpt_session_id");
    });

  async function saveAnswersInline() {
    const sections = (view?.sections ?? []) as SectionDef[];
    const fieldIds = sections.flatMap((s) => s.fields.map((f) => f.id));
    const answers = fieldIds
      .filter((id) => draft[id] !== undefined)
      .map((fieldId) => ({ fieldId, value: draft[fieldId] }));
    if (answers.length > 0) {
      const data = await api.post(`/api/intake/${sessionId}/answers`, { answers });
      if (data.status === "TERMINATED") {
        endSession(data.card as CardData);
        throw new Error("Session ended");
      }
    }
  }

  function endSession(card: CardData) {
    setTerminatedCard(card);
    setView(null);
    setSessionId(null);
    window.localStorage.removeItem("dgpt_session_id");
  }

  const state = view?.state as string | undefined;
  const gateQuestion = view?.gateQuestion as
    | { prompt: string; kind: string; options?: { value: string; label: string }[] }
    | undefined;

  const sections = useMemo(() => (view?.sections ?? []) as SectionDef[], [view]);
  const missing = (view?.missing ?? []) as string[];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Divorce Intake</h1>
        <Link href="/portal/matter" className="text-sm text-blue-600 hover:underline">
          My matter
        </Link>
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {terminatedCard && <StaticCardView card={terminatedCard} />}

      {done && (
        <div className="rounded-xl border-2 border-green-300 bg-green-50 p-6">
          <h2 className="text-lg font-semibold text-green-800">Intake complete</h2>
          <p className="mt-2 whitespace-pre-wrap text-green-900">
            {copy.readyForReview ?? "Your intake has been sent to the attorney for review."}
          </p>
        </div>
      )}

      {!sessionId && !terminatedCard && !done && (
        <div className="rounded-xl border bg-white p-6">
          <p className="whitespace-pre-wrap text-slate-700">
            {copy.welcome ??
              "This structured intake collects the information the attorney needs for an uncontested New Jersey divorce. A conflict-of-interest screen runs first; only both spouses' names are collected before the firm reviews it."}
          </p>
          <button
            onClick={start}
            disabled={busy}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Begin intake
          </button>
          {err && (err.includes("invitation") || err.includes("disclosure")) && (
            <p className="mt-3 text-sm text-slate-600">
              {err.includes("invitation") ? (
                <>
                  Portal access starts with a firm invitation —{" "}
                  <Link href="/invite" className="text-blue-700 underline">
                    enter your invitation
                  </Link>
                  .
                </>
              ) : (
                <>
                  Please review the disclosure on{" "}
                  <Link href="/portal/matter" className="text-blue-700 underline">
                    your matter page
                  </Link>{" "}
                  first.
                </>
              )}
            </p>
          )}
        </div>
      )}

      {sessionId && state === "CONFLICT_REVIEW_PENDING" && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Submitted for review</h2>
          <p className="mt-2 text-slate-700">
            {String(
              view?.message ??
                "Your information has been submitted for review. The firm will contact you regarding the next step."
            )}
          </p>
          <Link
            href="/portal/matter"
            className="mt-4 inline-block rounded-lg border px-5 py-2 hover:bg-slate-100"
          >
            Back to my matter
          </Link>
        </div>
      )}

      {sessionId && state === "PRE_GATE" && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Conflict check — names only</h2>
          <p className="mt-1 text-sm text-slate-600">
            {copy.preGate ??
              "Before anything else, the office must run a conflict-of-interest check. Only the names below are collected at this step."}
          </p>
          <div className="mt-4 grid gap-3">
            <label className="text-sm">
              Your full legal name
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} maxLength={120}
                className="mt-1 w-full rounded border px-2 py-1.5" />
            </label>
            <label className="text-sm">
              Your prior or maiden names (comma-separated, if any)
              <input value={clientPrior} onChange={(e) => setClientPrior(e.target.value)} maxLength={300}
                className="mt-1 w-full rounded border px-2 py-1.5" />
            </label>
            <label className="text-sm">
              Your spouse&apos;s full legal name
              <input value={spouseName} onChange={(e) => setSpouseName(e.target.value)} maxLength={120}
                className="mt-1 w-full rounded border px-2 py-1.5" />
            </label>
            <label className="text-sm">
              Spouse&apos;s prior or maiden names (comma-separated, if any)
              <input value={spousePrior} onChange={(e) => setSpousePrior(e.target.value)} maxLength={300}
                className="mt-1 w-full rounded border px-2 py-1.5" />
            </label>
          </div>
          <button
            onClick={submitIdentity}
            disabled={busy || clientName.trim().length < 2 || spouseName.trim().length < 2}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Run conflict check
          </button>
        </div>
      )}

      {sessionId && gateQuestion && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">{gateQuestion.prompt}</h2>
          <div className="mt-4">
            {gateQuestion.kind === "yesno" && (
              <div className="flex gap-3">
                <button onClick={() => answerGate(true)} disabled={busy}
                  className="rounded-lg border px-5 py-2 hover:bg-slate-100 disabled:opacity-50">Yes</button>
                <button onClick={() => answerGate(false)} disabled={busy}
                  className="rounded-lg border px-5 py-2 hover:bg-slate-100 disabled:opacity-50">No</button>
              </div>
            )}
            {(gateQuestion.kind === "county" || gateQuestion.kind === "choice") && (
              <div className="grid gap-2">
                {(gateQuestion.options ?? []).map((o) => (
                  <button key={o.value} onClick={() => answerGate(o.value)} disabled={busy}
                    className="rounded-lg border px-4 py-2 text-left hover:bg-slate-100 disabled:opacity-50">
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {sessionId && state === "TIER_BRANCH" && view?.branchQuestions != null && (
        <div className="rounded-xl border bg-white p-6">
          {Object.values(view.branchQuestions as Record<string, { id: string; prompt: string; options: { value: string; label: string }[] }>).map((q) => (
            <div key={q.id} className="mb-4">
              <h2 className="font-semibold">{q.prompt}</h2>
              <div className="mt-2 grid gap-2">
                {q.options.map((o) => {
                  const sel = q.id === "branch_assets" ? branchAssets : branchAlimony;
                  const set = q.id === "branch_assets" ? setBranchAssets : setBranchAlimony;
                  return (
                    <label key={o.value} className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={sel === o.value} onChange={() => set(o.value)} />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            onClick={submitBranch}
            disabled={busy || !branchAssets || !branchAlimony}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {sessionId && state === "INTAKE" && (
        <div className="space-y-6">
          {sections.map((sec) => (
            <div key={sec.id} className="rounded-xl border bg-white p-6">
              <h2 className="font-semibold">{sec.title}</h2>
              <div className="mt-4 grid gap-4">
                {sec.fields.filter((f) => visible(f, draft)).map((f) => (
                  <label key={f.id} className="block text-sm">
                    <span className="font-medium">
                      {f.label}
                      {missing.includes(f.id) && <span className="ml-1 text-red-500">*</span>}
                    </span>
                    <div className="mt-1">
                      <FieldInput
                        field={f}
                        value={draft[f.id]}
                        onChange={(v) => setDraft((d) => ({ ...d, [f.id]: v }))}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-3">
            <button onClick={saveAnswers} disabled={busy}
              className="rounded-lg border px-5 py-2 hover:bg-slate-100 disabled:opacity-50">
              Save progress
            </button>
            <button onClick={complete} disabled={busy}
              className="rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700 disabled:opacity-50">
              Submit for attorney review
            </button>
          </div>
        </div>
      )}

      {sessionId && state && state !== "PRE_GATE" && <BotPanel sessionId={sessionId} />}
    </main>
  );
}
