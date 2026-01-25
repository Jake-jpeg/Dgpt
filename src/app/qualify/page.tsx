"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    invertLogic: true, // "No" is the qualifying answer
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
  const router = useRouter();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a365d] text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-10 h-10 bg-[#c59d5f] rounded-lg flex items-center justify-center text-xl">⚖️</div>
            <div>
              <h1 className="text-xl font-semibold">DivorceGPT</h1>
              <p className="text-xs opacity-80">Eligibility Check</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {!submitted ? (
          <>
            <h2 className="text-2xl font-bold text-[#1a365d] mb-2">Check Your Eligibility</h2>
            <p className="text-gray-600 mb-8">
              Answer these questions to confirm this service is right for your situation.
            </p>

            <div className="space-y-6">
              {questions.map((q, index) => (
                <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-[#1a365d] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1a365d] mb-1">{q.question}</h3>
                      <p className="text-sm text-gray-500 mb-4">{q.description}</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAnswer(q.id, true)}
                          className={`px-6 py-2 rounded-lg font-medium transition ${
                            answers[q.id] === true
                              ? "bg-[#1a365d] text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => handleAnswer(q.id, false)}
                          className={`px-6 py-2 rounded-lg font-medium transition ${
                            answers[q.id] === false
                              ? "bg-[#1a365d] text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
              className={`w-full mt-8 py-4 rounded-xl font-semibold text-lg transition ${
                allAnswered
                  ? "bg-[#c59d5f] hover:bg-[#b08a4f] text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Check Eligibility
            </button>
          </>
        ) : isQualified ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
              ✓
            </div>
            <h2 className="text-3xl font-bold text-[#1a365d] mb-4">You Qualify!</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Based on your answers, you're eligible for our New York uncontested divorce service.
            </p>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
              <p className="text-2xl font-bold text-[#1a365d] mb-2">$20</p>
              <p className="text-gray-500 text-sm">One-time payment • No hidden fees</p>
            </div>
            <button
              onClick={() => {
                // TODO: Integrate Stripe
                alert("Stripe integration coming soon!");
              }}
              className="bg-[#c59d5f] hover:bg-[#b08a4f] text-white font-semibold text-lg px-8 py-4 rounded-xl transition"
            >
              Continue to Payment →
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
              ✕
            </div>
            <h2 className="text-3xl font-bold text-[#1a365d] mb-4">Not Eligible</h2>
            <p className="text-gray-600 mb-6">
              Based on your answers, this service may not be right for your situation.
            </p>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-left mb-8">
              <h3 className="font-semibold text-[#1a365d] mb-3">Reasons:</h3>
              <ul className="space-y-2">
                {disqualifyingReasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-red-500 mt-0.5">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              You may need to consult with a family law attorney for your specific situation.
            </p>
            <Link
              href="/"
              className="text-[#1a365d] hover:text-[#c59d5f] font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6 mt-auto">
        <p className="text-center text-xs text-gray-400">
          This tool explains NY divorce forms and procedures. It is not legal advice and may contain errors. Consult an attorney for your specific situation.
        </p>
      </footer>
    </div>
  );
}
