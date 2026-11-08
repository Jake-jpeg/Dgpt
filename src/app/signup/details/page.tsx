"use client";

/** /signup/details (2026-11-07) — public path, needs a signed-in CLIENT: full name and phone, then done. */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell, useMe, ErrorNotice } from "@/components/shell";
import { api } from "@/lib/ui/client-api";
import { useLang, LangToggle } from "@/lib/ui/lang";
import { SIGNUP_COPY, SIGNUP_DISCLAIMER_VERSION } from "@/config/signup-copy";
import { operatingFirmName } from "@/config/branding";

interface State { signedIn: boolean; client?: boolean; name?: string; email?: string; signup: { fullName: string; phoneDisplay: string; status: "NEW" | "CLEARED" | "REJECTED" } | null }

export default function SignupDetailsPage() {
  const { loading } = useMe();
  const [lang, setLang] = useLang();
  const t = SIGNUP_COPY[lang];
  // 2026-11-08: arrived from "Start with June" (?next=start) → after sign-up, continue to June.
  // Read in an effect, not via useSearchParams, so the page prerenders without a Suspense boundary.
  const [toStart, setToStart] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToStart(new URLSearchParams(window.location.search).get("next") === "start");
  }, []);
  const firm = operatingFirmName();
  const [state, setState] = useState<State | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.get("/api/signup").then((s) => {
      const st = s as unknown as State;
      setState(st);
      if (st.signup) setFullName(st.signup.fullName);
      else if (st.name) setFullName(st.name);
    }).catch((e) => setErr(e instanceof Error ? e.message : "Could not load"));
  }, []);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const r = (await api.post("/api/signup", { fullName, phone, acknowledgedVersion: SIGNUP_DISCLAIMER_VERSION })) as unknown as { signup: State["signup"] };
      setState((s) => (s ? { ...s, signup: r.signup } : s));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  const hero = (
    <div className="blog-hero">
      <div className="door-topline">
        <p className="eyebrow">{lang === "ko" ? `${firm} · 변호사 광고` : `${firm} · Attorney Advertising`}</p>
        <LangToggle lang={lang} onChange={setLang} />
      </div>
      <h1 className="door-h1">{state?.signup ? t.doneTitle : t.detailsTitle}</h1>
    </div>
  );

  return (
    <Shell hero={hero}>
      <div className="blog-article">
        <ErrorNotice message={err} />
        {!loading && state && !state.signedIn && (
          <div className="panel"><p className="panel-sub">{lang === "ko" ? "먼저 가입 페이지에서 로그인해 주세요." : "Please sign in from the sign-up page first."}</p><Link className="btn btn-primary" href="/signup">{t.title}</Link></div>
        )}
        {state?.signedIn && state.client === false && (
          <div className="panel"><p className="panel-sub">{lang === "ko" ? "로펌 계정으로 로그인되어 있습니다. 개인 계정을 사용해 주세요." : "You are signed in to a firm account. Use a personal Google or Microsoft account."}</p></div>
        )}
        {state?.client && !state.signup && (
          <div className="panel signup-panel">
            <p className="panel-sub">{state.email}</p>
            <label className="text-sm"><span className="field-label">{t.fullName}</span><input className="text-input" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" /></label>
            <label className="text-sm mt-3 block"><span className="field-label">{t.phone}</span><input className="text-input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="(201) 555-0123" /></label>
            <p className="guide-hint">{t.phoneHint}</p>
            <button className="btn btn-primary mt-4" disabled={busy || fullName.trim().length < 2 || phone.trim().length < 7} onClick={submit}>{busy ? "…" : t.submit}</button>
          </div>
        )}
        {state?.signup && (
          <div className="panel">
            <p><strong>{state.signup.fullName}</strong> · {state.signup.phoneDisplay}</p>
            <p className="panel-sub">{t.status[state.signup.status]}</p>
            <p>{state.signup.status === "REJECTED" ? t.rejected(firm) : t.done(firm)}</p>
            {state.signup.status !== "REJECTED" && (
              <div className="door-actions">
                <Link className="btn btn-primary" href="/start">{t.toJune}</Link>
                {!toStart && <Link className="btn btn-quiet" href="/blog">{t.toArticles}</Link>}
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
