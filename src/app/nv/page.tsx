"use client";
import Link from "next/link";

export default function NVComingSoon() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="max-w-md text-center px-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-200 mb-6">
          <span className="text-3xl font-bold text-zinc-400">NV</span>
        </div>
        <h1 className="text-3xl font-bold text-zinc-900">Nevada</h1>
        <p className="mt-2 text-xl text-[#c59d5f] font-semibold">Coming Soon</p>
        <p className="mt-4 text-zinc-600">
          DivorceGPT for Nevada uncontested divorces is currently in development.
        </p>
        <div className="mt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[#1a365d] font-medium transition hover:text-[#c59d5f]">
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
