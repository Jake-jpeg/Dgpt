"use client";

/**
 * /start — a conversation with June (2026-10-30, second cut).
 *
 * The server owns everything: June's words, the eight facts, the language,
 * the quote. This page is a thin, mobile-first chat: it loads the opening and
 * transcript for this visitor (GET /api/start/turn), posts each message
 * (POST), and shows the sign-in buttons once the server says the draft is
 * complete. Korean and English; June mirrors the visitor.
 */
import { useEffect, useRef, useState } from "react";
import { Shell, useMe } from "@/components/shell";
import { api } from "@/lib/ui/client-api";
import { formatUsd } from "@/config/pricing";

type Msg = { id: string; role: "VISITOR" | "JUNE" | "SYSTEM"; content: string };
interface State {
  lang: "en" | "ko";
  facts: { yourEmail?: string; yourName?: string };
  missing: string[];
  complete: boolean;
  quote: { total: number; lines: { label: string; amount: number }[] } | null;
  disabled?: boolean;
}

export default function StartWithJune() {
  const { me } = useMe();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [state, setState] = useState<State | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = (await api.get("/api/start/turn")) as unknown as State & { transcript: Msg[] };
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMsgs(r.transcript);
        setState(r);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "June is not available right now");
      }
    })();
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length, state?.complete, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setErr(null);
    setInput("");
    setMsgs((m) => [...m, { id: `v-${Date.now()}`, role: "VISITOR", content: text }]);
    try {
      const r = (await api.post("/api/start/turn", { message: text })) as unknown as State & { say: string };
      setMsgs((m) => [...m, { id: `j-${Date.now()}`, role: "JUNE", content: r.say }]);
      if (r.missing) setState(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong — try again");
    } finally {
      setBusy(false);
    }
  }

  const ko = state?.lang === "ko";
  const complete = Boolean(state?.complete);
  const TOTAL_FACTS = 8;
  const known = state ? Math.max(0, TOTAL_FACTS - state.missing.length) : 0;

  return (
    <Shell compact>
      <div className="june">
        <div className="june-head">
          <div className="june-avatar" aria-hidden="true">J</div>
          <div className="june-head-text">
            <p className="june-name">June</p>
            <p className="june-role">
              {ko ? "사건 준비 도우미 · Jake Kim Law Firm LLC" : "Set-up assistant · Jake Kim Law Firm LLC"}
            </p>
          </div>
          {state && !complete && (
            <span className="june-pill" aria-label={ko ? `${known}/${TOTAL_FACTS} 완료` : `${known} of ${TOTAL_FACTS} done`}>
              {known}/{TOTAL_FACTS}
            </span>
          )}
          {complete && <span className="june-pill june-pill-done">{ko ? "준비 완료" : "Ready"}</span>}
        </div>
        {state && (
          <div className="june-progress" aria-hidden="true">
            <div style={{ width: `${(known / TOTAL_FACTS) * 100}%` }} />
          </div>
        )}

        <div className="june-thread" aria-live="polite">
          {msgs
            .filter((m) => m.role !== "SYSTEM")
            .map((m) => (
              <div key={m.id} className={`june-turn june-turn-${m.role === "JUNE" ? "june" : "you"}`}>
                <div className={`june-msg june-msg-${m.role === "JUNE" ? "june" : "you"}`}>{m.content}</div>
              </div>
            ))}
          {busy && (
            <div className="june-turn june-turn-june">
              <div className="june-msg june-msg-june june-typing" aria-label={ko ? "입력 중" : "June is typing"}>
                <i /><i /><i />
              </div>
            </div>
          )}

          {complete && state?.quote && (
            <div className="june-quote">
              {state.quote.lines.map((l) => (
                <div className="june-quote-line" key={l.label}>
                  <span>{l.label}</span>
                  <span>{formatUsd(l.amount)}</span>
                </div>
              ))}
              <div className="june-quote-total">
                <span>{ko ? "정액 수임료" : "Flat fee"}</span>
                <span>{formatUsd(state.quote.total)}</span>
              </div>
            </div>
          )}
          {complete && (
            <div className="june-signin">
              {me?.providers.google && (
                <button className="btn btn-primary" onClick={() => (window.location.href = "/api/auth/login/google")}>
                  {ko ? "Google로 로그인하고 사건 만들기" : "Sign in with Google to create my case"}
                </button>
              )}
              {me?.providers.msa && (
                <button className="btn btn-primary" onClick={() => (window.location.href = "/api/auth/login/msa")}>
                  {ko ? "Outlook / Hotmail로 로그인" : "Sign in with Outlook / Hotmail"}
                </button>
              )}
              {state?.facts.yourEmail && (
                <p className="text-xs text-slate-500">
                  {ko ? `${state.facts.yourEmail} 주소로 로그인해 주세요 — 그 주소로 사건이 준비되어 있습니다.` : `Use ${state.facts.yourEmail} — that is the address your case is waiting under.`}
                </p>
              )}
            </div>
          )}
          <div ref={bottom} />
        </div>

        {err && <div className="notice notice-error mt-3">{err}</div>}

        {state && !complete && (
          <div className="june-input">
            <div className="june-row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={ko ? "여기에 입력하세요…" : "Type here…"}
                maxLength={1000}
                disabled={busy}
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="off"
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button className="btn btn-primary" disabled={busy || !input.trim()} onClick={send}>
                {ko ? "보내기" : "Send"}
              </button>
            </div>
            <p className="june-ask">
              {ko
                ? "영어 또는 한국어로 답하실 수 있습니다. 질문도 언제든지 하세요. 법률 자문이 아닙니다 · Jake Kim Law Firm LLC"
                : "English or Korean. Ask June anything about how this works. Not legal advice · Jake Kim Law Firm LLC"}
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}
