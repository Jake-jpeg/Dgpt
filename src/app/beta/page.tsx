"use client";

/**
 * The beta access gate. Public visitors land here (middleware redirects
 * everything else). Flow: CAPTCHA (Cloudflare Turnstile, if configured) →
 * manually enter an access code → server validates against FREE_ACCESS_KEYS
 * → cookie set → through to the real site, where Google/Microsoft sign-in
 * takes over. The code unlocks the door; it is not a login.
 */
import { useEffect, useRef, useState } from "react";

const inquiryEmail =
  process.env.NEXT_PUBLIC_INQUIRY_EMAIL?.trim() ||
  "admin@juneguidedsolutions.com";

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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">DivorceGPT</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Private beta</p>
        <p className="mt-4 text-sm text-slate-600">
          This site is in closed testing. If you were given an access code,
          enter it below to continue.
        </p>

        {config?.captcha && (
          <div className="mt-5">
            <div ref={widgetRef} />
            {captchaPending && (
              <p className="mt-1 text-xs text-slate-400">
                Complete the verification above to continue.
              </p>
            )}
          </div>
        )}

        <label className="mt-5 block text-sm font-medium">
          Access code
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !captchaPending && code.trim() && unlock()}
            maxLength={200}
            autoComplete="off"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="Enter your access code"
          />
        </label>

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <button
          onClick={unlock}
          disabled={busy || !code.trim() || captchaPending}
          className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Checking…" : "Enter beta"}
        </button>

        <p className="mt-6 border-t pt-4 text-xs text-slate-400">
          No access code? The site isn&apos;t open yet. For inquiries:{" "}
          <a href={`mailto:${inquiryEmail}`} className="underline">
            {inquiryEmail}
          </a>
        </p>
      </div>
    </main>
  );
}
