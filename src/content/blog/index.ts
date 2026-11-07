/**
 * Articles on divorcegpt.com (2026-11-07).
 *
 * The posts are Jake Kim's own writing, copied verbatim from the firm's
 * website repository (jakekimlaw.com, `src/lib/posts.ts` / `posts-ko.ts`).
 * They are the FIRM's content — attorney advertising by Jake Kim Law Firm,
 * bylined — not the software company's. DivorceGPT shows the New York
 * matrimonial selection only: the MVP is New York, and the criminal,
 * immigration and New Jersey pieces stay on the firm's own site.
 *
 * To add an article: write it in posts.ts / posts-ko.ts (the firm's files)
 * and add its slug below. Nothing else.
 */
import { posts, type Post } from "./posts";
import { postsKo } from "./posts-ko";

export type { Post };

/** The New York matrimonial selection, in display order. */
export const DIVORCEGPT_BLOG_SLUGS: readonly string[] = [
  "how-divorce-works-new-york",
  "uncontested-vs-contested-divorce-new-york",
  "non-monied-spouse-new-york-temporary-support",
  "stay-at-home-spouse-new-york-divorce-cost-support",
  "biggest-asset-in-your-divorce",
  "should-i-get-a-divorce",
  "is-marriage-counseling-appropriate",
  "korean-vs-american-divorce-mindsets",
  "moving-to-korea-during-divorce-custody-green-card",
];

export type BlogLang = "en" | "ko";

const bySlug = (list: Post[]) => new Map(list.map((p) => [p.slug, p]));
const EN = bySlug(posts);
const KO = bySlug(postsKo);

/** Drop `related` links that point outside the selection — never a dead link. */
function scoped(p: Post): Post {
  return {
    ...p,
    sections: p.sections.map((s) => ({
      ...s,
      related: s.related?.filter((r) => DIVORCEGPT_BLOG_SLUGS.includes(r.slug)),
    })),
  };
}

export function listArticles(lang: BlogLang = "en"): Post[] {
  const src = lang === "ko" ? KO : EN;
  return DIVORCEGPT_BLOG_SLUGS.map((slug) => src.get(slug) ?? EN.get(slug))
    .filter((p): p is Post => Boolean(p))
    .map(scoped);
}

export function getArticle(slug: string, lang: BlogLang = "en"): Post | null {
  if (!DIVORCEGPT_BLOG_SLUGS.includes(slug)) return null;
  const p = (lang === "ko" ? KO.get(slug) : undefined) ?? EN.get(slug);
  return p ? scoped(p) : null;
}

/** Author line on every article (RPC 7.1: the firm's advertising carries the firm's name). */
export const ARTICLE_BYLINE = { en: "By Jake S. Kim, Esq. · Jake Kim Law Firm", ko: "글: Jake S. Kim, Esq. · Jake Kim Law Firm" } as const;
