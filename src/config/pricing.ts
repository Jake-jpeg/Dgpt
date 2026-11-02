/**
 * The firm's flat fee for an uncontested divorce through DivorceGPT
 * (operator, 2026-10-30: "$1,500 (no kids no assets) – $3,000 (kids and
 * assets); something like that"). June quotes it up front; the app takes no
 * payment (docs/NO-PAYMENTS-POSTURE.md) — the number is information for the
 * two spouses, and the firm bills in its own system.
 *
 * Every figure is here, in one place, so the attorney changes a price by
 * changing a number — never copy in a component.
 */
export const PRICING = {
  currency: "USD",
  /** Uncontested, no minor children, no significant assets or debts to divide. */
  base: 1500,
  /** Minor children of the marriage (custody, parenting time, child support). */
  children: 750,
  /** Significant assets or debts to divide (real estate, retirement, accounts, loans). */
  assets: 750,
} as const;

/**
 * The REVIEW tier (2026-11-02, the software-company / law-firm structure):
 * the firm reviews the packet, corrects it, meets both spouses, and hands
 * back a finished set; the client files. Flat, regardless of children or
 * assets. The Review-and-file tier keeps the base/children/assets schedule.
 * Per-firm overrides live on the firm row (src/lib/db/firms.ts); these are
 * the defaults the default firm is seeded with and the door displays.
 */
export const REVIEW_FEE = 1000;
export const DEFAULT_TIER: "REVIEW" | "REVIEW_AND_FILE" = "REVIEW";

export interface Quote {
  total: number;
  lines: { label: string; amount: number }[];
}

export function quoteFor(opts: { children: boolean; assets: boolean; tier?: "REVIEW" | "REVIEW_AND_FILE" }): Quote {
  if ((opts.tier ?? DEFAULT_TIER) === "REVIEW") {
    return { total: REVIEW_FEE, lines: [{ label: "Attorney review of your divorce papers, corrections, and the meeting with both of you — you file", amount: REVIEW_FEE }] };
  }
  const lines: Quote["lines"] = [{ label: "Uncontested divorce — attorney-reviewed, prepared and filed", amount: PRICING.base }];
  if (opts.children) lines.push({ label: "Minor children (custody, parenting time, child support)", amount: PRICING.children });
  if (opts.assets) lines.push({ label: "Assets or debts to divide", amount: PRICING.assets });
  return { total: lines.reduce((n, l) => n + l.amount, 0), lines };
}

/** "a flat $1,000" (Review) or "$1,500–$3,000, depending on children and assets" (Review-and-file). */
export function feePhrase(tier: "REVIEW" | "REVIEW_AND_FILE" = DEFAULT_TIER): { lo: string; hi: string; flat: boolean } {
  const lo = formatUsd(quoteFor({ children: false, assets: false, tier }).total);
  const hi = formatUsd(quoteFor({ children: true, assets: true, tier }).total);
  return { lo, hi, flat: lo === hi };
}

export function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
