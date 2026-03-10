"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../components/LanguageProvider";
import { Locale } from "../lib/ny-dictionary";

const languages = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
  { code: "ru", label: "Русский" },
  { code: "ht", label: "Kreyòl Ayisyen" },
];

const states = [
  {
    code: "ny",
    name: "New York",
    abbr: "NY",
    live: true,
    href: "/ny",
    tagline: "Uncontested divorce filing — no lawyer needed.",
    price: "$29",
    counties: "All 62 counties",
  },
  {
    code: "nj",
    name: "New Jersey",
    abbr: "NJ",
    live: true,
    href: "/nj",
    tagline: "Uncontested divorce filing for New Jersey.",
    price: "$29",
    counties: "All 21 counties",
  },
  {
    code: "nv",
    name: "Nevada",
    abbr: "NV",
    live: false,
    href: "/nv",
    tagline: "Uncontested divorce filing for Nevada.",
    price: "$29",
    counties: "Clark & Washoe counties",
  },
  {
    code: "ut",
    name: "Utah",
    abbr: "UT",
    live: false,
    href: "#",
    tagline: "Uncontested divorce filing for Utah.",
    price: "$29",
    counties: "All 29 counties",
  },
  {
    code: "wy",
    name: "Wyoming",
    abbr: "WY",
    live: false,
    href: "#",
    tagline: "Uncontested divorce filing for Wyoming.",
    price: "$29",
    counties: "All 23 counties",
  },
  {
    code: "id",
    name: "Idaho",
    abbr: "ID",
    live: false,
    href: "#",
    tagline: "Uncontested divorce filing for Idaho.",
    price: "$29",
    counties: "All 44 counties",
  },
];

// ============================================================
// YOUTUBE VIDEO ID
// After uploading your demo to YouTube, replace this value
// with the video ID from the URL. For example, if your video
// URL is https://www.youtube.com/watch?v=dQw4w9WgXcQ
// then set this to "dQw4w9WgXcQ"
// ============================================================
const YOUTUBE_VIDEO_ID = "nA9bf64rrA8";

export default function Home() {
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
                <span className="text-lg">⚖️</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1>
                <p className="text-xs text-zinc-500">AI-Powered Document Preparation</p>
              </div>
            </div>
            
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as Locale)}
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:border-[#c59d5f] focus:outline-none"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Hero with Video */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1a365d] via-[#1e3a5f] to-[#234876] pt-16 pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#c59d5f]/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#c59d5f]/10 blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Uncontested Divorce
            </h2>
            <p className="mt-2 text-2xl font-semibold text-[#c59d5f] sm:text-3xl">Made Simple</p>
            <p className="mt-6 text-lg text-zinc-300 max-w-2xl mx-auto">
              {t.hero.description}
            </p>
            
            {/* Language Buttons */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
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
          </div>

          {/* YouTube Video Embed */}
          <div className="mx-auto max-w-3xl">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/10 aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1`}
                title="DivorceGPT Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Select Your State */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Select Your State</h3>
            <p className="mt-4 text-lg text-zinc-600">Choose your state to begin preparing your uncontested divorce documents.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {states.map((state) => (
              <Link
                key={state.code}
                href={state.href}
                className={`group relative rounded-2xl p-8 transition-all duration-300 ${
                  state.live
                    ? "bg-gradient-to-b from-[#1a365d] to-[#234876] text-white shadow-xl shadow-[#1a365d]/20 hover:shadow-2xl hover:shadow-[#1a365d]/30 hover:-translate-y-1"
                    : "bg-zinc-50 text-zinc-900 ring-1 ring-zinc-200 hover:ring-zinc-300 hover:shadow-lg"
                }`}
              >
                {/* State badge */}
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold ${
                  state.live
                    ? "bg-[#c59d5f] text-white shadow-lg shadow-[#c59d5f]/30"
                    : "bg-zinc-200 text-zinc-400"
                }`}>
                  {state.abbr}
                </div>

                {/* State name + status */}
                <div className="mt-6">
                  <h4 className={`text-2xl font-bold ${state.live ? "text-white" : "text-zinc-900"}`}>
                    {state.name}
                  </h4>
                  {state.live ? (
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                      Live Now
                    </span>
                  ) : state.code === "nv" ? (
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                      Under Construction
                    </span>
                  ) : (
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-500">
                      Coming Soon
                    </span>
                  )}
                </div>

                {/* Details */}
                <p className={`mt-4 text-sm ${state.live ? "text-zinc-300" : "text-zinc-500"}`}>
                  {state.tagline}
                </p>
                
                <div className={`mt-6 flex items-center justify-between border-t pt-4 ${
                  state.live ? "border-white/10" : "border-zinc-200"
                }`}>
                  <span className={`text-sm ${state.live ? "text-zinc-400" : "text-zinc-400"}`}>
                    {state.counties}
                  </span>
                  {state.live && (
                    <span className="text-lg font-bold text-[#c59d5f]">{state.price}</span>
                  )}
                </div>

                {/* Arrow indicator for live states */}
                {state.live && (
                  <div className="absolute top-8 right-8 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-all duration-200 group-hover:bg-[#c59d5f] group-hover:shadow-lg">
                    <svg className="h-5 w-5 text-white transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                )}
              </Link>
            ))}
          </div>

          <p className="mt-12 text-center text-sm text-zinc-400">
            DivorceGPT is expanding nationwide — all 50 states.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-zinc-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{t.howItWorks.title}</h3>
            <p className="mt-4 text-lg text-zinc-600">{t.howItWorks.subtitle}</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {t.howItWorks.steps.map((step, index) => (
              <div key={index} className="relative">
                {index < t.howItWorks.steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-[#c59d5f] to-transparent" />
                )}
                <div className="relative rounded-2xl bg-white p-8 transition-all duration-200 hover:shadow-lg">
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

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-zinc-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282]">
                <span className="text-sm">⚖️</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-900">DivorceGPT</span>
                <p className="text-xs text-zinc-400">© 2025 DivorceGPT by June Guided Solutions, LLC</p>
              </div>
            </div>
            <p className="text-center text-sm text-zinc-500 max-w-md">
               {t.chat.disclaimer}
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-zinc-600 transition hover:text-[#1a365d]">{t.legal.privacyTitle}</Link>
              <Link href="/terms" className="text-zinc-600 transition hover:text-[#1a365d]">{t.legal.termsTitle}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
