"use client";

import { useState } from "react";
import Link from "next/link";

const questions = [
  {
    id: "residency",
    question: "Does at least one spouse meet New York's residency requirement?",
    description: "Either spouse lived in NY for 2+ years, OR 1+ year with a connection (married in NY, lived in NY as spouses, or grounds arose in NY).",
  },
  {
    id: "children",
    question: "Are there any unemancipated children of the marriage?",
    description: "This includes any children under 21 who are not self-supporting, and any current pregnancy.",
    invertLogic: true,
  },
  {
    id: "property",
    question: "Is there any property, debts, pensions, or retirement accounts to divide?",
    description: "This includes real estate, vehicles, bank accounts, credit card debt, 401(k)s, pensions, etc.",
    invertLogic: true,
  },
  {
    id: "support",
    question: "Is either spouse asking for spousal maintenance (alimony)?",
    description: "Either now or in the future.",
    invertLogic: true,
  },
  {
    id: "uncontested",
    question: "Is the divorce uncontested and do both spouses agree to end the marriage?",
    description: "Both parties want the divorce and agree on all terms.",
  },
  {
    id: "cooperation",
    question: "Will the other spouse cooperate with signing or service of papers?",
    description: "Your spouse will either sign an acknowledgment or accept service of divorce papers.",
  },
];

type Answers = Record<string, boolean | null>;

export default function QualifyPage() {
  const [answers, setAnswers] = useState<Answers>(
    Object.fromEntries(questions.map((q) => [q.id, null]))
  );
  const [submitted, setSubmitted] = useState(false);

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
                <p className="text-xs text-zinc-500">Eligibility Check</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {!submitted ? (
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Check Your Eligibility</h2>
              <p className="mt-2 text-zinc-600">
                Answer these questions to confirm this service is right for your situation.
              </p>
            </div>

            <div className="space-y-4">
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 transition-all duration-200 hover:shadow-md"
                >
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
                          Yes
                        </button>
                        <button
                          onClick={() => handleAnswer(q.id, false)}
                          className={`rounded-full px-6 py-2 text-sm font-medium transition-all duration-200 ${
                            answers[q.id] === false
                              ? "bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-white shadow-lg shadow-[#1a365d]/20"
                              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                          }`}
                        >
                          No
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
              Check Eligibility
            </button>
          </>
        ) : isQualified ? (
          <div className="text-center py-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900">You Qualify!</h2>
            <p className="mt-2 text-zinc-600 max-w-md mx-auto">
              Based on your answers, you're eligible for our New York uncontested divorce service.
            </p>
            
            <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-100">
              <p className="text-4xl font-bold text-[#1a365d]">$20</p>
              <p className="mt-1 text-sm text-zinc-500">One-time payment • No hidden fees</p>
            </div>
            
            <button
              onClick={() => alert("Stripe integration coming soon!")}
              className="mt-8 group inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-[#c59d5f]/30 transition-all duration-200 hover:bg-[#d4ac6e] hover:shadow-2xl hover:-translate-y-0.5"
            >
              Continue to Payment
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900">Not Eligible</h2>
            <p className="mt-2 text-zinc-600">
              Based on your answers, this service may not be right for your situation.
            </p>
            
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 text-left">
              <h3 className="font-semibold text-zinc-900 mb-3">Reasons:</h3>
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
            
            <p className="mt-6 text-sm text-zinc-500">
              You may need to consult with a family law attorney for your specific situation.
            </p>
            
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 text-[#1a365d] font-medium transition hover:text-[#c59d5f]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white py-6 mt-auto">
        <p className="text-center text-xs text-zinc-500">
          This tool explains NY divorce forms and procedures. It is not legal advice and may contain errors. Consult an attorney for your specific situation.
        </p>
      </footer>
    </div>
  );
}
