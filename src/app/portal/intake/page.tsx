"use client";

/**
 * Client questionnaire (B11) — the schema-driven NJ/NY intake experience.
 *
 * Everything a client sees here is a plain-language FACT question from the
 * versioned intake schema. The server decides which items are visible
 * (audience + deterministic conditions); this page only renders and posts
 * back. It never shows statutes, internal source records, or attorney
 * determinations, and it never offers legal conclusions or advice — those
 * are the attorney's alone. Save-and-resume: every section save persists
 * immediately; returning later restores the saved answers.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Shell, useMe, ErrorNotice } from "@/components/shell";
import { api } from "@/lib/ui/client-api";

interface Option {
  value: string;
  label: string;
}
interface Item {
  id: string;
  section: string;
  prompt: string;
  helpText?: string;
  type: string;
  required?: boolean;
  options?: Option[];
  sensitive?: boolean;
}
interface SectionMeta {
  id: string;
  title: string;
  clientIntro?: string;
}
interface Progress {
  sectionId: string;
  title: string;
  total: number;
  answered: number;
  missingRequired: number;
}
interface IntakeView {
  available: boolean;
  status?: string;
  workflowAssigned: boolean;
  workflowMessage: string;
  schema: { id: string; version: string; sections: SectionMeta[] };
  items: Item[];
  answers: Record<string, unknown>;
  progress: Progress[];
  missingRequired: { id: string; section: string; prompt: string }[];
}
interface DocRequest {
  documentId: string;
  title: string;
  requestText: string;
  status: string;
}

/** Column layout for each repeating record type — plain factual fields. */
const REPEAT_COLUMNS: Record<string, { key: string; label: string; kind: "text" | "date" | "number" }[]> = {
  repeat_child: [
    { key: "name", label: "Child's name", kind: "text" },
    { key: "dateOfBirth", label: "Date of birth", kind: "date" },
    { key: "residesWith", label: "Currently lives with", kind: "text" },
    { key: "state", label: "State where the child lives now", kind: "text" },
    { key: "school", label: "School (if any)", kind: "text" },
  ],
  // Also used for residence-history items: the state field is what the
  // firm's deterministic jurisdiction signals read — keep it first.
  repeat_case: [
    { key: "state", label: "State", kind: "text" },
    { key: "court", label: "Court / county (if a court case)", kind: "text" },
    { key: "caseNumber", label: "Case or docket number (if known)", kind: "text" },
    { key: "from", label: "From (approx.)", kind: "text" },
    { key: "to", label: "To (approx.)", kind: "text" },
    { key: "caseType", label: "What it was about (if a court case)", kind: "text" },
  ],
  repeat_employer: [
    { key: "employer", label: "Employer", kind: "text" },
    { key: "position", label: "Position", kind: "text" },
    { key: "since", label: "Start date (approx.)", kind: "text" },
  ],
  repeat_income: [
    { key: "source", label: "Income source", kind: "text" },
    { key: "amountMonthly", label: "Approx. monthly amount", kind: "number" },
  ],
  repeat_asset: [
    { key: "description", label: "Asset (what and where)", kind: "text" },
    { key: "titledTo", label: "Whose name is it in?", kind: "text" },
    { key: "estimatedValue", label: "Approx. value", kind: "number" },
    { key: "acquired", label: "When acquired (before/during the marriage)", kind: "text" },
  ],
  repeat_debt: [
    { key: "description", label: "Debt (type and lender)", kind: "text" },
    { key: "inWhoseName", label: "Whose name is it in?", kind: "text" },
    { key: "balance", label: "Approx. balance", kind: "number" },
  ],
  repeat_insurance: [
    { key: "kind", label: "Type (health, life, auto…)", kind: "text" },
    { key: "carrier", label: "Carrier", kind: "text" },
    { key: "whoIsCovered", label: "Who is covered", kind: "text" },
  ],
};

