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
        <p className="text-sm text-zinc-500 mb-8">Last updated: February 1, 2026</p>

        <div className="prose prose-zinc max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Overview</h2>
            <p className="text-zinc-600 mb-4">
              This Privacy Policy explains how we collect, use, and protect your information when you use DivorceGPT, our New York uncontested divorce form assistance service.
            </p>
            <p className="text-zinc-600">
              <strong>The short version:</strong> We collect minimal data, don't store your conversations, and never sell your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-zinc-800 mb-2">Payment Information</h3>
            <p className="text-zinc-600 mb-4">
              When you make a payment, your payment details are processed directly by Stripe, a PCI-compliant payment processor. We do not store your credit card number, CVV, or full payment details on our servers. We only receive confirmation of successful payment and a transaction ID.
            </p>

            <h3 className="text-lg font-medium text-zinc-800 mb-2">Conversation Data</h3>
            <p className="text-zinc-600 mb-4">
              Your conversations with DivorceGPT are processed by Anthropic's Claude AI. <strong>We do not store conversation logs on our servers.</strong> Once your session ends, your conversation is not retained. Anthropic's data handling practices can be found in their privacy policy.
            </p>

            <h3 className="text-lg font-medium text-zinc-800 mb-2">Form Data</h3>
            <p className="text-zinc-600 mb-4">
              Any information you enter for form preparation (names, addresses, dates) is stored locally in your browser session and used solely to generate your divorce documents. Sensitive information like Social Security Numbers is processed in memory only and is never stored on any server or database.
            </p>

            <h3 className="text-lg font-medium text-zinc-800 mb-2">Technical Data</h3>
            <p className="text-zinc-600">
              We collect basic technical data through our hosting provider (DigitalOcean) including IP addresses, browser type, and access times. This data is used for security and service improvement purposes only.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>To provide the divorce form explanation and preparation service</li>
              <li>To process your payment</li>
              <li>To generate your divorce documents</li>
              <li>To improve our service and fix technical issues</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">What We Don't Do</h2>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>We do <strong>not</strong> sell your personal information</li>
              <li>We do <strong>not</strong> store your conversations on our servers</li>
              <li>We do <strong>not</strong> use your data to train AI models</li>
              <li>We do <strong>not</strong> share your information with third parties for marketing</li>
              <li>We do <strong>not</strong> store sensitive information like Social Security Numbers</li>
              <li>We do <strong>not</strong> maintain a database of user information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Our Technology Stack</h2>
            <p className="text-zinc-600 mb-4">DivorceGPT is built with privacy-focused infrastructure:</p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li><strong>AI:</strong> Anthropic Claude - conversations are not used for model training per Anthropic's commercial terms</li>
              <li><strong>Hosting:</strong> DigitalOcean App Platform - enterprise-grade security with data centers in the United States</li>
              <li><strong>PDF Generation:</strong> Server-side processing with no document retention</li>
              <li><strong>Payments:</strong> Stripe - PCI DSS Level 1 compliant</li>
              <li><strong>Session Data:</strong> Browser localStorage only - no server-side user database</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Data Retention</h2>
            <p className="text-zinc-600 mb-4">
              <strong>Conversation data:</strong> Not retained after your session ends.
            </p>
            <p className="text-zinc-600 mb-4">
              <strong>Form data:</strong> Stored in your browser's localStorage. You can clear this at any time by clearing your browser data.
            </p>
            <p className="text-zinc-600 mb-4">
              <strong>Payment records:</strong> Retained by Stripe as required by law for accounting and tax purposes. We only store transaction IDs, not payment details.
            </p>
            <p className="text-zinc-600">
              You may request deletion of any data associated with your payment by contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Your Rights</h2>
            <p className="text-zinc-600 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>Request access to any personal data we hold about you</li>
              <li>Request deletion of your data</li>
              <li>Clear your local browser data at any time</li>
              <li>Opt out of any marketing communications</li>
              <li>File a complaint with a data protection authority</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Third-Party Services</h2>
            <p className="text-zinc-600 mb-4">We use the following third-party services:</p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li><strong>Stripe:</strong> Payment processing - <a href="https://stripe.com/privacy" className="text-[#1a365d] hover:underline">Privacy Policy</a></li>
              <li><strong>Anthropic:</strong> AI processing - <a href="https://www.anthropic.com/privacy" className="text-[#1a365d] hover:underline">Privacy Policy</a></li>
              <li><strong>DigitalOcean:</strong> Hosting - <a href="https://www.digitalocean.com/legal/privacy-policy" className="text-[#1a365d] hover:underline">Privacy Policy</a></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Contact Us</h2>
            <p className="text-zinc-600">
              If you have questions about this Privacy Policy or your data, contact us at:<br />
              <strong>Email:</strong> admin@divorcegpt.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Changes to This Policy</h2>
            <p className="text-zinc-600">
              We may update this Privacy Policy from time to time. We will notify users of any material changes by posting the new policy on this page with an updated revision date.
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
