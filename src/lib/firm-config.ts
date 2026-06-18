// ═══════════════════════════════════════════════════════════════
// FIRM CONFIG — single source of truth for firm/attorney IDENTITY.
//
// PURPOSE: Under the lawyer-reviewed model, the operating firm's
// identity (name, attorney, contact details) appears in NON-LEGAL
// display spots like a contact block. Centralizing it here means
// onboarding "firm #2" later is a config change, not a code rewrite.
//
// SCOPE / GUARDRAILS:
//   • This object holds IDENTITY + CONTACT info ONLY.
//   • It must NOT contain legal-positioning claims (e.g. "a lawyer
//     reviews your file", "not a law firm", disclaimers). That copy
//     is Jake's decision and lives in the page/TOS components.
//   • This is a PUBLIC repo. Do not commit anything here that should
//     stay private — move sensitive values to env vars if needed.
//
// STATUS: All values below are TODO placeholders. The repo does NOT
// currently contain "Jake Kim Law Firm" details (the existing
// operating entity referenced across the site is "June Guided
// Solutions, LLC", which is the software/document-prep company —
// a different entity from the reviewing law firm). Jake to fill in
// the real firm details. No bar number has been invented.
// ═══════════════════════════════════════════════════════════════

export interface FirmConfig {
  name: string;
  attorneyName: string;
  barAdmissions: string[];
  address: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
}

export const FIRM: FirmConfig = {
  name: 'TODO: Jake Kim Law Firm — confirm exact legal name',
  attorneyName: 'TODO: supervising attorney full name',
  // Do NOT invent a bar number / admission. Jake to provide.
  barAdmissions: ['TODO: e.g. "NY", "NJ" — confirm jurisdictions of admission'],
  address: 'TODO: firm office address (work address OK in public repo)',
  phone: 'TODO: firm phone',
  fax: 'TODO: firm fax (or remove if unused)',
  email: 'TODO: firm contact email',
  website: 'TODO: firm website URL',
};
