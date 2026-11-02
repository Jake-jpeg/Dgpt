/**
 * Child Support Standards Act arithmetic (DRL § 240(1-b)) for the UD-8
 * worksheet — deterministic, from the figures pinned in
 * src/config/legal/ny-guidelines-2026.ts. The worksheet PRINTS every step
 * so the attorney sees what the engine did; nothing here is an award.
 *
 * What is computed: the FICA deduction (Medicare + Social Security up to the
 * wage base), adjusted and combined parental income, the statutory
 * percentage, the basic obligation on combined income up to the cap, each
 * parent's pro-rata share, the non-custodial parent's annual/monthly/weekly
 * amount, and the self-support-reserve / poverty-level tests.
 *
 * What is NOT computed (left for the attorney, printed as blanks): income
 * above the cap (the court's § 240(1-b)(f) factors), maintenance paid or
 * received, child support paid for other children, add-ons (child care,
 * health insurance, education), and any deviation the parties agreed —
 * their agreement is printed beside the guideline figure.
 */
import { CSSA_GUIDELINES } from "@/config/legal/ny-guidelines-2026";

/** 2026 FICA: 6.2% Social Security to the wage base, 1.45% Medicare on all. [ATTORNEY VERIFY the wage base each January.] */
export const FICA = { socialSecurityRate: 0.062, socialSecurityWageBase: 184_500, medicareRate: 0.0145, year: "2026" } as const;

export function fica(grossAnnual: number): number {
  const ss = Math.min(Math.max(grossAnnual, 0), FICA.socialSecurityWageBase) * FICA.socialSecurityRate;
  const medicare = Math.max(grossAnnual, 0) * FICA.medicareRate;
  return round(ss + medicare);
}

export function percentageFor(children: number): number {
  const p = CSSA_GUIDELINES.percentages;
  if (children <= 1) return p.one;
  if (children === 2) return p.two;
  if (children === 3) return p.three;
  if (children === 4) return p.four;
  return p.fiveOrMore;
}

export interface CssaInput {
  /** Gross annual income, each parent. */
  custodialGross: number;
  nonCustodialGross: number;
  children: number;
}

export interface CssaResult {
  custodial: { gross: number; fica: number; adjusted: number; share: number };
  nonCustodial: { gross: number; fica: number; adjusted: number; share: number };
  combined: number;
  cap: number;
  combinedUpToCap: number;
  aboveCap: number;
  percentage: number;
  /** Basic obligation on combined income up to the cap (annual). */
  basicAnnual: number;
  /** Non-custodial parent's pro-rata share of the basic obligation (annual), before the reserve test. */
  ncpAnnualBeforeReserve: number;
  /** Self-support reserve / poverty tests (DRL § 240(1-b)(d)). */
  reserve: { selfSupportReserve: number; povertyLevel: number; applied: "NONE" | "RESERVE" | "POVERTY_MINIMUM"; };
  ncpAnnual: number;
  ncpMonthly: number;
  ncpWeekly: number;
  guidelineYear: string;
  chart: string;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeCssa(input: CssaInput): CssaResult {
  const g = CSSA_GUIDELINES;
  const cGross = Math.max(0, input.custodialGross || 0);
  const nGross = Math.max(0, input.nonCustodialGross || 0);
  const cFica = fica(cGross);
  const nFica = fica(nGross);
  const cAdj = round(cGross - cFica);
  const nAdj = round(nGross - nFica);
  const combined = round(cAdj + nAdj);
  const cap = g.combinedIncomeCap;
  const combinedUpToCap = Math.min(combined, cap);
  const aboveCap = round(Math.max(0, combined - cap));
  const pct = percentageFor(input.children);
  const basicAnnual = round(combinedUpToCap * pct);
  const nShare = combined > 0 ? round(nAdj / combined) : 0;
  const cShare = combined > 0 ? round(1 - nShare) : 0;
  const ncpBefore = round(basicAnnual * nShare);

  // Self-support reserve: if the obligation would leave the NCP below the
  // reserve, the obligation is the greater of (income − reserve) and $50/month;
  // if the NCP's income is below the poverty level, $25/month.
  let ncpAnnual = ncpBefore;
  let applied: CssaResult["reserve"]["applied"] = "NONE";
  if (nAdj < g.povertyIncomeGuideline) {
    ncpAnnual = 25 * 12;
    applied = "POVERTY_MINIMUM";
  } else if (nAdj - ncpBefore < g.selfSupportReserve) {
    ncpAnnual = round(Math.max(nAdj - g.selfSupportReserve, 50 * 12));
    applied = "RESERVE";
  }

  return {
    custodial: { gross: cGross, fica: cFica, adjusted: cAdj, share: cShare },
    nonCustodial: { gross: nGross, fica: nFica, adjusted: nAdj, share: nShare },
    combined,
    cap,
    combinedUpToCap,
    aboveCap,
    percentage: pct,
    basicAnnual,
    ncpAnnualBeforeReserve: ncpBefore,
    reserve: { selfSupportReserve: g.selfSupportReserve, povertyLevel: g.povertyIncomeGuideline, applied },
    ncpAnnual,
    ncpMonthly: round(ncpAnnual / 12),
    ncpWeekly: round(ncpAnnual / 52),
    guidelineYear: g.year,
    chart: g.chartLabel,
  };
}

export function money(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function pct(n: number): string {
  return `${Math.round(n * 10000) / 100}%`;
}
