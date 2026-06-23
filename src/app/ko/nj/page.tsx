import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "뉴저지 합의 이혼 서류 준비 (한국어)",
  description:
    "뉴저지에서 변호사 없이 합의 이혼(무쟁점 이혼) 서류를 한국어로 준비하세요. AI가 단계별로 안내합니다. $500.",
  alternates: {
    canonical: "/ko/nj",
    languages: { "en-US": "/nj", "ko-KR": "/ko/nj", "x-default": "/nj" },
  },
};

export default function KoStatePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1a365d] via-[#1e3a5f] to-[#234876] pt-16 pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#c59d5f]/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">뉴저지 합의 이혼</h2>
          <p className="mt-2 text-2xl font-semibold text-[#c59d5f] sm:text-3xl">간편하게 준비하세요</p>
          <p className="mt-6 text-lg text-zinc-300 max-w-2xl mx-auto">
            <span translate="no">DivorceGPT</span>가 뉴저지의 합의 이혼 서류를 단계별로 준비해 드립니다. 변호사 없이 진행하는 단순하고 다툼 없는 사건을 위한 도구입니다.
          </p>
          <p className="mt-4 text-sm text-zinc-400">$500 일회성 비용 · 숨겨진 비용 없음</p>
          <div className="mt-10">
            <Link href="/nj/qualify" className="inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-[#c59d5f]/30 transition-all hover:bg-[#d4ac6e] hover:-translate-y-0.5">
              자격 확인하고 시작하기 →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-6">
            <h3 className="font-bold text-amber-900">진행 안내</h3>
            <p className="mt-2 text-sm text-amber-800 leading-relaxed">
              자격 확인 절차는 현재 <strong>영어로 진행</strong>됩니다. 이후 서류 작성 단계에서는 AI 도우미가 <strong>한국어로</strong> 질문에 답하고 절차를 안내합니다. 모든 법원 제출 서류는 뉴저지주 법원의 요구에 따라 영어로 작성됩니다.
            </p>
          </div>
          <div className="rounded-2xl bg-[#1a365d]/5 ring-1 ring-[#1a365d]/10 p-6">
            <h3 className="text-lg font-bold text-[#1a365d]">대상 사건</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li>• 미성년 자녀가 없고 임신 중이 아닌 경우</li>
              <li>• 분할할 재산·연금·부채가 없는 경우</li>
              <li>• 배우자 부양료(위자료) 청구가 없는 경우</li>
              <li>• 두 배우자 모두 이혼에 동의하는 경우</li>
            </ul>
            <p className="mt-4 text-sm text-zinc-500">
              자세한 내용은 <Link href="/ko/blog/welcome-korean-uncontested-divorce" className="text-[#1a365d] underline hover:text-[#c59d5f]">블로그 안내 글</Link>을 참고하세요.
            </p>
          </div>
          <p className="text-xs text-zinc-400 text-center leading-relaxed">
            <span translate="no">DivorceGPT</span>는 서류 준비 서비스이며 법률 사무소가 아닙니다. 본 페이지는 법률 자문이 아닙니다.
          </p>
        </div>
      </section>
    </>
  );
}
