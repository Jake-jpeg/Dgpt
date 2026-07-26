/**
 * NY spousal-maintenance and child-support guideline constants — the
 * ANNUALLY-ADJUSTED figures, pinned to a stated effective year.
 *
 * WHY THIS FILE EXISTS: the operator's directive (2026-07-26) — "Place on the
 * lawyer panel WHICH YEAR of spousal maintenance and child support guidelines
 * are applied." An attorney reviewing a packet must be able to see, without
 * digging, which year's caps the system used, because the caps change every
 * two years (maintenance / CSSA income caps) and every two years for the
 * self-support reserve and poverty figure.
 *
 * NOTHING HERE COMPUTES AN AWARD. These are display + recital constants. The
 * maintenance and CSSA determinations remain attorney determinations; the
 * official UCS calculator and the CSSA chart are the operative tools.
 *
 * Sources (verified 2026-07-26 against live official hosts):
 *   - https://childsupport.ny.gov/pdfs/CSSA.pdf  (LDSS-4515, Rev. 03/26)
 *   - https://www.nycourts.gov/LegacyPDFS/divorce/calculator.pdf
 *   - https://www.nysenate.gov/legislation/laws/DOM/236
 * NOTE: the UCS "What's New in Matrimonial Legislation" page still displays
 * the 2024 figures and must NOT be used as the citation for these numbers.
 */

export interface GuidelineYear {
  /** The year label shown to the attorney, e.g. "2026". */
  year: string;
  /** Effective date of these figures. */
  effective: string;
  /** Effective date of the figures these replaced (for the "was" note). */
  supersedes: string | null;
}

export const MAINTENANCE_GUIDELINES = {
  year: "2026",
  effective: "March 1, 2026",
  supersedes: "March 1, 2024",
  /** DRL § 236(B)(6)(b)(4) payor income cap. */
  incomeCap: 241_000,
  priorIncomeCap: 228_000,
  /** Statutory formulas are unchanged by the biennial adjustment. */
  formulaNote:
    "Formulas unchanged: with child support payor also paying, 20% of payor income less 25% of payee income, compared to 40% of combined less payee income (lower controls). Without, 30% less 20%, compared to 40% of combined less payee income.",
  /** DRL § 236(B)(6)(e) advisory durational schedule — unchanged. */
  durationNote:
    "Advisory duration schedule unchanged: 0–15 years of marriage → 15–30% of the length of the marriage; 15–20 years → 30–40%; over 20 years → 35–50%.",
  citation:
    "NY spousal-maintenance guideline income cap effective March 1, 2026 (DRL § 236(B)(6)); UCS Maintenance Guidelines Calculator.",
  sourceUrl: "https://www.nycourts.gov/LegacyPDFS/divorce/calculator.pdf",
} as const;

export const CSSA_GUIDELINES = {
  year: "2026",
  effective: "March 1, 2026",
  supersedes: "March 1, 2024",
  /** Combined parental income cap (DRL § 240(1-b)(c)(3) / FCA § 413). */
  combinedIncomeCap: 193_000,
  priorCombinedIncomeCap: 183_000,
  /** Self-support reserve (135% of the federal poverty level, one person). */
  selfSupportReserve: 21_546,
  /** Federal poverty income guideline, single person. */
  povertyIncomeGuideline: 15_960,
  /** Statutory percentages — never adjusted. */
  percentages: {
    one: 0.17,
    two: 0.25,
    three: 0.29,
    four: 0.31,
    fiveOrMore: 0.35,
  },
  percentagesNote:
    "Statutory percentages unchanged: 1 child 17%, 2 children 25%, 3 children 29%, 4 children 31%, 5 or more at least 35%.",
  chartLabel: "2026 Child Support Standards Chart — LDSS-4515 (Rev. 03/26)",
  citation:
    "2026 Child Support Standards Chart — LDSS-4515 (Rev. 03/26); combined parental income cap effective March 1, 2026.",
  sourceUrl: "https://childsupport.ny.gov/pdfs/CSSA.pdf",
} as const;

/** Formatted currency for panel display (whole dollars). */
export function usd(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

/**
 * The one-line, attorney-facing summary of WHICH YEAR is applied. This is the
 * string the matter panel prints so the reviewing attorney never has to guess.
 */
export function guidelineYearSummary(): {
  maintenance: string;
  childSupport: string;
} {
  return {
    maintenance: `${MAINTENANCE_GUIDELINES.year} guidelines applied — payor income cap ${usd(
      MAINTENANCE_GUIDELINES.incomeCap
    )}, effective ${MAINTENANCE_GUIDELINES.effective} (was ${usd(
      MAINTENANCE_GUIDELINES.priorIncomeCap
    )} under the ${MAINTENANCE_GUIDELINES.supersedes} figures).`,
    childSupport: `${CSSA_GUIDELINES.year} guidelines applied — combined parental income cap ${usd(
      CSSA_GUIDELINES.combinedIncomeCap
    )}, self-support reserve ${usd(
      CSSA_GUIDELINES.selfSupportReserve
    )}, effective ${CSSA_GUIDELINES.effective}. ${CSSA_GUIDELINES.chartLabel}.`,
  };
}
