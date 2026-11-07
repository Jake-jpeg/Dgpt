import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { listArticles, ARTICLE_BYLINE, type BlogLang } from "@/content/blog";
import { operatingFirmName } from "@/config/branding";

/**
 * Articles (2026-11-07): Jake Kim's New York divorce writing, on
 * divorcegpt.com. Public (exempt from the access gate — informational
 * content, nothing of June's). The firm's attorney advertising, bylined.
 */
export const metadata: Metadata = {
  title: "New York divorce articles | DivorceGPT",
  description: "Plain-language articles on New York divorce by Jake S. Kim, Esq. — how divorce works in New York, uncontested versus contested, support while the case is pending, and more.",
};

function langOf(v: string | string[] | undefined): BlogLang {
  return v === "ko" ? "ko" : "en";
}

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const sp = await searchParams;
  const lang = langOf(sp.lang);
  const articles = listArticles(lang);
  const firm = operatingFirmName();
  const q = lang === "ko" ? "?lang=ko" : "";

  const hero = (
    <div className="blog-hero">
      <div className="door-topline">
        <p className="eyebrow">{lang === "ko" ? `${firm} · 변호사 광고` : `${firm} · Attorney Advertising`}</p>
        <div className="lang-toggle" role="group" aria-label="Language">
          <Link href="/blog" aria-current={lang === "en" ? "page" : undefined} className={lang === "en" ? "on" : ""}>English</Link>
          <Link href="/blog?lang=ko" aria-current={lang === "ko" ? "page" : undefined} className={lang === "ko" ? "on" : ""}>한국어</Link>
        </div>
      </div>
      <h1 className="door-h1">{lang === "ko" ? "뉴욕 이혼, 쉽게 설명합니다." : "New York divorce, in plain language."}</h1>
      <p className="door-copy">
        {lang === "ko"
          ? "Jake S. Kim 변호사가 직접 쓴 글입니다. 일반적인 정보이며 법률 자문이 아닙니다."
          : "Written by Jake S. Kim, Esq. General information, not legal advice."}
      </p>
    </div>
  );

  return (
    <Shell hero={hero}>
      <ul className="blog-list">
        {articles.map((a) => (
          <li key={a.slug} className="blog-card">
            <Link href={`/blog/${a.slug}${q}`}>
              <h2>{a.title}</h2>
            </Link>
            <p className="blog-meta">{a.date} · {ARTICLE_BYLINE[lang]}</p>
            <p className="blog-desc">{a.description}</p>
            <Link className="blog-more" href={`/blog/${a.slug}${q}`}>
              {lang === "ko" ? "읽기 →" : "Read →"}
            </Link>
          </li>
        ))}
      </ul>
      <p className="door-staff">
        {lang === "ko" ? "뉴욕 합의 이혼을 시작하려면 " : "Ready to start an uncontested New York divorce? "}
        <Link className="underline" href="/portal">{lang === "ko" ? "여기서 시작하세요" : "Start here"}</Link>.
      </p>
    </Shell>
  );
}