export default function ClientIntake() {
  const { me, loading } = useMe();
  const matterId = me?.clientMatterId ?? null;
  // Chat is the DEFAULT intake experience; the classic form stays one click
  // away and both write the same answer store — switching keeps progress.
  const [mode, setMode] = useState<"chat" | "form">("chat");
  const [chatUnavailable, setChatUnavailable] = useState(false);

  if (mode === "chat" && !chatUnavailable) {
    return (
      <IntakeChat
        me={me}
        loading={loading}
        matterId={matterId}
        onPreferForm={() => setMode("form")}
        onUnavailable={() => {
          setChatUnavailable(true);
          setMode("form");
        }}
      />
    );
  }
  return <ClientQuestionnaire backToChat={chatUnavailable ? null : () => setMode("chat")} />;
}

interface ChatMsg {
  id: string;
  role: "CLIENT" | "ASSISTANT" | "SYSTEM_EVENT";
  content: string;
  lang: string;
}
interface ChatProgress {
  answered: number;
  total: number;
  sectionTitle: string | null;
  sectionIndex: number | null;
  sectionCount: number;
}

function IntakeChat({
  me,
  loading,
  matterId,
  onPreferForm,
  onUnavailable,
}: {
  me: ReturnType<typeof useMe>["me"];
  loading: boolean;
  matterId: string | null;
  onPreferForm: () => void;
  onUnavailable: () => void;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [prog, setProg] = useState<ChatProgress | null>(null);
  const [stopped, setStopped] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Resolve the client's own intake session from their matter, then load
  // the transcript (the server appends the scripted welcome on first read).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!matterId) return;
      try {
        const m = (await api.get(`/api/matters/${matterId}`)) as unknown as {
          matter: { intakeSessionId: string | null };
        };
        let sid = m.matter.intakeSessionId;
        if (!sid) {
          const started = (await api.post("/api/intake/start", { matterId })) as unknown as {
            session: { id: string };
          };
          sid = started.session.id;
        }
        if (cancelled) return;
        setSessionId(sid);
        const view = (await api.get(`/api/intake-chat/${sid}`)) as unknown as {
          enabled: boolean;
          transcript: ChatMsg[];
          progress: ChatProgress;
          stopped: string | null;
          complete: boolean;
        };
        if (cancelled) return;
        if (!view.enabled) {
          onUnavailable();
          return;
        }
        setMessages(view.transcript.filter((t) => t.role !== "SYSTEM_EVENT"));
        setProg(view.progress);
        setStopped(view.stopped);
        setComplete(view.complete);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Could not load your intake");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const message = text.trim();
    if (!message || !sessionId || busy) return;
    setBusy(true);
    setErr(null);
    setText("");
    setMessages((m) => [
      ...m,
      { id: `local-${Date.now()}`, role: "CLIENT", content: message, lang: "en" },
    ]);
    try {
      const r = (await api.post(`/api/intake-chat/${sessionId}`, { message })) as unknown as {
        say: string;
        stopped: string | null;
        complete: boolean;
        card: { title: string; body: string; resources?: { label: string; value: string }[] } | null;
        progress: ChatProgress;
      };
      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: "ASSISTANT", content: r.say, lang: "en" },
      ]);
      setProg(r.progress);
      setStopped(r.stopped);
      if (r.complete) setComplete(true);
      if (r.card) {
        setMessages((m) => [
          ...m,
          {
            id: `card-${Date.now()}`,
            role: "ASSISTANT",
            content:
              `${r.card!.title}\n\n${r.card!.body}` +
              (r.card!.resources
                ? "\n\n" + r.card!.resources.map((x) => `${x.label}: ${x.value}`).join("\n")
                : ""),
            lang: "en",
          },
        ]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      if (msg.includes("unavailable") || msg.includes("form")) {
        onUnavailable();
        return;
      }
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your intake</h1>
          {prog && prog.total > 0 && (
            <p className="text-sm text-slate-600" aria-live="polite">
              {prog.sectionTitle
                ? `Section ${prog.sectionIndex ?? "…"} of ${prog.sectionCount} — ${prog.sectionTitle} · `
                : ""}
              {prog.answered} of {prog.total} questions answered
            </p>
          )}
        </div>
        <button
          type="button"
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          onClick={onPreferForm}
        >
          Prefer a form?
        </button>
      </div>

      <p className="mb-3 rounded bg-slate-100 px-3 py-2 text-xs text-slate-600">
        DivorceGPT is not a lawyer and gives no legal advice. Your attorney reviews
        everything. · DivorceGPT는 변호사가 아니며 법률 자문을 제공하지 않습니다.
        모든 내용은 담당 변호사가 검토합니다.
      </p>

      {err && <p className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      {loading && <p className="text-slate-500">Loading…</p>}
      {!loading && !matterId && (
        <p className="text-slate-600">
          Your workspace is created when you sign in. If this does not resolve,
          sign out and back in.
        </p>
      )}

      <div
        className="flex-1 space-y-3 overflow-y-auto rounded border border-slate-200 bg-white p-4"
        style={{ minHeight: "50vh", fontSize: "16px" }}
        aria-live="polite"
      >
        {messages.map((m) => (
          <div key={m.id} className={m.role === "CLIENT" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "CLIENT"
                  ? "max-w-[85%] whitespace-pre-wrap rounded-2xl bg-[#16324f] px-4 py-2 text-white"
                  : "max-w-[85%] whitespace-pre-wrap rounded-2xl bg-slate-100 px-4 py-2 text-slate-900"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && <p className="text-sm text-slate-400">…</p>}
        <div ref={bottomRef} />
      </div>

      {complete && (
        <p className="mt-3 rounded bg-green-50 px-3 py-2 text-sm text-green-800">
          Your intake is complete. The attorney will review everything and the
          firm will contact you about next steps.
        </p>
      )}
      {stopped && (
        <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This intake is paused — please contact the firm to continue.
        </p>
      )}

      {!complete && !stopped && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Your message
          </label>
          <textarea
            id="chat-input"
            className="flex-1 resize-none rounded border border-slate-300 px-3 py-2"
            style={{ fontSize: "16px" }}
            rows={2}
            maxLength={4000}
            value={text}
            disabled={busy || !sessionId}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type your answer or question… (한국어 가능)"
          />
          <button
            type="submit"
            className="rounded bg-[#16324f] px-5 py-2 font-semibold text-white disabled:opacity-50"
            disabled={busy || !text.trim() || !sessionId}
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}

function ClientQuestionnaire({ backToChat }: { backToChat: (() => void) | null }) {
  const { me, loading } = useMe();
  const matterId = me?.clientMatterId ?? null;

  const [view, setView] = useState<IntakeView | null>(null);
  const [docRequests, setDocRequests] = useState<DocRequest[]>([]);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const load = useCallback(async () => {
    if (!matterId) return;
    setErr(null);
    try {
      const v = (await api.get(`/api/matters/${matterId}/intake2`)) as unknown as IntakeView;
      setView(v);
      if (v.available) {
        setDraft(v.answers);
        setDirty(new Set());
        setCurrent((c) => c ?? v.schema.sections.find((s) => v.items.some((i) => i.section === s.id))?.id ?? null);
        try {
          const c = (await api.get(`/api/matters/${matterId}/checklist`)) as unknown as { requests?: DocRequest[] };
          setDocRequests(c.requests ?? []);
        } catch {
          /* checklist is optional here */
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load your questionnaire");
    }
  }, [matterId]);

  useEffect(() => {
    // Hydrate once the client identity resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const sections = useMemo(() => {
    if (!view?.available) return [];
    const withItems = new Set(view.items.map((i) => i.section));
    return view.schema.sections.filter((s) => withItems.has(s.id));
  }, [view]);

  const currentItems = useMemo(
    () => (view?.available && current ? view.items.filter((i) => i.section === current) : []),
    [view, current]
  );

  const setAnswer = (id: string, value: unknown) => {
    setDraft((d) => ({ ...d, [id]: value }));
    setDirty((s) => new Set(s).add(id));
  };

  const saveSection = async (goNext: boolean) => {
    if (!matterId || !view?.available || !current) return;
    const changed = currentItems.filter((i) => dirty.has(i.id));
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      if (changed.length > 0) {
        await api.put(`/api/matters/${matterId}/intake2`, {
          answers: changed.map((i) => ({ questionId: i.id, value: draft[i.id] ?? null })),
        });
      }
      // Conditions may reveal/hide questions — always refresh from the server.
      const idx = sections.findIndex((s) => s.id === current);
      const next = goNext && idx >= 0 && idx < sections.length - 1 ? sections[idx + 1].id : current;
      await load();
      setCurrent(next);
      setInfo(changed.length > 0 ? "Your answers were saved. You can leave and return at any time." : null);
      headingRef.current?.focus();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Your answers could not be saved");
    } finally {
      setBusy(false);
    }
  };

  /* ── gating states ─────────────────────────────────────────────── */

  if (!loading && me?.user && me.user.role !== "CLIENT") {
    return (
      <Shell title="Questionnaire">
        <div className="notice notice-info">This page is for client accounts.</div>
      </Shell>
    );
  }

  return (
    <Shell title="My questionnaire">
      <ErrorNotice message={err} />
      {info && <div className="notice notice-good mb-4" role="status">{info}</div>}
      {backToChat && (
        <p className="mb-3">
          <button type="button" className="btn btn-quiet" onClick={backToChat}>
            ← Back to the chat intake (your progress carries over)
          </button>
        </p>
      )}

      {!loading && me?.user?.role === "CLIENT" && !matterId && (
        <div className="panel">
          <h2>Preparing your workspace</h2>
          <p className="panel-sub">
            Your workspace is created automatically when you sign in. If it does
            not appear, sign out and back in, or contact the firm.
          </p>
        </div>
      )}

      {view && !view.available && (
        <div className="panel">
          <h2>Thank you</h2>
          <p className="text-[.95rem]">{view.status}</p>
          <Link className="btn btn-quiet mt-3" href="/portal/matter">Back to my matter</Link>
        </div>
      )}

      {view?.available && (
        <>
          <div className="panel">
            <h2>About this questionnaire</h2>
            <p className="text-[.95rem]">{view.workflowMessage}</p>
            <p className="panel-sub mt-2">
              These questions collect facts so your attorney can advise you. Answer what you can —
              your progress is saved as you go, and you can return anytime. If a question doesn&apos;t
              apply, you may leave it blank. Nothing here is legal advice, and your answers are
              reviewed by the firm.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            {/* section navigation */}
            <nav aria-label="Questionnaire sections" className="panel h-fit lg:sticky lg:top-4">
              <ul className="space-y-1">
                {sections.map((s) => {
                  const p = view.progress.find((x) => x.sectionId === s.id);
                  const isCurrent = current === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        className={`w-full rounded px-2 py-1.5 text-left text-sm ${
                          isCurrent ? "bg-[#eef3fc] font-semibold text-[#1f4ca8]" : "hover:bg-slate-50"
                        }`}
                        aria-current={isCurrent ? "step" : undefined}
                        onClick={() => {
                          setCurrent(s.id);
                          setInfo(null);
                          headingRef.current?.focus();
                        }}
                      >
                        {s.title}
                        {p && (
                          <span className="ml-1 block text-xs font-normal text-slate-500">
                            {p.answered}/{p.total}
                            {p.missingRequired > 0 ? ` · ${p.missingRequired} needed` : p.total > 0 && p.answered >= p.total ? " ✓" : ""}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* current section */}
            <div>
              {sections
                .filter((s) => s.id === current)
                .map((s) => (
                  <div key={s.id} className="panel">
                    <h2 ref={headingRef} tabIndex={-1}>{s.title}</h2>
                    {s.clientIntro && <p className="panel-sub">{s.clientIntro}</p>}
                    <div className="space-y-5">
                      {currentItems.map((item) => (
                        <Question key={item.id} item={item} value={draft[item.id]} onChange={(v) => setAnswer(item.id, v)} />
                      ))}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button className="btn btn-primary" disabled={busy} onClick={() => saveSection(true)}>
                        Save &amp; continue
                      </button>
                      <button className="btn btn-quiet" disabled={busy} onClick={() => saveSection(false)}>
                        Save
                      </button>
                      <Link className="btn btn-quiet" href="/portal/matter">
                        Save for later
                      </Link>
                    </div>
                  </div>
                ))}

              {docRequests.length > 0 && (
                <div className="panel">
                  <h2>Documents the firm has asked for</h2>
                  <ul className="space-y-2 text-[.93rem]">
                    {docRequests.map((d) => (
                      <li key={d.documentId}>
                        <span className="font-semibold">{d.title}</span> — {d.requestText}
                        <span className="ml-2 text-xs text-slate-500">({d.status})</span>
                      </li>
                    ))}
                  </ul>
                  <p className="panel-sub mt-2">
                    You can upload these from{" "}
                    <Link href="/portal/matter" className="text-[#1f4ca8] hover:underline">your matter page</Link>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}

/* ── a single question ────────────────────────────────────────────── */

function Question({ item, value, onChange }: { item: Item; value: unknown; onChange: (v: unknown) => void }) {
  const inputId = `q-${item.id.replaceAll(".", "-")}`;
  const helpId = item.helpText ? `${inputId}-help` : undefined;

  if (item.type === "document_request") {
    return (
      <div className="rounded border border-dashed border-[var(--line)] p-3 text-sm">
        <p className="font-medium">{item.prompt}</p>
        {item.helpText && <p className="mt-1 text-xs text-slate-500">{item.helpText}</p>}
        <p className="mt-1 text-xs text-slate-500">
          Please upload this from your matter page when you have it.
        </p>
      </div>
    );
  }

  const label = (
    <span className="field-label">
      {item.prompt}
      {item.required && <span aria-hidden className="ml-1 text-red-700">*</span>}
      {item.required && <span className="sr-only"> (required)</span>}
    </span>
  );
  const help = item.helpText && (
    <p id={helpId} className="mt-1 text-xs text-slate-500">{item.helpText}</p>
  );
  const sensitiveNote = item.sensitive && (
    <p className="mt-1 text-xs text-slate-500">
      This answer is handled with additional care and shared only with the firm.
    </p>
  );

  switch (item.type) {
    case "yes_no":
      return (
        <fieldset>
          <legend className="field-label">
            {item.prompt}
            {item.required && <span aria-hidden className="ml-1 text-red-700">*</span>}
          </legend>
          {help}
          <div className="mt-1 flex gap-4" role="radiogroup">
            {[
              ["yes", "Yes"],
              ["no", "No"],
            ].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={inputId}
                  checked={value === (v === "yes")}
                  onChange={() => onChange(v === "yes")}
                  aria-describedby={helpId}
                />
                {l}
              </label>
            ))}
          </div>
          {sensitiveNote}
        </fieldset>
      );

    case "single_select":
      return (
        <div>
          <label htmlFor={inputId}>{label}</label>
          {help}
          <select
            id={inputId}
            className="text-input mt-1"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value || null)}
            aria-describedby={helpId}
          >
            <option value="">— please choose —</option>
            {(item.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {sensitiveNote}
        </div>
      );

    case "multi_select": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <fieldset>
          <legend className="field-label">
            {item.prompt}
            {item.required && <span aria-hidden className="ml-1 text-red-700">*</span>}
          </legend>
          {help}
          <div className="mt-1 space-y-1">
            {(item.options ?? []).map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(o.value)}
                  onChange={(e) =>
                    onChange(e.target.checked ? [...selected, o.value] : selected.filter((x) => x !== o.value))
                  }
                />
                {o.label}
              </label>
            ))}
          </div>
          {sensitiveNote}
        </fieldset>
      );
    }

    case "long_text":
      return (
        <div>
          <label htmlFor={inputId}>{label}</label>
          {help}
          <textarea
            id={inputId}
            className="text-input mt-1 min-h-24"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            maxLength={8000}
            aria-describedby={helpId}
          />
          {sensitiveNote}
        </div>
      );

    case "date":
      return (
        <div>
          <label htmlFor={inputId}>{label}</label>
          {help}
          <input
            id={inputId}
            type="date"
            className="text-input mt-1"
            style={{ width: "auto" }}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value || null)}
            aria-describedby={helpId}
          />
          {sensitiveNote}
        </div>
      );

    case "date_range": {
      const range = (value ?? {}) as { from?: string; to?: string };
      return (
        <fieldset>
          <legend className="field-label">{item.prompt}</legend>
          {help}
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              From
              <input
                type="date"
                className="text-input"
                style={{ width: "auto" }}
                value={range.from ?? ""}
                onChange={(e) => onChange({ ...range, from: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2">
              To
              <input
                type="date"
                className="text-input"
                style={{ width: "auto" }}
                value={range.to ?? ""}
                onChange={(e) => onChange({ ...range, to: e.target.value })}
              />
            </label>
          </div>
          {sensitiveNote}
        </fieldset>
      );
    }

    case "money":
    case "percent":
    case "integer":
      return (
        <div>
          <label htmlFor={inputId}>{label}</label>
          {help}
          <div className="mt-1 flex items-center gap-2">
            {item.type === "money" && <span aria-hidden>$</span>}
            <input
              id={inputId}
              type="number"
              inputMode="decimal"
              step={item.type === "integer" ? 1 : "0.01"}
              className="text-input"
              style={{ width: "12rem" }}
              value={value === undefined || value === null ? "" : String(value)}
              onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
              aria-describedby={helpId}
            />
            {item.type === "percent" && <span aria-hidden>%</span>}
          </div>
          {sensitiveNote}
        </div>
      );

    case "address": {
      const addr = (value ?? {}) as Record<string, string>;
      const set = (k: string, v: string) => onChange({ ...addr, [k]: v });
      return (
        <fieldset>
          <legend className="field-label">
            {item.prompt}
            {item.required && <span aria-hidden className="ml-1 text-red-700">*</span>}
          </legend>
          {help}
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              Street address
              <input className="text-input mt-0.5" value={addr.line1 ?? ""} onChange={(e) => set("line1", e.target.value)} autoComplete="off" />
            </label>
            <label className="text-sm">
              City
              <input className="text-input mt-0.5" value={addr.city ?? ""} onChange={(e) => set("city", e.target.value)} autoComplete="off" />
            </label>
            <label className="text-sm">
              State
              <input className="text-input mt-0.5" value={addr.state ?? ""} onChange={(e) => set("state", e.target.value)} autoComplete="off" />
            </label>
            <label className="text-sm">
              ZIP
              <input className="text-input mt-0.5" value={addr.zip ?? ""} onChange={(e) => set("zip", e.target.value)} autoComplete="off" />
            </label>
            <label className="text-sm">
              Since (approx. date)
              <input type="date" className="text-input mt-0.5" value={addr.since ?? ""} onChange={(e) => set("since", e.target.value)} />
            </label>
          </div>
          {sensitiveNote}
        </fieldset>
      );
    }

    case "person": {
      const p = (value ?? {}) as Record<string, string>;
      const set = (k: string, v: string) => onChange({ ...p, [k]: v });
      return (
        <fieldset>
          <legend className="field-label">
            {item.prompt}
            {item.required && <span aria-hidden className="ml-1 text-red-700">*</span>}
          </legend>
          {help}
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            <label className="text-sm">
              Full legal name
              <input className="text-input mt-0.5" value={p.fullLegalName ?? ""} onChange={(e) => set("fullLegalName", e.target.value)} autoComplete="off" />
            </label>
            <label className="text-sm">
              Also known as (optional)
              <input className="text-input mt-0.5" value={p.aka ?? ""} onChange={(e) => set("aka", e.target.value)} autoComplete="off" />
            </label>
          </div>
          {sensitiveNote}
        </fieldset>
      );
    }

    case "entity": {
      const en = (value ?? {}) as Record<string, string>;
      const set = (k: string, v: string) => onChange({ ...en, [k]: v });
      return (
        <fieldset>
          <legend className="field-label">{item.prompt}</legend>
          {help}
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            <label className="text-sm">
              Name
              <input className="text-input mt-0.5" value={en.name ?? ""} onChange={(e) => set("name", e.target.value)} autoComplete="off" />
            </label>
            <label className="text-sm">
              Your role / interest
              <input className="text-input mt-0.5" value={en.role ?? ""} onChange={(e) => set("role", e.target.value)} autoComplete="off" />
            </label>
          </div>
          {sensitiveNote}
        </fieldset>
      );
    }

    default: {
      if (item.type.startsWith("repeat_")) {
        return <RepeatEditor item={item} value={value} onChange={onChange} help={help} sensitiveNote={sensitiveNote} />;
      }
      // short_text and anything unrecognized → safe text input
      return (
        <div>
          <label htmlFor={inputId}>{label}</label>
          {help}
          <input
            id={inputId}
            className="text-input mt-1"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            maxLength={2000}
            aria-describedby={helpId}
            autoComplete="off"
          />
          {sensitiveNote}
        </div>
      );
    }
  }
}

/** Repeating records: add/remove rows of plain factual fields. */
function RepeatEditor({
  item,
  value,
  onChange,
  help,
  sensitiveNote,
}: {
  item: Item;
  value: unknown;
  onChange: (v: unknown) => void;
  help: React.ReactNode;
  sensitiveNote: React.ReactNode;
}) {
  const columns = REPEAT_COLUMNS[item.type] ?? [
    { key: "description", label: "Description", kind: "text" as const },
  ];
  const rows = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

  const setCell = (idx: number, key: string, v: string) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, [key]: v } : r));
    onChange(next);
  };

  return (
    <fieldset>
      <legend className="field-label">
        {item.prompt}
        {item.required && <span aria-hidden className="ml-1 text-red-700">*</span>}
      </legend>
      {help}
      {rows.length === 0 && <p className="mt-1 text-sm text-slate-500">None added yet.</p>}
      <div className="mt-2 space-y-3">
        {rows.map((row, idx) => (
          <div key={idx} className="rounded border border-[var(--line)] p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {columns.map((c) => (
                <label key={c.key} className="text-sm">
                  {c.label}
                  <input
                    type={c.kind === "date" ? "date" : c.kind === "number" ? "number" : "text"}
                    inputMode={c.kind === "number" ? "decimal" : undefined}
                    className="text-input mt-0.5"
                    value={row[c.key] === undefined || row[c.key] === null ? "" : String(row[c.key])}
                    onChange={(e) => setCell(idx, c.key, e.target.value)}
                    autoComplete="off"
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-quiet mt-2"
              style={{ padding: "2px 10px", fontSize: ".75rem" }}
              onClick={() => onChange(rows.filter((_, i) => i !== idx))}
            >
              Remove this entry
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-quiet mt-2"
        onClick={() => onChange([...rows, {}])}
      >
        + Add {rows.length === 0 ? "an entry" : "another"}
      </button>
      {sensitiveNote}
    </fieldset>
  );
}
