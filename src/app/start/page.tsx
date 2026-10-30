"use client";

/**
 * /start — June sets up the case (2026-10-30).
 *
 * June's opening and her eight questions are SCRIPTED (src/lib/june/start.ts
 * owns the copy and the validation); the only model call on this page is
 * "Ask June a question", which goes to /api/start/ask under its own cage.
 * When the eight answers are in, the draft is parked under the starting
 * spouse's email and they sign in; the portal then offers "Create my case".
 *
 * Mobile-first: one column, big tap targets, chips for yes/no, the input
 * pinned to the bottom. This page is for the two spouses, not for lawyers.
 */
import { useEffect, useRef, useState } from "react";
import { Shell, useMe } from "@/components/shell";
import { api } from "@/lib/ui/client-api";
import { formatUsd, quoteFor } from "@/config/pricing";
import { juneOpening } from "@/config/june-copy";

type Msg = { id: string; who: "june" | "you"; text: string };

const OPENING: string[] = juneOpening("Jake Kim Law Firm LLC");

type StepId = "yourName" | "yourEmail" | "spouseName" | "spouseEmail" | "state" | "children" | "assets" | "understood" | "done";

interface Step {
  id: StepId;
  prompt: (d: Draft) => string;
  kind: "text" | "email" | "state" | "yesno" | "confirm";
}

interface Draft {
  yourName: string;
  yourEmail: string;
  spouseName: string;
  spouseEmail: string;
  state: "NY" | "NJ" | "";
  children: boolean | null;
  assets: boolean | null;
}

const STEPS: Step[] = [
  { id: "yourName", kind: "text", prompt: () => "First — what's your full name?" },
  { id: "yourEmail", kind: "email", prompt: (d) => `Thanks, ${first(d.yourName)}. What email address will you sign in with? It needs to be a Google (Gmail) or Microsoft (Outlook/Hotmail) address — that's your login.` },
  { id: "spouseName", kind: "text", prompt: () => "What is your spouse's full name?" },
  { id: "spouseEmail", kind: "email", prompt: (d) => `And ${first(d.spouseName)}'s email address? I'll give you a private link to send them; it only works for that address.` },
  { id: "state", kind: "state", prompt: () => "Which state will the divorce be filed in?" },
  { id: "children", kind: "yesno", prompt: () => "Do you and your spouse have children together under 18 (or still dependent)?" },
  { id: "assets", kind: "yesno", prompt: () => "Are there significant assets or debts to divide — a home, retirement accounts, investments, a business, or loans beyond ordinary credit cards?" },
  { id: "understood", kind: "confirm", prompt: () => "" },
];

