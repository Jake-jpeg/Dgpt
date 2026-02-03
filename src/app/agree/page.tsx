"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AgreePage() {
  const router = useRouter();
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedAt, setAgreedAt] = useState<string | null>(null);

  // Track when links are clicked
  const handleTermsClick = () => {
    setHasReadTerms(true);
  };

  const handlePrivacyClick = () => {
    setHasReadPrivacy(true);
  };

  // Handle checkbox change
  const handleAgreeChange = (checked: boolean) => {
    setAgreedToTerms(checked);
    if (checked) {
      setAgreedAt(new Date().toISOString());
    } else {
      setAgreedAt(null);
    }
  };

  // Proceed to payment
  const handleProceed = async () => {
    if (!agreedToTerms || !hasReadTerms || !hasReadPrivacy) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          returnUrl: window.location.origin,
          agreedAt: agreedAt,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session. Please try again.");
        setIsProcessing(false);
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  const canProceed = hasReadTerms && hasReadPrivacy && agreedToTerms;

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
                <p className="text-xs text-zinc-500">Review & Agree</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1a365d]/10 mb-4">
            <svg className="h-8 w-8 text-[#1a365d]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Before You Continue</h2>
          <p className="mt-2 text-zinc-600">
            Please review our Terms of Service and Privacy Policy
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
                      Reviewed
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  Understand what DivorceGPT is (and isn't), eligibility requirements, and important disclaimers.
                </p>
              </div>
              <a
                href="/terms"
                target="_blank"
                onClick={handleTermsClick}
                className="flex-shrink-0 rounded-full bg-[#1a365d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2c5282]"
              >
                Read →
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
                      Reviewed
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  Learn how we handle (and don't store) your data.
                </p>
              </div>
              <a
                href="/privacy"
                target="_blank"
                onClick={handlePrivacyClick}
                className="flex-shrink-0 rounded-full bg-[#1a365d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2c5282]"
              >
                Read →
              </a>
            </div>
          </div>

          {/* Key Points Summary */}
          <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200">
            <h3 className="font-semibold text-amber-900 mb-3">Key Points</h3>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>DivorceGPT is a <strong>document preparation service</strong>, not a law firm</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>We do <strong>not provide legal advice</strong> — consult an attorney for legal questions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>We do <strong>not store your data</strong> — form info stays in your browser only</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Threats, fraud, or dangerous content will result in <strong>immediate session termination</strong></span>
              </li>
            </ul>
          </div>

          {/* Agreement Checkbox */}
          <div className={`rounded-2xl p-6 ring-1 transition-all duration-200 ${
            canProceed 
              ? 'bg-green-50 ring-green-300' 
              : 'bg-white ring-zinc-200'
          }`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => handleAgreeChange(e.target.checked)}
                disabled={!hasReadTerms || !hasReadPrivacy}
                className="mt-1 h-5 w-5 rounded border-zinc-300 text-[#1a365d] focus:ring-[#1a365d] disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className={`text-sm ${!hasReadTerms || !hasReadPrivacy ? 'text-zinc-400' : 'text-zinc-700'}`}>
                I have read and agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>. I understand that DivorceGPT is a document preparation service and does not provide legal advice.
              </span>
            </label>
            {(!hasReadTerms || !hasReadPrivacy) && (
              <p className="mt-3 text-xs text-zinc-500 italic">
                Please click "Read" on both documents above to enable this checkbox.
              </p>
            )}
          </div>

          {/* Price and Continue */}
          <div className="text-center pt-4">
            <div className="mb-4">
              <p className="text-4xl font-bold text-[#1a365d]">$20</p>
              <p className="text-sm text-zinc-500">One-time fee • No subscription</p>
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
            
            <p className="mt-4 text-xs text-zinc-500">
              Secure payment processed by Stripe
            </p>
          </div>

          {/* Back Link */}
          <div className="text-center pt-4">
            <Link
              href="/qualify"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700"
            >
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
