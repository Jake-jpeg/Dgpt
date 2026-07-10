"use client";

import { useEffect, useState } from "react";

interface Me {
  user: { role: "CLIENT" | "ATTORNEY"; email: string; name: string } | null;
  devStub: boolean;
  providers: { google: boolean; entra: boolean };
}

export default function Landing() {
  const [me, setMe] = useState<Me | null>(null);
  const [devRole, setDevRole] = useState<"CLIENT" | "ATTORNEY">("CLIENT");
  const [devEmail, setDevEmail] = useState("client@example.test");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then(setMe).catch(() => setMe(null));
  }, []);

  async function devLogin() {
    setErr(null);
    const res = await fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "content-type": "application/json", "x-dgpt-csrf": "1" },
      body: JSON.stringify({ role: devRole, email: devEmail, name: "Dev User" }),
    });
    if (!res.ok) {
      setErr((await res.json()).error ?? "Dev login failed");
      return;
    }
    window.location.href = devRole === "ATTORNEY" ? "/attorney" : "/intake";
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold">DivorceGPT — Client Intake</h1>
      <p className="mt-3 text-slate-600">
        A structured intake for uncontested New Jersey divorces, reviewed by the
        attorney. This is not a chatbot and not legal advice — no engagement
        exists until the attorney confirms it with you directly.
      </p>

      {me?.user ? (
        <div className="mt-8 rounded-xl border bg-white p-6">
          <p>
            Signed in as <strong>{me.user.name || me.user.email}</strong> ({me.user.role.toLowerCase()})
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href={me.user.role === "ATTORNEY" ? "/attorney" : "/intake"}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              {me.user.role === "ATTORNEY" ? "Go to attorney dashboard" : "Continue to intake"}
            </a>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", {
                  method: "POST",
                  headers: { "x-dgpt-csrf": "1" },
                });
                window.location.reload();
              }}
              className="rounded-lg border px-4 py-2 hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-6">
            <h2 className="font-semibold">I&apos;m a client</h2>
            <p className="mt-1 text-sm text-slate-600">Sign in with Google to begin your intake.</p>
            {/* API redirect endpoint — must be a plain anchor, not a prefetched <Link> */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/auth/login/google"
              className={`mt-4 inline-block rounded-lg px-4 py-2 text-white ${me?.providers.google ? "bg-blue-600 hover:bg-blue-700" : "pointer-events-none bg-slate-300"}`}
            >
              Sign in with Google
            </a>
            {!me?.providers.google && (
              <p className="mt-2 text-xs text-amber-600">Google sign-in not configured yet.</p>
            )}
          </div>
          <div className="rounded-xl border bg-white p-6">
            <h2 className="font-semibold">Attorney / staff</h2>
            <p className="mt-1 text-sm text-slate-600">Sign in with your Microsoft work account.</p>
            {/* API redirect endpoint — must be a plain anchor, not a prefetched <Link> */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/auth/login/entra"
              className={`mt-4 inline-block rounded-lg px-4 py-2 text-white ${me?.providers.entra ? "bg-slate-800 hover:bg-slate-900" : "pointer-events-none bg-slate-300"}`}
            >
              Sign in with Microsoft
            </a>
            {!me?.providers.entra && (
              <p className="mt-2 text-xs text-amber-600">Microsoft sign-in not configured yet.</p>
            )}
          </div>
        </div>
      )}

      {me?.devStub && !me.user && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-6">
          <h2 className="font-semibold text-amber-800">Dev auth stub (non-production only)</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={devRole}
              onChange={(e) => setDevRole(e.target.value as "CLIENT" | "ATTORNEY")}
              className="rounded border px-2 py-1"
            >
              <option value="CLIENT">CLIENT</option>
              <option value="ATTORNEY">ATTORNEY</option>
            </select>
            <input
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              className="rounded border px-2 py-1"
              placeholder="email"
            />
            <button
              onClick={devLogin}
              className="rounded bg-amber-600 px-3 py-1 text-white hover:bg-amber-700"
            >
              Dev sign-in
            </button>
          </div>
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          <p className="mt-2 text-xs text-amber-700">
            Attorney dev sign-ins must still be on the ATTORNEY_EMAILS allowlist.
          </p>
        </div>
      )}

      <p className="mt-10 text-xs text-slate-400">
        DivorceGPT by June Guided Solutions, LLC · Stage 1 (gated intake) · No
        payments are handled in this application.
      </p>
    </main>
  );
}
