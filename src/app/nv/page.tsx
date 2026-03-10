"use client";

import Link from "next/link";

export default function NVHome() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20">
                <span className="text-lg">&#9878;&#65039;</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1>
                <p className="text-xs text-zinc-500">Nevada Document Preparation</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1a365d] via-[#1e3a5f] to-[#234876] pt-16 pb-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#c59d5f]/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#c59d5f]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Nevada Document Preparation
          </h2>
          <p className="mt-2 text-2xl font-semibold text-[#c59d5f] sm:text-3xl">Uncontested Joint Petition Divorce</p>
          <p className="mt-6 text-lg text-zinc-300 max-w-2xl mx-auto">
            AI-powered document preparation for Nevada uncontested divorces. Generate your complete filing packet in one session.
          </p>

          <div className="mt-10">
            <Link
              href="/nv/qualify"
              className="group inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-[#c59d5f]/30 transition-all duration-200 hover:bg-[#d4ac6e] hover:shadow-2xl hover:shadow-[#c59d5f]/40 hover:-translate-y-0.5"
            >
              Check Eligibility
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          <p className="mt-4 text-sm text-zinc-400">One-time fee of $29 &middot; 12-month access &middot; No subscription</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">How It Works</h3>
            <p className="mt-4 text-lg text-zinc-600">Nevada&apos;s Joint Petition process is straightforward</p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Check Eligibility", desc: "Answer a few questions to confirm your divorce qualifies for our service." },
              { title: "Provide Your Info", desc: "Chat with our AI clerk to provide information about both spouses, the marriage, and your witness." },
              { title: "Download & Sign", desc: "Download your complete filing packet. Both spouses and witness sign before a notary." },
              { title: "File with Court", desc: "File everything with your county's District Court Clerk. Judge signs the Decree within 1-3 weeks." },
            ].map((step, index) => (
              <div key={index} className="relative">
                {index < 3 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-[#c59d5f] to-transparent" />
                )}
                <div className="relative rounded-2xl bg-zinc-50 p-8 transition-all duration-200 hover:bg-zinc-100 hover:shadow-lg">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-xl font-bold text-white shadow-lg shadow-[#1a365d]/20">
                    {index + 1}
                  </div>
                  <h4 className="mt-6 text-lg font-semibold text-zinc-900">{step.title}</h4>
                  <p className="mt-2 text-sm text-zinc-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Your Filing Packet */}
      <section className="py-24 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Your Filing Packet</h3>
            <p className="mt-4 text-lg text-zinc-600">Four documents, generated in one session</p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Cover Sheet", desc: "Civil (Family/Juvenile-Related) Cover Sheet required by the court." },
              { title: "Joint Petition", desc: "Joint Petition for Divorce (No Children) - the core filing document." },
              { title: "Decree of Divorce", desc: "Proposed Decree for the judge to review and sign." },
              { title: "Affidavit of Witness", desc: "Affidavit of Resident Witness proving 6-week NV residency." },
            ].map((card, index) => (
              <div key={index} className="group rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-100 transition-all duration-200 hover:shadow-xl hover:ring-[#c59d5f]/20 hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-white shadow-lg shadow-[#1a365d]/20 transition-transform duration-200 group-hover:scale-110">
                  <span className="text-xl">&#128196;</span>
                </div>
                <h4 className="mt-6 text-lg font-semibold text-zinc-900">{card.title}</h4>
                <p className="mt-2 text-sm text-zinc-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility Section */}
      <section className="py-24 bg-gradient-to-b from-[#1a365d] via-[#1e3a5f] to-[#234876]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Eligibility Requirements</h3>
          <p className="mt-4 text-lg text-zinc-300">DivorceGPT works for simple, uncontested Nevada divorces</p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 text-left max-w-2xl mx-auto">
            {[
              "Both spouses agree to divorce",
              "No minor children",
              "No undivided property or debt",
              "No spousal support requested",
              "At least one spouse: 6 weeks in NV",
              "NV resident witness available",
              "Neither spouse is active military",
              "No domestic violence history",
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 ring-1 ring-white/10">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c59d5f] text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-white">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Link
              href="/nv/qualify"
              className="group inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-[#c59d5f]/30 transition-all duration-200 hover:bg-[#d4ac6e] hover:shadow-2xl hover:-translate-y-0.5"
            >
              Check Eligibility
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Frequently Asked Questions</h3>
          </div>

          <div className="mt-12 space-y-4">
            {[
              { q: "How long does a Nevada divorce take?", a: "After filing your packet with the court, most judges sign the Decree within 1-3 weeks. There is no mandatory waiting period in Nevada." },
              { q: "Do I need a lawyer?", a: "DivorceGPT prepares documents for pro se (self-represented) filers. If your situation is complex, we recommend consulting an attorney." },
              { q: "What is the Affidavit of Resident Witness?", a: "Nevada requires a third-party witness (not a spouse) who is a NV resident and can attest to the filing spouse's 6-week NV residency. This is typically a friend, neighbor, or coworker." },
              { q: "Do the forms need to be notarized?", a: "Yes. The Joint Petition, Decree, and Affidavit all require notarization. Both spouses sign the Petition and Decree before a notary. The witness signs the Affidavit before a notary." },
              { q: "How much does filing cost?", a: "DivorceGPT charges $29 for document preparation. The court filing fee is approximately $326 (varies by county). Notary fees are separate." },
              { q: "What if we have property but already divided it?", a: "If you and your spouse have already divided all community property and debt by mutual agreement, DivorceGPT can handle your case. If anything still needs to be divided, you'll need an attorney." },
            ].map((faq, index) => (
              <div key={index} className="rounded-2xl bg-zinc-50 p-6 transition-all duration-200 hover:bg-zinc-100">
                <h4 className="text-lg font-semibold text-zinc-900">{faq.q}</h4>
                <p className="mt-2 text-zinc-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-zinc-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282]">
                <span className="text-sm">&#9878;&#65039;</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-900">DivorceGPT</span>
                <p className="text-xs text-zinc-400">&copy; 2025 DivorceGPT by June Guided Solutions, LLC</p>
              </div>
            </div>
            <p className="text-center text-sm text-zinc-500 max-w-md">
              DivorceGPT is a document preparation service. This is not a law firm and does not provide legal advice.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-zinc-600 transition hover:text-[#1a365d]">Privacy</Link>
              <Link href="/terms" className="text-zinc-600 transition hover:text-[#1a365d]">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
