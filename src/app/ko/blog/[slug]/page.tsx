import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "../../../../lib/blog-posts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "글을 찾을 수 없습니다" };
  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/ko/blog/${post.slug}`,
      languages: { "ko-KR": `/ko/blog/${post.slug}` },
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://divorcegpt.com/ko/blog/${post.slug}`,
      siteName: "DivorceGPT",
      locale: "ko_KR",
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function KoBlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <Link href="/ko/blog" className="text-sm text-zinc-500 hover:text-[#1a365d] transition">
        ← 블로그 목록
      </Link>

      <header className="mt-6 mb-10">
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <time dateTime={post.date}>{post.date}</time>
          <span>·</span>
          <span>읽는 시간 {post.readingTime}</span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl leading-tight">
          {post.title}
        </h1>
      </header>

      <div className="space-y-8">
        {post.sections.map((section, i) => (
          <section key={i}>
            {section.heading && (
              <h2 className="text-xl font-bold text-zinc-900 mb-3">{section.heading}</h2>
            )}
            {section.paragraphs.map((p, j) => (
              <p key={j} className="text-zinc-700 leading-relaxed mb-4">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-gradient-to-b from-[#1a365d] to-[#234876] p-8 text-center">
        <h3 className="text-xl font-bold text-white">한국어로 합의 이혼 서류를 준비하세요</h3>
        <p className="mt-2 text-sm text-zinc-300">뉴욕·뉴저지 · 합의 이혼 · 자녀 없음</p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/ko/ny" className="inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-[#c59d5f]/25 hover:bg-[#d4ac6e] transition">
            뉴욕에서 시작하기 →
          </Link>
          <Link href="/ko/nj" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-7 py-3 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/20 transition">
            뉴저지에서 시작하기 →
          </Link>
        </div>
      </div>

      <p className="mt-10 text-xs text-zinc-400 text-center leading-relaxed">
        <span translate="no">DivorceGPT</span>는 서류 준비 서비스이며 법률 사무소가 아닙니다. 본 글은 일반 정보 제공용이며 특정 사안에 대한 법률 자문이 아닙니다.
      </p>
    </article>
  );
}
