import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { DIVORCEGPT_BLOG_SLUGS, getArticle, ARTICLE_BYLINE, type BlogLang } from "@/content/blog";
import { operatingFirmName } from "@/config/branding";
import { GuideChat } from "@/components/guide-chat";

export function generateStaticParams() {
  return DIVORCEGPT_BLOG_SLUGS.map((slug) => ({ slug }));
}

function langOf(v: string | string[] | undefined): BlogLang {
  return v === "ko" ? "ko" : "en";
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getArticle(slug, langOf((await searchParams).lang));
  return post ? { title: `${post.title} | DivorceGPT`, description: post.description } : {};
}

export default async function ArticlePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { slug } = await params;
  const lang = langOf((await searchParams).lang);
  const post = getArticle(slug, lang);
  if (!post) notFound();
  const firm = operatingFirmName();
  const q = lang === "ko" ? "?lang=ko" : "";

  const hero = (
    <div className="blog-hero">
      <div className="door-topline">
        <p className="eyebrow">{lang === "ko" ? `${firm} · 변호사 광고` : `${firm} · Attorney Advertising`}</p>
        <div className="lang-toggle" role="group" aria-label="Language">
          <Link href={`/blog/${slug}`} className={lang === "en" ? "on" : ""}>English</Link>
          <Link href={`/blog/${slug}?lang=ko`} className={lang === "ko" ? "on" : ""}>한국어</Link>
        </div>
      </div>
      <h1 className="blog-title">{post.title}</h1>
      <p className="blog-meta blog-meta-dark">{post.date} · {ARTICLE_BYLINE[lang]}</p>
    </div>
  );

  return (
    <Shell hero={hero}>
      <article className="blog-article">
        {post.sections.map((section, i) => (
          <section key={i}>
            {section.heading && <h2>{section.heading}</h2>}
            {section.paragraphs?.map((p, j) => <p key={j}>{p}</p>)}
            {section.bullets && (
              <ul>
                {section.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
            {section.related && section.related.length > 0 && (
              <p className="blog-related">
                <strong>{lang === "ko" ? "관련 글:" : "Related:"}</strong>{" "}
                {section.related.map((r, k) => (
                  <span key={r.slug}>{k > 0 && ", "}<Link href={`/blog/${r.slug}${q}`}>{r.label}</Link></span>
                ))}
              </p>
            )}
          </section>
        ))}
        {post.sources && post.sources.length > 0 && (
          <section>
            <h2>{lang === "ko" ? "출처" : "Sources"}</h2>
            <ul>
              {post.sources.map((s) => (
                <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
              ))}
            </ul>
          </section>
        )}
        <div className="notice notice-info blog-callout">
          {lang === "ko"
            ? "이 글은 일반적인 정보이며 법률 자문이 아닙니다. 이 글을 읽는 것만으로 변호사-의뢰인 관계가 성립하지 않습니다. 변호사 광고."
            : "This article provides general information only. It is not legal advice, and reading it does not create an attorney-client relationship. Attorney Advertising."}
        </div>
        <GuideChat article={post.slug} lang={lang} />
        <p className="door-staff">
          <Link className="underline" href={`/blog${q}`}>{lang === "ko" ? "← 모든 글" : "← All articles"}</Link>
          {" · "}
          <Link className="underline" href="/portal">{lang === "ko" ? "뉴욕 합의 이혼 시작하기" : "Start an uncontested New York divorce"}</Link>
        </p>
      </article>
    </Shell>
  );
}
