"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ISSUE_TYPES = [
  { value: "contested", label: "Contested divorce" },
  { value: "children", label: "Divorce with children / custody" },
  { value: "property", label: "Complex property or asset division" },
  { value: "support", label: "Spousal support / alimony" },
  { value: "military", label: "Military divorce (SCRA)" },
  { value: "dv", label: "Domestic violence situation" },
  { value: "modification", label: "Modify existing order" },
  { value: "other", label: "Other family law matter" },
];

const STATES_SERVED = [
  { value: "ny", label: "New York" },
  { value: "nj", label: "New Jersey" },
  { value: "other", label: "Other state" },
];

function ReferContent() {
  const searchParams = useSearchParams();
  const fromState = searchParams.get("from") || "";
  const reason = searchParams.get("reason") || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    state: fromState || "",
    issueType: reason || "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const canSubmit = form.name.trim() && form.email.trim() && form.state && form.issueType;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // POST to referral API endpoint
      const res = await fetch("/api/refer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        alert("Something went wrong. Please email admin@divorcegpt.com directly.");
      }
    } catch {
      alert("Something went wrong. Please email admin@divorcegpt.com directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center">
              <Link href="/" className="flex items-center gap-3 transition hover:opacity-80">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20">
                  <span className="text-lg">⚖️</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1>
                  <p className="text-xs text-zinc-500">Attorney Referral</p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">Request Received</h2>
          <p className="mt-4 text-zinc-600">
            We've received your referral request. A member of our team will reach out within 1-2 business days to connect you with a licensed attorney in your state.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Check your email ({form.email}) for a confirmation.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1a365d] px-6 py-3 text-white font-medium hover:bg-[#2c5282] transition"
          >
            Return Home
          </Link>
        </main>
      </div>
    );
  }

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
                <p className="text-xs text-zinc-500">Attorney Referral</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1a365d]/10 mb-4">
            <svg className="h-8 w-8 text-[#1a365d]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Connect with a Divorce Attorney
          </h2>
          <p className="mt-3 text-zinc-600">
            Your situation may need more than document preparation. Tell us a little about your case and we'll connect you with a licensed attorney.
          </p>
        </div>

        {/* Reason banner if coming from disqualification */}
        {reason && (
          <div className="mb-8 rounded-xl bg-blue-50 p-4 ring-1 ring-blue-200">
            <p className="text-sm text-blue-800">
              Based on your answers, your case may require legal representation. No worries — we can help connect you with the right attorney.
            </p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-5 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email Address *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@email.com"
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d]"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="(optional)"
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d]"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">State *</label>
            <select
              name="state"
              value={form.state}
              onChange={handleChange}
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-900 focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d]"
            >
              <option value="">Select state</option>
              {STATES_SERVED.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Issue type */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">What do you need help with? *</label>
            <select
              name="issueType"
              value={form.issueType}
              onChange={handleChange}
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-900 focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d]"
            >
              <option value="">Select issue</option>
              {ISSUE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Anything else?</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={3}
              placeholder="Brief description (optional)"
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#1a365d] focus:outline-none focus:ring-1 focus:ring-[#1a365d] resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={`w-full rounded-full py-3.5 text-sm font-semibold transition-all duration-200 ${
              canSubmit && !submitting
                ? "bg-[#c59d5f] text-white shadow-lg shadow-[#c59d5f]/30 hover:bg-[#d4ac6e]"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {submitting ? "Submitting..." : "Request Attorney Referral"}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          DivorceGPT is a document preparation service by June Guided Solutions, LLC. Attorney referrals are provided as a courtesy — we do not guarantee representation.
        </p>
      </main>
    </div>
  );
}

export default function ReferPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" />
      </div>
    }>
      <ReferContent />
    </Suspense>
  );
}