function first(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

export default function StartWithJune() {
  const { me } = useMe();
  const [draft, setDraft] = useState<Draft>({ yourName: "", yourEmail: "", spouseName: "", spouseEmail: "", state: "", children: null, assets: null });
  const [stepIndex, setStepIndex] = useState(0);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const step = STEPS[stepIndex];

  // Opening, then the first question — once.
  useEffect(() => {
    const opening = OPENING.map((t, i) => ({ id: `o${i}`, who: "june" as const, text: t }));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMsgs([...opening, { id: "q0", who: "june", text: STEPS[0].prompt(draft) }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length]);

  function say(who: Msg["who"], text: string) {
    setMsgs((m) => [...m, { id: `${who}-${Date.now()}-${m.length}`, who, text }]);
  }

  function advance(next: Draft) {
    setDraft(next);
    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    const s = STEPS[nextIndex];
    if (!s) return;
    if (s.kind === "confirm") {
      const q = quoteFor({ children: Boolean(next.children), assets: Boolean(next.assets) });
      say(
        "june",
        `Here's your number: ${formatUsd(q.total)}, flat. That covers the attorney's review of both questionnaires, the one-hour video meeting with both of you, and preparing and filing the uncontested divorce. The firm bills this directly — nothing is paid on this site.\n\nOne last thing before you sign in: the firm's attorney will meet both of you by video and will check identity there. The firm cannot help with a divorce where one spouse is being pressured or kept in the dark — both of you have to answer the questionnaire yourselves, separately.`
      );
    } else {
      say("june", s.prompt(next));
    }
  }

  function answerText(raw: string) {
    const v = raw.trim();
    if (!v) return;
    setErr(null);
    if (step.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setErr("That doesn't look like an email address — try again.");
      return;
    }
    if (step.id === "spouseEmail" && v.toLowerCase() === draft.yourEmail.toLowerCase()) {
      setErr("Your spouse needs their own email address — the two of you sign in separately.");
      return;
    }
    say("you", v);
    setInput("");
    advance({ ...draft, [step.id]: step.kind === "email" ? v.toLowerCase() : v } as Draft);
  }

  function answerChoice(label: string, patch: Partial<Draft>) {
    say("you", label);
    advance({ ...draft, ...patch });
  }

  async function askJune() {
    const q = input.trim();
    if (!q) return;
    setBusy(true);
    setErr(null);
    say("you", q);
    setInput("");
    try {
      const r = (await api.post("/api/start/ask", { question: q })) as unknown as { answer: string };
      say("june", r.answer);
    } catch (e) {
      say("june", e instanceof Error && e.message ? `I couldn't answer that just now (${e.message}). The attorney can at your meeting.` : "I couldn't answer that just now — the attorney can at your meeting.");
    } finally {
      setBusy(false);
      setAsking(false);
    }
  }

  async function confirmAndSave() {
    setBusy(true);
    setErr(null);
    try {
      await api.post("/api/start/draft", {
        yourName: draft.yourName,
        yourEmail: draft.yourEmail,
        spouseName: draft.spouseName,
        spouseEmail: draft.spouseEmail,
        state: draft.state,
        children: Boolean(draft.children),
        assets: Boolean(draft.assets),
        understood: true,
      });
      setSaved(true);
      say("you", "I understand.");
      say("june", `All set, ${first(draft.yourName)}. Sign in with ${draft.yourEmail} and I'll create your case and give you ${first(draft.spouseName)}'s private link.`);
      setStepIndex(STEPS.length); // done
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save — try again");
    } finally {
      setBusy(false);
    }
  }

  const quote = quoteFor({ children: Boolean(draft.children), assets: Boolean(draft.assets) });
  const done = stepIndex >= STEPS.length;

  return (
    <Shell>
      <div className="june">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Start your case</h1>
        <p className="panel-sub">A service of Jake Kim Law Firm LLC. Attorney-reviewed, prepared and filed.</p>
        <div className="june-thread" aria-live="polite">
          {msgs.map((m) => (
            <div key={m.id}>
              {m.who === "june" && <p className="june-who">June</p>}
              <div className={`june-msg june-msg-${m.who}`}>{m.text}</div>
            </div>
          ))}
          {step?.kind === "confirm" && !done && (
            <div className="june-quote">
              {quote.lines.map((l) => (
                <div className="june-quote-line" key={l.label}>
                  <span>{l.label}</span>
                  <span>{formatUsd(l.amount)}</span>
                </div>
              ))}
              <div className="june-quote-total">
                <span>Flat fee</span>
                <span>{formatUsd(quote.total)}</span>
              </div>
            </div>
          )}
          {done && saved && (
            <div className="june-signin">
              {me?.providers.google && (
                <button className="btn btn-primary" onClick={() => (window.location.href = "/api/auth/login/google")}>
                  Sign in with Google to create my case
                </button>
              )}
              {me?.providers.msa && (
                <button className="btn btn-primary" onClick={() => (window.location.href = "/api/auth/login/msa")}>
                  Sign in with Outlook / Hotmail
                </button>
              )}
              <p className="text-xs text-slate-500">Use {draft.yourEmail} — that is the address your case is waiting under.</p>
            </div>
          )}
          <div ref={bottom} />
        </div>

        {err && <div className="notice notice-error mt-3">{err}</div>}

        {!done && (
          <div className="june-input">
            {asking ? (
              <>
                <div className="june-row">
                  <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask June a question…" maxLength={600} autoFocus onKeyDown={(e) => e.key === "Enter" && askJune()} />
                  <button className="btn btn-primary" disabled={busy || !input.trim()} onClick={askJune}>Ask</button>
                </div>
                <p className="june-ask"><button onClick={() => { setAsking(false); setInput(""); }}>Back to the questions</button></p>
              </>
            ) : step.kind === "text" || step.kind === "email" ? (
              <>
                <div className="june-row">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    type={step.kind === "email" ? "email" : "text"}
                    inputMode={step.kind === "email" ? "email" : "text"}
                    autoCapitalize={step.kind === "email" ? "none" : "words"}
                    placeholder={step.kind === "email" ? "name@example.com" : "Type your answer"}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && answerText(input)}
                  />
                  <button className="btn btn-primary" disabled={!input.trim()} onClick={() => answerText(input)}>Next</button>
                </div>
                <p className="june-ask">Not sure about something? <button onClick={() => { setAsking(true); setInput(""); }}>Ask June a question</button></p>
              </>
            ) : step.kind === "state" ? (
              <div className="june-chips">
                <button className="june-chip" onClick={() => answerChoice("New York", { state: "NY" })}>New York</button>
                <button className="june-chip" onClick={() => answerChoice("New Jersey", { state: "NJ" })}>New Jersey</button>
              </div>
            ) : step.kind === "yesno" ? (
              <div className="june-chips">
                <button className="june-chip" onClick={() => answerChoice("Yes", { [step.id]: true } as Partial<Draft>)}>Yes</button>
                <button className="june-chip" onClick={() => answerChoice("No", { [step.id]: false } as Partial<Draft>)}>No</button>
              </div>
            ) : (
              <div className="june-signin">
                <button className="btn btn-primary" disabled={busy} onClick={confirmAndSave}>I understand — set up my case</button>
                <p className="june-ask"><button onClick={() => { setAsking(true); setInput(""); }}>Ask June a question first</button></p>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
