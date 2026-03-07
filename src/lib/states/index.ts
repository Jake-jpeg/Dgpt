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
}

// Import all state configs
import { ny } from './ny';
import { nj } from './nj';
import { nv } from './nv';

// Registry — add new states here
const STATES: Record<string, StateConfig> = {
  ny,
  nj,
  nv,
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
