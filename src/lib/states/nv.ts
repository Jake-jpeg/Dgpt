import type { StateConfig } from './index';
export const nv: StateConfig = {
  code: 'nv', name: 'Nevada', live: false, price: 2900, priceDisplay: '$29',
  qualificationQuestions: [ { id: 'residency', invertLogic: false }, { id: 'children', invertLogic: true }, { id: 'property', invertLogic: true }, { id: 'support', invertLogic: true }, { id: 'uncontested', invertLogic: false }, { id: 'cooperation', invertLogic: false }, { id: 'military', invertLogic: true } ],
  phase1Fields: [], phase2Fields: [], phase3Fields: [], systemPrompt: '',
  pdfEndpoints: { phase1: '/generate/nv/complaint', phase2: '/generate/nv/package', phase3: '/generate/nv/final' },
  stripeProductName: 'DivorceGPT — Nevada', stripeProductDescription: 'AI-powered document preparation for Nevada uncontested divorces.',
  phaseLabels: { 1: 'Filing', 2: 'Submission', 3: 'Final Decree' },
  phaseForms: { 1: [], 2: [], 3: [] },
};
