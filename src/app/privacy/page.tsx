"use client";

import Link from "next/link";
import { useLanguage } from "../../components/LanguageProvider";

export default function PrivacyPage() {
  const { t } = useLanguage();
  if (!t) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <Link href="/" className="flex items-center gap-3 transition hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20">
                <span className="text-lg">⚖️</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1>
                <p className="text-xs text-zinc-500">{t.legal.privacyTitle}</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">{t.legal.privacyTitle}</h1>
        <p className="text-sm text-zinc-500 mb-8">{t.legal.lastUpdated}</p>

        {/* Translation Warning Banner */}
        <div className="mb-10 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <span className="text-xl">🌍</span>
            <p className="text-sm text-blue-900 font-medium">
              {t.legal.officialNotice}
            </p>
          </div>
        </div>

        <div className="prose prose-zinc max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Overview</h2>
            <p className="text-zinc-600 mb-4">
              This Privacy Policy explains how we collect, use, and protect your information when you use DivorceGPT.
            </p>
            <p className="text-zinc-600">
              <strong>The short version:</strong> We collect minimal data, don't store your conversations, and never sell your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-zinc-800 mb-2">Payment Information</h3>
            <p className="text-zinc-600 mb-4">
              When you make a payment, your payment details are processed directly by Stripe. We do not store your credit card number.
            </p>

            <h3 className="text-lg font-medium text-zinc-800 mb-2">Conversation Data</h3>
            <p className="text-zinc-600 mb-4">
              Your conversations are processed by Anthropic's Claude AI. <strong>We do not store conversation logs.</strong> Once your session ends, your conversation is not retained on our servers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">What We Don't Do</h2>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>We do <strong>not</strong> sell your personal information</li>
              <li>We do <strong>not</strong> store your conversations</li>
              <li>We do <strong>not</strong> use your data to train AI models</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">{t.legal.sections.contact}</h2>
            <p className="text-zinc-600">
              For questions about this Privacy Policy, contact us at:<br />
              <strong>Email:</strong> admin@divorcegpt.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200">
          <Link href="/" className="text-[#1a365d] hover:text-[#c59d5f] font-medium inline-flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {t.legal.backHome}
          </Link>
        </div>
      </main>
    </div>
  );
}