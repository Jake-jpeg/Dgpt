"use client";
import Link from "next/link";

export default function FilingFeesGuide() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20"><span className="text-lg">⚖️</span></div>
              <div><h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1><p className="text-xs text-zinc-500">by <a href="https://juneguidedsolutions.com" className="underline hover:text-[#1a365d]">June Guided Solutions, LLC</a></p></div>
            </Link>
            <Link href="/guides" className="text-sm font-medium text-zinc-600 hover:text-[#1a365d] transition">← All Guides</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f2440] via-[#1a365d] to-[#1e3a5f] py-16 lg:py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#c59d5f]/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center rounded-full bg-[#c59d5f]/20 px-4 py-1.5 text-xs font-semibold text-[#c59d5f] mb-6">Resource Guide · New York</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.15]">
            How Much Does an Uncontested Divorce Cost in New York?
          </h1>
          <p className="mt-5 text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            A complete breakdown of court filing fees — what you pay, when you pay it, and what it covers. Updated March 2026.
          </p>
        </div>
      </section>

      <div className="bg-[#1a365d]/5 border-b border-[#1a365d]/10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-zinc-600 text-center">
            <strong className="text-[#1a365d]">Scope:</strong> This guide covers filing fees for <strong>uncontested divorces in New York — no children under 21.</strong> Fees are set by the New York State Unified Court System and may change. Verify with your county clerk before filing.
          </p>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

        <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 p-5 mb-12">
          <p className="text-sm text-amber-800">
            <strong>Disclaimer:</strong> This guide is published by DivorceGPT, a product of June Guided Solutions, LLC, for educational purposes only. It does not constitute legal advice. Fees listed are current as of March 2026 and are subject to change. Always confirm fees with your county clerk&apos;s office before filing.
          </p>
        </div>

        {/* The Short Answer */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">The Short Answer</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            The mandatory court filing fees for an uncontested divorce in New York total <strong>$335</strong>. That breaks down into two payments made at two different stages of the process. There is no way around these fees unless you qualify for a fee waiver.
          </p>
          <p className="text-zinc-700 leading-relaxed">
            Everything else — attorney fees, document preparation services, process server costs — is optional and depends on how you choose to handle your case. The court itself charges $335.
          </p>
        </section>

        {/* Fee Breakdown */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">The Two Mandatory Fees</h2>

          <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-6 mb-6">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-base font-bold text-[#1a365d]">1. Index Number</h3>
              <span className="text-xl font-bold text-[#1a365d]">$210</span>
            </div>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              This is the first fee you pay. The index number is assigned when you file your initial papers — either your Summons with Notice (Form UD-1) or your Summons and Verified Complaint (Forms UD-1A and UD-2) — with the County Clerk. Every Supreme Court case in New York gets an index number. It is the case&apos;s unique identifier, and it goes on every document you file from that point forward.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed">
              <strong>When you pay it:</strong> At the very beginning, when you file your initiating papers.
            </p>
          </div>

          <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-6 mb-6">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-base font-bold text-[#1a365d]">2. Note of Issue + Request for Judicial Intervention (RJI)</h3>
              <span className="text-xl font-bold text-[#1a365d]">$125</span>
            </div>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              This is the second fee. After you have served your spouse, gathered all required forms, and are ready for the court to review your case, you file a Note of Issue and a Request for Judicial Intervention (Form UD-13). This places your case on the uncontested matrimonial calendar and asks the court to assign a judge.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              In an uncontested divorce, the RJI is filed without an additional separate fee — the $125 covers both the Note of Issue and the RJI together. This is different from contested cases, where the RJI carries its own $95 fee.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed">
              <strong>When you pay it:</strong> After all your papers are complete and you are ready to submit them for judicial review. This is typically several weeks or months after the index number purchase.
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-b from-[#1a365d] to-[#234876] p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-bold text-white">Total Mandatory Court Fees</h3>
              <span className="text-2xl font-bold text-[#c59d5f]">$335</span>
            </div>
          </div>
        </section>

        {/* Other Costs */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Other Costs You May Encounter</h2>
          <p className="text-zinc-700 leading-relaxed mb-6">
            Beyond the two mandatory fees, there are a few other costs that may apply depending on your situation:
          </p>

          <div className="space-y-4">
            <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-5">
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-sm font-bold text-zinc-900">Certified Copy of Judgment of Divorce</p>
                <p className="text-sm font-bold text-zinc-700">~$8+</p>
              </div>
              <p className="text-sm text-zinc-600">After the judge signs your Judgment of Divorce, you will want at least one certified copy. The base fee is $8 for up to 4 pages (varies slightly by county), with additional per-page charges for longer judgments. You will need a certified copy to prove your divorce is final — for example, to change your name, update your Social Security records, or remarry.</p>
            </div>

            <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-5">
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-sm font-bold text-zinc-900">Process Server / Service of Process</p>
                <p className="text-sm font-bold text-zinc-700">$0–$150</p>
              </div>
              <p className="text-sm text-zinc-600">Your spouse must be formally served with the divorce papers. If your spouse is cooperative and signs the Affidavit of Defendant (Form UD-7), service can be handled by any person over 18 who is not a party to the action — at no cost. If you need a professional process server, expect to pay between $85 and $150 depending on where you are. Standard service within the five boroughs of New York City typically starts around $85–$95, while rates in suburban counties like Westchester tend to run closer to $115 and up. Rush service or multiple attempts will cost more.</p>
            </div>

            <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-5">
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-sm font-bold text-zinc-900">Certificate of Dissolution of Marriage (DOH-2168)</p>
                <p className="text-sm font-bold text-zinc-700">$5</p>
              </div>
              <p className="text-sm text-zinc-600">This is a New York State Department of Health form that records the vital statistics of your divorce. It is filed alongside your final Judgment of Divorce with the County Clerk. Most County Clerks charge a $5 fee to file it. This is not optional — the court needs it to report the dissolution to the state&apos;s vital records.</p>
            </div>

            <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-5">
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-sm font-bold text-zinc-900">Credit Card / Online Payment Surcharge</p>
                <p className="text-sm font-bold text-zinc-700">2.99%</p>
              </div>
              <p className="text-sm text-zinc-600">If you pay your filing fees online — including through the NYSCEF e-filing system — the Unified Court System adds a non-refundable 2.99% service fee on all credit card transactions. On the $335 mandatory total, that works out to roughly an extra $10. The $335 figure assumes you are paying in person with cash, a certified bank check, or a money order. If you pay electronically, budget accordingly.</p>
            </div>

            <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-5">
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-sm font-bold text-zinc-900">Filing a Settlement / Separation Agreement</p>
                <p className="text-sm font-bold text-zinc-700">$35</p>
              </div>
              <p className="text-sm text-zinc-600">If you file a stipulation or settlement agreement with the court, there is a $35 filing fee. Not all uncontested divorces require a separately filed agreement — but if yours includes one, this fee applies.</p>
            </div>

            <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-5">
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-sm font-bold text-zinc-900">Motions</p>
                <p className="text-sm font-bold text-zinc-700">$45 each</p>
              </div>
              <p className="text-sm text-zinc-600">If you need to file any motions during the process (for example, a motion to proceed as a poor person for a fee waiver), each motion costs $45. In a straightforward uncontested case with no children and no disputed issues, you typically will not need to file any motions.</p>
            </div>
          </div>
        </section>

        {/* Fee Waiver */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Can You Get a Fee Waiver?</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            Yes. If you cannot afford the filing fees, you can apply to proceed as a &ldquo;poor person&rdquo; under CPLR § 1101. You do this by filing an Affirmation in Support of Application for Waiver of Court Costs, Fees and Expenses. The judge will review your financial situation and decide whether to waive the fees.
          </p>
          <p className="text-zinc-700 leading-relaxed">
            If you are currently receiving public benefits such as Medicaid, SNAP (food stamps), SSI, or TANF, you may automatically qualify. Bring documentation of your benefits when you file.
          </p>
        </section>

        {/* What DivorceGPT costs */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">What About DivorceGPT&apos;s Fee?</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            DivorceGPT charges <strong>$99</strong> for AI-assisted document preparation. This is a document preparation fee — not a court filing fee. It covers the preparation of your complete court-ready document packet with plain-language guidance through every field.
          </p>
          <p className="text-zinc-700 leading-relaxed">
            The $99 is separate from the $335 in court fees. Your total out-of-pocket cost for an uncontested divorce using DivorceGPT would be approximately <strong>$434</strong> ($99 + $335), plus any additional costs for service of process or certified copies.
          </p>
        </section>

        {/* Summary Table */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Quick Reference</h2>
          <div className="rounded-xl bg-white ring-1 ring-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-5 py-3 font-bold text-zinc-900">Fee</th>
                  <th className="text-right px-5 py-3 font-bold text-zinc-900">Amount</th>
                  <th className="text-left px-5 py-3 font-bold text-zinc-900">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr><td className="px-5 py-3 text-zinc-700">Index Number</td><td className="px-5 py-3 text-right font-semibold text-zinc-900">$210</td><td className="px-5 py-3 text-zinc-500">At filing</td></tr>
                <tr><td className="px-5 py-3 text-zinc-700">Note of Issue + RJI</td><td className="px-5 py-3 text-right font-semibold text-zinc-900">$125</td><td className="px-5 py-3 text-zinc-500">When submitting for review</td></tr>
                <tr className="bg-[#1a365d]/5"><td className="px-5 py-3 font-bold text-[#1a365d]">Total (Court Fees)</td><td className="px-5 py-3 text-right font-bold text-[#1a365d]">$335</td><td className="px-5 py-3 text-zinc-500">Mandatory</td></tr>
                <tr><td className="px-5 py-3 text-zinc-700">DivorceGPT Document Prep</td><td className="px-5 py-3 text-right font-semibold text-zinc-900">$99</td><td className="px-5 py-3 text-zinc-500">Optional</td></tr>
                <tr><td className="px-5 py-3 text-zinc-700">Certified Judgment Copy</td><td className="px-5 py-3 text-right font-semibold text-zinc-900">~$8+</td><td className="px-5 py-3 text-zinc-500">After judgment</td></tr>
                <tr><td className="px-5 py-3 text-zinc-700">Certificate of Dissolution (DOH-2168)</td><td className="px-5 py-3 text-right font-semibold text-zinc-900">$5</td><td className="px-5 py-3 text-zinc-500">With final judgment</td></tr>
                <tr><td className="px-5 py-3 text-zinc-700">Process Server (if needed)</td><td className="px-5 py-3 text-right font-semibold text-zinc-900">$85–$150</td><td className="px-5 py-3 text-zinc-500">During service</td></tr>
                <tr><td className="px-5 py-3 text-zinc-700">Credit Card Surcharge (if paying online)</td><td className="px-5 py-3 text-right font-semibold text-zinc-900">2.99%</td><td className="px-5 py-3 text-zinc-500">At payment</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <hr className="border-zinc-200 my-12" />

        <div className="rounded-2xl bg-gradient-to-b from-[#1a365d] to-[#234876] p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-3">Ready to Prepare Your Divorce Documents?</h3>
          <p className="text-sm text-zinc-300 mb-6 max-w-lg mx-auto">
            DivorceGPT prepares your complete court-ready document packet for $99 — with plain-language guidance through every field.
          </p>
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c59d5f] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#c59d5f]/25 hover:bg-[#d4ac6e] hover:shadow-xl transition-all">
            Get Started — $99 →
          </Link>
          <p className="mt-3 text-xs text-zinc-400">New York &amp; New Jersey · Uncontested · No Children</p>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200">
          <p className="text-xs text-zinc-400 text-center">© 2025 June Guided Solutions, LLC · This guide is for educational purposes only and does not constitute legal advice.</p>
          <p className="text-xs text-zinc-400 text-center mt-1">Fees current as of March 2026. Verify with your county clerk before filing.</p>
        </div>
      </article>
    </div>
  );
}
