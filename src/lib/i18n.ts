// ───────────────────────────────────────────────────────────────
// i18n — Korean + English only.
// DivorceGPT serves English at the root and Korean under /ko.
// This helper centralizes hreflang alternates and the EN↔KO path map
// so every page and the language switch stay in sync.
// ───────────────────────────────────────────────────────────────

export type Locale = "en" | "ko";

/**
 * Canonical EN ↔ KO path pairs for pages that have both versions.
 * Keys are English paths; values are the Korean counterpart.
 * Pages NOT listed here have no Korean route yet (e.g. the funnel),
 * and the switch falls back to the Korean home.
 */
export const EN_TO_KO: Record<string, string> = {
  "/": "/ko",
  "/ny": "/ko/ny",
  "/nj": "/ko/nj",
  "/guides": "/ko/blog",
};

export const KO_TO_EN: Record<string, string> = Object.fromEntries(
  Object.entries(EN_TO_KO).map(([en, ko]) => [ko, en])
);

/** Resolve the Korean counterpart for an English path (fallback: /ko). */
export function koHref(enPath: string): string {
  return EN_TO_KO[enPath] ?? "/ko";
}

/** Resolve the English counterpart for a Korean path (fallback: /). */
export function enHref(koPath: string): string {
  return KO_TO_EN[koPath] ?? "/";
}

/**
 * Build the Next `alternates` metadata block for a page.
 * Pass the English path and its Korean counterpart; both pages should
 * call this with the SAME pair so the hreflang links are reciprocal.
 */
export function hreflangAlternates(enPath: string, koPath: string) {
  return {
    canonical: enPath, // overridden per-page below when needed
    languages: {
      "en-US": enPath,
      "ko-KR": koPath,
      "x-default": enPath,
    },
  };
}
