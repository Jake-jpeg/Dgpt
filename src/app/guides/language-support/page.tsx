import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Supported Languages | DivorceGPT — AI Divorce Document Preparation",
  description:
    "DivorceGPT supports 12 languages for AI-assisted divorce form preparation in New York and New Jersey. See the full list, accuracy benchmarks, and important disclaimers.",
  openGraph: {
    title: "Supported Languages | DivorceGPT",
    description:
      "DivorceGPT supports 12 languages including Spanish, Chinese, Korean, Hindi, and Arabic. All court filings are generated in English. See benchmarks and disclaimers.",
    url: "https://divorcegpt.com/guides/language-support",
    siteName: "DivorceGPT",
    type: "article",
  },
};

const supportedLanguages = [
  { name: "English", native: "English", score: "100%", tier: "Baseline" },
  { name: "Spanish", native: "Español", score: "98.1%", tier: "Tier 1" },
  { name: "French", native: "Français", score: "97.9%", tier: "Tier 1" },
  { name: "Portuguese (Brazilian)", native: "Português", score: "97.8%", tier: "Tier 1" },
  { name: "Italian", native: "Italiano", score: "97.7%", tier: "Tier 1" },
  { name: "German", native: "Deutsch", score: "97.7%", tier: "Tier 1" },
  { name: "Indonesian", native: "Bahasa Indonesia", score: "97.3%", tier: "Tier 1" },
  { name: "Arabic", native: "العربية", score: "97.1%", tier: "Tier 1" },
  { name: "Chinese (Simplified)", native: "中文", score: "97.1%", tier: "Tier 1" },
  { name: "Japanese", native: "日本語", score: "96.9%", tier: "Tier 2" },
  { name: "Hindi", native: "हिन्दी", score: "96.8%", tier: "Tier 2" },
  { name: "Korean", native: "한국어", score: "96.6%", tier: "Tier 2" },
];

