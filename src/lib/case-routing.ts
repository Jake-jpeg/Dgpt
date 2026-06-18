// ═══════════════════════════════════════════════════════════════
// CASE ROUTING — the triage brain for the lawyer-reviewed model.
//
// PURPOSE: Under the reviewed model the qualifier STOPS being a
// pass/fail gate and becomes a ROUTER. The same seven screening
// answers it already collects (residency / children / property /
// support / uncontested / military / domesticViolence) now decide
// WHICH service path and price tier a person lands in — instead of
// disqualifying them.
//
// SCOPE / GUARDRAILS:
//   • This is BUSINESS routing only. It contains NO legal intake
//     questions and NO legal-accuracy content. The actual
//     custody/ED/alimony intake (the questions + validation) lives
//     in ny.ts / nj.ts and is authored by the licensed attorney —
//     see the TODO stubs there, not here.
//   • DV is a hard stop -> direct to a human, never AI-drafted
//     (Jake: "too radioactive… a direct-to-human type of case").
//   • Custody is AI-drafted but flagged custodyReviewRequired so the
//     reviewing attorney MUST sign off on the parenting arrangement
//     ("is the custody situation sane?" is the #1 review item).
// ═══════════════════════════════════════════════════════════════

import { PRICING_TIERS, type PricingTierId } from '@/lib/pricing-config';

/** The seven answers the existing qualifier already collects. */
export interface QualifierAnswers {
  residency: boolean;         // resident long enough to file (must be true)
  children: boolean;          // minor children -> custody path
  property: boolean;          // assets to divide -> equitable distribution
  support: boolean;           // alimony/spousal support at issue
  uncontested: boolean;       // both spouses agree (must be true)
  military: boolean;          // active-duty -> SCRA -> human
  domesticViolence: boolean;  // DV present -> hard stop -> human
}

export type RouteOutcome =
  | 'ineligible'        // cannot be served (e.g. residency not met)
  | 'direct_to_human'   // skip AI entirely, route to attorney consult
  | 'reviewed';         // AI drafts -> mandatory attorney review

export interface RoutingResult {
  outcome: RouteOutcome;
  tier: PricingTierId;            // which price tier applies
  custodyReviewRequired: boolean; // hard-flag for the reviewer
  reasons: string[];              // why this outcome (for UI + audit)
}

// Why a case is pushed straight to a human (never AI-drafted).
function hardStopReasons(a: QualifierAnswers): string[] {
  const r: string[] = [];
  if (a.domesticViolence) r.push('domestic_violence');   // radioactive — human only
  if (!a.uncontested) r.push('contested');               // contested — out of scope for drafting
  if (a.military) r.push('active_military_scra');         // SCRA protections — attorney consult
  return r;
}

/**
 * Route a person based on the qualifier answers.
 * NOTE: changing the meaning of these answers (children/property/support
 * are now ROUTERS, not disqualifiers) is a product decision by Jake;
 * the qualifier page's own pass/fail copy still needs his sign-off.
 */
export function routeCase(a: QualifierAnswers): RoutingResult {
  // 1) Jurisdiction gate — unchanged from the old model.
  if (!a.residency) {
    return {
      outcome: 'ineligible',
      tier: 'consult',
      custodyReviewRequired: false,
      reasons: ['residency_not_met'],
    };
  }

  // 2) Hard stops -> a human handles it, no AI draft.
  const stops = hardStopReasons(a);
  if (stops.length > 0) {
    return {
      outcome: 'direct_to_human',
      tier: 'consult',
      custodyReviewRequired: a.children, // surface it even on the consult path
      reasons: stops,
    };
  }

  // 3) Reviewed paths — AI drafts, attorney reviews. Pick the top
  //    applicable tier; custody review flag is independent of price.
  const reasons: string[] = [];
  let tier: PricingTierId = 'simple';

  const hasEDorAlimony = a.property || a.support;
  const hasCustody = a.children;

  if (hasEDorAlimony) {
    tier = 'ed_alimony';
    if (a.property) reasons.push('equitable_distribution');
    if (a.support) reasons.push('alimony');
  } else if (hasCustody) {
    tier = 'custody';
  } else {
    tier = 'simple';
    reasons.push('simple_uncontested');
  }

  if (hasCustody) reasons.push('custody');

  return {
    outcome: 'reviewed',
    tier,
    custodyReviewRequired: hasCustody,
    reasons,
  };
}

/** Convenience: the resolved tier object for a routing result. */
export function tierFor(result: RoutingResult) {
  return PRICING_TIERS.find(t => t.id === result.tier) ?? null;
}
