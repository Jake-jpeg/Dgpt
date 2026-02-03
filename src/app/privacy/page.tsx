"use client";

import Link from "next/link";

export default function PrivacyPage() {
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
                <p className="text-xs text-zinc-500">Privacy Policy</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-8">Last updated: February 2, 2026</p>

        <div className="prose prose-zinc max-w-none">
          
          {/* Core Principle - Highlighted */}
          <section className="mb-8 p-6 bg-[#1a365d] rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-3">Our Core Principle</h2>
            <p className="text-zinc-200 text-lg">
              DivorceGPT does not retain your data. We do not store your conversations, your form answers, or your personal information on our servers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">What We Collect</h2>
            
            <div className="space-y-4">
              <div className="rounded-xl bg-white p-5 ring-1 ring-zinc-200">
                <h3 className="font-semibold text-zinc-900 mb-2">Payment Transaction Record</h3>
                <p className="text-zinc-600 text-sm">
                  Stripe processes your payment and provides us with a transaction ID. We retain this ID solely for IRS tax reporting requirements. We do not receive or store your credit card number, CVV, or billing details.
                </p>
                <p className="text-xs text-zinc-500 mt-2">Retention: As required by law for tax purposes (typically 7 years)</p>
              </div>

              <div className="rounded-xl bg-white p-5 ring-1 ring-zinc-200">
                <h3 className="font-semibold text-zinc-900 mb-2">Server Logs</h3>
                <p className="text-zinc-600 text-sm">
                  Our hosting provider (DigitalOcean) automatically collects IP addresses and access timestamps for security purposes. These logs are not linked to your identity or form data.
                </p>
                <p className="text-xs text-zinc-500 mt-2">Retention: 30 days (automatic deletion)</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">What We Do NOT Collect or Store</h2>
            <div className="rounded-xl bg-red-50 p-5 ring-1 ring-red-200">
              <ul className="space-y-2 text-zinc-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Conversation logs or chat history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Form data you enter (names, addresses, dates)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Social Security Numbers (our system blocks these)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Generated PDF documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>User accounts or profiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✗</span>
                  <span>Email addresses (unless you contact us directly)</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">How It Works</h2>
            <div className="space-y-3 text-zinc-600">
              <p>
                <strong>Your browser stores your progress.</strong> Form data is saved in your browser's localStorage and never transmitted to our servers for storage. You can clear this at any time by clearing your browser data.
              </p>
              <p>
                <strong>AI processes but doesn't remember.</strong> Your conversations are processed by Anthropic's Claude AI to generate responses. Per Anthropic's commercial API terms, these conversations are not used for AI training and are not retained after your session.
              </p>
              <p>
                <strong>PDFs are generated and discarded.</strong> When you download your forms, the PDF is generated server-side, sent to your browser, and immediately discarded. We do not keep copies.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Third-Party Services</h2>
            <p className="text-zinc-600 mb-4">DivorceGPT uses the following services. Their privacy practices are governed by their own policies:</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                <span className="font-medium text-zinc-900">Stripe</span>
                <span className="text-sm text-zinc-500">Payment processing</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                <span className="font-medium text-zinc-900">Anthropic</span>
                <span className="text-sm text-zinc-500">AI processing (Claude)</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-medium text-zinc-900">DigitalOcean</span>
                <span className="text-sm text-zinc-500">Hosting infrastructure</span>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Session Termination</h2>
            <p className="text-zinc-600">
              DivorceGPT reserves the right to terminate any session for violations of our Terms of Service. Upon termination, any data in your browser session is cleared. Because we do not store your data server-side, there is nothing to delete on our end.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Your Rights</h2>
            <p className="text-zinc-600 mb-4">Because we don't retain your data, traditional data rights (access, deletion, portability) are largely moot. However:</p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>You can clear your browser localStorage at any time to remove all local session data</li>
              <li>You can request deletion of your Stripe transaction record by contacting us (note: we may be required to retain certain records for tax compliance)</li>
              <li>You can contact us with any privacy questions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Contact</h2>
            <p className="text-zinc-600">
              For privacy questions, contact us at:<br />
              <strong>Email:</strong> admin@divorcegpt.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Changes to This Policy</h2>
            <p className="text-zinc-600">
              We may update this Privacy Policy from time to time. Material changes will be posted on this page with an updated revision date.
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
