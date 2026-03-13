import type { StateConfig } from './index';

// PLACEHOLDER — System prompt to be completed after TX form audit
const SYSTEM_PROMPT = `# ROLE AND PURPOSE
You are the AI engine for **DivorceGPT**, a document preparation tool for uncontested divorces in Texas.
Your role is strictly limited to that of a **neutral, administrative Court Clerk**.

# STATUS: UNDER CONSTRUCTION
This state is currently in development. The full system prompt will be built after the Texas form audit is complete.

# TEXAS DIVORCE FUNDAMENTALS (PLACEHOLDER)
- Ground: Insupportability (no-fault, Texas Family Code §6.001)
- Residency: 6 months in Texas, 90 days in filing county (TFC §6.301)
- Waiting period: 60 days from filing date (TFC §6.702)
- Forms: Texas Supreme Court approved forms for agreed divorce without children or real property
- Terminology: Petitioner / Respondent
- Filing: eFileTexas.gov or in person at county district clerk

# SCOPE
- Uncontested agreed divorce
- No minor children, neither party pregnant
- No real property to divide
- No spousal maintenance
- Both parties agree
- Neither party active military
- Pro se litigants only

Packet revision: 3/13/26
`;

export const tx: StateConfig = {
  code: 'tx', name: 'Texas', live: false, price: 2900, priceDisplay: '$29',
  qualificationQuestions: [
    { id: 'residency', invertLogic: false },
    { id: 'countyResidency', invertLogic: false },
    { id: 'children', invertLogic: true },
    { id: 'property', invertLogic: true },
    { id: 'support', invertLogic: true },
    { id: 'uncontested', invertLogic: false },
    { id: 'military', invertLogic: true },
  ],
  phase1Fields: [
    { key: 'plaintiffName', label: 'Petitioner', desc: 'Petitioner full legal name' },
    { key: 'defendantName', label: 'Respondent', desc: 'Respondent full legal name' },
    { key: 'county', label: 'Filing County', desc: 'TX county where filing' },
    { key: 'marriageDate', label: 'Marriage Date', desc: 'Date of marriage' },
    { key: 'marriageCity', label: 'Marriage City', desc: 'City where married' },
    { key: 'marriageState', label: 'Marriage State', desc: 'State/Country where married' },
    { key: 'plaintiffAddress', label: 'Petitioner Address', desc: 'Full address' },
    { key: 'plaintiffPhone', label: 'Petitioner Phone', desc: 'Phone number' },
    { key: 'defendantAddress', label: 'Respondent Address', desc: 'Full address' },
  ],
  phase2Fields: [],
  phase3Fields: [],
  pdfEndpoints: { phase1: '/generate/tx/phase1-package', phase2: '', phase3: '' },
  stripeProductName: 'DivorceGPT \u2014 Texas',
  stripeProductDescription: 'AI-powered document preparation for Texas uncontested divorces. Includes all documents. 12-month access.',
  phaseLabels: { 1: 'Filing Packet', 2: '', 3: '' },
  phaseForms: {
    1: [
      { label: 'Original Petition', desc: 'Original Petition for Divorce' },
      { label: 'Waiver of Citation', desc: 'Waiver of Citation / Acceptance of Service' },
      { label: 'Final Decree', desc: 'Final Decree of Divorce' },
      { label: 'VS Info', desc: 'Vital Statistics Information / Certificate of Last Address' },
    ],
    2: [],
    3: [],
  },
  systemPrompt: SYSTEM_PROMPT,
};
