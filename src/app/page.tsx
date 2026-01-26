"use client";

import Link from "next/link";
import { useState } from "react";

const languages = [
  { code: "en", label: "English", cta: "Check If You Qualify" },
  { code: "es", label: "Español", cta: "Verifique Si Califica" },
  { code: "zh", label: "中文", cta: "检查您是否符合资格" },
  { code: "ko", label: "한국어", cta: "자격 확인하기" },
  { code: "ru", label: "Русский", cta: "Проверьте, подходите ли вы" },
  { code: "ht", label: "Kreyòl Ayisyen", cta: "Tcheke Si Ou Kalifye" },
];

const howToUse = [
  {
    title: "Reference Your Forms",
    description: "Look at the upper left corner of your form for the ID (UD-1, UD-3, etc.). Tell DivorceGPT which form and paragraph you're asking about.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: "Ask in Your Language",
    description: "Just ask in whatever language you're comfortable with. DivorceGPT responds in English, Spanish, Chinese, Korean, Russian, and Haitian Creole.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
      </svg>
    ),
  },
  {
    title: "Ask About Filing",
    description: "Not sure what to do with your forms? Ask about the filing process, court locations, fees, or what happens next.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
  },
];

const steps = [
  { number: "01", title: "Check Eligibility", description: "Answer a few questions to confirm this service is right for you." },
  { number: "02", title: "Pay $20", description: "One-time payment. No hidden fees. No subscriptions." },
  { number: "03", title: "Get Your Forms", description: "Receive your prepared divorce forms ready for filing." },
  { number: "04", title: "Ask Questions", description: "Use DivorceGPT to understand any part of the process." },
];

const eligibilityItems = [
  "No children of the marriage",
  "No property or debts to divide",
  "No spousal support requests",
  "Both spouses agree to divorce",
  "Spouse will cooperate with paperwork",
  "At least one spouse meets NY residency",
];

const faqs = [
  {
    q: "Is this legal advice?",
    a: "No. DivorceGPT explains what divorce forms ask for and how to file them. It does not provide legal advice or tell you what to do. For legal advice, consult an attorney.",
  },
  {
    q: "What technology powers DivorceGPT?",
    a: "DivorceGPT uses Claude, an AI assistant created by Anthropic, combined with custom legal document guardrails developed specifically for New York divorce filings. Your conversations are not stored or used for AI training.",
  },
  {
    q: "How long does the process take?",
    a: "You can complete your forms in one session. After filing, New York courts typically process uncontested divorces in 2-4 months.",
  },
  {
    q: "What if my spouse won't cooperate?",
    a: "This service is for uncontested divorces where both spouses agree. If your spouse won't cooperate, you may need to pursue a contested divorce with an attorney.",
  },
  {
    q: "Can I get a refund?",
    a: "If you don't qualify after completing the eligibility check, you won't be charged. Once forms are generated, refunds are not available.",
  },
];

export default function Home() {
  const [selectedLang, setSelectedLang] = useState(languages[0]);

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
                <p className="text-xs text-zinc-500">New York Uncontested Divorce</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {["How It Works", "How to Use", "FAQ"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                  className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1a365d] via-[#1e3a5f] to-[#234876] pt-16 pb-32">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#c59d5f]/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#c59d5f]/10 blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            New York Uncontested Divorce
          </h2>
          <p className="mt-2 text-2xl font-semibold text-[#c59d5f] sm:text-3xl">Made Simple</p>
          <p className="mt-6 text-lg text-zinc-300 max-w-2xl mx-auto">
            Get your divorce forms prepared and explained in plain language. 
            No lawyers needed for simple, uncontested cases.
          </p>
          
          {/* Language Selector */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  selectedLang.code === lang.code
                    ? "bg-[#c59d5f] text-white shadow-lg shadow-[#c59d5f]/30"
                    : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-sm"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <div className="mt-10">
            <Link
              href="/qualify"
              className="group inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-[#c59d5f]/30 transition-all duration-200 hover:bg-[#d4ac6e] hover:shadow-2xl hover:shadow-[#c59d5f]/40 hover:-translate-y-0.5"
            >
              {selectedLang.cta}
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
          
          <p className="mt-4 text-sm text-zinc-400">$20 one-time fee • No hidden costs</p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">How It Works</h3>
            <p className="mt-4 text-lg text-zinc-600">Four simple steps to complete your divorce</p>
          </div>
          
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-[#c59d5f] to-transparent" />
                )}
                <div className="relative rounded-2xl bg-zinc-50 p-8 transition-all duration-200 hover:bg-zinc-100 hover:shadow-lg">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-xl font-bold text-white shadow-lg shadow-[#1a365d]/20">
                    {step.number}
                  </div>
                  <h4 className="mt-6 text-lg font-semibold text-zinc-900">{step.title}</h4>
                  <p className="mt-2 text-sm text-zinc-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section id="how-to-use" className="py-24 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">How to Use</h3>
            <p className="mt-4 text-lg text-zinc-600">Quick tips to get the most out of DivorceGPT</p>
          </div>
          
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {howToUse.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-100 transition-all duration-200 hover:shadow-xl hover:ring-[#c59d5f]/20 hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-white shadow-lg shadow-[#1a365d]/20 transition-transform duration-200 group-hover:scale-110">
                  {item.icon}
                </div>
                <h4 className="mt-6 text-lg font-semibold text-zinc-900">{item.title}</h4>
                <p className="mt-2 text-sm text-zinc-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-24 bg-gradient-to-b from-[#1a365d] via-[#1e3a5f] to-[#234876]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Is This Right For You?</h3>
          <p className="mt-4 text-lg text-zinc-300">This service is for New York uncontested divorces with:</p>
          
          <div className="mt-12 grid gap-4 sm:grid-cols-2 text-left max-w-2xl mx-auto">
            {eligibilityItems.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 ring-1 ring-white/10"
              >
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
              href="/qualify"
              className="group inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-[#c59d5f]/30 transition-all duration-200 hover:bg-[#d4ac6e] hover:shadow-2xl hover:-translate-y-0.5"
            >
              Check Your Eligibility
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Frequently Asked Questions</h3>
          </div>
          
          <div className="mt-12 space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl bg-zinc-50 p-6 transition-all duration-200 hover:bg-zinc-100"
              >
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
                <span className="text-sm">⚖️</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-900">DivorceGPT</span>
                <p className="text-xs text-zinc-400">© 2025 DivorceGPT · Powered by Claude</p>
              </div>
            </div>
            <p className="text-center text-sm text-zinc-500 max-w-md">
              This tool explains NY divorce forms and procedures. It is not legal advice and may contain errors. Consult an attorney for your specific situation.
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
