"use client";
import Link from "next/link";

import type { Metadata } from "next";

const guides = [
  {
    state: "OSS",
    title: "DivorceGPT is Open Source — Download the Full Source Code",
    description: "The entire codebase — frontend, PDF server, qualification flow, everything — is free and MIT licensed. Clone it, deploy it, add your state.",
    href: "/open-source",
    tags: ["GitHub", "MIT License", "Free"],
    pinned: true,
  },
  {
    state: "ALL",
    title: "Supported Languages — Multilingual AI Assistance",
    description: "DivorceGPT supports 12 languages. See the full list, accuracy benchmarks from Anthropic, and important disclaimers for non-English speakers.",
    href: "/guides/language-support",
    tags: ["Languages", "Multilingual", "AI Accuracy"],
    pinned: true,
  },
  {
    state: "NY",
    title: "Form UD-4 & UD-4A: Removal of Barriers to Remarriage",
    description: "What these forms are, why they exist under DRL § 253, and what changed in the December 2025 revision.",
    href: "/guides/ny/ud-4",
    tags: ["UD-4", "UD-4A", "DRL § 253"],
  },
  {
    state: "NY",
    title: "How Much Does an Uncontested Divorce Cost in New York?",
    description: "A complete breakdown of court filing fees, service costs, and what you actually pay — updated March 2026.",
    href: "/guides/ny/filing-fees",
    tags: ["Filing Fees", "Index Number", "RJI"],
  },
  {
    state: "NJ",
    title: "Do I Need an Affidavit of Insurance for My NJ Divorce?",
    description: "If you are only seeking dissolution with no financial claims, R. 5:4-2(f) says no. Here is why — and what to file instead.",
    href: "/guides/nj/affidavit-of-insurance",
    tags: ["R. 5:4-2(f)", "Insurance Affidavit", "Uncontested"],
  },
];

export default function GuidesHub() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20"><span className="text-lg">⚖️</span></div>
              <div><h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1><p className="text-xs text-zinc-500">by <span className="underline">June Guided Solutions, LLC</span></p></div>
            </Link>
            <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-[#1a365d] transition">← Home</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f2440] via-[#1a365d] to-[#1e3a5f] py-16 lg:py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#c59d5f]/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">Resource Guides</h1>
          <p className="mt-5 text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            Plain-language guides to divorce forms, filing fees, and court procedures — written by a licensed attorney, for educational purposes only.
          </p>
        </div>
      </section>

      <div className="bg-[#1a365d]/5 border-b border-[#1a365d]/10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-zinc-600 text-center">
            <strong className="text-[#1a365d]">Scope:</strong> These guides cover forms and procedures for <strong>uncontested divorces — no children under 21, no contested assets, no spousal maintenance disputes.</strong> If your case involves children, contested property, or maintenance, consult a licensed attorney.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid gap-6">
          {guides.map((g, i) => (
            <Link key={i} href={g.href} className="group rounded-2xl bg-white p-6 ring-1 ring-zinc-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#1a365d] text-sm font-bold text-white shadow-lg shadow-[#1a365d]/20">{g.state}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-zinc-900 group-hover:text-[#1a365d] transition">{g.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{g.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {g.tags.map((tag, j) => (
                      <span key={j} className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">{tag}</span>
                    ))}
                  </div>
                </div>
                <svg className="h-5 w-5 text-zinc-400 group-hover:text-[#c59d5f] transition flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-xl bg-amber-50 ring-1 ring-amber-200 p-5">
          <p className="text-sm text-amber-800">
            <strong>Disclaimer:</strong> These guides are published by DivorceGPT, a product of June Guided Solutions, LLC, for educational purposes only. They do not constitute legal advice. Laws and court forms change. If you have questions about your specific situation, consult a licensed attorney.
          </p>
        </div>
      </section>

      <footer className="border-t border-zinc-100 bg-zinc-900 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-zinc-500">© 2025 June Guided Solutions, LLC · Educational purposes only · Not legal advice</p>
        </div>
      </footer>
    </div>
  );
}
