"use client";

/**
 * The beta access gate. Public visitors land here (middleware redirects
 * everything else). Flow: CAPTCHA (Cloudflare Turnstile, if configured) →
 * manually enter an access code → server validates against FREE_ACCESS_KEYS
 * → cookie set → through to the real site, where Google/Microsoft sign-in
 * takes over. The code unlocks the door; it is not a login.
 */
import { useEffect, useRef, useState } from "react";

// Branding is configuration — no hard-coded mailbox (see src/config/branding.ts).
const inquiryEmail = process.env.NEXT_PUBLIC_INQUIRY_EMAIL?.trim() || "";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (id?: string) => void;
    };
  }
}

interface GateConfig {
  gate: boolean;
  captcha: boolean;
  siteKey: string | null;
}

export default function BetaGate() {
  const [config, setConfig] = useState<GateConfig | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const rendered = useRef(false);

  useEffect(() => {
    fetch("/api/beta/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setErr("Could not load this page — please refresh."));
  }, []);

  useEffect(() => {
    if (!config?.captcha || !config.siteKey) return;
    const siteKey = config.siteKey;

    const renderWidget = () => {
      if (rendered.current || !widgetRef.current || !window.turnstile) return;
      rendered.current = true;
      window.turnstile.render(widgetRef.current, {
        sitekey: siteKey,
        callback: (token) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(null),
        "error-callback": () => setCaptchaToken(null),
      });
    };

    if (window.turnstile) {
      renderWidget();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = renderWidget;
    document.head.appendChild(script);
  }, [config]);

  async function unlock() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/beta/unlock", {
        method: "POST",
        headers: { "content-type": "application/json", "x-dgpt-csrf": "1" },
        body: JSON.stringify({
          code,
          ...(captchaToken ? { captchaToken } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not verify the code");
      window.location.href = "/";
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  const captchaPending = Boolean(config?.captcha) && !captchaToken;

  return (
    <main className="gate-shell">
      <div className="gate-card">
        <h1 className="gate-wordmark">
          DivorceGPT<span className="gate-wordmark-tld">.com</span>
        </h1>
        {/* Sentence case in the DOM; CSS uppercases it so screen readers
            do not spell the kicker out letter by letter. */}
        <p className="gate-kicker">Private beta — invitation only</p>

        <hr className="gate-rule" />

        <p className="gate-copy">
          This site is in closed testing. If you were given an access code,
          enter it below to continue.
        </p>

        {config?.captcha && (
          <div className="gate-captcha">
            <div ref={widgetRef} />
            {captchaPending && (
              <p className="gate-captcha-note">
                Complete the verification above to continue.
              </p>
            )}
          </div>
        )}

        <label className="gate-label">
          Access code
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !captchaPending && code.trim() && unlock()}
            maxLength={200}
            autoComplete="off"
            className="gate-input"
            placeholder="Enter your access code"
          />
        </label>

        {err && <p className="gate-error">{err}</p>}

        <button
          onClick={unlock}
          disabled={busy || !code.trim() || captchaPending}
          className="gate-button"
        >
          {busy ? "Checking…" : "Enter beta"}
        </button>

        <p className="gate-foot">
          No access code? The site isn&apos;t open yet.
          {inquiryEmail ? (
            <>
              {" "}For inquiries:{" "}
              <a href={`mailto:${inquiryEmail}`}>
                {inquiryEmail}
              </a>
            </>
          ) : (
            " Please contact the firm directly with any inquiries."
          )}
        </p>
      </div>
    </main>
  );
}
