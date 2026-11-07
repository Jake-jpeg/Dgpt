"use client";

/**
 * /signup (2026-11-07) — public. Strict disclaimers, each acknowledged, then
 * Google or Microsoft. The OAuth callback returns the reader to
 * /signup/details for name and phone. Attorney advertising by the firm.
 */
import { useState } from "react";
import Link from "next/link";
import { Shell, useMe } from "@/components/shell";
import { useLang, LangToggle } from "@/lib/ui/lang";
import { SIGNUP_COPY, SIGNUP_RETURN_COOKIE } from "@/config/signup-copy";
import { operatingFirmName } from "@/config/branding";

export default function SignupPage() {
  const { me } = useMe();
  const [lang, setLang] = useLang();
  const t = SIGNUP_COPY[lang];
  const firm = operatingFirmName();
  const items = t.disclaimers(firm);
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  const all = checked.every(Boolean);

  function go(provider: "google" | "msa") {
    document.cookie = `${SIGNUP_RETURN_COOKIE}=1; Path=/; SameSite=Lax; Max-Age=900`;
    window.location.href = `/api/auth/login/${provider}`;
  }

  const hero = (
    <div className="blog-hero">
      <div className="door-topline">
        <p className="eyebrow">{lang === "ko" ? `${firm} · 변호사 광고` : `${firm} · Attorney Advertising`}</p>
        <LangToggle lang={lang} onChange={setLang} />
      </div>
      <h1 className="door-h1">{t.title}</h1>
      <p className="door-copy">{t.lede(firm)}</p>
    </div>
  );

  return (
    <Shell hero={hero}>
      <div className="blog-article">
        {me?.user?.role === "CLIENT" ? (
          <div className="panel">
            <p className="panel-sub">{lang === "ko" ? "이미 로그인되어 있습니다." : "You're already signed in."}</p>
            <Link className="btn btn-primary" href="/signup/details">{lang === "ko" ? "가입 완료하기 / 상태 보기" : "Finish sign-up / see status"}</Link>
          </div>
        ) : (
          <div className="panel signup-panel">
            <h2>{t.disclaimersTitle}</h2>
            <ul className="signup-ack">
              {items.map((line, i) => (
                <li key={i}>
                  <label>
                    <input type="checkbox" checked={checked[i]} onChange={(e) => setChecked((c) => c.map((v, k) => (k === i ? e.target.checked : v)))} />
                    <span>{line}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="door-providers">
              {me?.providers.google && (
                <button className="door-provider" disabled={!all} onClick={() => go("google")}>{t.continueGoogle}</button>
              )}
              {me?.providers.msa && (
                <button className="door-provider" disabled={!all} onClick={() => go("msa")}>{t.continueMsa}</button>
              )}
            </div>
            {!all && <p className="guide-hint">{lang === "ko" ? "모든 항목을 확인하시면 계속할 수 있습니다." : "Acknowledge each item to continue."}</p>}
          </div>
        )}
      </div>
    </Shell>
  );
}