export default function LanguageSupportGuide() {
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
            <Link href="/guides" className="text-sm font-medium text-zinc-600 hover:text-[#1a365d] transition">
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
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Supported Languages
          </h1>
          <p className="mt-5 text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            DivorceGPT can communicate with you in multiple languages during the intake and form explanation process. Here is the full list, our rationale, and important disclaimers.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

        {/* How it works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900">How Multilingual Support Works</h2>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            DivorceGPT is powered by Anthropic&apos;s Claude AI, which natively supports communication in dozens of languages. When you use DivorceGPT, you can type your questions and answers in any of the supported languages listed below. The AI will respond in that language, explain form fields, and guide you through the process.
          </p>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            <strong className="text-zinc-900">All court filings are generated in English.</strong> New York and New Jersey courts require documents to be filed in English. Regardless of which language you communicate in during the intake process, your final court-ready documents will always be in English. You should review the English-language documents carefully — or have someone who reads English review them — before filing.
          </p>
        </section>

        {/* The list */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900">Supported Languages &amp; Accuracy Benchmarks</h2>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            DivorceGPT has been validated for use in the following 12 languages. The accuracy scores below are relative to English performance (100% baseline) and are sourced from Anthropic&apos;s official multilingual benchmark data, based on professionally human-translated MMLU (Massive Multitask Language Understanding) test sets.
          </p>

          <div className="mt-8 overflow-hidden rounded-xl ring-1 ring-zinc-200">
            <table className="min-w-full text-sm">
              <thead className="bg-[#1a365d] text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Language</th>
                  <th className="px-4 py-3 text-left font-semibold">Native</th>
                  <th className="px-4 py-3 text-center font-semibold">Accuracy vs. English</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {supportedLanguages.map((lang, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50"}>
                    <td className="px-4 py-3 font-medium text-zinc-900">{lang.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{lang.native}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          lang.score === "100%"
                            ? "bg-[#1a365d] text-white"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {lang.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Source: Anthropic Multilingual Support documentation. Scores represent zero-shot chain-of-thought evaluation relative to English (100%). Based on MMLU test sets translated by professional human translators.
          </p>
        </section>

        {/* Why these languages */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900">Why These 12 Languages?</h2>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            DivorceGPT serves diverse communities in New York and New Jersey — two of the most linguistically diverse states in the country. We selected these 12 languages based on two criteria: (1) Anthropic&apos;s published benchmark data showing at least 96% accuracy relative to English, and (2) relevance to the communities we serve.
          </p>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            We intentionally excluded languages where the AI&apos;s accuracy drops below 96% of English performance. This includes many regional languages and dialects — for example, the hundreds of languages spoken across South Asia, sub-Saharan Africa, and indigenous communities worldwide. We recognize this is a limitation, and we encourage speakers of unsupported languages to proceed in English or consult an attorney who speaks their language.
          </p>
        </section>

        {/* Unsupported languages */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900">What If My Language Is Not Listed?</h2>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            If your preferred language is not on the list above, DivorceGPT may still attempt to respond in that language — but the accuracy of those responses cannot be guaranteed. The AI may produce errors, mistranslations, or misinterpretations of legal terminology that could affect your understanding of the forms.
          </p>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            For your protection, we strongly recommend proceeding in English or consulting an attorney who speaks your language before filing any court documents.
          </p>
        </section>

        {/* Bar referrals — ALL non-English */}
        <section className="mb-12">
          <div className="rounded-xl bg-[#1a365d]/5 ring-1 ring-[#1a365d]/10 p-6">
            <h2 className="text-xl font-bold text-[#1a365d]">Attorney Referrals for Non-English Speakers</h2>
            <p className="mt-3 text-zinc-600 leading-relaxed">
              If you are using DivorceGPT in any language other than English, we recommend confirming your understanding of the court documents with a licensed attorney who speaks your language. Even at 98% accuracy, AI-generated explanations in a non-English language may contain nuances or translation differences that could affect your case.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <a
                href="https://www.nysba.org/lawyerreferral/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg bg-white p-4 ring-1 ring-zinc-200 hover:shadow-md transition"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1a365d] text-xs font-bold text-white">
                  NY
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">New York State Bar Association</p>
                  <p className="text-xs text-zinc-500">Lawyer Referral Service</p>
                </div>
              </a>
              <a
                href="https://njsba.com/resources/county-bar-associations/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg bg-white p-4 ring-1 ring-zinc-200 hover:shadow-md transition"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1a365d] text-xs font-bold text-white">
                  NJ
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">New Jersey State Bar Association</p>
                  <p className="text-xs text-zinc-500">Lawyer Referral Service</p>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-12">
          <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 p-6">
            <h3 className="font-bold text-amber-900">Important Disclaimer</h3>
            <p className="mt-2 text-sm text-amber-800 leading-relaxed">
              DivorceGPT can communicate in multiple languages, but AI-generated translations and explanations may contain errors. All court filings generated by DivorceGPT are in English, as required by New York and New Jersey courts. If you interact with DivorceGPT in a language other than English, you do so with the understanding that the AI&apos;s accuracy in that language, while high, is not equivalent to English and has not been independently verified for legal accuracy.
            </p>
            <p className="mt-3 text-sm text-amber-800 leading-relaxed">
              This does not constitute legal advice in any language. DivorceGPT is a document preparation service operated by June Guided Solutions, LLC. For legal advice, consult a licensed attorney.
            </p>
          </div>
        </section>

        {/* Last updated + schema hint */}
        <p className="text-xs text-zinc-400 text-center">
          Last updated: March 2026 · DivorceGPT by June Guided Solutions, LLC
        </p>
      </article>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-zinc-900 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-zinc-500">© 2025 June Guided Solutions, LLC · Educational purposes only · Not legal advice</p>
        </div>
      </footer>
    </div>
  );
}
