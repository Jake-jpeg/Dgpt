"use client";

/**
 * /start — a conversation with June (2026-10-30, second cut; 2026-11-08
 * behind sign-in).
 *
 * The server owns everything: June's words, the eight facts, the language,
 * the quote. This page is a thin, mobile-first chat. Before the chat it is a
 * door: sign in (Google / Microsoft — no passwords exist here), finish
 * sign-up (name, number, notices), and only then June — who opens by
 * confirming the name and email from the sign-in. When the eight facts are
 * in, "Create my case" turns the draft into the matter and the spouse's
 * private link, right here.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Shell, useMe } from "@/components/shell";
import { api } from "@/lib/ui/client-api";
import { formatUsd } from "@/config/pricing";
import { NO_PASSWORD_LINE } from "@/config/signup-copy";
import { START_RETURN_COOKIE } from "@/lib/june/links";
import { operatingFirmName } from "@/config/branding";

type Msg = { id: string; role: "VISITOR" | "JUNE" | "SYSTEM"; content: string };
type Access = "OK" | "SIGN_IN" | "SIGN_UP" | "REJECTED" | "NOT_CLIENT";
interface State {
  access: Access;
  signupUrl?: string;
  lang: "en" | "ko";
  facts: { yourEmail?: string; yourName?: string };
  missing: string[];
  complete: boolean;
  quote: { total: number; lines: { label: string; amount: number }[] } | null;
  disabled?: boolean;
}

export default function StartWithJune() {
  const { me } = useMe();
  const firm = operatingFirmName();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [state, setState] = useState<State | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = (await api.get("/api/start/turn")) as unknown as State & { transcript?: Msg[] };
            setMsgs(r.transcript ?? []);
        setState(r);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "June is not available right now");
      }
    })();
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length, state?.complete, busy]);

  function signIn(provider: "google" | "msa") {
    document.cookie = `${START_RETURN_COOKIE}=1; Path=/; SameSite=Lax; Max-Age=900`;
    window.location.href = `/api/auth/login/${provider}`;
  }

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
      if (r.missing) setState((s) => ({ ...(s as State), ...r, access: "OK" }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong — try again");
    } finally {
      setBusy(false);
    }
  }

  async function createCase() {
    setCreating(true);
    setErr(null);
    try {
      const r = (await api.post("/api/start/finish")) as unknown as { matterId: string; inviteUrl: string };
      try {
        window.sessionStorage.setItem("dgpt_invite_url", r.inviteUrl);
      } catch {
        /* storage unavailable — the portal can reissue the link */
      }
      window.location.replace("/portal/matter");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create the case");
      setCreating(false);
    }
  }

  const ko = state?.lang === "ko";
  const access = state?.access ?? null;
  const complete = Boolean(state?.complete);
  const TOTAL_FACTS = 8;
  const known = state && access === "OK" ? Math.max(0, TOTAL_FACTS - state.missing.length) : 0;

  /* ── the door before the chat ─────────────────────────────────────── */
  if (access && access !== "OK") {
    return (
      <Shell compact>
        <div className="june">
          <div className="june-head">
            <div className="june-avatar" aria-hidden="true">J</div>
            <div className="june-head-text">
              <p className="june-name">June</p>
              <p className="june-role">Set-up assistant · {firm}</p>
            </div>
          </div>
          <div className="panel start-door">
            {access === "SIGN_IN" && (
              <>
                <h2>Sign in to start with June</h2>
                <p className="panel-sub">
                  June sets up your case under your own account, so the first step is a Google or Microsoft sign-in. Then two things —
                  your name and a phone number — and you&apos;re talking to June.
                </p>
                <div className="door-providers">
                  {me?.providers.google && <button className="door-provider" onClick={() => signIn("google")}>Continue with Google</button>}
                  {me?.providers.msa && <button className="door-provider" onClick={() => signIn("msa")}>Continue with Outlook / Hotmail</button>}
                  {me && !me.providers.google && !me.providers.msa && <p className="text-sm text-slate-500">Sign-in is not configured in this environment.</p>}
                </div>
                <p className="guide-hint">{NO_PASSWORD_LINE.en}</p>
                <p className="guide-hint">{NO_PASSWORD_LINE.ko}</p>
              </>
            )}
            {access === "SIGN_UP" && (
              <>
                <h2>One more step</h2>
                <p className="panel-sub">You&apos;re signed in. Leave your name and a phone number, acknowledge the notices, and June is ready.</p>
                <Link className="btn btn-primary" href={state?.signupUrl ?? "/signup/details?next=start"}>Finish sign-up</Link>
              </>
            )}
            {access === "REJECTED" && (
              <>
                <h2>We&apos;re sorry</h2>
                <p className="panel-sub">The firm has reviewed your sign-up and is unable to assist with this matter.</p>
              </>
            )}
            {access === "NOT_CLIENT" && (
              <>
                <h2>Firm account</h2>
                <p className="panel-sub">You are signed in to a firm account. June is for the spouses; use a personal Google or Microsoft account.</p>
              </>
            )}
          </div>
          {err && <div className="notice notice-error mt-3">{err}</div>}
        </div>
      </Shell>
    );
  }

  /* ── the chat ─────────────────────────────────────────────────────── */
  return (
    <Shell compact>
      <div className="june">
        <div className="june-head">
          <div className="june-avatar" aria-hidden="true">J</div>
          <div className="june-head-text">
            <p className="june-name">June</p>
            <p className="june-role">
              {ko ? `사건 준비 도우미 · ${firm}` : `Set-up assistant · ${firm}`}
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
              <button className="btn btn-primary" disabled={creating} onClick={createCase}>
                {creating ? "…" : ko ? "사건 만들기" : "Create my case"}
              </button>
              {state?.facts.yourEmail && (
                <p className="text-xs text-slate-500">
                  {ko ? `${state.facts.yourEmail} 계정으로 사건이 만들어지고, 배우자분께 보낼 개인 링크가 생성됩니다.` : `Your case is created under ${state.facts.yourEmail}, with a private link for your spouse.`}
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
                ? `영어 또는 한국어로 답하실 수 있습니다. 질문도 언제든지 하세요. 법률 자문이 아닙니다 · ${firm}`
                : `English or Korean. Ask June anything about how this works. Not legal advice · ${firm}`}
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}
