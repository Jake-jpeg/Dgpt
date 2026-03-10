"use client";

import { useState } from "react";
import Link from "next/link";

type Answers = Record<string, boolean | null>;

const questions = [
  {
    id: "residency",
    question: "Has at least one spouse lived in Nevada for at least 6 weeks?",
    description: "Nevada requires at least one spouse to have been a bona fide resident for 6 weeks before filing (NRS 125.020).",
    invertLogic: false,
  },
  {
    id: "witness",
    question: "Do you have a Nevada resident who can serve as a witness?",
    description: "You need a third-party Nevada resident (not a spouse) who can attest to the filing spouse's NV residency. This is typically a friend, neighbor, or coworker.",
    invertLogic: false,
  },
  {
    id: "children",
    question: "Do you have any minor children (under 18), or is either party currently pregnant?",
    description: "DivorceGPT only handles divorces with no minor children and where neither spouse is currently pregnant.",
    invertLogic: true,
  },
  {
    id: "property",
    question: "Do you have community property or debt that still needs to be divided?",
    description: "If all property and debt have already been divided by agreement, or if there is none, you may still qualify.",
    invertLogic: true,
  },
  {
    id: "support",
    question: "Is either spouse seeking spousal support (alimony)?",
    description: "DivorceGPT only handles cases where neither party requests alimony.",
    invertLogic: true,
  },
  {
    id: "uncontested",
    question: "Do both spouses agree to the divorce and will both cooperate with signing the required documents?",
    description: "Both spouses must agree and be willing to sign the Joint Petition and Decree before a notary.",
    invertLogic: false,
  },
  {
    id: "military",
    question: "Is either spouse currently on active military duty?",
    description: "Active duty military members have additional legal protections (SCRA) that require attorney representation.",
    invertLogic: true,
  },
  {
    id: "domesticViolence",
    question: "Is there any history of domestic violence between the spouses?",
    description: "This includes any protective orders (active or expired), DV complaints, or police involvement for domestic incidents.",
    invertLogic: true,
  },
];

