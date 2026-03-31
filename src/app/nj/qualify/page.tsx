"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../../components/LanguageProvider";

type Answers = Record<string, boolean | null>;

export default function NJQualifyPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  
  const [answers, setAnswers] = useState<Answers>({
    residency: null,
    children: null,
    property: null,
    support: null,
    uncontested: null,
    military: null,
    domesticViolence: null,
  });
  
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthorized(true);
  }, []);

  if (!mounted || !t || !authorized) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" />
      </div>
    );
  }

  const questions = [
    {
      id: "residency",
      question: t.qualify.questions.residency.q,
      description: t.qualify.questions.residency.d,
      invertLogic: false,
    },
    {
      id: "children",
      question: t.qualify.questions.children.q,
      description: t.qualify.questions.children.d,
      invertLogic: true,
    },
    {
      id: "property",
      question: t.qualify.questions.property.q,
      description: t.qualify.questions.property.d,
      invertLogic: true,
    },
    {
      id: "support",
      question: t.qualify.questions.support.q,
      description: t.qualify.questions.support.d,
      invertLogic: true,
    },
    {
      id: "uncontested",
      question: t.qualify.questions.uncontested.q,
      description: t.qualify.questions.uncontested.d,
      invertLogic: false,
    },
    {
      id: "military",
      question: t.qualify.questions.military.q,
      description: t.qualify.questions.military.d,
      invertLogic: true,
    },
    {
      id: "domesticViolence",
      question: t.qualify.questions.domesticViolence.q,
      description: t.qualify.questions.domesticViolence.d,
      invertLogic: true,
    },
  ];

  const handleAnswer = (id: string, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const allAnswered = Object.values(answers).every((a) => a !== null);

  const isQualified = questions.every((q) => {
    const answer = answers[q.id];
    if (answer === null) return false;
    return q.invertLogic ? !answer : answer;
  });

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
  };

  const disqualifyingReasons = questions
    .filter((q) => {
      const answer = answers[q.id];
      if (answer === null) return false;
      return q.invertLogic ? answer : !answer;
    })
    .map((q) => q.question);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <Link href="/nj" className="flex items-center gap-3 transition hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20">
                <span className="text-lg">⚖️</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1>
                <p className="text-xs text-zinc-500">New Jersey — Qualification</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {!submitted ? (
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">{t.qualify.title}</h2>
              <p className="mt-2 text-zinc-600">{t.qualify.subtitle}</p>
            </div>

            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={q.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 transition-all duration-200 hover:shadow-md">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-sm font-semibold text-white shadow-md">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900">{q.question}</h3>
                      <p className="mt-1 text-sm text-zinc-500">{q.description}</p>
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => handleAnswer(q.id, true)}
                          className={`rounded-full px-6 py-2 text-sm font-medium transition-all duration-200 ${
                            answers[q.id] === true
                              ? "bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-white shadow-lg shadow-[#1a365d]/20"
                              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                          }`}
                        >
                          {t.qualify.yes}
                        </button>
                        <button
                          onClick={() => handleAnswer(q.id, false)}
                          className={`rounded-full px-6 py-2 text-sm font-medium transition-all duration-200 ${
                            answers[q.id] === false
                              ? "bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-white shadow-lg shadow-[#1a365d]/20"
                              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                          }`}
                        >
                          {t.qualify.no}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className={`mt-8 w-full rounded-full py-4 text-lg font-semibold transition-all duration-200 ${
                allAnswered
                  ? "bg-[#c59d5f] text-white shadow-xl shadow-[#c59d5f]/30 hover:bg-[#d4ac6e] hover:shadow-2xl hover:-translate-y-0.5"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              }`}
            >
              {t.qualify.submit}
            </button>
          </>
        ) : isQualified ? (
          <div className="text-center py-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900">{t.qualify.successTitle}</h2>
            <p className="mt-2 text-zinc-600 max-w-md mx-auto">{t.qualify.successMsg}</p>
            
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 text-left">
              <h3 className="font-semibold text-zinc-900 mb-4">What DivorceGPT Does</h3>
              <p className="text-sm text-zinc-600 mb-4">
                DivorceGPT is a document preparation service. It generates the required forms for an uncontested New Jersey divorce filing.
              </p>
              <p className="text-sm text-zinc-600 mb-2">The service:</p>
              <ul className="text-sm text-zinc-600 mb-4 ml-4 space-y-1">
                <li>• Transfers your answers onto the required NJ court forms</li>
                <li>• Displays plain-language labels identifying what each form field requests</li>
                <li>• Generates a PDF packet for your review before filing</li>
              </ul>
              <p className="text-sm text-zinc-600 mb-4">
                DivorceGPT does not review your answers for legal sufficiency, provide legal advice, or represent you in court.
              </p>
              <h4 className="font-semibold text-zinc-900 mb-2">NJ Court Forms</h4>
              <p className="text-sm text-zinc-600">
                Official divorce forms are available from the New Jersey Courts website (njcourts.gov). DivorceGPT automates filling them in — you can always file them yourself for free.
              </p>
            </div>
            
            <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-100">
              <p className="text-sm text-zinc-500">DIY Divorce Packet</p>
              <p className="text-4xl font-bold text-[#1a365d]">$99</p>
              <p className="mt-1 text-sm text-zinc-500">One-time payment · 12-month access</p>
            </div>
            
            <button
              onClick={() => { window.location.href = "/nj/agree?tier=pro_se"; }}
              className="mt-8 group inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-[#c59d5f]/30 transition-all duration-200 hover:bg-[#d4ac6e] hover:shadow-2xl hover:-translate-y-0.5"
            >
              Continue with DIY ($99)
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        ) : answers.military === true ? (
          <div className="text-center py-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900">{t.qualify.failTitle}</h2>
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 text-left">
              {t.qualify.militaryDisqualification.split('\n\n').map((paragraph: string, i: number) => (
                <p key={i} className={`text-sm text-zinc-600 ${i > 0 ? 'mt-4' : ''}`}>{paragraph}</p>
              ))}
            </div>
            {/* Lawyer Referral CTA */}
            <div className="mt-8 rounded-2xl bg-gradient-to-b from-[#1a365d] to-[#234876] p-6 text-left">
              <h3 className="font-semibold text-white mb-2">Need an Attorney?</h3>
              <p className="text-sm text-zinc-300 mb-4">
                Military divorces involve special protections under the SCRA. We recommend consulting with a family law attorney in your area.
              </p>
              <Link href="https://tcms.njsba.com/personifyebusiness/Resources/CountyBarAssociations.aspx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#c59d5f]/30 hover:bg-[#d4ac6e] transition">
                Find an Attorney
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
            <Link href="/nj" className="mt-8 inline-flex items-center gap-2 text-[#1a365d] font-medium transition hover:text-[#c59d5f]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              {t.qualify.back}
            </Link>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900">{t.qualify.failTitle}</h2>
            <p className="mt-2 text-zinc-600">{t.qualify.failMsg}</p>
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 text-left">
              <h3 className="font-semibold text-zinc-900 mb-3">{t.qualify.reasons}</h3>
              <ul className="space-y-2">
                {disqualifyingReasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                    <span className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    </span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-6 text-sm text-zinc-500">{t.qualify.consult}</p>
            {/* Lawyer Referral CTA */}
            <div className="mt-8 rounded-2xl bg-gradient-to-b from-[#1a365d] to-[#234876] p-6 text-left">
              <h3 className="font-semibold text-white mb-2">Need an Attorney?</h3>
              <p className="text-sm text-zinc-300 mb-4">
                Your situation may require legal representation. We recommend consulting with a family law attorney in your area.
              </p>
              <Link href="https://tcms.njsba.com/personifyebusiness/Resources/CountyBarAssociations.aspx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#c59d5f]/30 hover:bg-[#d4ac6e] transition">
                Find an Attorney
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
            <Link href="/nj" className="mt-6 inline-flex items-center gap-2 text-[#1a365d] font-medium transition hover:text-[#c59d5f]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              {t.qualify.back}
            </Link>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-100 bg-white py-6 mt-auto">
        <p className="text-center text-xs text-zinc-500">{t.chat.disclaimer}</p>
      </footer>
    </div>
  );
}
