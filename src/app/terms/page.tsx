"use client";

import Link from "next/link";

export default function TermsPage() {
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
                <p className="text-xs text-zinc-500">Terms of Service</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-8">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-8">Last updated: January 25, 2026</p>

        <div className="prose prose-zinc max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Agreement to Terms</h2>
            <p className="text-zinc-600">
              By accessing or using DivorceGPT, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use this service. DivorceGPT is operated by June Guided Solutions LLC.
            </p>
          </section>

          <section className="mb-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
            <h2 className="text-xl font-semibold text-amber-900 mb-4">⚠️ Important: Not Legal Advice</h2>
            <p className="text-amber-800 mb-4">
              <strong>DivorceGPT is NOT a law firm and does NOT provide legal advice.</strong>
            </p>
            <p className="text-amber-800 mb-4">
              This service provides information about New York divorce forms and filing procedures. It explains what forms ask for, what legal terms mean, and how the filing process works. This is educational and informational content only.
            </p>
            <p className="text-amber-800 mb-4">
              DivorceGPT does NOT:
            </p>
            <ul className="list-disc pl-6 text-amber-800 space-y-2 mb-4">
              <li>Provide legal advice or legal opinions</li>
              <li>Tell you what you should do in your specific situation</li>
              <li>Guarantee any outcome for your divorce case</li>
              <li>Create an attorney-client relationship</li>
              <li>Replace the advice of a licensed attorney</li>
            </ul>
            <p className="text-amber-800">
              <strong>If you need legal advice about your specific situation, consult a licensed attorney in your jurisdiction.</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Service Description</h2>
            <p className="text-zinc-600 mb-4">
              DivorceGPT is an AI-powered tool that:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>Explains New York State uncontested divorce forms (UD series, DRL forms)</li>
              <li>Describes what information forms require</li>
              <li>Explains legal terminology used in divorce documents</li>
              <li>Provides information about filing procedures, fees, and court processes</li>
              <li>Responds in multiple languages (English, Spanish, Chinese, Korean, Russian, Haitian Creole)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Eligibility</h2>
            <p className="text-zinc-600 mb-4">
              This service is designed for New York uncontested divorces that meet ALL of the following criteria:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>At least one spouse meets New York residency requirements</li>
              <li>No unemancipated children of the marriage</li>
              <li>No property, debts, pensions, or retirement accounts to divide</li>
              <li>Neither spouse is requesting spousal maintenance</li>
              <li>Both spouses agree to the divorce</li>
              <li>The other spouse will cooperate with paperwork</li>
            </ul>
            <p className="text-zinc-600 mt-4">
              If your situation does not meet these criteria, this service may not be appropriate for you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">AI-Generated Content</h2>
            <p className="text-zinc-600 mb-4">
              DivorceGPT is powered by Claude, an AI assistant created by Anthropic. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>Responses are generated by artificial intelligence</li>
              <li>AI may occasionally produce inaccurate or incomplete information</li>
              <li>You should verify important information independently</li>
              <li>AI responses do not constitute professional legal advice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Payment and Refunds</h2>
            <p className="text-zinc-600 mb-4">
              <strong>Payment:</strong> The service fee is $20 USD, payable via Stripe. Payment is required before accessing form preparation features.
            </p>
            <p className="text-zinc-600 mb-4">
              <strong>Refund Policy:</strong>
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>If you do not pass the eligibility check, you will not be charged</li>
              <li>Once you have accessed the form preparation service, no refunds are available</li>
              <li>If you experience technical issues preventing service delivery, contact us for resolution</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">User Responsibilities</h2>
            <p className="text-zinc-600 mb-4">You agree to:</p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>Provide accurate information when using the service</li>
              <li>Use the service only for lawful purposes</li>
              <li>Not attempt to circumvent eligibility requirements</li>
              <li>Not use the service to generate fraudulent documents</li>
              <li>Understand that you are responsible for reviewing and filing your own documents</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Limitation of Liability</h2>
            <p className="text-zinc-600 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>DivorceGPT and June Guided Solutions are not liable for any damages arising from your use of this service</li>
              <li>We are not responsible for the outcome of your divorce case</li>
              <li>We are not responsible for errors in court filings or rejections by the court</li>
              <li>Our total liability is limited to the amount you paid for the service ($20)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Disclaimer of Warranties</h2>
            <p className="text-zinc-600">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT ANY INFORMATION PROVIDED WILL BE ACCURATE OR COMPLETE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Intellectual Property</h2>
            <p className="text-zinc-600">
              The DivorceGPT service, including its design, code, and content (excluding court forms which are public domain), is the property of DivorceGPT. You may not copy, modify, or distribute our proprietary content without permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Governing Law</h2>
            <p className="text-zinc-600">
              These Terms are governed by the laws of the State of New York, without regard to conflict of law principles. Any disputes shall be resolved in the courts of New York.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Changes to Terms</h2>
            <p className="text-zinc-600">
              We may modify these Terms at any time. Continued use of the service after changes constitutes acceptance of the new terms. Material changes will be posted on this page with an updated revision date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Contact</h2>
            <p className="text-zinc-600">
              For questions about these Terms of Service, contact us at:<br />
              <strong>Email:</strong> admin@divorcegpt.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200">
          <Link href="/" className="text-[#1a365d] hover:text-[#c59d5f] font-medium inline-flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
