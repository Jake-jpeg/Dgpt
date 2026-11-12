"use client";

/**
 * The reader's guide (2026-11-07) — a general-information chat at the bottom
 * of each article and on /forms. ATTORNEY ADVERTISING by the firm of record.
 *
 * Compliance elements (operator spec): "ATTORNEY ADVERTISING" label; a pre-
 * chat acknowledgment the reader must click through (general information,
 * not legal advice, no attorney-client relationship, don't share details,
 * New York only); a persistent banner "General information only. Not legal
 * advice."; a warning not to enter names, figures or case facts. The thread
 * lives in this component's memory only — nothing the reader types is
 * stored anywhere (the server logs only the guide's output and a timestamp).
 */
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/ui/client-api";

type Lang = "en" | "ko";
interface Msg { role: "reader" | "guide"; text: string; citations?: string[]; label?: string }

const COPY = {
  en: {
    title: "Ask about this",
    sub: "A general-information guide by Jake Kim Law Firm. It explains the article, New York terms, the court process and the official forms. It does not give legal advice.",
    ad: "ATTORNEY ADVERTISING",
    banner: "General information only. Not legal advice.",
    ackTitle: "Before you start",
    ack: [
      "This guide gives general information about New York law only. It is not legal advice.",
      "Using it does not make Jake Kim Law Firm your lawyer and creates no attorney-client relationship.",
      "This conversation is not privileged and not confidential. Do not share sensitive details — no names, dollar figures or facts about your case. Nothing you type is saved, but keep it general.",
      "New York only. It cannot tell you what to do, what you will get, or what to put in any form.",
    ],
    ackButton: "I understand",
    placeholder: "Ask what a term means, how a step works, what a form is…",
    hint: "Please don't enter names, financial details or case facts.",
    send: "Send",
    thinking: "…",
    sources: "Official sources",
    consult: "Schedule a consultation with Jake Kim Law Firm",
    capped: "That's the end of this conversation. For your own situation, the consultation link below is the right next step.",
    err: "The guide isn't available right now.",
  },
  ko: {
    title: "이 글에 대해 질문하기",
    sub: "Jake Kim Law Firm이 제공하는 일반 정보 안내입니다. 글의 의미, 뉴욕 법률 용어, 법원 절차, 공식 서식을 설명합니다. 법률 자문은 제공하지 않습니다.",
    ad: "변호사 광고 (ATTORNEY ADVERTISING)",
    banner: "일반 정보만 제공합니다. 법률 자문이 아닙니다.",
    ackTitle: "시작하기 전에",
    ack: [
      "이 안내는 뉴욕 법에 관한 일반적인 정보만 제공하며 법률 자문이 아닙니다.",
      "이용한다고 해서 Jake Kim Law Firm이 귀하의 변호사가 되는 것이 아니며, 변호사-의뢰인 관계가 성립하지 않습니다.",
      "이 대화는 변호사-의뢰인 특권(privilege)의 보호를 받지 않으며 비밀이 보장되지 않습니다. 이름, 금액, 사건의 구체적 사실 등 민감한 정보는 입력하지 마세요. 입력 내용은 저장되지 않지만 일반적인 질문만 해 주세요.",
      "뉴욕 한정입니다. 무엇을 해야 하는지, 무엇을 받게 되는지, 서식에 무엇을 적어야 하는지는 알려드릴 수 없습니다.",
    ],
    ackButton: "이해했습니다",
    placeholder: "용어의 뜻, 절차, 서식이 무엇인지 물어보세요…",
    hint: "이름, 재정 정보, 사건 사실은 입력하지 마세요.",
    send: "보내기",
    thinking: "…",
    sources: "공식 출처",
    consult: "Jake Kim Law Firm 상담 예약",
    capped: "대화가 여기서 끝납니다. 귀하의 상황에 대해서는 아래 상담 링크가 다음 단계입니다.",
    err: "지금은 안내를 이용할 수 없습니다.",
  },
} as const;

