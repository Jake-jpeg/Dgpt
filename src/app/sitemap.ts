import type { MetadataRoute } from "next";
import { DIVORCEGPT_BLOG_SLUGS } from "@/content/blog";

/** Public pages only: the articles. The door stays behind the access gate until launch. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.APP_URL || "https://divorcegpt.com").replace(/\/$/, "");
  return [
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ...DIVORCEGPT_BLOG_SLUGS.map((slug) => ({ url: `${base}/blog/${slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
