"use client";
import Link from "next/link";
import type { PricingTier } from "../lib/states/index";

interface TierSelectProps { stateCode: string; stateName: string; tiers: PricingTier[]; }

export default function TierSelect({ stateCode, stateName, tiers }: TierSelectProps) {
  const diy = tiers.find(t => t.id === "pro_se");
  const consult = tiers.find(t => t.id === "lawyer_review");
  const full = tiers.find(t => t.id === "consultation");

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={`/${stateCode}`} className="flex items-center gap-3 transition hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20"><span className="text-lg">⚖️</span></div>
              <div><h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1><p className="text-xs text-zinc-500">{stateName}</p></div>
            </Link>
            <a href="https://jakekimlaw.com" className="text-sm text-zinc-500 hover:text-[#1a365d] transition">Jake Kim Law Firm</a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">How Do You Want to Handle Your Divorce?</h2>
          <p className="mt-4 text-lg text-zinc-600">Simple case? $99 DIY. Need a lawyer? We are the lawyer.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 items-start">
          {/* DIY */}
          {diy && <div className="rounded-2xl bg-white p-8 ring-1 ring-zinc-200 hover:shadow-lg transition flex flex-col">
            <h3 className="text-xl font-bold text-zinc-900">{diy.label}</h3>
            <div className="mt-3"><span className="text-4xl font-bold text-[#1a365d]">{diy.priceDisplay}</span></div>
            <p className="mt-3 text-sm text-zinc-500">{diy.description}</p>
            <ul className="mt-6 space-y-3 flex-1">{diy.features.map((f,i) => <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-600"><svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#c59d5f]" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{f}</li>)}</ul>
            <div className="mt-6 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200"><p className="text-xs text-amber-800"><strong>Eligibility required.</strong> Uncontested, no children, no complex property.</p></div>
            <div className="mt-6"><Link href={`/${stateCode}/qualify`} className="block w-full rounded-full py-3 text-center text-sm font-semibold bg-[#1a365d] text-white hover:bg-[#2c5282] transition">Check Eligibility & Start →</Link></div>
          </div>}
          {/* Attorney $499 — FEATURED */}
          {consult && <div className="relative rounded-2xl bg-gradient-to-b from-[#1a365d] to-[#234876] p-8 text-white shadow-xl shadow-[#1a365d]/20 ring-2 ring-[#c59d5f] md:-translate-y-4 flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="inline-flex items-center rounded-full bg-[#c59d5f] px-4 py-1 text-xs font-bold text-white shadow-lg shadow-[#c59d5f]/30">Most Popular</span></div>
            <h3 className="text-xl font-bold text-white">{consult.label}</h3>
            <div className="mt-3"><span className="text-4xl font-bold text-[#c59d5f]">{consult.priceDisplay}</span></div>
            <p className="mt-3 text-sm text-zinc-300">{consult.description}</p>
            <ul className="mt-6 space-y-3 flex-1">{consult.features.map((f,i) => <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-200"><svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#c59d5f]" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{f}</li>)}</ul>
            <div className="mt-6 rounded-lg bg-white/10 p-3 ring-1 ring-white/20"><p className="text-xs text-zinc-300"><strong>No qualification needed.</strong> Any case type. NY & NJ only.</p></div>
            <div className="mt-6"><a href="https://jakekimlaw.com/contact" className="block w-full rounded-full py-3 text-center text-sm font-semibold bg-[#c59d5f] text-white shadow-lg shadow-[#c59d5f]/30 hover:bg-[#d4ac6e] transition">Book Consultation →</a></div>
          </div>}
          {/* Full Rep — Contact Us */}
          {full && <div className="rounded-2xl bg-white p-8 ring-1 ring-zinc-200 hover:shadow-lg transition flex flex-col">
            <h3 className="text-xl font-bold text-zinc-900">{full.label}</h3>
            <div className="mt-3"><span className="text-4xl font-bold text-[#1a365d]">{full.priceDisplay}</span></div>
            <p className="mt-3 text-sm text-zinc-500">{full.description}</p>
            <ul className="mt-6 space-y-3 flex-1">{full.features.map((f,i) => <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-600"><svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#c59d5f]" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{f}</li>)}</ul>
            <div className="mt-6"><a href="https://jakekimlaw.com/contact" className="block w-full rounded-full py-3 text-center text-sm font-semibold bg-[#1a365d] text-white hover:bg-[#2c5282] transition">Free Consultation →</Link></div>
          </div>}
        </div>
        <div className="mt-10 text-center"><p className="text-sm text-zinc-400">Attorney services offered in New York and New Jersey only. Document preparation by June Guided Solutions, LLC. Attorney services by <a href="https://jakekimlaw.com" className="underline hover:text-[#1a365d]">Jake Kim Law Firm, LLC</a>.</p></div>
      </main>
    </div>
  );
}
