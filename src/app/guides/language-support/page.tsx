import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Korean & English Support (한국어 지원) | DivorceGPT",
  description:
    "DivorceGPT is a Korean and English service for AI-assisted uncontested divorce form preparation in New York and New Jersey. 뉴욕·뉴저지 합의 이혼 서류를 한국어로 준비하세요.",
  openGraph: {
    title: "Korean & English Support | DivorceGPT 한국어 지원",
    description:
      "DivorceGPT operates in Korean and English. Court filings are generated in English. 한국어와 영어로 이용 가능합니다.",
    url: "https://divorcegpt.com/guides/language-support",
    siteName: "DivorceGPT",
    type: "article",
  },
};

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
                  by <span className="underline">June Guided Solutions, LLC</span>
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
          <span className="inline-flex items-center rounded-full bg-[#c59d5f]/20 px-4 py-1.5 text-sm font-bold text-[#c59d5f] mb-6">
            한국어 &amp; English
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Korean &amp; English Support
          </h1>
          <p className="mt-5 text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            DivorceGPT is built for Korean and English speakers preparing an uncontested divorce in New York and New Jersey.
            한국어와 영어로 뉴욕·뉴저지 합의 이혼 서류를 준비할 수 있습니다.
          </p>
        </div>
      </section>

      {/* Body */}
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900">Two languages — Korean and English</h2>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            You can use DivorceGPT in <strong>Korean (한국어)</strong> or <strong>English</strong>. Use the
            {" "}<strong>한국어 / EN</strong> switch at the top of every page to choose. The AI clerk will explain
            form fields, filing instructions, and the process in whichever of the two languages you select.
          </p>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            DivorceGPT는 한국어 또는 영어로 이용할 수 있습니다. 모든 페이지 상단의 <strong>한국어 / EN</strong> 버튼으로
            언어를 선택하세요. AI는 선택한 언어로 양식 항목과 제출 절차를 안내합니다.
          </p>
        </section>

        <section className="mb-12">
          <div className="rounded-xl bg-[#1a365d]/5 ring-1 ring-[#1a365d]/10 p-6">
            <h2 className="text-xl font-bold text-[#1a365d]">Court filings are in English</h2>
            <p className="mt-3 text-zinc-600 leading-relaxed">
              <strong>All court filings are generated in English.</strong> New York and New Jersey courts require
              documents to be filed in English. Whichever language you use during intake, your final court-ready
              documents will be in English. Please review the English documents carefully — or have someone who reads
              English review them — before filing.
            </p>
            <p className="mt-3 text-zinc-600 leading-relaxed">
              <strong>법원 제출 서류는 영어로 작성됩니다.</strong> 뉴욕과 뉴저지 법원은 영어 서류를 요구합니다. 제출 전에
              영어 서류를 주의 깊게 검토하시거나, 영어를 읽을 수 있는 분 또는 변호사의 검토를 받으시기 바랍니다.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 p-6">
            <h3 className="font-bold text-amber-900">Important Disclaimer / 중요 고지</h3>
            <p className="mt-2 text-sm text-amber-800 leading-relaxed">
              DivorceGPT is a document preparation service, not a law firm, and does not provide legal advice.
              AI-generated explanations may contain errors. For Korean-language users, we recommend confirming your
              understanding of the English court documents with a licensed attorney before filing.
            </p>
            <p className="mt-3 text-sm text-amber-800 leading-relaxed">
              DivorceGPT는 법률 자문을 제공하지 않습니다. 제출 전에 라이선스를 보유한 변호사의 검토를 받으시길 권장합니다.
              Attorney referrals: {" "}
              <a href="https://www.nysba.org/lawyerreferral/" target="_blank" rel="noopener noreferrer" className="underline">New York State Bar Association</a>
              {" · "}
              <a href="https://njsba.com/resources/county-bar-associations/" target="_blank" rel="noopener noreferrer" className="underline">New Jersey State Bar Association</a>.
            </p>
          </div>
        </section>

        <p className="text-xs text-zinc-400 text-center">
          DivorceGPT supports Korean and English only. 한국어와 영어만 지원합니다.
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
