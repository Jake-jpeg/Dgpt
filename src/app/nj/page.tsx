"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function NJHome() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
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
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20">
                <span className="text-lg">⚖️</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1>
                <p className="text-xs text-zinc-500">New Jersey Uncontested Divorce</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1a365d] via-[#1e3a5f] to-[#234876] pt-16 pb-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#c59d5f]/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#c59d5f]/10 blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            New Jersey Uncontested Divorce
          </h2>
          <p className="mt-2 text-2xl font-semibold text-[#c59d5f] sm:text-3xl">Made Simple</p>
          <p className="mt-6 text-lg text-zinc-300 max-w-2xl mx-auto">
            Automate your uncontested divorce forms with an AI clerk. An attorney-designed tool for simple cases that do not require legal advice.
          </p>

          <div className="mt-10">
            <Link
              href="/nj/qualify"
              className="group inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-[#c59d5f]/30 transition-all duration-200 hover:bg-[#d4ac6e] hover:shadow-2xl hover:shadow-[#c59d5f]/40 hover:-translate-y-0.5"
            >
              Check If You Qualify
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
          
          <p className="mt-4 text-sm text-zinc-400">$99 one-time fee · No hidden costs</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">How It Works</h3>
            <p className="mt-4 text-lg text-zinc-600">Four simple steps to complete your divorce</p>
          </div>
          
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Check Eligibility", desc: "Answer a few questions to confirm this service is right for you." },
              { title: "Pay $99", desc: "One-time payment. No hidden fees. No subscriptions." },
              { title: "Get Your Forms", desc: "Receive your prepared divorce forms ready for filing." },
              { title: "Ask Questions", desc: "Use DivorceGPT to understand any part of the process." },
            ].map((step, index) => (
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

      {/* How to Use */}
      <section className="py-24 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">How to Use</h3>
            <p className="mt-4 text-lg text-zinc-600">Quick tips to get the most out of DivorceGPT</p>
          </div>
          
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "📝", title: "Create Your Forms", desc: "Answer the questions. DivorceGPT prepares your documents step by step." },
              { icon: "💡", title: "Reference Your Forms", desc: "Tell DivorceGPT which form you're asking about by name (e.g., Complaint, Certification)." },
              { icon: "💡", title: "Ask About Filing", desc: "Not sure what to do with your forms? Ask about the filing process, court locations, fees, or what happens next." },
            ].map((card, index) => (
              <div key={index} className="group rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-100 transition-all duration-200 hover:shadow-xl hover:ring-[#c59d5f]/20 hover:-translate-y-1">
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-white shadow-lg shadow-[#1a365d]/20 transition-transform duration-200 group-hover:scale-110">
                   <span className="text-xl">{card.icon}</span>
                 </div>
                 <h4 className="mt-6 text-lg font-semibold text-zinc-900">{card.title}</h4>
                 <p className="mt-2 text-sm text-zinc-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-24 bg-gradient-to-b from-[#1a365d] via-[#1e3a5f] to-[#234876]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Is This Right For You?</h3>
          <p className="mt-4 text-lg text-zinc-300">This service is for New Jersey uncontested divorces with:</p>
          
          <div className="mt-12 grid gap-4 sm:grid-cols-2 text-left max-w-2xl mx-auto">
            {[
              "No children of the marriage and neither party is pregnant",
              "No property or debts to divide",
              "No spousal support (alimony) requests",
              "Both spouses agree to divorce",
              "Spouse will cooperate with paperwork",
              "At least one spouse meets NJ residency (12+ months)",
            ].map((item, index) => (
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
              href="/nj/qualify"
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
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Frequently Asked Questions</h3>
          </div>
          
          <div className="mt-12 space-y-4">
            {[
              { q: "Is this legal advice?", a: "No. DivorceGPT explains what divorce forms ask for and how to file them. It does not provide legal advice. For legal advice, consult an attorney." },
              { q: "What technology powers DivorceGPT?", a: "DivorceGPT uses advanced AI technology via a secure commercial API. Under our API provider's terms, your inputs are not used for AI model training and are automatically deleted within days. June Guided Solutions, LLC does not retain any chat history or conversation data." },
              { q: "How long does the process take?", a: "You can complete your forms in minutes, but the overall divorce process takes time. Timeline varies by county. Your session remains valid for 12 months." },
              { q: "How do I access my session?", a: "After payment, you'll be redirected to your session page. Bookmark this page — the URL is your access link. There are no accounts or passwords." },
              { q: "What if my spouse won't cooperate?", a: "This service is for uncontested divorces where both spouses agree. If your spouse won't cooperate, you may need a contested divorce attorney." },
              { q: "Can I get a refund?", a: "If you don't qualify after the eligibility check, you won't be charged. Once forms are generated, refunds are not available." },
            ].map((faq, index) => (
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
                <span className="text-sm">⚖️</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-900">DivorceGPT</span>
                <p className="text-xs text-zinc-400">© 2025 DivorceGPT by June Guided Solutions, LLC</p>
              </div>
            </div>
            <p className="text-center text-sm text-zinc-500 max-w-md">
              DivorceGPT is a document preparation service. This is not legal advice. For legal advice, consult an attorney.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-zinc-600 transition hover:text-[#1a365d]">Privacy Policy</Link>
              <Link href="/terms" className="text-zinc-600 transition hover:text-[#1a365d]">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
