"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function TermsContent() {
  const searchParams = useSearchParams();
  const isReviewMode = searchParams.get("review") === "true";

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 transition hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20">
                <span className="text-lg">⚖️</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1>
                <p className="text-xs text-zinc-500">Terms of Service</p>
              </div>
            </Link>
            {isReviewMode && (
              <button
                onClick={() => window.close()}
                className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
              >
                ✓ Done Reading — Close Tab
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-8">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-8">Last updated: March 27, 2026</p>

        <div className="prose prose-zinc max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Agreement to Terms</h2>
            <p className="text-zinc-600">
              By accessing or using DivorceGPT, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use this service. DivorceGPT is operated by June Guided Solutions LLC.
            </p>
          </section>

          {/* Critical Notice */}
          <section className="mb-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
            <h2 className="text-xl font-semibold text-amber-900 mb-4">⚠️ Important: Not Legal Advice</h2>
            <p className="text-amber-800 mb-4">
              <strong>DivorceGPT is NOT a law firm and does NOT provide legal advice.</strong>
            </p>
            <p className="text-amber-800 mb-4">
              This service provides information about divorce forms and filing procedures for the states we serve. It explains what forms ask for, what legal terms mean, and how the filing process works. This is educational and informational content only.
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
              DivorceGPT is an automated document preparation service that:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>Transfers your answers onto court divorce forms for your state</li>
              <li>Displays plain-language labels identifying what information each form field requests</li>
              <li>Generates PDF packets for your review before filing</li>
              <li>Explains what forms are, what fields mean, and filing procedures</li>
              <li>Can respond in the user&apos;s language during the intake process — all court filings are generated in English</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Language During Intake</h2>
            <p className="text-zinc-600 mb-4">
              DivorceGPT&apos;s AI assistant can communicate with you in your preferred language during the intake and form explanation process. The AI determines the language from your messages and responds accordingly.
            </p>
            <p className="text-zinc-600 mb-4">
              <strong>All court filings are generated in English.</strong> New York and New Jersey courts require documents to be filed in English. Regardless of which language you communicate in during the intake process, your final court-ready documents will always be in English.
            </p>
            <p className="text-zinc-600 mb-4">
              <strong>AI-generated explanations in non-English languages may contain errors.</strong> If you interact with DivorceGPT in any language other than English, you do so with the understanding that translation nuances may affect your comprehension of legal concepts and form requirements.
            </p>
            <p className="text-zinc-600">
              For non-English speakers, we recommend confirming your understanding of the court documents with a licensed attorney who speaks your language before filing. Attorney referral services are available through the <a href="https://www.nysba.org/lawyerreferral/" target="_blank" rel="noopener noreferrer" className="text-[#1a365d] underline hover:text-[#2c5282]">New York State Bar Association</a> and the <a href="https://njsba.com/resources/county-bar-associations/" target="_blank" rel="noopener noreferrer" className="text-[#1a365d] underline hover:text-[#2c5282]">New Jersey State Bar Association</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Eligibility</h2>
            <p className="text-zinc-600 mb-4">
              DivorceGPT is designed for simple, uncontested divorces. While specific requirements vary by state, the following general criteria apply across all states we serve:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>At least one spouse meets the state's residency requirements</li>
              <li>No minor children of the marriage (and neither party is pregnant, where applicable)</li>
              <li>No property, debts, or financial assets requiring division (or already divided by agreement)</li>
              <li>Neither spouse is requesting spousal support or maintenance</li>
              <li>Both spouses agree to the divorce and will cooperate with the process</li>
              <li>Neither spouse is an active duty military service member</li>
            </ul>
            <p className="text-zinc-600 mt-4">
              Each state has an eligibility screening before payment. If your situation does not meet the criteria for your state, you will not be charged.
            </p>
          </section>

          {/* State-Specific Terms */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">State-Specific Terms</h2>
            
            <div className="space-y-4">
              <div className="rounded-xl bg-zinc-50 p-5 ring-1 ring-zinc-200">
                <h3 className="font-semibold text-zinc-900 mb-2">New York</h3>
                <p className="text-zinc-600 text-sm mb-2">
                  DivorceGPT for New York uses official Unified Court System forms (UD series). The divorce process has three phases: Summons &amp; Complaint (Phase 1), Sworn Statements (Phase 2), and Judgment (Phase 3). Each phase allows up to 5 document generation attempts.
                </p>
                <p className="text-zinc-600 text-sm">
                  Ground: Irretrievable breakdown of the relationship for at least 6 months. Residency: At least one spouse meets NY residency requirements under DRL §230.
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-5 ring-1 ring-zinc-200">
                <h3 className="font-semibold text-zinc-900 mb-2">New Jersey</h3>
                <p className="text-zinc-600 text-sm mb-2">
                  DivorceGPT for New Jersey generates forms based on Superior Court Family Part requirements. The process has two phases: Filing Packet (Phase 1) and Final Judgment (Phase 2). Each phase allows up to 5 document generation attempts.
                </p>
                <p className="text-zinc-600 text-sm">
                  Ground: Irreconcilable differences for at least 6 months. Residency: At least one spouse has been a bona fide resident of New Jersey for at least 12 months.
                </p>
              </div>
            </div>
          </section>

          {/* Prohibited Conduct & Termination - NEW SECTION */}
          <section className="mb-8 p-6 bg-red-50 rounded-xl border border-red-200">
            <h2 className="text-xl font-semibold text-red-900 mb-4">Prohibited Conduct & Session Termination</h2>
            <p className="text-red-800 mb-4">
              DivorceGPT will <strong>immediately terminate your session</strong> if you:
            </p>
            <ul className="list-disc pl-6 text-red-800 space-y-2 mb-4">
              <li>Make threats of violence toward any person, including your spouse</li>
              <li>Express intent to harm children or any indication of child endangerment</li>
              <li>Request assistance with falsifying court documents or forging signatures</li>
              <li>Attempt to use the service for fraudulent purposes</li>
              <li>Make statements indicating someone is in immediate danger</li>
            </ul>
            <p className="text-red-800 mb-4">
              Upon termination:
            </p>
            <ul className="list-disc pl-6 text-red-800 space-y-2">
              <li>Your session will end immediately</li>
              <li>All browser session data will be cleared</li>
              <li>You will be instructed to take a screenshot for refund review (see Refund Policy below)</li>
              <li>Crisis resources will be displayed</li>
            </ul>
            <p className="text-red-800 mt-4 text-sm">
              DivorceGPT is not a law enforcement service and does not report users to authorities. Termination is solely to disengage from the session.
            </p>
          </section>

          {/* Right to Refuse Service - NEW SECTION */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Right to Refuse Service</h2>
            <p className="text-zinc-600 mb-4">
              DivorceGPT reserves the right, at its sole discretion, to refuse or terminate service to any user at any time, with or without cause, and with or without notice. This includes, but is not limited to, situations where:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2 mb-4">
              <li>Information provided appears inconsistent, contradictory, or implausible</li>
              <li>There is reasonable suspicion of bad-faith use of the service</li>
              <li>User conduct suggests the service is being used for purposes other than legitimate document preparation</li>
              <li>Repeated errors in basic information entry after correction prompts</li>
              <li>Any other reason at the discretion of June Guided Solutions LLC</li>
            </ul>
            <p className="text-zinc-600">
              If service is refused or terminated under this section, you may request a refund by following the Refund Policy below. No explanation for the refusal is required, and the decision is final and not subject to appeal.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">AI-Generated Content</h2>
            <p className="text-zinc-600 mb-4">
              DivorceGPT uses artificial intelligence to assist with document preparation. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>Responses are generated by artificial intelligence</li>
              <li>AI may occasionally produce inaccurate or incomplete information</li>
              <li>You should verify important information independently</li>
              <li>AI responses do not constitute professional legal advice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Payment, Access, and Document Generation</h2>
            <p className="text-zinc-600 mb-4">
              <strong>Payment:</strong> The service fee is $99 USD, payable via Stripe. Payment is required before accessing form preparation features.
            </p>
            <p className="text-zinc-600 mb-4">
              <strong>Access Window:</strong> Your session is valid for 12 months from the date of purchase. This covers all three phases of the divorce filing process. DivorceGPT does not track court timelines or provide ongoing assistance during this period — the access window is solely for document generation.
            </p>
            <p className="text-zinc-600 mb-4">
              <strong>Document Generation:</strong> Each phase of the filing process allows up to 5 document generation attempts. The number of phases varies by state (see State-Specific Terms above). You will be notified of your remaining attempts after each download. Once all 5 attempts for a phase are used, no further regeneration is available for that phase. You are responsible for saving your downloaded files. DivorceGPT does not store copies of generated documents.
            </p>
            <p className="text-zinc-600 mb-4">
              <strong>Session Completion:</strong> Once all documents for your state have been generated, your session is complete and access to the AI assistant ends. Previously downloaded documents remain valid.
            </p>
            <p className="text-zinc-600 mb-4">
              <strong>Usage Limits:</strong> Each session is limited to 200 AI messages. If you reach this limit before completing all phases, your session ends. This limit exists to ensure fair usage across all users. A new session requires a new purchase.
            </p>
            <p className="text-zinc-600 mb-4">
              <strong>Session Expiration:</strong> If your session expires after 12 months, you must purchase a new session at the standard rate of $99 USD. A new session requires re-entry of all information. Court processing delays are outside the scope of this service and do not extend your access window.
            </p>
            <p className="text-zinc-600 mb-4">
              <strong>Refund Policy:</strong>
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>If you do not pass the eligibility check, you will not be charged</li>
              <li>DivorceGPT does not retain chat data. If your session is terminated or you are disqualified after payment, you must take a screenshot of the relevant chat exchange and email it to admin@divorcegpt.com</li>
              <li>Refund requests will be reviewed by replaying the same inputs to verify the outcome. If the system reproduces the same termination or disqualification, the refund will be processed within 5-10 business days</li>
              <li>If you experience technical issues preventing service delivery, contact admin@divorcegpt.com with a screenshot for resolution</li>
              <li>Once you have successfully generated documents for any phase, no refunds are available</li>
              <li>Session expiration does not entitle you to a refund</li>
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
              <li>Save and securely store all generated documents upon download — documents cannot be regenerated once a phase is complete</li>
              <li>Not enter sensitive information (SSNs, bank accounts) into the chat — you will add these to printed forms yourself</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Limitation of Liability</h2>
            <p className="text-zinc-600 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 space-y-2">
              <li>DivorceGPT and June Guided Solutions LLC are not liable for any damages arising from your use of this service</li>
              <li>We are not responsible for the outcome of your divorce case</li>
              <li>We are not responsible for errors in court filings or rejections by the court</li>
              <li>Our total liability is limited to the amount you paid for the service ($99)</li>
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
              The DivorceGPT service, including its design, code, and content (excluding court forms which are public domain), is the property of June Guided Solutions LLC. You may not copy, modify, or distribute our proprietary content without permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Governing Law and Jurisdiction</h2>
            <p className="text-zinc-600 mb-4">
              These Terms are governed by the laws of the State of New York, without regard to conflict of law principles.
            </p>
            <p className="text-zinc-600">
              Any disputes arising from or relating to these Terms or your use of DivorceGPT shall be resolved exclusively in the state courts of Orange County, New York, or the United States District Court for the Southern District of New York. You consent to personal jurisdiction in these courts and waive any objection to venue.
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

        {/* Floating close button for mobile in review mode */}
        {isReviewMode && (
          <div className="fixed bottom-6 right-6 z-50 lg:hidden">
            <button
              onClick={() => window.close()}
              className="rounded-full bg-green-600 px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-green-700 transition"
            >
              ✓ Done Reading
            </button>
          </div>
        )}

        {!isReviewMode && (
          <div className="mt-12 pt-8 border-t border-zinc-200">
            <Link href="/" className="text-[#1a365d] hover:text-[#c59d5f] font-medium inline-flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" /></div>}>
      <TermsContent />
    </Suspense>
  );
}