export default function NVQualifyPage() {
  const [accessKey, setAccessKey] = useState("");
  const [keyVerified, setKeyVerified] = useState(false);
  const [keyChecking, setKeyChecking] = useState(false);
  const [keyError, setKeyError] = useState(false);

  const [answers, setAnswers] = useState<Answers>(
    Object.fromEntries(questions.map((q) => [q.id, null]))
  );
  const [submitted, setSubmitted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleKeySubmit = async () => {
    if (!accessKey.trim()) return;
    setKeyChecking(true);
    setKeyError(false);

    try {
      const res = await fetch("/api/verify-access-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: accessKey.trim(), state: "nv" }),
      });
      const data = await res.json();

      if (data.valid) {
        setKeyVerified(true);
      } else {
        setKeyError(true);
      }
    } catch {
      setKeyError(true);
    } finally {
      setKeyChecking(false);
    }
  };

  const handleContinueToForms = async () => {
    setIsRedirecting(true);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: window.location.origin,
          freeKey: accessKey.trim(),
          state: "nv",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setIsRedirecting(false);
        alert("Failed to create session. Please try again.");
      }
    } catch {
      setIsRedirecting(false);
      alert("Something went wrong. Please try again.");
    }
  };

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
            <Link href="/nv" className="flex items-center gap-3 transition hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20">
                <span className="text-lg">&#9878;&#65039;</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1>
                <p className="text-xs text-zinc-500">Nevada Eligibility Check</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Access Key Gate */}
        {!keyVerified ? (
          <div className="text-center py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1a365d]/10 mb-6">
              <svg className="h-8 w-8 text-[#1a365d]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Nevada is in Testing</h2>
            <p className="mt-2 text-zinc-600 max-w-md mx-auto">
              Nevada document preparation is currently in QA testing. Enter your access key to continue.
            </p>

            <div className="mt-8 max-w-sm mx-auto">
              <input
                type="text"
                value={accessKey}
                onChange={(e) => { setAccessKey(e.target.value); setKeyError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleKeySubmit()}
                placeholder="Enter access key"
                className={`w-full rounded-lg border px-4 py-3 text-center text-lg placeholder:text-zinc-400 focus:outline-none focus:ring-2 ${
                  keyError
                    ? "border-red-300 focus:ring-red-500"
                    : "border-zinc-200 focus:border-[#1a365d] focus:ring-[#1a365d]"
                }`}
              />
              {keyError && (
                <p className="mt-2 text-sm text-red-600">Invalid access key. Please try again.</p>
              )}
              <button
                onClick={handleKeySubmit}
                disabled={!accessKey.trim() || keyChecking}
                className={`mt-4 w-full rounded-full py-3 text-lg font-semibold transition-all duration-200 ${
                  accessKey.trim() && !keyChecking
                    ? "bg-[#c59d5f] text-white shadow-xl shadow-[#c59d5f]/30 hover:bg-[#d4ac6e] hover:shadow-2xl hover:-translate-y-0.5"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                }`}
              >
                {keyChecking ? "Verifying..." : "Continue"}
              </button>
            </div>

            <Link
              href="/nv"
              className="mt-8 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Nevada
            </Link>
          </div>
        ) : !submitted ? (
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Check Your Eligibility</h2>
              <p className="mt-2 text-zinc-600">
                Answer each question to see if DivorceGPT can prepare your Nevada divorce documents.
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
              Based on your answers, DivorceGPT can prepare your Nevada divorce documents.
            </p>

            {/* Post-Qualification Disclosure */}
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 text-left">
              <h3 className="font-semibold text-zinc-900 mb-4">What DivorceGPT Does</h3>
              <p className="text-sm text-zinc-600 mb-4">
                DivorceGPT is a document preparation service. It uses the official forms from the Nevada Supreme Court Self-Help Center.
              </p>
              <p className="text-sm text-zinc-600 mb-2">The service:</p>
              <ul className="text-sm text-zinc-600 mb-4 ml-4 space-y-1">
                <li>&bull; Transfers your answers onto the required court forms</li>
                <li>&bull; Displays plain-language labels identifying what each field requests</li>
                <li>&bull; Generates a PDF filing packet for your review before filing</li>
              </ul>
              <p className="text-sm text-zinc-600 mb-4">
                DivorceGPT does not review your answers for legal sufficiency, provide legal advice, or represent you in court.
              </p>
              <h4 className="font-semibold text-zinc-900 mb-2">Free Forms Available</h4>
              <p className="text-sm text-zinc-600">
                Official divorce forms are available free from the Nevada Self-Help Center at selfhelp.nvcourts.gov.
              </p>
            </div>

            <button
              onClick={handleContinueToForms}
              disabled={isRedirecting}
              className="mt-8 group inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-[#c59d5f]/30 transition-all duration-200 hover:bg-[#d4ac6e] hover:shadow-2xl hover:-translate-y-0.5"
            >
              {isRedirecting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating session...
                </span>
              ) : (
                <>
                  Continue to Forms
                  <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        ) : answers.domesticViolence === true ? (
          <div className="text-center py-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900">We Can&apos;t Help With This Case</h2>

            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 text-left">
              <p className="text-sm text-zinc-600">
                DivorceGPT cannot prepare documents for cases involving domestic violence history between the parties. These cases involve legal complexities that fall outside the scope of this document preparation service.
              </p>
              <p className="text-sm text-zinc-600 mt-4">
                We recommend consulting with a family law attorney experienced in domestic violence matters.
              </p>
              <p className="text-sm text-zinc-600 mt-4">
                If you are in immediate danger, contact the National Domestic Violence Hotline at 1-800-799-7233 or call 911.
              </p>
            </div>

            <Link
              href="/nv"
              className="mt-8 inline-flex items-center gap-2 text-[#1a365d] font-medium transition hover:text-[#c59d5f]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Nevada
            </Link>
          </div>
        ) : answers.military === true ? (
          <div className="text-center py-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900">We Can&apos;t Help With This Case</h2>

            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 text-left">
              <p className="text-sm text-zinc-600">
                DivorceGPT cannot prepare documents when either spouse is on active military duty. The Servicemembers Civil Relief Act (SCRA) provides additional legal protections that require attorney representation.
              </p>
              <p className="text-sm text-zinc-600 mt-4">
                We recommend contacting your base&apos;s legal assistance office or a family law attorney experienced in military divorces.
              </p>
            </div>

            <Link
              href="/nv"
              className="mt-8 inline-flex items-center gap-2 text-[#1a365d] font-medium transition hover:text-[#c59d5f]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Nevada
            </Link>
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
              Based on your answers, your situation falls outside what DivorceGPT can handle.
            </p>

            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 text-left">
              <h3 className="font-semibold text-zinc-900 mb-3">Disqualifying factors:</h3>
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
              We recommend consulting with a Nevada family law attorney for assistance with your situation.
            </p>

            <Link
              href="/nv"
              className="mt-6 inline-flex items-center gap-2 text-[#1a365d] font-medium transition hover:text-[#c59d5f]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Nevada
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white py-6 mt-auto">
        <p className="text-center text-xs text-zinc-500">
          DivorceGPT is a document preparation service. This is not legal advice.
        </p>
      </footer>
    </div>
  );
}
