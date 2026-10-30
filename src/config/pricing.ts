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

export interface Quote {
  total: number;
  lines: { label: string; amount: number }[];
}

export function quoteFor(opts: { children: boolean; assets: boolean }): Quote {
  const lines: Quote["lines"] = [{ label: "Uncontested divorce — attorney-reviewed, prepared and filed", amount: PRICING.base }];
  if (opts.children) lines.push({ label: "Minor children (custody, parenting time, child support)", amount: PRICING.children });
  if (opts.assets) lines.push({ label: "Assets or debts to divide", amount: PRICING.assets });
  return { total: lines.reduce((n, l) => n + l.amount, 0), lines };
}

export function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
