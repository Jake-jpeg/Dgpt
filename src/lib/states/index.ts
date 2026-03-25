// State configuration types and registry
// Each state has its own file: ny.ts, nj.ts, nv.ts, etc.

export interface FieldDef {
  key: string;
  label: string;
  desc: string;
}

export interface QualificationQuestion {
  id: string;
  invertLogic: boolean;
}

export interface FormDef {
  label: string;
  desc: string;
  conditionalOn?: string;
}

// ---------------------------------------------------------------------------
// Pricing tiers — supports pro-se, lawyer review, and consultation
// ---------------------------------------------------------------------------
export interface PricingTier {
  id: 'pro_se' | 'lawyer_review' | 'consultation';
  label: string;
  price: number;          // cents
  priceDisplay: string;   // e.g. "$100"
  description: string;    // one-liner shown on card
  features: string[];     // bullet points
  badge?: string;         // optional badge text e.g. "Most Popular"
  enabled: boolean;       // toggle tiers per state
}

export interface StateConfig {
  code: string;
  name: string;
  live: boolean;
  price: number;
  priceDisplay: string;
  qualificationQuestions: QualificationQuestion[];
  phase1Fields: FieldDef[];
  phase2Fields: FieldDef[];
  phase3Fields: FieldDef[];
  systemPrompt: string;
  pdfEndpoints: { phase1: string; phase2: string; phase3: string };
  stripeProductName: string;
  stripeProductDescription: string;
  phaseLabels: { 1: string; 2: string; 3: string };
  phaseForms: { 1: FormDef[]; 2: FormDef[]; 3: FormDef[] };
  breakdownMonths?: number;
  // New: multi-tier pricing
  tiers?: PricingTier[];
}

// ---------------------------------------------------------------------------
// Default tiers — states can override in their own config
// ---------------------------------------------------------------------------
export const DEFAULT_TIERS: PricingTier[] = [
  {
    id: 'pro_se',
    label: 'DIY Divorce Packet',
    price: 9900,
    priceDisplay: '$99',
    description: 'AI-prepared court forms for simple, uncontested cases. You file it yourself.',
    features: [
      'Complete court-ready document packet',
      'AI-guided form filling in plain language',
      'State & county-specific filing instructions',
      '12-month session access',
      'Email support',
    ],
    enabled: true,
  },
];

// Import all state configs
import { ny } from './ny';
import { nj } from './nj';

// Registry — add new states here
const STATES: Record<string, StateConfig> = {
  ny,
  nj,
};

export function getStateConfig(stateCode: string): StateConfig | null {
  return STATES[stateCode] || null;
}

export function getSupportedStates(): StateConfig[] {
  return Object.values(STATES);
}

export function getLiveStates(): StateConfig[] {
  return Object.values(STATES).filter(s => s.live);
}

/**
 * Get the active tiers for a state.
 * Falls back to DEFAULT_TIERS if the state doesn't define its own.
 * Filters to enabled-only.
 */
export function getStateTiers(stateCode: string): PricingTier[] {
  const config = getStateConfig(stateCode);
  const tiers = config?.tiers ?? DEFAULT_TIERS;
  return tiers.filter(t => t.enabled);
}
