import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "한국어 합의 이혼 서류 준비 — 뉴욕·뉴저지",
  description:
    "변호사 없이 뉴욕과 뉴저지의 합의 이혼(무쟁점 이혼) 서류를 한국어로 준비하세요. AI가 단계별로 안내하고 법원 제출용 서류를 준비해 드립니다. $500.",
  alternates: {
    canonical: "/ko",
    languages: { "en-US": "/", "ko-KR": "/ko", "x-default": "/" },
  },
};

const steps = [
  { n: "1", title: "자격 확인", desc: "몇 가지 질문으로 이 서비스가 적합한지 확인합니다." },
  { n: "2", title: "$500 결제", desc: "일회성 결제. 숨겨진 비용이나 구독이 없습니다." },
  { n: "3", title: "서류 준비", desc: "AI가 질문을 통해 법원 제출용 서류를 준비합니다." },
  { n: "4", title: "검토 후 제출", desc: "완성된 서류를 검토하고 법원에 직접 제출합니다." },
];

const eligibility = [
  "미성년 자녀가 없고 임신 중이 아님",
  "분할할 재산·연금·부채가 없음",
  "배우자 부양료(위자료) 청구가 없음",
  "두 배우자 모두 이혼에 동의",
  "상대 배우자가 서류 절차에 협조",
  "최소 한 명이 거주 요건 충족",
];

export default function KoHome() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f2440] via-[#1a365d] to-[#1e3a5f] pt-16 pb-20 lg:pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#c59d5f]/8 blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#c59d5f]/5 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center rounded-full bg-[#c59d5f]/20 px-4 py-1.5 text-sm font-bold text-[#c59d5f] mb-6">
            한국어 지원
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]">
            빠르고 합리적인<br />온라인 합의 이혼
          </h2>
          <p className="mt-6 text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            <span translate="no">DivorceGPT</span>는 뉴욕과 뉴저지에서 변호사 없이 합의 이혼 서류를 준비하시는 분들을 위한 한국어·영어 서비스입니다. 단순하고 다툼 없는 사건을 위한 자가 진행 도구입니다.
          </p>
          <p className="mt-4 text-sm text-zinc-400">$500 일회성 비용 · 숨겨진 비용 없음</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/ko/ny" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c59d5f] px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-[#c59d5f]/30 transition-all hover:bg-[#d4ac6e] hover:-translate-y-0.5">
              뉴욕에서 시작하기 →
            </Link>
            <Link href="/ko/nj" className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-8 py-4 text-lg font-semibold text-white ring-1 ring-white/20 transition-all hover:bg-white/20">
              뉴저지에서 시작하기 →
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">진행 방법</h3>
            <p className="mt-4 text-lg text-zinc-600">네 단계로 끝나는 합의 이혼</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl bg-zinc-50 p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-xl font-bold text-white shadow-lg shadow-[#1a365d]/20">
                  {s.n}
                </div>
                <h4 className="mt-6 text-lg font-semibold text-zinc-900">{s.title}</h4>
                <p className="mt-2 text-sm text-zinc-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-20 bg-gradient-to-b from-[#1a365d] via-[#1e3a5f] to-[#234876]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">이런 경우에 적합합니다</h3>
          <p className="mt-4 text-lg text-zinc-300">다음 조건에 모두 해당하는 합의 이혼:</p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 text-left max-w-2xl mx-auto">
            {eligibility.map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c59d5f] text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-white">{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-zinc-400 max-w-2xl mx-auto">
            자녀·재산·부양료에 다툼이 있거나, 가정폭력 이력이 있거나, 현역 군인이 관련된 경우에는 이 서비스 대상이 아닙니다. 이 경우 변호사와 상담하시기 바랍니다.
          </p>
        </div>
      </section>

      {/* Language / filings note */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-[#1a365d]/5 ring-1 ring-[#1a365d]/10 p-6">
            <h3 className="text-xl font-bold text-[#1a365d]">언어 안내</h3>
            <p className="mt-3 text-zinc-600 leading-relaxed">
              안내와 설명은 한국어로 제공됩니다. 다만 <strong>모든 법원 제출 서류는 영어로 작성</strong>됩니다. 뉴욕과 뉴저지 법원이 영어 서류를 요구하기 때문입니다. 제출 전에 영어 서류를 주의 깊게 검토하시거나, 변호사의 검토를 받으시기를 권장합니다.
            </p>
            <p className="mt-3 text-sm text-zinc-500">
              자세한 내용은 <Link href="/ko/blog/welcome-korean-uncontested-divorce" className="text-[#1a365d] underline hover:text-[#c59d5f]">블로그 안내 글</Link>을 참고하세요.
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="pb-16 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-zinc-400 text-center leading-relaxed">
            <span translate="no">DivorceGPT</span>는 서류 준비 서비스이며 법률 사무소가 아닙니다. 법률 자문을 제공하지 않으며, 이용으로 변호사-의뢰인 관계가 성립하지 않습니다.
          </p>
        </div>
      </section>
    </>
  );
}
