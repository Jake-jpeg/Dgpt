import type { Metadata } from "next";
import Link from "next/link";
import { POSTS } from "../../../lib/blog-posts";

export const metadata: Metadata = {
  title: "블로그 — 한국어 이혼 정보",
  description:
    "뉴욕·뉴저지 합의 이혼에 대한 한국어 안내와 정보. DivorceGPT 블로그.",
  alternates: {
    canonical: "/ko/blog",
    languages: { "ko-KR": "/ko/blog" },
  },
};

export default function KoBlogIndex() {
  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">블로그</h2>
        <p className="mt-3 text-zinc-600">뉴욕·뉴저지 합의 이혼에 대한 한국어 안내입니다.</p>
      </div>

      <div className="space-y-6">
        {POSTS.map((post) => (
          <Link
            key={post.slug}
            href={`/ko/blog/${post.slug}`}
            className="group block rounded-2xl bg-white p-6 ring-1 ring-zinc-200 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <time dateTime={post.date}>{post.date}</time>
              <span>·</span>
              <span>읽는 시간 {post.readingTime}</span>
            </div>
            <h3 className="mt-2 text-xl font-bold text-zinc-900 group-hover:text-[#1a365d] transition">
              {post.title}
            </h3>
            <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{post.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#c59d5f]">
              읽어보기 →
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-12 text-xs text-zinc-400 text-center">
        <span translate="no">DivorceGPT</span>는 서류 준비 서비스이며 법률 사무소가 아닙니다. 본 블로그는 일반 정보 제공용이며 법률 자문이 아닙니다.
      </p>
    </section>
  );
}