export function GuideChat({ article, lang = "en" }: { article?: string; lang?: Lang }) {
  const t = COPY[lang];
  const [cfg, setCfg] = useState<{ enabled: boolean; access: "OK" | "SIGN_IN" | "SIGN_UP" | "REJECTED" | "NOT_CLIENT"; signupUrl: string; consultationUrl: string; maxChars: number; maxTurns: number } | null>(null);
  const [acked, setAcked] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/api/guide").then((c) => setCfg(c as unknown as typeof cfg)).catch(() => setCfg(null));
  }, []);
  useEffect(() => {
    if (msgs.length) bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs.length]);

  const turns = msgs.filter((m) => m.role === "reader").length;
  const capped = cfg ? turns >= cfg.maxTurns : false;

  async function send() {
    const text = input.trim();
    if (!text || busy || !cfg || capped) return;
    setBusy(true);
    setErr(null);
    setInput("");
    const history = msgs.slice(-8).map((m) => ({ role: m.role, text: m.text }));
    setMsgs((m) => [...m, { role: "reader", text }]);
    try {
      const r = (await api.post("/api/guide", { message: text, article, lang, history })) as unknown as { answer: string; citations: string[]; label: string };
      setMsgs((m) => [...m, { role: "guide", text: r.answer, citations: r.citations, label: r.label }]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t.err);
    } finally {
      setBusy(false);
    }
  }

  if (cfg && !cfg.enabled) return null;

  return (
    <section className="guide" aria-labelledby="guide-title">
      <div className="guide-head">
        <p className="guide-ad">{t.ad}</p>
        <h2 id="guide-title">{t.title}</h2>
        <p className="guide-sub">{t.sub}</p>
      </div>
      <div className="guide-banner" role="note">{t.banner}</div>

      {cfg && cfg.access !== "OK" ? (
        <div className="guide-ack">
          <h3>{lang === "ko" ? "가입 후 이용할 수 있습니다" : "Sign up to use the guide"}</h3>
          <p className="panel-sub">
            {cfg.access === "REJECTED"
              ? lang === "ko" ? "로펌이 이 사안을 도와드릴 수 없습니다." : "The firm is unable to assist with this matter."
              : cfg.access === "NOT_CLIENT"
                ? lang === "ko" ? "로펌 계정으로 로그인되어 있습니다. 개인 계정으로 가입해 주세요." : "You are signed in to a firm account; sign up with a personal account to use the guide."
                : lang === "ko"
                  ? "무료입니다. Google 또는 Microsoft 계정으로 로그인하고 성명과 전화번호를 남기시면, 로펌이 이해충돌 확인 후 연락드립니다."
                  : "It's free. Sign in with Google or Microsoft and leave your name and phone number; the firm runs a conflict check and follows up."}
          </p>
          {cfg.access !== "REJECTED" && cfg.access !== "NOT_CLIENT" && (
            <a className="btn btn-primary" href={cfg.signupUrl}>{lang === "ko" ? "가입하기" : "Sign up"}</a>
          )}
        </div>
      ) : !acked ? (
        <div className="guide-ack">
          <h3>{t.ackTitle}</h3>
          <ul>
            {t.ack.map((line) => <li key={line}>{line}</li>)}
          </ul>
          <button className="btn btn-primary" onClick={() => setAcked(true)}>{t.ackButton}</button>
        </div>
      ) : (
        <>
          <div className="guide-thread" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`guide-turn guide-turn-${m.role}`}>
                <div className={`guide-msg guide-msg-${m.role}`}>
                  {m.text}
                  {m.citations && m.citations.length > 0 && (
                    <p className="guide-cites">
                      <span>{t.sources}: </span>
                      {m.citations.map((c, k) => (
                        <span key={c}>{k > 0 && " · "}<a href={c} target="_blank" rel="noopener noreferrer">{new URL(c).hostname.replace(/^www\./, "")}</a></span>
                      ))}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="guide-turn guide-turn-guide"><div className="guide-msg guide-msg-guide">{t.thinking}</div></div>}
            {capped && <div className="notice notice-info">{t.capped}</div>}
            <div ref={bottom} />
          </div>
          {err && <div className="notice notice-error">{err}</div>}
          <div className="guide-input">
            <div className="june-row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder}
                maxLength={cfg?.maxChars ?? 600}
                disabled={busy || capped || !cfg}
                enterKeyHint="send"
                autoComplete="off"
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button className="btn btn-primary" disabled={busy || capped || !input.trim() || !cfg} onClick={send}>{t.send}</button>
            </div>
            <p className="guide-hint">{t.hint}</p>
          </div>
        </>
      )}
      <p className="guide-consult">
        <a className="btn btn-quiet" href={cfg?.consultationUrl ?? "#"} target="_blank" rel="noopener noreferrer">{t.consult}</a>
      </p>
    </section>
  );
}
