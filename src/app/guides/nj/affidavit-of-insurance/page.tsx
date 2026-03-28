import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Do I Need an Affidavit of Insurance for an Uncontested Divorce in New Jersey? | DivorceGPT",
  description:
    "No — if you are only seeking a divorce with no financial claims, New Jersey Court Rule 5:4-2(f) provides an exception. Learn what to file instead and why.",
  openGraph: {
    title:
      "NJ Divorce: Do You Need the Affidavit of Insurance Coverage?",
    description:
      "R. 5:4-2(f) exempts dissolution-only cases from the full insurance affidavit. Here is what the rule says and what you file instead.",
    url: "https://divorcegpt.com/guides/nj/affidavit-of-insurance",
    siteName: "DivorceGPT",
    type: "article",
  },
};

export default function NJInsuranceAffidavitGuide() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20">
                <span className="text-lg">⚖️</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1>
                <p className="text-xs text-zinc-500">
                  by{" "}
                  <span className="underline">
                    June Guided Solutions, LLC
                  </span>
                </p>
              </div>
            </Link>
            <Link
              href="/guides"
              className="text-sm font-medium text-zinc-600 hover:text-[#1a365d] transition"
            >
              ← All Guides
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f2440] via-[#1a365d] to-[#1e3a5f] py-16 lg:py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#c59d5f]/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-zinc-300 ring-1 ring-white/20 mb-6">
            New Jersey · R. 5:4-2(f)
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Do I Need an Affidavit of Insurance for My NJ Divorce?
          </h1>
          <p className="mt-5 text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            If you are filing for an uncontested divorce in New Jersey and the only thing you want is the dissolution of your marriage — no alimony, no equitable distribution, no child support — the answer is <strong className="text-white">no</strong>. Here is why.
          </p>
        </div>
      </section>

      {/* Content */}
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* The general rule */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900">
            The General Rule: R. 5:4-2(f)
          </h2>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            New Jersey Court Rule 5:4-2(f) requires that the first pleading filed by each party in a divorce action include an affidavit or certification listing all known insurance coverage — life, health, automobile, homeowner&apos;s, renter&apos;s, umbrella, long-term care, and disability insurance. The affidavit must identify the insurance company, policy number, named insured, covered persons, coverage description, policy term, and whether any coverage was canceled or modified in the 90 days before the filing.
          </p>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            The purpose of this requirement is to preserve the status quo. Once insurance is disclosed, the rule mandates that all identified coverage be maintained pending further order of the court. This prevents one spouse from retaliating by dropping the other from health insurance or canceling policies during litigation.
          </p>
        </section>

        {/* The exception */}
        <section className="mb-12">
          <div className="rounded-xl bg-green-50 ring-1 ring-green-200 p-6">
            <h2 className="text-xl font-bold text-green-900">
              The Exception: Dissolution-Only Cases
            </h2>
            <p className="mt-4 text-green-800 leading-relaxed">
              The same rule — R. 5:4-2(f) — contains an explicit exception. If the <strong>only relief sought is dissolution of the marriage</strong> (or civil union, or domestic partnership), or if the parties have already reached a settlement agreement addressing insurance coverage, the full insurance affidavit is <strong>not required</strong>.
            </p>
            <p className="mt-4 text-green-800 leading-relaxed">
              Instead, the parties file a short affidavit or certification <strong>stating that the only relief sought is dissolution</strong>. This substitute affidavit takes the place of the full insurance certification.
            </p>
          </div>
        </section>

        {/* The actual rule text */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900">
            What the Rule Actually Says
          </h2>
          <div className="mt-4 rounded-xl bg-zinc-100 p-6 ring-1 ring-zinc-200">
            <p className="text-sm text-zinc-700 leading-relaxed italic">
              &ldquo;If, however, the only relief sought is dissolution of the marriage or civil union, or a termination of a domestic partnership, or if a settlement agreement addressing insurance coverage has already been reached, the parties shall annex to their pleadings, <strong>in lieu of the required insurance affidavit</strong>, an affidavit so stating.&rdquo;
            </p>
            <p className="mt-3 text-xs text-zinc-500">
              — N.J. Court Rule 5:4-2(f)
            </p>
          </div>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            The key phrase is &ldquo;in lieu of.&rdquo; The rule does not say you can skip the filing entirely — it says you file a <em>different, shorter</em> document that certifies the only relief you are seeking is dissolution. This satisfies the court&apos;s requirement without disclosing all insurance details.
          </p>
        </section>

        {/* Why this matters */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900">
            Why This Matters for Uncontested Divorces
          </h2>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            DivorceGPT handles uncontested divorces in New Jersey where neither party is seeking alimony, equitable distribution, child support, or any other financial relief — only the legal dissolution of the marriage. These cases fall squarely within the R. 5:4-2(f) exception.
          </p>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            That means you do <strong>not</strong>{" "}need to gather all of your insurance policy numbers, coverage details, and beneficiary information to file. You need only certify that dissolution is the sole relief sought. DivorceGPT&apos;s Complaint for Divorce and accompanying certifications are drafted to reflect this.
          </p>
        </section>

        {/* Important caveat */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900">
            When the Full Affidavit <em>Is</em> Required
          </h2>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            The exception only applies when dissolution is the sole relief sought. If either party requests financial relief — alimony, equitable distribution of assets, child support, or counsel fees — the full insurance affidavit is required. Under the rule, if the responding party (the defendant) seeks financial relief in their answer or counterclaim, the responding party must file the insurance affidavit and the plaintiff must do the same within 20 days.
          </p>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            This is one reason DivorceGPT disqualifies cases that involve financial claims. The moment alimony or equitable distribution enters the picture, the procedural requirements — including the insurance affidavit — become significantly more complex.
          </p>
        </section>

        {/* Common misconception */}
        <section className="mb-12">
          <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 p-6">
            <h3 className="font-bold text-amber-900">
              Common Misconception
            </h3>
            <p className="mt-2 text-sm text-amber-800 leading-relaxed">
              Many guides — including some court websites and self-help resources — list the Certification of Insurance Coverage as a required filing for <em>all</em> divorce cases. This is understandable because it <em>is</em> the general rule. But the exception for dissolution-only cases is written directly into R. 5:4-2(f) and is routinely applied by the courts. If you are filing for a simple, uncontested divorce with no financial claims, you do not need the full insurance certification. You file the substitute affidavit instead.
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-12">
          <div className="rounded-xl bg-zinc-100 ring-1 ring-zinc-200 p-5">
            <p className="text-sm text-zinc-600 leading-relaxed">
              <strong>Disclaimer:</strong> This guide is published by DivorceGPT, a product of June Guided Solutions, LLC, for educational purposes only. It does not constitute legal advice. Court rules and local practices vary by county and can change. If you have questions about your specific situation, consult a licensed attorney in New Jersey. You can find one through the{" "}
              <a
                href="https://njsba.com/resources/county-bar-associations/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[#1a365d] hover:text-[#2c5282]"
              >
                New Jersey State Bar Association Lawyer Referral Service
              </a>
              .
            </p>
          </div>
        </section>

        <p className="text-xs text-zinc-400 text-center">
          Last updated: March 2026 · DivorceGPT by June Guided Solutions, LLC
        </p>
      </article>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-zinc-900 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-zinc-500">
            © 2025 June Guided Solutions, LLC · Educational purposes only · Not
            legal advice
          </p>
        </div>
      </footer>
    </div>
  );
}
