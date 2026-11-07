/** Articles on divorcegpt.com (2026-11-07): the NY matrimonial selection of the firm's posts, both languages, public. */
import { describe, it, expect } from "vitest";
import { DIVORCEGPT_BLOG_SLUGS, listArticles, getArticle } from "@/content/blog";
import { posts } from "@/content/blog/posts";
import { postsKo } from "@/content/blog/posts-ko";
import { betaGateExempt } from "@/lib/beta";

describe("articles", () => {
  it("every selected slug exists in English and Korean; nothing New Jersey, criminal or immigration is selected", () => {
    const en = new Set(posts.map((p) => p.slug));
    const ko = new Set(postsKo.map((p) => p.slug));
    for (const slug of DIVORCEGPT_BLOG_SLUGS) {
      expect(en.has(slug), `${slug} en`).toBe(true);
      expect(ko.has(slug), `${slug} ko`).toBe(true);
      expect(slug).not.toMatch(/new-jersey|warrant|arrest|gun|airport|green-card-risk|e2-visa|irs|military|sponsor/);
    }
    expect(listArticles("en")).toHaveLength(DIVORCEGPT_BLOG_SLUGS.length);
    expect(listArticles("ko")[0].title).toMatch(/뉴욕/);
  });

  it("related links never point outside the selection; an unselected post is not served", () => {
    for (const a of listArticles("en")) {
      for (const s of a.sections) for (const r of s.related ?? []) expect(DIVORCEGPT_BLOG_SLUGS).toContain(r.slug);
    }
    expect(getArticle("how-divorce-works-new-jersey")).toBeNull();
    expect(getArticle("how-divorce-works-new-york")?.title).toMatch(/New York/);
  });

  it("the articles are public; the door is not", () => {
    expect(betaGateExempt("/blog")).toBe(true);
    expect(betaGateExempt("/blog/how-divorce-works-new-york")).toBe(true);
    expect(betaGateExempt("/portal")).toBe(false);
    expect(betaGateExempt("/start")).toBe(false);
  });
});
