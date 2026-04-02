// DivorceGPT State Law & Rule Registry
// This is the SOURCE OF TRUTH for what DivorceGPT currently implements.
// The monitor compares live court rules against this registry.
// When adding a new state, add one entry here.

export interface StateRegistryEntry {
  stateCode: string;
  stateName: string;
  lastChecked: string; // ISO date
  lastConfirmedCurrent: string; // ISO date when rules were last confirmed accurate
  
  // Official sources to check
  courtWebsite: string;
  statuteReference: string;
  courtRulesReference: string;
  efilingPortal: string;

  // ═══════════════════════════════════════════════════════════════
  // MONITOR URLS — Direct-fetch targets for reliable change detection
  // The monitor fetches these URLs directly (in addition to keyword
  // search) to catch form revisions, fee changes, and new directives
  // that keyword search might miss.
  // ═══════════════════════════════════════════════════════════════
  monitorUrls: {
    url: string;
    label: string;       // Human-readable description for alert emails
    fetchMethod: 'search' | 'fetch'; // 'fetch' = direct web_fetch, 'search' = web_search (for WAF-blocked sites)
  }[];

  // ═══════════════════════════════════════════════════════════════
  // FORM REVISION DATES — Tracks when each form was last revised.
  // The monitor compares these against what the court website reports.
  // A revision date change means the form content may have changed
  // even if the form name/number stayed the same.
  // ═══════════════════════════════════════════════════════════════
  formRevisionDates: Record<string, string>; // e.g. { 'UD-1': '3/1/26', 'UD-7': '3/1/26' }
  
  // Current known rules (what DivorceGPT implements)
  knownRules: {
    residencyRequirement: string;
    groundsForDivorce: string;
    waitingPeriod: string;
    filingFee: string;
    defendantFee: string;
    serviceDeadlineDays: number;
    responseDeadlineDays: number;
    requiredForms: string[];
    efilingAvailable: boolean;
    efilingMandatory: boolean;
    divorceOnPapersAvailable: boolean;
    divorceOnPapersDirective: string;
    proSeAllowed: boolean;
    notarizationRequired: string;
    specialRules: string[];
  };
}

