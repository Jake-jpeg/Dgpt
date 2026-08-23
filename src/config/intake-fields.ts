/**
 * ATTORNEY-CONTROLLED CONFIG — intake field definitions.
 *
 * Drafted from the Stage-1 build prompt's tier outlines. When the companion
 * intake spec (dgpt_intake_spec_v2) is reconciled, edits happen HERE — the
 * engine renders and validates whatever this file defines.
 *
 * Tier 1: no kids / no assets / no alimony.
 * Tier 2: settled equitable distribution + agreed spousal maintenance
 *         (Tier 1 minus the no-assets/no-alimony confirmations, plus the ED
 *         capture with the retirement clarification tree and the
 *         agreed-maintenance capture).
 */
import type { ProcessCopyId } from "./process-copy";

export type FieldType =
  | "text"
  | "date"
  | "boolean"
  | "select"
  | "currency"
  | "integer"
  | "retirementAccounts"; // structured list validated by a dedicated schema

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: FieldOption[];
  /** "why we ask" copy id (attorney-controlled). */
  whyId?: ProcessCopyId;
  maxLen?: number;
  /** Only collected/required when another field has (or doesn't have) a given value. */
  dependsOn?: { fieldId: string; equals?: unknown; notEquals?: unknown };
  /** For boolean confirmations that MUST be true to complete the intake. */
  mustBeTrue?: boolean;
}

export interface SectionDef {
  id: string;
  title: string;
  tier: "BOTH" | "TIER1" | "TIER2";
  whyId?: ProcessCopyId;
  fields: FieldDef[];
}

/** All 62 New York counties. Venue is collect-only — the attorney's call, never a client-facing rejection. */
export const NY_COUNTIES = [
  "Albany", "Allegany", "Bronx", "Broome", "Cattaraugus", "Cayuga",
  "Chautauqua", "Chemung", "Chenango", "Clinton", "Columbia", "Cortland",
  "Delaware", "Dutchess", "Erie", "Essex", "Franklin", "Fulton", "Genesee",
  "Greene", "Hamilton", "Herkimer", "Jefferson", "Kings", "Lewis",
  "Livingston", "Madison", "Monroe", "Montgomery", "Nassau", "New York",
  "Niagara", "Oneida", "Onondaga", "Ontario", "Orange", "Orleans", "Oswego",
  "Otsego", "Putnam", "Queens", "Rensselaer", "Richmond", "Rockland",
  "St. Lawrence", "Saratoga", "Schenectady", "Schoharie", "Schuyler",
  "Seneca", "Steuben", "Suffolk", "Sullivan", "Tioga", "Tompkins", "Ulster",
  "Warren", "Washington", "Wayne", "Westchester", "Wyoming", "Yates",
] as const;

/** All 21 New Jersey counties — the NJ venue gate's option list. */
export const NJ_COUNTIES = [
  "Atlantic", "Bergen", "Burlington", "Camden", "Cape May", "Cumberland",
  "Essex", "Gloucester", "Hudson", "Hunterdon", "Mercer", "Middlesex",
  "Monmouth", "Morris", "Ocean", "Passaic", "Salem", "Somerset", "Sussex",
  "Union", "Warren",
] as const;

/** Retirement clarification tree — the account types the intake distinguishes. */
export const RETIREMENT_TYPES: FieldOption[] = [
  { value: "401K", label: "401(k) or similar employer plan (403(b), 457)" },
  { value: "IRA_TRADITIONAL", label: "IRA — Traditional" },
  { value: "IRA_ROTH", label: "IRA — Roth" },
  { value: "PENSION", label: "Pension (defined benefit)" },
  { value: "MILITARY", label: "Military retirement" },
  { value: "DEFERRED_COMP", label: "Deferred compensation" },
  { value: "UNSURE", label: "I'm not sure what type this is" },
];

export const RETIREMENT_DIVISIONS: FieldOption[] = [
  { value: "KEEP_OWN", label: "Each of us keeps our own account(s)" },
  { value: "SPLIT_AGREED", label: "We agreed to divide this account" },
  { value: "OTHER_AGREED", label: "We agreed on something else" },
  { value: "UNSURE", label: "We're not sure / haven't agreed" },
];

