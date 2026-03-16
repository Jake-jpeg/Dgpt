"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../../components/LanguageProvider";
import { Locale } from "../../lib/ny-dictionary";

// TX languages: Vietnamese replaces Russian, Korean stays, no Haitian Creole
// Vietnamese mapped to 'ht' slot in the Locale type (same pattern as NV Tagalog)
const languages = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
  { code: "ht", label: "Tiếng Việt" },
];

export default function TXHome() {
  const { lang, setLang, t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !t) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20">
                <span className="text-lg">&#9878;&#65039;</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1>
                <p className="text-xs text-zinc-500">{t.hero?.title || "Texas Document Preparation"}</p>
              </div>
            </div>

            {/* Mobile-friendly Language Select */}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Locale)}
              className="ml-auto rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:border-[#c59d5f] focus:outline-none"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1a365d] via-[#1e3a5f] to-[#234876] pt-16 pb-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#c59d5f]/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#c59d5f]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t.hero?.title || "Texas Uncontested Divorce"}
          </h2>
          <p className="mt-2 text-2xl font-semibold text-[#c59d5f] sm:text-3xl">{t.hero?.subtitle || "Made Simple"}</p>
          <p className="mt-6 text-lg text-zinc-300 max-w-2xl mx-auto">
            {t.hero?.description || "AI-powered document preparation for Texas uncontested divorces."}
          </p>

          {/* Language Buttons (Desktop) */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code as Locale)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  lang === l.code
                    ? "bg-[#c59d5f] text-white shadow-lg shadow-[#c59d5f]/30"
                    : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-sm"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/tx/qualify"
              className="group inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-[#c59d5f]/30 transition-all duration-200 hover:bg-[#d4ac6e] hover:shadow-2xl hover:shadow-[#c59d5f]/40 hover:-translate-y-0.5"
            >
              {t.hero?.cta || "Check If You Qualify"}
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          <p className="mt-4 text-sm text-zinc-400">{t.hero?.fee || "One-time fee of $99 · No hidden costs"}</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{t.howItWorks?.title || "How It Works"}</h3>
            <p className="mt-4 text-lg text-zinc-600">{t.howItWorks?.subtitle || "Answer questions, get your forms, file with the court."}</p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {(t.howItWorks?.steps || [
              { title: "Check Eligibility", desc: "Answer a few questions to confirm this service is right for you." },
              { title: "Pay $99", desc: "One-time payment. No hidden fees. No subscriptions." },
              { title: "Get Your Forms", desc: "Receive your complete filing packet ready for filing." },
              { title: "Ask Questions", desc: "Use DivorceGPT to understand any part of the process." },
            ]).map((step: any, index: number) => (
              <div key={index} className="relative">
                {index < 3 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-[#c59d5f] to-transparent" />
                )}
                <div className="relative rounded-2xl bg-zinc-50 p-8 transition-all duration-200 hover:bg-zinc-100 hover:shadow-lg">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-xl font-bold text-white shadow-lg shadow-[#1a365d]/20">
                    {index + 1}
                  </div>
                  <h4 className="mt-6 text-lg font-semibold text-zinc-900">{step.title}</h4>
                  <p className="mt-2 text-sm text-zinc-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility Section */}
      <section className="py-24 bg-gradient-to-b from-[#1a365d] via-[#1e3a5f] to-[#234876]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t.eligibilitySection?.title || "Is This Right For You?"}</h3>
          <p className="mt-4 text-lg text-zinc-300">{t.eligibilitySection?.subtitle || "This service is for Texas uncontested divorces with:"}</p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 text-left max-w-2xl mx-auto">
            {(t.eligibilitySection?.items || []).map((item: string, index: number) => (
              <div key={index} className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 ring-1 ring-white/10">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c59d5f] text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-white">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Link
              href="/tx/qualify"
              className="group inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-[#c59d5f]/30 transition-all duration-200 hover:bg-[#d4ac6e] hover:shadow-2xl hover:-translate-y-0.5"
            >
              {t.eligibilitySection?.cta || "Check Your Eligibility"}
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{t.faq?.title || "Frequently Asked Questions"}</h3>
          </div>

          <div className="mt-12 space-y-4">
            {(t.faq?.items || []).map((faq: any, index: number) => (
              <div key={index} className="rounded-2xl bg-zinc-50 p-6 transition-all duration-200 hover:bg-zinc-100">
                <h4 className="text-lg font-semibold text-zinc-900">{faq.q}</h4>
                <p className="mt-2 text-zinc-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-zinc-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282]">
                <span className="text-sm">&#9878;&#65039;</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-900">DivorceGPT</span>
                <p className="text-xs text-zinc-400">&copy; 2025 DivorceGPT by June Guided Solutions, LLC</p>
              </div>
            </div>
            <p className="text-center text-sm text-zinc-500 max-w-md">
              DivorceGPT is a document preparation service. This is not a law firm and does not provide legal advice.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-zinc-600 transition hover:text-[#1a365d]">Privacy</Link>
              <Link href="/terms" className="text-zinc-600 transition hover:text-[#1a365d]">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
