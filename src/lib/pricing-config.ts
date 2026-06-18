// ═══════════════════════════════════════════════════════════════
// PRICING CONFIG — single source of truth for the reviewed-service
// price tiers. Replaces the legacy flat $99 "pro_se" / DIY price.
//
// Prices are in CENTS to match Stripe's unit_amount (see
// src/app/api/create-checkout/route.ts, which currently defaults to
// 9900 = $99 and must be repointed at these tiers — flagged, not
// yet wired).
//
// RECOMMENDED PRICING (Jake delegated the call; override freely):
//   The comp is NOT LegalZoom — it's a $3k–$10k matrimonial retainer.
//   These are attorney-reviewed limited-scope flat fees, anchored to
//   read as a steal against full representation while paying for the
//   reviewing attorney's time. Limited-scope fees still must clear
//   RPC 1.5 reasonableness — Jake's call.
// ═══════════════════════════════════════════════════════════════

export type PricingTierId = 'simple' | 'custody' | 'ed_alimony' | 'consult';

export interface PricingTier {
  id: PricingTierId;
  label: string;
  priceCents: number;       // 0 => not a fixed-price product (consult)
  priceDisplay: string;     // human-facing
  includesAttorneyReview: boolean;
  blurb: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'simple',
    label: 'Uncontested — Attorney Reviewed',
    priceCents: 49900,
    priceDisplay: '$499',
    includesAttorneyReview: true,
    blurb: 'Simple uncontested divorce. AI prepares your court packet; a licensed attorney reviews every file before you file.',
  },
  {
    id: 'custody',
    label: 'With Children / Custody — Attorney Reviewed',
    priceCents: 99900,
    priceDisplay: '$999',
    includesAttorneyReview: true,
    blurb: 'Includes minor children. The parenting arrangement is mandatorily reviewed and signed off by the attorney before release.',
  },
  {
    id: 'ed_alimony',
    label: 'Property &/or Support — Attorney Reviewed',
    priceCents: 149900,
    priceDisplay: '$1,499',
    includesAttorneyReview: true,
    blurb: 'Includes equitable distribution and/or alimony. AI drafts; attorney reviews the financial terms before filing.',
  },
  {
    id: 'consult',
    label: 'Consultation',
    priceCents: 0,
    priceDisplay: 'Book a consult',
    includesAttorneyReview: true,
    blurb: 'Contested matters, domestic-violence cases, and active-military (SCRA) cases are handled directly by an attorney — not drafted by AI.',
  },
];

export function getTier(id: PricingTierId): PricingTier | undefined {
  return PRICING_TIERS.find(t => t.id === id);
}
