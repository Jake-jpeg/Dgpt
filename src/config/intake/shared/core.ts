/**
 * Shared family-law factual intake core (NY-only product). FACTS ONLY: nothing here
 * asks the client to reach a legal conclusion; judgment items live at the
 * end as attorney_determination records (never client-visible).
 *
 * All wording is COUNSEL_REVIEW_REQUIRED before live client use.
 */
import type {
  DocumentCatalogItem,
  IntakeItem,
  IntakeSection,
} from "@/lib/intake2/types";

export const SHARED_SECTIONS: IntakeSection[] = [
  { id: "safety", title: "Safe contact & communication", order: 1, description: "How the firm can reach you safely, and anything we should know before contacting you." },
  { id: "identity", title: "About you and the other party", order: 2, description: "Names and contact details for the people involved." },
  { id: "relationship", title: "Marriage / relationship", order: 3, description: "Facts about the marriage, civil union, or partnership." },
  { id: "residence", title: "Where everyone has lived", order: 4, description: "Residence history helps your attorney determine the right court and process. You do not need to know the legal answer — just the facts." },
  { id: "priors", title: "Prior & pending court matters", order: 5, description: "Any existing or past cases involving you, the other party, or the children." },
  { id: "children", title: "Children & parentage", order: 6 },
  { id: "parenting", title: "Parenting arrangements", order: 7, description: "How parenting time and decisions work today — the facts, not what should happen." },
  { id: "income", title: "Income & employment", order: 8 },
  { id: "expenses", title: "Monthly expenses", order: 9 },
  { id: "assets", title: "Assets", order: 10 },
  { id: "debts", title: "Debts & liabilities", order: 11 },
  { id: "property_history", title: "How property was acquired", order: 12, description: "When and how significant property was acquired. Your attorney — not this questionnaire — determines how the law treats it." },
  { id: "insurance", title: "Insurance & benefits", order: 13 },
  { id: "taxes", title: "Taxes", order: 14 },
  { id: "retirement", title: "Retirement accounts & pensions", order: 15 },
  { id: "business", title: "Business & professional interests", order: 16 },
  { id: "special", title: "Other circumstances", order: 17 },
  { id: "documents", title: "Documents", order: 18 },
  { id: "goals", title: "Your goals & concerns", order: 19, description: "Your preferences and priorities. These are not legal conclusions — they help your attorney advise you." },
  { id: "review", title: "Review & submit", order: 20 },
];

export const SHARED_DOCUMENTS: DocumentCatalogItem[] = [
  { id: "doc.marriage_certificate", title: "Marriage / civil union certificate", requestText: "A copy of your marriage or civil union certificate." },
  { id: "doc.prior_agreements", title: "Prenuptial / separation / settlement agreements", requestText: "Any written agreement between you and the other party (prenuptial, postnuptial, separation, or settlement)." },
  { id: "doc.pleadings_orders", title: "Court pleadings, judgments & orders", requestText: "Copies of papers from any current or past court case involving you, the other party, or the children (including support, custody, or protective orders)." },
  { id: "doc.tax_returns", title: "Tax returns (last 3 years)", requestText: "Your last three years of personal tax returns (and business returns, if any)." },
  { id: "doc.pay_records", title: "Pay records", requestText: "Recent pay stubs or other proof of income (about the last 3 months)." },
  { id: "doc.bank_statements", title: "Bank statements", requestText: "Recent statements for each bank account (about the last 3 months)." },
  { id: "doc.retirement_statements", title: "Retirement / pension statements", requestText: "The most recent statement for each retirement account or pension." },
  { id: "doc.brokerage_statements", title: "Investment account statements", requestText: "Recent statements for brokerage or investment accounts." },
  { id: "doc.deeds_mortgages", title: "Deeds & mortgage statements", requestText: "The deed and most recent mortgage statement for any real estate." },
  { id: "doc.appraisals", title: "Appraisals / valuations", requestText: "Any appraisal or valuation you have for property or a business." },
  { id: "doc.business_records", title: "Business records", requestText: "Recent business tax returns and financial statements for any business interest." },
  { id: "doc.insurance_policies", title: "Insurance policies / cards", requestText: "Health, life, and other insurance policy pages or cards showing coverage." },
  { id: "doc.school_records", title: "Children's school records", requestText: "Current school enrollment information for each child." },
  { id: "doc.medical_records", title: "Medical records (children, if relevant)", requestText: "Medical documentation relevant to a child's needs, if applicable.", sensitive: true },
  { id: "doc.childcare_proof", title: "Proof of childcare costs", requestText: "Invoices or statements showing childcare costs." },
  { id: "doc.communications", title: "Relevant communications", requestText: "Messages or emails you believe are important to your matter.", sensitive: true },
  { id: "doc.photos", title: "Photographs", requestText: "Photographs you believe are important to your matter.", sensitive: true },
  { id: "doc.police_reports", title: "Police reports", requestText: "Copies of any police reports involving you, the other party, or the children.", sensitive: true },
  { id: "doc.protective_orders", title: "Protective / restraining orders", requestText: "Copies of any protective or restraining orders.", sensitive: true },
  { id: "doc.bankruptcy", title: "Bankruptcy filings", requestText: "Copies of any bankruptcy petitions or discharge papers." },
  { id: "doc.immigration", title: "Immigration documents (only if requested)", requestText: "Immigration documents — only if the firm specifically asks for them.", sensitive: true },
];

