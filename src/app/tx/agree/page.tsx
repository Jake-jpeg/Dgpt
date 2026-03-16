"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function AgreeContent() {
  const searchParams = useSearchParams();
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [freeKey, setFreeKey] = useState(searchParams.get("key") || "");

  const [confirmNotLawFirm, setConfirmNotLawFirm] = useState(false);
  const [confirmNoDataStored, setConfirmNoDataStored] = useState(false);
  const [confirmTermination, setConfirmTermination] = useState(false);
  const [confirmReadDocs, setConfirmReadDocs] = useState(false);

  const allConfirmed = confirmNotLawFirm && confirmNoDataStored && confirmTermination && confirmReadDocs;
  const canProceed = hasReadTerms && hasReadPrivacy && allConfirmed;

  const handleProceed = async () => {
    if (!canProceed) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: window.location.origin,
          agreedAt: new Date().toISOString(),
          freeKey: freeKey.trim() || undefined,
          state: "tx",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session. Please try again.");
        setIsProcessing(false);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <Link href="/" className="flex items-center gap-3 transition hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20">
                <span className="text-lg">&#9878;&#65039;</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1>
                <p className="text-xs text-zinc-500">Review &amp; Agree</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1a365d]/10 mb-4">
            <svg className="h-8 w-8 text-[#1a365d]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Before You Continue</h2>
          <p className="mt-2 text-zinc-600">
            Review the documents below, then confirm each statement to continue.
          </p>
        </div>

        <div className="space-y-6">
          {/* Terms of Service Card */}
          <div className={`rounded-2xl bg-white p-6 shadow-sm ring-1 transition-all duration-200 ${hasReadTerms ? 'ring-green-300 bg-green-50/30' : 'ring-zinc-200'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-zinc-900">Terms of Service</h3>
                  {hasReadTerms && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      &#10003; Opened
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  Understand what DivorceGPT is (and isn&apos;t), eligibility requirements, and important disclaimers.
                </p>
              </div>
              <a
                href="/terms?review=true"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setHasReadTerms(true)}
                className="flex-shrink-0 rounded-full bg-[#1a365d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2c5282]"
              >
                Read &rarr;
              </a>
            </div>
          </div>

          {/* Privacy Policy Card */}
          <div className={`rounded-2xl bg-white p-6 shadow-sm ring-1 transition-all duration-200 ${hasReadPrivacy ? 'ring-green-300 bg-green-50/30' : 'ring-zinc-200'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-zinc-900">Privacy Policy</h3>
                  {hasReadPrivacy && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      &#10003; Opened
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  Learn how we handle (and don&apos;t store) your data.
                </p>
              </div>
              <a
                href="/privacy?review=true"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setHasReadPrivacy(true)}
                className="flex-shrink-0 rounded-full bg-[#1a365d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2c5282]"
              >
                Read &rarr;
              </a>
            </div>
          </div>

          {/* Confirmation Checkboxes */}
          <div className={`rounded-2xl p-6 ring-1 transition-all duration-200 ${
            allConfirmed ? 'bg-green-50 ring-green-300' : 'bg-white ring-zinc-200'
          }`}>
            <h3 className="font-semibold text-zinc-900 mb-4">Please confirm each statement:</h3>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={confirmNotLawFirm} onChange={(e) => setConfirmNotLawFirm(e.target.checked)}
                  className="mt-1 h-4 w-4 flex-shrink-0 rounded border-zinc-300 text-[#1a365d] focus:ring-[#1a365d]" />
                <span className="text-sm text-zinc-700">
                  I understand and agree that DivorceGPT is <strong>not a law firm</strong>, does not provide legal advice, and that my use of this service <strong>does not create an attorney-client relationship</strong>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={confirmNoDataStored} onChange={(e) => setConfirmNoDataStored(e.target.checked)}
                  className="mt-1 h-4 w-4 flex-shrink-0 rounded border-zinc-300 text-[#1a365d] focus:ring-[#1a365d]" />
                <span className="text-sm text-zinc-700">
                  I understand my data is <strong>not stored</strong> &mdash; I am responsible for saving my documents
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={confirmTermination} onChange={(e) => setConfirmTermination(e.target.checked)}
                  className="mt-1 h-4 w-4 flex-shrink-0 rounded border-zinc-300 text-[#1a365d] focus:ring-[#1a365d]" />
                <span className="text-sm text-zinc-700">
                  I understand threats or fraud will result in <strong>immediate session termination</strong>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={confirmReadDocs} onChange={(e) => setConfirmReadDocs(e.target.checked)}
                  className="mt-1 h-4 w-4 flex-shrink-0 rounded border-zinc-300 text-[#1a365d] focus:ring-[#1a365d]" />
                <span className="text-sm text-zinc-700">
                  I have read the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>
                </span>
              </label>
            </div>
          </div>

          {/* Price and Continue */}
          <div className="text-center pt-4">
            <div className="mb-4">
              <p className="text-4xl font-bold text-[#1a365d]">$99</p>
              <p className="text-sm text-zinc-500">One-time fee &middot; 12-month access &middot; No subscription</p>
              <p className="text-xs text-zinc-400 mt-2">After payment, you&apos;ll be redirected to your session. Bookmark the page &mdash; that URL is how you return.</p>
            </div>

            {/* Free Access Key Input */}
            <div className="mb-4">
              <input
                type="text" value={freeKey} onChange={(e) => setFreeKey(e.target.value)}
                placeholder="Have an access code? Enter it here"
                className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm text-center placeholder:text-zinc-400 focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d]"
              />
            </div>

            <button
              onClick={handleProceed}
              disabled={!canProceed || isProcessing}
              className={`w-full rounded-full py-4 text-lg font-semibold transition-all duration-200 ${
                canProceed && !isProcessing
                  ? "bg-[#c59d5f] text-white shadow-xl shadow-[#c59d5f]/30 hover:bg-[#d4ac6e] hover:shadow-2xl hover:-translate-y-0.5"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              }`}
            >
              {isProcessing ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                "Agree & Continue to Payment"
              )}
            </button>

            {!canProceed && (
              <p className="mt-3 text-sm text-zinc-500">
                {(!hasReadTerms || !hasReadPrivacy)
                  ? "Please open and read both documents above"
                  : "Please confirm all statements above"
                }
              </p>
            )}

            <p className="mt-4 text-xs text-zinc-500">Secure payment processed by Stripe</p>
          </div>

          {/* Back Link */}
          <div className="text-center pt-4">
            <Link href="/tx/qualify" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Qualification
            </Link>
          </div>
        </div>
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

export default function NVAgreePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" />
      </div>
    }>
      <AgreeContent />
    </Suspense>
  );
}