export const STATE_REGISTRY: StateRegistryEntry[] = [
  {
    stateCode: 'ny',
    stateName: 'New York',
    lastChecked: '2026-03-08',
    lastConfirmedCurrent: '2026-03-08',
    courtWebsite: 'https://www.nycourts.gov/divorce',
    statuteReference: 'DRL Article 10 (§§170-177), DRL §§230-240',
    courtRulesReference: '22 NYCRR Part 202.50 (Uncontested Divorce)',
    efilingPortal: 'https://iapps.courts.state.ny.us/nyscef',
    monitorUrls: [
      {
        url: 'nycourts.gov uncontested divorce forms revisions 2026',
        label: 'NY UCS — Uncontested Divorce Forms page (form list + revision dates)',
        fetchMethod: 'search', // ww2.nycourts.gov returns 403 on direct fetch
      },
      {
        url: 'nycourts.gov matrimonial legislation court rules changes 2026',
        label: 'NY UCS — What\'s New in Matrimonial Legislation, Court Rules & Forms',
        fetchMethod: 'search',
      },
      {
        url: 'nycourts.gov divorce filing fee index number 2026',
        label: 'NY UCS — Filing fees and index number purchase',
        fetchMethod: 'search',
      },
      {
        url: 'https://www.nycourts.gov/LegacyPDFS/divorce/COMPOSITE-UNCONTESTED-DIVORCE-FORMS.pdf',
        label: 'NY UCS — Composite Uncontested Divorce Forms PDF (contains all UD forms with revision dates)',
        fetchMethod: 'fetch',
      },
    ],
    formRevisionDates: {
      'UD-1': '3/1/26',
      'UD-5': '3/1/26',
      'UD-6': '3/1/26',
      'UD-7': '3/1/26',
      'UD-8(1)': '12/23/25',
      'UD-9': '3/1/26',
      'UD-10': '3/1/26',
      'UD-11': '3/1/26',
      'UD-12': '3/1/26',
      'UD-14': '3/1/26',
      'UD-15': '3/1/26',
      'DOH-2168': 'N/A — NYS DOH form, not UCS-controlled',
    },
    knownRules: {
      residencyRequirement: 'DRL §230: One party resident of NY for continuous period of at least one year before filing, OR two years if cause arose outside NY, OR marriage/residency combo under DRL §230(a)-(e)',
      groundsForDivorce: 'DRL §170(7): Irretrievable breakdown for at least 6 months',
      waitingPeriod: 'No mandatory waiting period after filing; 6-month breakdown period must precede filing',
      filingFee: '$210 (index number purchase)',
      defendantFee: 'No separate defendant fee',
      serviceDeadlineDays: 120,
      responseDeadlineDays: 20, // 20 days personal service in NY, 30 days if outside NY
      requiredForms: [
        'UD-1 Summons with Notice',
        'UD-5 Affirmation of Regularity',
        'UD-6 Affirmation/Affidavit of Plaintiff',
        'UD-7 Affirmation/Affidavit of Defendant',
        'UD-9 Note of Issue',
        'UD-10 Findings of Fact/Conclusions of Law',
        'UD-11 Judgment of Divorce',
        'UD-12 Part 130 Certification',
        'UD-14 Notice of Entry',
        'UD-15 Affirmation of Service of JOD',
        'DOH-2168 Certificate of Dissolution of Marriage',
      ],
      efilingAvailable: true,
      efilingMandatory: false, // mandatory in some counties via NYSCEF
      divorceOnPapersAvailable: false, // NY requires submission package but judge reviews on papers
      divorceOnPapersDirective: 'N/A — NY uses the UD submission package process',
      proSeAllowed: true,
      notarizationRequired: 'UD-6 and UD-7 must be notarized (affidavits). UD-5 is an affirmation (no notary).',
      specialRules: [
        'DRL §253: Barriers to remarriage for religious ceremonies — included in UD-7',
        'RJI required for judicial assignment (UD-13) — not generated by DivorceGPT',
        'DOH-2168 Certificate of Dissolution — user downloads from nycourts.gov',
        'NYSCEF e-filing: mandatory in some counties, optional in others',
        'Children under 21 disqualify from uncontested UD process',
      ],
    },
  },
  {
    stateCode: 'nj',
    stateName: 'New Jersey',
    lastChecked: '2026-03-08',
    lastConfirmedCurrent: '2026-03-08',
    courtWebsite: 'https://www.njcourts.gov/self-help/divorce',
    statuteReference: 'N.J.S.A. 2A:34-2 through 2A:34-95',
    courtRulesReference: 'R. 5:1 through 5:7 (Family Division Rules)',
    efilingPortal: 'https://portal.njcourts.gov (JEDS)',
    monitorUrls: [
      {
        url: 'https://www.njcourts.gov/self-help/divorce',
        label: 'NJ Courts — Self-Help Divorce page (forms, fees, process)',
        fetchMethod: 'fetch',
      },
      {
        url: 'https://www.njcourts.gov/self-help/divorce/contested-uncontested',
        label: 'NJ Courts — Contested vs Uncontested page (fee confirmation, process)',
        fetchMethod: 'fetch',
      },
      {
        url: 'https://www.njcourts.gov/attorneys/directives',
        label: 'NJ Courts — Administrative Directives (new directives affecting family division)',
        fetchMethod: 'fetch',
      },
      {
        url: 'https://www.njcourts.gov/self-help/forms',
        label: 'NJ Courts — Forms catalog (form additions/retirements)',
        fetchMethod: 'fetch',
      },
    ],
    formRevisionDates: {
      'Complaint for Divorce': 'N/A — no official state form number; NJLS standard',
      'Certification of Verification and Non-Collusion': 'N/A',
      'Summons': 'N/A',
      'CLIS (CN 10486)': 'N/A — court-issued',
      'CDR Certification (CN 10889)': 'N/A — court-issued',
      'Certification of Insurance Coverage': 'N/A',
      'Acknowledgment of Service': 'N/A',
      'CN 12620': 'Directive #01-25 (March 19, 2025)',
      'CN 11191': 'N/A — court-issued',
      'Proposed Final Judgment': 'N/A',
    },
    knownRules: {
      residencyRequirement: 'N.J.S.A. 2A:34-10: One party must have lived in NJ for 12 consecutive months before filing',
      groundsForDivorce: 'N.J.S.A. 2A:34-2(i): Irreconcilable differences for 6+ months, no reasonable prospect of reconciliation',
      waitingPeriod: 'No mandatory waiting period after filing; 6-month irreconcilable differences period must precede filing',
      filingFee: '$300 (no children)',
      defendantFee: '$175 (Appearance fee)',
      serviceDeadlineDays: 60,
      responseDeadlineDays: 35,
      requiredForms: [
        'Complaint for Divorce/Dissolution (Irreconcilable Differences)',
        'Certification of Verification and Non-Collusion',
        'Summons with Proof of Service',
        'Confidential Litigant Information Sheet (CN 10486)',
        'CDR Certification (CN 10889) — plaintiff',
        'CDR Certification (CN 10889) — defendant',
        'Certification of Insurance Coverage',
        'Acknowledgment of Service (defendant, notarized)',
        'CN 12620 — Plaintiff Certification for Divorce Without Court Appearance',
        'CN 12620 — Defendant Certification for Divorce Without Court Appearance',
        'CN 11191 — Certification of Non-Military Service',
        'Proposed Final Judgment of Divorce/Dissolution',
      ],
      efilingAvailable: true,
      efilingMandatory: false,
      divorceOnPapersAvailable: true,
      divorceOnPapersDirective: 'Directive #01-25 (March 19, 2025) — supersedes Directive #12-22',
      proSeAllowed: true,
      notarizationRequired: 'Acknowledgment of Service requires notarization. All other DivorceGPT forms use certifications under R. 1:4-4(b) (no notary).',
      specialRules: [
        'NJ has no official state-issued divorce forms — NJLS created the standard packet',
        'CLIS (CN 10486) is confidential — not shared with other party',
        'CDR certifications required for both parties per R. 5:4-2(h)',
        'CIS (CN 10482) only required if custody/support/alimony/equitable distribution at issue',
        'Docket number format: FM-XX-XXXXXX-XX',
        'Filing county per R. 5:7-1: where plaintiff was domiciled when cause of action arose',
        'Directive #01-25 revised CN 12620 effective March 2025',
        'No barriers to remarriage requirement (unlike NY DRL §253)',
        'Children under 18 (or 18-23 if dependent) disqualify from DivorceGPT scope',
      ],
    },
  },
];

export function getRegistryEntry(stateCode: string): StateRegistryEntry | undefined {
  return STATE_REGISTRY.find(s => s.stateCode === stateCode);
}

export function getAllRegistryEntries(): StateRegistryEntry[] {
  return STATE_REGISTRY;
}
