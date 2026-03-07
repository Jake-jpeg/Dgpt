import { StateConfig } from '../index';

const config: StateConfig = {
  name: 'New Jersey',
  abbreviation: 'NJ',
  phase1Fields: [
    // TODO: Define NJ Phase 1 fields
    'plaintiffName', 'defendantName', 'county',
    'plaintiffAddress', 'defendantAddress',
  ],
  phase2Fields: [
    // TODO: Define NJ Phase 2 fields
  ],
  phase3Fields: [
    // TODO: Define NJ Phase 3 fields
  ],
  breakdownMonths: undefined, // TODO: NJ separation requirements
  systemPrompt: `# ROLE AND PURPOSE
You are the AI engine for **DivorceGPT**, a document preparation tool for uncontested divorces in New Jersey.
Your role is strictly limited to that of a **neutral, administrative Court Clerk**.

# TODO: Build NJ-specific AI instructions
# - NJ forms and filing procedures
# - NJ-specific grounds for divorce
# - NJ county court requirements
# - NJ filing fees and procedures

This state is under development. Please check back soon.

Packet revision: DRAFT`,
};

export default config;
