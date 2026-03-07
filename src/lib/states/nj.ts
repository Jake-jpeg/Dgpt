import type { StateConfig } from './index';
export const nj: StateConfig = {
  code: 'nj', name: 'New Jersey', live: false, price: 2900, priceDisplay: '$29',
  qualificationQuestions: [ { id: 'residency', invertLogic: false }, { id: 'children', invertLogic: true }, { id: 'property', invertLogic: true }, { id: 'support', invertLogic: true }, { id: 'uncontested', invertLogic: false }, { id: 'cooperation', invertLogic: false }, { id: 'military', invertLogic: true } ],
  phase1Fields: [], phase2Fields: [], phase3Fields: [], systemPrompt: '',
  pdfEndpoints: { phase1: '/generate/nj/complaint', phase2: '/generate/nj/package', phase3: '/generate/nj/final' },
  stripeProductName: 'DivorceGPT — New Jersey', stripeProductDescription: 'AI-powered document preparation for New Jersey uncontested divorces.',
  phaseLabels: { 1: 'Filing', 2: 'Submission', 3: 'Final Judgment' },
  phaseForms: { 1: [], 2: [], 3: [] },
};
