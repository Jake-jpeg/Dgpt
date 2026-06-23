import type { Metadata } from "next";
import Link from "next/link";
import LanguageToggle from "../../components/LanguageToggle";

export const metadata: Metadata = {
  title: {
    default: "DivorceGPT — 한국어 합의 이혼 서류 준비 (뉴욕·뉴저지)",
    template: "%s | DivorceGPT 한국어",
  },
  description:
    "뉴욕과 뉴저지에서 변호사 없이 합의 이혼(무쟁점 이혼) 서류를 한국어로 준비하세요. DivorceGPT는 한국어와 영어를 지원하는 AI 서류 준비 서비스입니다.",
  alternates: {
    canonical: "/ko",
    languages: { "en-US": "/", "ko-KR": "/ko", "x-default": "/" },
  },
  openGraph: {
    title: "DivorceGPT — 한국어 합의 이혼 서류 준비",
    description: "뉴욕·뉴저지 합의 이혼 서류를 한국어로 준비하세요.",
    url: "https://divorcegpt.com/ko",
    siteName: "DivorceGPT",
    locale: "ko_KR",
    type: "website",
  },
};

export default function KoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50" lang="ko">
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/ko" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20">
                <span className="text-lg">⚖️</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900" translate="no">DivorceGPT</h1>
                <p className="text-xs text-zinc-500" translate="no">by June Guided Solutions, LLC</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <nav className="hidden sm:flex items-center gap-5 text-sm font-medium text-zinc-600">
                <Link href="/ko/ny" className="hover:text-[#1a365d] transition">뉴욕</Link>
                <Link href="/ko/nj" className="hover:text-[#1a365d] transition">뉴저지</Link>
                <Link href="/ko/blog" className="hover:text-[#1a365d] transition">블로그</Link>
              </nav>
              <LanguageToggle />
            </div>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-zinc-100 bg-zinc-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-white" translate="no">DivorceGPT</p>
              <p className="mt-1 text-xs text-zinc-500" translate="no">© 2025 June Guided Solutions, LLC</p>
              <p className="mt-1 text-xs text-zinc-500">서류 준비 서비스입니다. 법률 자문이 아닙니다.</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/ko/ny" className="text-zinc-400 hover:text-[#c59d5f] transition">뉴욕</Link>
              <Link href="/ko/nj" className="text-zinc-400 hover:text-[#c59d5f] transition">뉴저지</Link>
              <Link href="/ko/blog" className="text-zinc-400 hover:text-[#c59d5f] transition">블로그</Link>
              <Link href="/privacy" className="text-zinc-400 hover:text-[#c59d5f] transition">개인정보 보호</Link>
              <Link href="/terms" className="text-zinc-400 hover:text-[#c59d5f] transition">이용약관</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