export const SECTIONS: SectionDef[] = [
  {
    id: "grounds",
    title: "Grounds for divorce",
    tier: "BOTH",
    whyId: "WHY_GROUNDS",
    fields: [
      {
        id: "grounds_basis",
        label: "What is the basis for the divorce?",
        type: "select",
        required: true,
        // [ATTORNEY REVIEW REQUIRED — NY] Options track NY DRL § 170 for the
        // uncontested flow. "Something else / not sure" stays in scope but is
        // flagged for the attorney (see tiers.ts routing).
        options: [
          {
            value: "IRRETRIEVABLE_6MO",
            label:
              "The marriage has broken down irretrievably for a period of at least 6 months",
          },
          {
            value: "SEPARATION_AGREEMENT_1YR",
            label:
              "We have lived apart for at least 1 year under a written separation agreement",
          },
          { value: "OTHER_UNSURE", label: "Something else / I'm not sure" },
        ],
      },
      {
        id: "grounds_date",
        label:
          "Approximately when did the breakdown of the marriage begin (or the separation start)?",
        type: "date",
        required: true,
      },
    ],
  },
  {
    id: "marriage",
    title: "Marriage details",
    tier: "BOTH",
    whyId: "WHY_MARRIAGE",
    fields: [
      { id: "marriage_date", label: "Date of marriage", type: "date", required: true },
      {
        id: "marriage_place",
        label: "City and state (or country) where you were married",
        type: "text",
        required: true,
        maxLen: 120,
      },
      {
        id: "ceremony_type",
        label: "Type of ceremony",
        type: "select",
        required: true,
        options: [
          { value: "CIVIL", label: "Civil" },
          { value: "RELIGIOUS", label: "Religious" },
          { value: "OTHER", label: "Other" },
        ],
      },
    ],
  },
  {
    id: "parties",
    title: "Party details",
    tier: "BOTH",
    whyId: "WHY_PARTIES",
    fields: [
      {
        id: "client_address",
        label: "Your current street address",
        type: "text",
        required: true,
        maxLen: 200,
      },
      {
        id: "client_phone",
        label: "Your phone number",
        type: "text",
        required: true,
        maxLen: 25,
      },
      {
        id: "client_email",
        label: "Your email address",
        type: "text",
        required: true,
        maxLen: 120,
      },
      {
        id: "spouse_address",
        label:
          "Your spouse's current street address (where they can receive court papers)",
        type: "text",
        required: true,
        maxLen: 200,
      },
    ],
  },
  {
    id: "separation",
    title: "Separation",
    tier: "BOTH",
    whyId: "WHY_SEPARATION",
    fields: [
      {
        id: "separation_date",
        label: "Approximate date you and your spouse separated",
        type: "date",
        required: true,
      },
      {
        id: "living_arrangement",
        label: "Current living arrangement",
        type: "select",
        required: true,
        options: [
          { value: "SEPARATE_RESIDENCES", label: "We live at separate addresses" },
          { value: "SAME_RESIDENCE", label: "We still live at the same address" },
        ],
      },
    ],
  },
  {
    id: "confirmations",
    title: "Confirmations",
    tier: "BOTH",
    whyId: "WHY_CONFIRMATIONS",
    fields: [
      {
        id: "children_confirm_none",
        label:
          "I confirm there are no children of this marriage who are under 18 or still dependent",
        type: "boolean",
        required: true,
        mustBeTrue: true,
      },
    ],
  },
  {
    id: "t1_confirmations",
    title: "No assets / no alimony confirmations",
    tier: "TIER1",
    whyId: "WHY_CONFIRMATIONS",
    fields: [
      {
        id: "t1_no_assets_confirm",
        label:
          "I confirm we have no marital property or debts that need to be divided",
        type: "boolean",
        required: true,
        mustBeTrue: true,
      },
      {
        id: "t1_no_alimony_confirm",
        label:
          "I confirm neither of us is seeking alimony / spousal support from the other",
        type: "boolean",
        required: true,
        mustBeTrue: true,
      },
    ],
  },
  {
    id: "equitable_distribution",
    title: "Property and debts (equitable distribution)",
    tier: "TIER2",
    whyId: "WHY_ED",
    fields: [
      {
        id: "ed_business_interest",
        label: "Does either of you own a business or an interest in a business?",
        type: "boolean",
        required: true,
        // true trips OUT routing — see src/lib/intake/tiers.ts
      },
      {
        id: "ed_valuation_needed",
        label:
          "Do you need an appraisal, accountant, or other valuation help — or disagree about what anything is worth?",
        type: "boolean",
        required: true,
        // true trips OUT routing
      },
      {
        id: "ed_realestate_any",
        label: "Do you own any real estate (home, condo, land)?",
        type: "boolean",
        required: true,
      },
      {
        id: "ed_realestate_disposition",
        label: "What have you agreed to do with the real estate?",
        type: "select",
        required: true,
        dependsOn: { fieldId: "ed_realestate_any", equals: true },
        options: [
          { value: "SELL_SPLIT", label: "Sell it and divide the proceeds as agreed" },
          { value: "CLIENT_KEEPS", label: "I keep it" },
          { value: "SPOUSE_KEEPS", label: "My spouse keeps it" },
          { value: "OTHER_AGREED", label: "Another arrangement we both agreed to" },
        ],
      },
      {
        id: "ed_vehicles_disposition",
        label: "Vehicles",
        type: "select",
        required: true,
        options: [
          { value: "NONE", label: "No vehicles to divide" },
          { value: "KEEP_OWN", label: "Each of us keeps the vehicle(s) we use" },
          { value: "OTHER_AGREED", label: "Another arrangement we both agreed to" },
        ],
      },
      {
        id: "ed_accounts_disposition",
        label: "Bank and investment accounts",
        type: "select",
        required: true,
        options: [
          { value: "NONE", label: "No accounts to divide" },
          { value: "KEEP_OWN", label: "Each of us keeps our own accounts" },
          { value: "SPLIT_AGREED", label: "We agreed how to divide them" },
        ],
      },
      {
        id: "ed_retirement_any",
        label: "Does either of you have retirement accounts or pensions?",
        type: "boolean",
        required: true,
      },
      {
        id: "ed_retirement_accounts",
        label: "Tell us about each retirement account",
        type: "retirementAccounts",
        required: true,
        whyId: "WHY_RETIREMENT",
        dependsOn: { fieldId: "ed_retirement_any", equals: true },
      },
      {
        id: "ed_debts_disposition",
        label: "Debts (credit cards, loans)",
        type: "select",
        required: true,
        options: [
          { value: "NONE", label: "No debts to divide" },
          { value: "KEEP_OWN", label: "Each of us pays the debts in our own name" },
          { value: "SPLIT_AGREED", label: "We agreed how to divide them" },
        ],
      },
      {
        id: "ed_personal_confirm",
        label:
          "I confirm we have already agreed how to divide personal property (furniture, belongings)",
        type: "boolean",
        required: true,
        mustBeTrue: true,
      },
    ],
  },
  {
    id: "maintenance",
    title: "Spousal maintenance (alimony)",
    tier: "TIER2",
    whyId: "WHY_MAINTENANCE",
    fields: [
      {
        id: "maint_arrangement",
        label: "What have you agreed about spousal maintenance?",
        type: "select",
        required: true,
        options: [
          { value: "WAIVED_BOTH", label: "We both agreed to waive maintenance" },
          { value: "AGREED_TERMS", label: "We agreed one of us will pay maintenance" },
        ],
      },
      {
        id: "maint_payor",
        label: "Who will pay?",
        type: "select",
        required: true,
        dependsOn: { fieldId: "maint_arrangement", equals: "AGREED_TERMS" },
        options: [
          { value: "CLIENT", label: "I will pay" },
          { value: "SPOUSE", label: "My spouse will pay" },
        ],
      },
      {
        id: "maint_form",
        label: "In what form?",
        type: "select",
        required: true,
        dependsOn: { fieldId: "maint_arrangement", equals: "AGREED_TERMS" },
        options: [
          { value: "PERIODIC", label: "Regular payments" },
          { value: "LUMP_SUM", label: "One lump sum" },
        ],
      },
      {
        id: "maint_amount",
        label: "Agreed amount (per payment, or the lump sum)",
        type: "currency",
        required: true,
        dependsOn: { fieldId: "maint_arrangement", equals: "AGREED_TERMS" },
      },
      {
        id: "maint_frequency",
        label: "How often?",
        type: "select",
        required: true,
        dependsOn: { fieldId: "maint_form", equals: "PERIODIC" },
        options: [
          { value: "WEEKLY", label: "Weekly" },
          { value: "BIWEEKLY", label: "Every two weeks" },
          { value: "MONTHLY", label: "Monthly" },
        ],
      },
      {
        id: "maint_duration_months",
        label: "For how many months?",
        type: "integer",
        required: true,
        dependsOn: { fieldId: "maint_form", equals: "PERIODIC" },
      },
    ],
  },
  {
    id: "name_change",
    title: "Name change",
    tier: "BOTH",
    whyId: "WHY_NAME_CHANGE",
    fields: [
      {
        id: "name_change_requested",
        label: "Does either of you want to resume a prior name?",
        type: "select",
        required: true,
        options: [
          { value: "NONE", label: "No" },
          { value: "CLIENT", label: "Yes — I do" },
          { value: "SPOUSE", label: "Yes — my spouse does" },
          { value: "BOTH", label: "Yes — both of us" },
        ],
      },
      {
        id: "name_change_names",
        label: "What name(s) will be resumed?",
        type: "text",
        required: true,
        maxLen: 200,
        dependsOn: { fieldId: "name_change_requested", notEquals: "NONE" },
      },
    ],
  },
  {
    id: "prior_actions",
    title: "Prior or pending actions",
    tier: "BOTH",
    whyId: "WHY_PRIOR_ACTIONS",
    fields: [
      {
        id: "prior_actions_any",
        label:
          "Have there been any prior or pending court cases between you and your spouse (family court, restraining orders, support cases)?",
        type: "boolean",
        required: true,
      },
      {
        id: "prior_actions_details",
        label: "Briefly list the court, case type, and docket number if known",
        type: "text",
        required: true,
        maxLen: 300,
        dependsOn: { fieldId: "prior_actions_any", equals: true },
      },
    ],
  },
];

export function sectionsForTier(tier: "TIER1" | "TIER2"): SectionDef[] {
  return SECTIONS.filter((s) => s.tier === "BOTH" || s.tier === tier);
}

export function getFieldDef(
  tier: "TIER1" | "TIER2",
  fieldId: string
): { section: SectionDef; field: FieldDef } | null {
  for (const s of sectionsForTier(tier)) {
    const f = s.fields.find((f) => f.id === fieldId);
    if (f) return { section: s, field: f };
  }
  return null;
}
