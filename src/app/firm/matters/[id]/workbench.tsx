"use client";

/**
 * The intake transcript — the ONE workbench panel that survived the
 * 2026-07-27 redesign ("for Claude" doc): "Intake Transcript: STAY. Very
 * good. … Lawyer should be able to review and audit the convo."
 *
 * Everything else this file used to hold — the Case check card, the
 * document checklist, form readiness, legal source status, and the AI
 * workbench — was deleted the same day: the forms rail (rail.tsx) is the
 * one control surface now, and "the lawyer should know if this can be
 * filed or not." The server-side machinery those panels displayed
 * (evaluateResidency feeding the Complaint's § 230 prong, audit logging,
 * the AI layer's HTTP routes) is UNCHANGED — only the panels are gone.
 */
import { useEffect, useRef, useState } from "react";
import { type PanelOpenSignal } from "@/components/shell";
import { api } from "@/lib/ui/client-api";

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
    // Same open-on-signal pattern as shell.tsx's AccordionPanel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

interface TranscriptMsg {
  id: string;
  role: "CLIENT" | "ASSISTANT" | "SYSTEM_EVENT";
  content: string;
  lang: string;
  createdAt: string;
}

export function IntakeTranscriptPanel({
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
