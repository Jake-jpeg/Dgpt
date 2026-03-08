"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NJGate() {
  const [key, setKey] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!key.trim()) return;
    setChecking(true);
    setError(false);

    try {
      const res = await fetch("/api/verify-access-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim(), state: "nj" }),
      });
      const data = await res.json();
      if (data.valid) {
        // Store key in sessionStorage so qualify/agree/forms can check
        sessionStorage.setItem("dgpt_nj_access", key.trim());
        router.push("/nj/qualify");
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="max-w-sm w-full text-center px-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] mb-6 shadow-lg shadow-[#1a365d]/20">
          <span className="text-2xl font-bold text-white">NJ</span>
        </div>
        <h1 className="text-3xl font-bold text-zinc-900">New Jersey</h1>
        <p className="mt-2 text-sm text-zinc-500">Beta Access — Restricted</p>

        <div className="mt-8 space-y-3">
          <input
            type="text"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Enter access key"
            className={`w-full rounded-xl border px-4 py-3 text-center text-zinc-900 focus:outline-none focus:ring-2 ${
              error
                ? "border-red-300 focus:ring-red-400 bg-red-50"
                : "border-zinc-200 focus:ring-[#c59d5f] bg-white"
            }`}
          />
          {error && (
            <p className="text-sm text-red-500">Invalid access key.</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={checking || !key.trim()}
            className="w-full rounded-xl bg-gradient-to-br from-[#1a365d] to-[#2c5282] py-3 text-sm font-semibold text-white shadow-lg shadow-[#1a365d]/20 hover:shadow-xl disabled:opacity-50 transition-all"
          >
            {checking ? "Verifying..." : "Enter"}
          </button>
        </div>

        <div className="mt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[#1a365d] font-medium text-sm transition hover:text-[#c59d5f]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to State Selection
          </Link>
        </div>
      </div>
    </div>
  );
}