const CRR = "COUNSEL_REVIEW_REQUIRED" as const;

function q(partial: Partial<IntakeItem> & Pick<IntakeItem, "id" | "section" | "prompt" | "type">): IntakeItem {
  return {
    jurisdiction: "SHARED",
    required: false,
    audience: "CLIENT",
    authorityIds: [],
    reviewStatus: CRR,
    ...partial,
  };
}

export const SHARED_ITEMS: IntakeItem[] = [
  // ── 1. Safe use & communication ─────────────────────────────────────
  q({ id: "shared.safety.safe_email", section: "safety", prompt: "Is it safe for the firm to email you at the address on your account?", type: "yes_no", required: true, sensitive: true }),
  q({ id: "shared.safety.safe_phone", section: "safety", prompt: "What is a safe telephone number for you, if any?", type: "short_text", sensitive: true }),
  q({ id: "shared.safety.voicemail_ok", section: "safety", prompt: "Is it safe for us to leave a voicemail at that number?", type: "yes_no", sensitive: true, condition: { kind: "answered", questionId: "shared.safety.safe_phone" } }),
  q({ id: "shared.safety.mail_ok", section: "safety", prompt: "Is it safe to send postal mail to your current address?", type: "yes_no", required: true, sensitive: true }),
  q({ id: "shared.safety.device_private", section: "safety", prompt: "Is the device you are using private (not shared with or monitored by the other party)?", type: "yes_no", required: true, sensitive: true, helpText: "If you are not sure, you can pause and continue later from a safer device. Your answers save as you go." }),
  q({ id: "shared.safety.preferred_contact", section: "safety", prompt: "How do you prefer the firm contact you?", type: "single_select", required: true, options: [ { value: "EMAIL", label: "Email" }, { value: "PHONE", label: "Phone call" }, { value: "TEXT", label: "Text message" }, { value: "PORTAL", label: "Through this portal only" } ] }),
  q({ id: "shared.safety.language_access", section: "safety", prompt: "Do you need language assistance or another accommodation to complete this intake?", type: "yes_no", helpText: "You can also use the “I need help completing this intake” button at any time — no reason required." }),
  q({ id: "shared.safety.immediate_danger", section: "safety", prompt: "Do you feel in immediate danger right now?", type: "yes_no", required: true, sensitive: true, helpText: "If you are in immediate danger, call 911. This portal is not monitored around the clock and is not an emergency service." }),
  q({ id: "shared.safety.current_protective_order", section: "safety", prompt: "Is there a protective or restraining order in place right now involving you or the other party?", type: "yes_no", required: true, sensitive: true, documentIds: ["doc.protective_orders"] }),
  q({ id: "shared.safety.prior_protective_order", section: "safety", prompt: "Has there ever been a protective or restraining order between you and the other party?", type: "yes_no", sensitive: true, documentIds: ["doc.protective_orders"] }),
  q({ id: "shared.safety.weapons_concern", section: "safety", prompt: "Do you have concerns about weapons in either household?", type: "yes_no", sensitive: true }),
  q({ id: "shared.safety.stalking_concern", section: "safety", prompt: "Do you have concerns about being followed, tracked, or monitored?", type: "yes_no", sensitive: true }),
  q({ id: "shared.safety.child_abuse_concern", section: "safety", prompt: "Do you have concerns about a child's safety?", type: "yes_no", sensitive: true }),
  q({ id: "shared.safety.abduction_concern", section: "safety", prompt: "Are you concerned the other party may take a child out of state or out of the country without agreement?", type: "yes_no", sensitive: true }),
  q({ id: "shared.safety.address_confidential", section: "safety", prompt: "Do you need your address kept confidential from the other party?", type: "yes_no", sensitive: true }),
  q({ id: "shared.safety.attorney_contact_urgent", section: "safety", prompt: "Do you need your attorney to contact you urgently about a safety issue?", type: "yes_no", sensitive: true }),

  // ── 2. Identity ─────────────────────────────────────────────────────
  q({ id: "shared.identity.client_name", section: "identity", prompt: "Your full legal name", type: "short_text", required: true }),
  q({ id: "shared.identity.client_prior_names", section: "identity", prompt: "Any prior or other names you have used (maiden name, etc.)", type: "short_text" }),
  q({ id: "shared.identity.client_dob", section: "identity", prompt: "Your date of birth", type: "date", required: true, sensitive: true, helpText: "The court requires basic identifying information. It is handled confidentially." }),
  q({ id: "shared.identity.client_address", section: "identity", prompt: "Your current address", type: "address", required: true, sensitive: true }),
  q({ id: "shared.identity.client_prior_addresses", section: "identity", prompt: "Your addresses over the last five years (most recent first)", type: "long_text" }),
  q({ id: "shared.identity.other_name", section: "identity", prompt: "The other party's full legal name", type: "short_text", required: true }),
  q({ id: "shared.identity.other_prior_names", section: "identity", prompt: "Any prior or other names the other party has used", type: "short_text" }),
  q({ id: "shared.identity.other_dob", section: "identity", prompt: "The other party's date of birth (if known)", type: "date", sensitive: true }),
  q({ id: "shared.identity.other_address", section: "identity", prompt: "The other party's current address (if known)", type: "address" }),
  q({ id: "shared.identity.household_members", section: "identity", prompt: "Who currently lives in your household?", type: "long_text" }),
  q({ id: "shared.identity.related_entities", section: "identity", prompt: "Any businesses, trusts, or organizations connected to you or the other party", type: "entity" }),

  // ── 3. Relationship / marriage ──────────────────────────────────────
  q({ id: "shared.relationship.status_kind", section: "relationship", prompt: "What is the legal relationship between you and the other party?", type: "single_select", required: true, options: [ { value: "MARRIAGE", label: "Marriage" }, { value: "CIVIL_UNION", label: "Civil union" }, { value: "DOMESTIC_PARTNERSHIP", label: "Domestic partnership" }, { value: "NEVER_MARRIED", label: "We were never married or in a civil union" } ] }),
  q({ id: "shared.relationship.marriage_date", section: "relationship", prompt: "Date of the marriage / union", type: "date", condition: { kind: "in", questionId: "shared.relationship.status_kind", values: ["MARRIAGE", "CIVIL_UNION", "DOMESTIC_PARTNERSHIP"] }, documentIds: ["doc.marriage_certificate"] }),
  // ONE question for the whole place-of-marriage fact. It used to be three
  // (city+country, then state, then civil-or-religious) and the 2026-07-26
  // live interview asked all three back-to-back after the client had already
  // answered them in a single sentence ("Civil ceremony, Goshen, NY 10940").
  // `marriage_state` and `ny.case.married_in_ny` are now DERIVED from this
  // answer server-side (deriveImpliedAnswers) and are never asked.
  q({ id: "shared.relationship.marriage_place", section: "relationship", prompt: "Where did the ceremony take place? (city, and state or country)", type: "short_text", condition: { kind: "in", questionId: "shared.relationship.status_kind", values: ["MARRIAGE", "CIVIL_UNION", "DOMESTIC_PARTNERSHIP"] } }),
  q({ id: "shared.relationship.marriage_state", section: "relationship", prompt: "State (or province) where the ceremony took place", type: "short_text", condition: { kind: "in", questionId: "shared.relationship.status_kind", values: ["MARRIAGE", "CIVIL_UNION", "DOMESTIC_PARTNERSHIP"] } }),
  q({ id: "shared.relationship.ceremony_type", section: "relationship", prompt: "Was the ceremony civil or religious?", type: "single_select", options: [ { value: "CIVIL", label: "Civil" }, { value: "RELIGIOUS", label: "Religious" } ], condition: { kind: "in", questionId: "shared.relationship.status_kind", values: ["MARRIAGE", "CIVIL_UNION"] }, helpText: "New York asks this because a religious ceremony can carry an extra step at the end of the case. Your attorney handles it." }),
  q({ id: "shared.relationship.religious_marriage_issues", section: "relationship", prompt: "Are there religious-marriage matters your attorney should know about (for example, a religious divorce requirement)?", type: "yes_no" }),
  q({ id: "shared.relationship.prior_matrimonial_actions", section: "relationship", prompt: "Has either of you previously filed for divorce, separation, or annulment (against each other or anyone else)?", type: "yes_no", required: true, documentIds: ["doc.pleadings_orders"] }),
  q({ id: "shared.relationship.separation_date", section: "relationship", prompt: "If you have separated, when did you separate?", type: "date" }),
  q({ id: "shared.relationship.living_arrangement", section: "relationship", prompt: "What is your current living arrangement?", type: "single_select", required: true, options: [ { value: "SAME_RESIDENCE", label: "Living in the same residence" }, { value: "SEPARATE_RESIDENCES", label: "Living separately" } ] }),
  q({ id: "shared.relationship.written_agreements", section: "relationship", prompt: "Do you have any written agreements with the other party (prenuptial, separation, settlement)?", type: "yes_no", required: true, documentIds: ["doc.prior_agreements"] }),
  q({ id: "shared.relationship.name_restoration", section: "relationship", prompt: "Would you like a former name restored, as a preference for your attorney to consider?", type: "yes_no" }),
  q({ id: "shared.relationship.name_restoration_name", section: "relationship", prompt: "Which name?", type: "short_text", condition: { kind: "truthy", questionId: "shared.relationship.name_restoration" } }),

  // ── 4. Residence & jurisdiction FACTS ───────────────────────────────
  q({ id: "shared.residence.party_history", section: "residence", prompt: "Your residence history for the last five years (state, from, to)", type: "repeat_case", required: true, helpText: "List each state you lived in and roughly when. Your attorney uses this to determine the right court — you do not need to know which state applies." }),
  q({ id: "shared.residence.spouse_history", section: "residence", prompt: "The other party's residence history for the last five years, as best you know (state, from, to)", type: "repeat_case" }),
  q({ id: "shared.residence.events_location", section: "residence", prompt: "In which state(s) did the main events of your matter happen?", type: "short_text" }),
  q({ id: "shared.residence.military", section: "residence", prompt: "Is either party an active-duty service member or claiming a military home state?", type: "yes_no" }),
  q({ id: "shared.residence.military_detail", section: "residence", prompt: "Which party, and what is their claimed home state / duty station?", type: "short_text", condition: { kind: "truthy", questionId: "shared.residence.military" } }),
  q({ id: "shared.residence.other_proceedings", section: "residence", prompt: "Is there a case between you and the other party pending anywhere else (another state or country)?", type: "yes_no", required: true }),

  // ── 5. Prior & pending matters ──────────────────────────────────────
  q({ id: "shared.priors.records", section: "priors", prompt: "List each current or past court matter involving you, the other party, or the children", type: "repeat_case", helpText: "Include the court, county, state, case or docket number if you have it, what kind of case it was, and how it ended.", documentIds: ["doc.pleadings_orders"] }),
  q({ id: "shared.priors.support_orders", section: "priors", prompt: "Is there any existing child-support or spousal-support order?", type: "yes_no", required: true, documentIds: ["doc.pleadings_orders"] }),
  q({ id: "shared.priors.custody_orders", section: "priors", prompt: "Is there any existing custody or parenting-time order?", type: "yes_no", required: true, documentIds: ["doc.pleadings_orders"] }),
  q({ id: "shared.priors.criminal_safety", section: "priors", prompt: "Are there criminal matters relevant to safety involving either party?", type: "yes_no", sensitive: true, documentIds: ["doc.police_reports"] }),
  q({ id: "shared.priors.child_protective", section: "priors", prompt: "Has a child-protective agency ever been involved with your family?", type: "yes_no", sensitive: true }),
  q({ id: "shared.priors.bankruptcy", section: "priors", prompt: "Has either party filed for bankruptcy?", type: "yes_no", documentIds: ["doc.bankruptcy"] }),
  q({ id: "shared.priors.upcoming_dates", section: "priors", prompt: "Any upcoming court dates you know of (case and date)", type: "long_text" }),

  // ── 6. Children & parentage ─────────────────────────────────────────
  q({ id: "shared.children.any", section: "children", prompt: "Do you and the other party have children together (including adopted or expected)?", type: "yes_no", required: true, helpText: "If you are wondering why we ask: the Verified Complaint — the document that starts your case — has to state whether there are children of the marriage, and name each one. The court will not accept it otherwise." }),
  q({ id: "shared.children.records", section: "children", prompt: "For each child: full name and date of birth", type: "repeat_child", required: true, condition: { kind: "truthy", questionId: "shared.children.any" }, sensitive: true, helpText: "Name and date of birth are what the Verified Complaint prints. Anything else about the children comes later, with your attorney." }),
  q({ id: "shared.children.residence_history", section: "children", prompt: "Where has each child lived during the last five years (state and with whom)?", type: "long_text", condition: { kind: "truthy", questionId: "shared.children.any" }, helpText: "This history matters for which court can decide about the children. Your attorney makes that determination." }),
  q({ id: "shared.children.parentage_docs", section: "children", prompt: "Is there an acknowledgment of parentage, a parentage court order, or an adoption for any child?", type: "yes_no", condition: { kind: "truthy", questionId: "shared.children.any" }, documentIds: ["doc.pleadings_orders"] }),
  q({ id: "shared.children.assisted_reproduction", section: "children", prompt: "Was any child born through assisted reproduction or surrogacy?", type: "yes_no", condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "shared.children.special_needs", section: "children", prompt: "Does any child have medical or special needs your attorney should know about?", type: "yes_no", condition: { kind: "truthy", questionId: "shared.children.any" }, sensitive: true, documentIds: ["doc.medical_records"] }),
  q({ id: "shared.children.insurance", section: "children", prompt: "Who currently provides health insurance for the children?", type: "single_select", options: [ { value: "ME", label: "I do" }, { value: "OTHER_PARTY", label: "The other party" }, { value: "BOTH", label: "Both / split" }, { value: "PUBLIC", label: "Public coverage" }, { value: "NONE", label: "No coverage right now" } ], condition: { kind: "truthy", questionId: "shared.children.any" }, documentIds: ["doc.insurance_policies"] }),

  // ── 7. Parenting facts ──────────────────────────────────────────────
  q({ id: "shared.parenting.current_schedule", section: "parenting", prompt: "Describe the current parenting schedule as it actually works today", type: "long_text", condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "shared.parenting.history", section: "parenting", prompt: "How were parenting time and caretaking shared over the last two years?", type: "long_text", condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "shared.parenting.decisions", section: "parenting", prompt: "How are major decisions (school, medical) made today?", type: "long_text", condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "shared.parenting.transportation", section: "parenting", prompt: "How is transportation between households handled?", type: "short_text", condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "shared.parenting.holidays", section: "parenting", prompt: "How are holidays and vacations handled today?", type: "long_text", condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "shared.parenting.communication", section: "parenting", prompt: "How do the households communicate about the children?", type: "short_text", condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "shared.parenting.relocation", section: "parenting", prompt: "Is either parent considering moving?", type: "yes_no", condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "shared.parenting.supervised", section: "parenting", prompt: "Has any parenting time ever been supervised or restricted?", type: "yes_no", condition: { kind: "truthy", questionId: "shared.children.any" }, sensitive: true }),
  q({ id: "shared.parenting.missed_time", section: "parenting", prompt: "Have there been significant periods of missed parenting time?", type: "yes_no", condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "shared.parenting.third_party_care", section: "parenting", prompt: "Do grandparents or others regularly care for the children?", type: "short_text", condition: { kind: "truthy", questionId: "shared.children.any" } }),

  // ── 8. Income & employment ──────────────────────────────────────────
  q({ id: "shared.income.employers", section: "income", prompt: "Your current employment (employer, role, start date)", type: "repeat_employer", required: true, documentIds: ["doc.pay_records"] }),
  q({ id: "shared.income.sources", section: "income", prompt: "All of your income sources and approximate amounts (salary, overtime, bonus, commissions, self-employment, rental, investments, benefits, unemployment, disability, public benefits, other)", type: "repeat_income", required: true, documentIds: ["doc.pay_records", "doc.tax_returns"] }),
  q({ id: "shared.income.other_party", section: "income", prompt: "The other party's employment and income, as best you know", type: "long_text" }),
  q({ id: "shared.income.history", section: "income", prompt: "Roughly what did each of you earn in each of the last three years?", type: "long_text", documentIds: ["doc.tax_returns"] }),
  q({ id: "shared.income.withholding", section: "income", prompt: "Anything unusual about tax withholding (extra withholding, exempt status)?", type: "short_text" }),

  // ── 9. Expenses ─────────────────────────────────────────────────────
  q({ id: "shared.expenses.housing", section: "expenses", prompt: "Monthly housing cost (rent or mortgage, taxes, insurance)", type: "money", required: true }),
  q({ id: "shared.expenses.utilities", section: "expenses", prompt: "Monthly utilities (electric, gas, water, phone, internet)", type: "money" }),
  q({ id: "shared.expenses.food", section: "expenses", prompt: "Monthly food and household supplies", type: "money" }),
  q({ id: "shared.expenses.transportation", section: "expenses", prompt: "Monthly transportation (car payment, insurance, fuel, transit)", type: "money" }),
  q({ id: "shared.expenses.insurance", section: "expenses", prompt: "Monthly insurance premiums you pay", type: "money" }),
  q({ id: "shared.expenses.medical", section: "expenses", prompt: "Monthly unreimbursed medical costs", type: "money" }),
  q({ id: "shared.expenses.education", section: "expenses", prompt: "Monthly education costs", type: "money" }),
  q({ id: "shared.expenses.childcare", section: "expenses", prompt: "Monthly childcare costs", type: "money", condition: { kind: "truthy", questionId: "shared.children.any" }, documentIds: ["doc.childcare_proof"] }),
  q({ id: "shared.expenses.debt_service", section: "expenses", prompt: "Monthly debt payments (cards, loans)", type: "money" }),
  q({ id: "shared.expenses.child_related", section: "expenses", prompt: "Other monthly child-related costs (activities, tutoring)", type: "money", condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "shared.expenses.extraordinary", section: "expenses", prompt: "Any extraordinary or irregular expenses", type: "long_text" }),

  // ── 10. Assets ──────────────────────────────────────────────────────
  q({ id: "shared.assets.records", section: "assets", prompt: "List each significant asset (real estate, bank accounts, investments, vehicles, valuables, digital assets, trusts, expected inheritances, pending claims, foreign assets)", type: "repeat_asset", required: true, helpText: "For each: what it is, whose name it is in, roughly what it is worth, and any loan against it.", documentIds: ["doc.bank_statements", "doc.brokerage_statements", "doc.deeds_mortgages"] }),
  q({ id: "shared.assets.real_estate_any", section: "assets", prompt: "Does either party own or co-own real estate?", type: "yes_no", required: true, documentIds: ["doc.deeds_mortgages", "doc.appraisals"] }),
  q({ id: "shared.assets.safe_deposit", section: "assets", prompt: "Any safe-deposit boxes or significant cash on hand?", type: "short_text" }),

  // ── 11. Debts ───────────────────────────────────────────────────────
  q({ id: "shared.debts.records", section: "debts", prompt: "List each significant debt (mortgages, home-equity, credit cards, personal loans, student loans, business or tax liabilities, judgments, family loans, contingent or foreign liabilities)", type: "repeat_debt", required: true }),
  q({ id: "shared.debts.disputed", section: "debts", prompt: "Are any debts disputed between you and the other party?", type: "yes_no" }),
  q({ id: "shared.debts.disputed_detail", section: "debts", prompt: "Which debts, and what is the disagreement about (facts only)?", type: "long_text", condition: { kind: "truthy", questionId: "shared.debts.disputed" } }),

  // ── 12. Property history (facts; no classification) ────────────────
  q({ id: "shared.property.premarital", section: "property_history", prompt: "Did either of you own significant property before the marriage? Describe it.", type: "long_text" }),
  q({ id: "shared.property.gifts_inheritance", section: "property_history", prompt: "Did either of you receive significant gifts or inheritances? From whom, when, and what happened to them?", type: "long_text" }),
  q({ id: "shared.property.title_changes", section: "property_history", prompt: "Were any titles changed or property transferred between you (or to others) during the marriage?", type: "long_text" }),
  q({ id: "shared.property.refinance_improvements", section: "property_history", prompt: "Any refinances or major improvements to property? Who paid?", type: "long_text" }),
  q({ id: "shared.property.mixing", section: "property_history", prompt: "Were separate funds ever deposited into joint accounts or used for joint purchases? Describe what you remember.", type: "long_text", helpText: "Just describe what happened. Whether the law treats property as marital or separate is a determination your attorney makes." }),
  q({ id: "shared.property.dissipation_concern", section: "property_history", prompt: "Are you concerned money or property has been hidden, moved, or spent unusually?", type: "yes_no" }),
  q({ id: "shared.property.tracing_docs", section: "property_history", prompt: "Do you have records tracing where major funds came from (closing statements, old account statements)?", type: "yes_no", documentIds: ["doc.bank_statements", "doc.deeds_mortgages"] }),

  // ── 13. Insurance & benefits ────────────────────────────────────────
  q({ id: "shared.insurance.records", section: "insurance", prompt: "List insurance in force (health, life, disability, home/renters, auto, long-term care): carrier, who is covered, who pays", type: "repeat_insurance", documentIds: ["doc.insurance_policies"] }),
  q({ id: "shared.insurance.beneficiaries", section: "insurance", prompt: "Who are the current beneficiaries on life insurance and retirement accounts, as best you know?", type: "long_text" }),
  q({ id: "shared.insurance.employer_benefits", section: "insurance", prompt: "Any employer benefits worth noting (stock plans, HSA, tuition, other)?", type: "long_text" }),

  // ── 14. Taxes ───────────────────────────────────────────────────────
  q({ id: "shared.taxes.filing_status", section: "taxes", prompt: "How did you file your most recent tax return?", type: "single_select", options: [ { value: "JOINT", label: "Married filing jointly" }, { value: "SEPARATE", label: "Married filing separately" }, { value: "HOH", label: "Head of household" }, { value: "SINGLE", label: "Single" }, { value: "NOT_FILED", label: "Have not filed yet" } ], required: true, documentIds: ["doc.tax_returns"] }),
  q({ id: "shared.taxes.issues", section: "taxes", prompt: "Any extensions, audits, unpaid taxes, estimated-tax obligations, or expected refunds?", type: "long_text" }),
  q({ id: "shared.taxes.dependents", section: "taxes", prompt: "Who claimed the children as dependents most recently?", type: "short_text", condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "shared.taxes.foreign", section: "taxes", prompt: "Any foreign income, accounts, or reporting (FBAR)?", type: "yes_no" }),
  q({ id: "shared.taxes.professional", section: "taxes", prompt: "Who prepares your taxes (name/firm), if anyone?", type: "short_text" }),

  // ── 15. Retirement ──────────────────────────────────────────────────
  q({ id: "shared.retirement.records", section: "retirement", prompt: "List each retirement account or pension (plan name, type, whose, approximate balance, service dates, loans, beneficiary)", type: "repeat_asset", documentIds: ["doc.retirement_statements"] }),
  q({ id: "shared.retirement.premarital_component", section: "retirement", prompt: "Were any retirement accounts started before the marriage? Which ones?", type: "long_text" }),
  q({ id: "shared.retirement.existing_dro", section: "retirement", prompt: "Is there an existing court order dividing any retirement account?", type: "yes_no", documentIds: ["doc.pleadings_orders"] }),

  // ── 16. Business & professional interests ───────────────────────────
  q({ id: "shared.business.any", section: "business", prompt: "Does either party own any part of a business or professional practice?", type: "yes_no", required: true }),
  q({ id: "shared.business.records", section: "business", prompt: "For each business: name, entity type, ownership %, partners, formation date, what it does", type: "entity", condition: { kind: "truthy", questionId: "shared.business.any" }, documentIds: ["doc.business_records"] }),
  q({ id: "shared.business.financials", section: "business", prompt: "What financial records exist (returns, statements, valuations, buy-sell agreements)? Any related-party dealings?", type: "long_text", condition: { kind: "truthy", questionId: "shared.business.any" }, documentIds: ["doc.business_records", "doc.appraisals"] }),
  q({ id: "shared.business.compensation", section: "business", prompt: "How is the owner compensated (salary, distributions, retained earnings)?", type: "long_text", condition: { kind: "truthy", questionId: "shared.business.any" } }),

  // ── 17. Special flags (facts → attorney review) ────────────────────
  q({ id: "shared.special.immigration", section: "special", prompt: "Are there immigration considerations for you, the other party, or the children?", type: "yes_no", sensitive: true }),
  q({ id: "shared.special.military_service", section: "special", prompt: "Is either party a current or former service member?", type: "yes_no" }),
  q({ id: "shared.special.disability_benefits", section: "special", prompt: "Does anyone in the family receive disability or public benefits?", type: "yes_no" }),
  q({ id: "shared.special.other", section: "special", prompt: "Anything else you believe your attorney should know?", type: "long_text" }),

  // ── 18. Document inventory (standing requests) ─────────────────────
  q({ id: "shared.documents.marriage_certificate", section: "documents", prompt: "Marriage / civil union certificate", type: "document_request", documentIds: ["doc.marriage_certificate"], condition: { kind: "in", questionId: "shared.relationship.status_kind", values: ["MARRIAGE", "CIVIL_UNION", "DOMESTIC_PARTNERSHIP"] } }),
  q({ id: "shared.documents.tax_returns", section: "documents", prompt: "Last three years of tax returns", type: "document_request", documentIds: ["doc.tax_returns"] }),
  q({ id: "shared.documents.pay_records", section: "documents", prompt: "Recent pay records", type: "document_request", documentIds: ["doc.pay_records"] }),
  q({ id: "shared.documents.bank_statements", section: "documents", prompt: "Recent bank statements", type: "document_request", documentIds: ["doc.bank_statements"] }),

  // ── 19. Goals (preferences, not conclusions) ────────────────────────
  q({ id: "shared.goals.desired_outcome", section: "goals", prompt: "In your own words, what outcome are you hoping for?", type: "long_text", required: true }),
  q({ id: "shared.goals.immediate_concerns", section: "goals", prompt: "What are your most immediate concerns?", type: "long_text" }),
  q({ id: "shared.goals.settlement_priorities", section: "goals", prompt: "What matters most to you in a settlement?", type: "long_text" }),
  q({ id: "shared.goals.parenting_goals", section: "goals", prompt: "What are your parenting goals?", type: "long_text", condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "shared.goals.financial_goals", section: "goals", prompt: "What are your financial goals or worries?", type: "long_text" }),
  q({ id: "shared.goals.timing", section: "goals", prompt: "Any timing concerns (deadlines, events)?", type: "short_text" }),
  q({ id: "shared.goals.privacy", section: "goals", prompt: "Any privacy concerns?", type: "short_text" }),
  q({ id: "shared.goals.mediation", section: "goals", prompt: "Are you open to mediation or settlement discussions?", type: "single_select", options: [ { value: "YES", label: "Yes" }, { value: "MAYBE", label: "Maybe — I'd like advice" }, { value: "NO", label: "No" } ] }),
  q({ id: "shared.goals.missing_info", section: "goals", prompt: "Is there information or a document you believe is missing or hard to get?", type: "long_text" }),

  // ── 20. Review ──────────────────────────────────────────────────────
  q({ id: "shared.review.certification", section: "review", prompt: "I confirm the information I provided is true and complete to the best of my knowledge, and I understand my attorney will rely on it. ", type: "yes_no", required: true, helpText: "You can come back and correct any answer before your attorney finalizes documents." }),

  // ── Attorney-only determinations (never client-visible) ────────────
  q({ id: "shared.det.jurisdiction", section: "review", prompt: "ATTORNEY DETERMINATION: Which state's courts should this matter proceed in, based on the residence and case-history facts?", type: "attorney_determination", audience: "ATTORNEY" }),
  q({ id: "shared.det.parentage", section: "review", prompt: "ATTORNEY DETERMINATION: Are there parentage issues requiring resolution?", type: "attorney_determination", audience: "ATTORNEY", condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "shared.det.property_character", section: "review", prompt: "ATTORNEY DETERMINATION: Preliminary characterization questions on property (marital/separate/commingled) requiring analysis.", type: "attorney_determination", audience: "ATTORNEY" }),
  q({ id: "shared.det.safety_escalation", section: "review", prompt: "ATTORNEY DETERMINATION: Does the safety screen require immediate escalation / protective steps?", type: "attorney_determination", audience: "ATTORNEY" }),
];
