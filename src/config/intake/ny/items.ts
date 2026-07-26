/**
 * New York intake module — FACTS mapped to the researched authority
 * snapshot (src/config/legal-authority/ny/records.json). No item asks the
 * client for a legal conclusion; no maintenance/support calculators are
 * implemented. All wording COUNSEL_REVIEW_REQUIRED.
 */
import type { DocumentCatalogItem, IntakeItem, IntakeSection, MatterCategory } from "@/lib/intake2/types";
import { CSSA_GUIDELINES, MAINTENANCE_GUIDELINES, usd } from "@/config/legal/ny-guidelines-2026";

export const NY_SECTIONS: IntakeSection[] = [
  { id: "ny_case", title: "New York case details", order: 30, description: "Facts specific to a New York Supreme Court or Family Court matter." },
  { id: "ny_scope", title: "What still needs to be worked out", order: 33, description: "Which parts of the divorce you and the other party have already settled between yourselves. Your attorney reviews every answer — nothing here is decided by this questionnaire." },
  { id: "ny_settlement", title: "Your settlement terms", order: 30, description: "What you and the other party have already agreed. These answers become your Stipulation of Settlement — your attorney reviews every word before anything is signed." },
  { id: "ny_financial", title: "New York financial disclosure (Statement of Net Worth preparation)", order: 31, description: "New York matrimonial cases use a sworn Statement of Net Worth. These answers prepare it." },
  { id: "ny_postjudgment", title: "After-judgment changes", order: 32 },
];

export const NY_DOCUMENTS: DocumentCatalogItem[] = [
  { id: "doc.ny_snw_support", title: "Statement of Net Worth supporting documents", requestText: "Documents supporting your Statement of Net Worth (recent pay stubs, last tax return, current account statements)." },
  { id: "doc.ny_settlement_agreement", title: "Settlement / separation agreement", requestText: "Your signed settlement or separation agreement, if you have one." },
  { id: "doc.ny_judgment", title: "Judgment of divorce / existing NY orders", requestText: "Your NY judgment of divorce and any orders you want reviewed." },
];

const CRR = "COUNSEL_REVIEW_REQUIRED" as const;
const SUP: MatterCategory[] = ["NY_SUPREME_UNCONTESTED_JOINT", "NY_SUPREME_UNCONTESTED", "NY_SUPREME_CONTESTED"];
const SUP_ALL: MatterCategory[] = [...SUP, "NY_SUPREME_POST_JUDGMENT"];
const FC: MatterCategory[] = ["NY_FAMILY_COURT_CUSTODY_VISITATION", "NY_FAMILY_COURT_SUPPORT_PARENTAGE"];

function q(partial: Partial<IntakeItem> & Pick<IntakeItem, "id" | "section" | "prompt" | "type">): IntakeItem {
  return { jurisdiction: "NY", required: false, audience: "CLIENT", authorityIds: [], reviewStatus: CRR, ...partial };
}

export const NY_ITEMS: IntakeItem[] = [
  // ── Residence facts (DRL 230) ───────────────────────────────────────
  q({ id: "ny.case.resident_now", section: "ny_case", prompt: "Do you currently live in New York?", type: "yes_no", required: true, authorityIds: ["NY-DIVORCE-RESIDENCE-001"] }),
  q({ id: "ny.case.resident_since", section: "ny_case", prompt: "Since when have you continuously lived in New York?", type: "date", condition: { kind: "truthy", questionId: "ny.case.resident_now" }, authorityIds: ["NY-DIVORCE-RESIDENCE-001"], helpText: "New York has residence requirements for matrimonial cases. Your attorney determines whether they are satisfied — just give the date." }),
  q({ id: "ny.case.spouse_resident", section: "ny_case", prompt: "Does the other party currently live in New York?", type: "yes_no", authorityIds: ["NY-DIVORCE-RESIDENCE-001"] }),
  q({ id: "ny.case.married_in_ny", section: "ny_case", prompt: "Were you married in New York?", type: "yes_no", categories: SUP_ALL, authorityIds: ["NY-DIVORCE-RESIDENCE-001"] }),
  q({ id: "ny.case.lived_in_ny_as_spouses", section: "ny_case", prompt: "Did you and the other party ever live in New York together as spouses?", type: "yes_no", categories: SUP_ALL, authorityIds: ["NY-DIVORCE-RESIDENCE-001"] }),
  q({ id: "ny.case.county", section: "ny_case", prompt: "Which New York county do you live in (or expect the case to proceed in)?", type: "short_text", required: true, authorityIds: ["NY-MATRIMONIAL-RULES-001"] }),

  // ── Grounds facts (DRL § 170(7)) ────────────────────────────────────
  // SCOPE IS UNCONTESTED-ONLY. An uncontested NY divorce is pleaded under
  // DRL § 170(7) — irretrievable breakdown for six months or more, stated
  // under oath by ONE party. The fault grounds (cruelty, adultery,
  // abandonment, imprisonment) and the separation-agreement/decree grounds
  // are NOT offered: they are contested-case pleadings, and listing them
  // alongside § 170(7) misled the client in the 2026-07-26 live test into
  // thinking a six-month physical separation was required. IT IS NOT.
  // Spouses living under the same roof qualify.
  q({ id: "ny.case.grounds_facts", section: "ny_case", prompt: "Has the relationship between you and the other party been broken down beyond repair for at least six months?", type: "single_select", categories: SUP, required: true, authorityIds: ["NY-DIVORCE-GROUNDS-001"], helpText: "This is what New York asks for in an uncontested divorce (DRL § 170(7)). It does NOT require living apart — you can still be in the same home. Only one of you has to state it, and the other party does not have to agree with the reason.", options: [
    { value: "IRRETRIEVABLE_6MO", label: "Yes — it has been broken down beyond repair for six months or more" },
    { value: "OTHER", label: "No, or I'm not sure — I'd like the attorney to look at this" },
  ] }),
  q({ id: "ny.case.grounds_dates", section: "ny_case", prompt: "Roughly when did the breakdown begin? (a month and year is fine)", type: "short_text", categories: SUP, condition: { kind: "answered", questionId: "ny.case.grounds_facts" }, authorityIds: ["NY-DIVORCE-GROUNDS-001"] }),

  // ── Posture / commencement facts ────────────────────────────────────
  q({ id: "ny.case.agreement_posture", section: "ny_case", prompt: "As of today, where do things stand between you and the other party?", type: "single_select", categories: SUP, required: true, options: [
    { value: "JOINT", label: "We are filing together and agree on everything" },
    { value: "FULL_AGREEMENT", label: "We agree on everything (I will file)" },
    { value: "PARTIAL", label: "We agree on some things" },
    { value: "NO_AGREEMENT", label: "We don't agree / we are not talking" },
  ], authorityIds: ["NY-UNCONTESTED-FORMS-001"] }),
  q({ id: "ny.case.signed_agreement", section: "ny_case", prompt: "Do you already have a signed settlement or separation agreement?", type: "yes_no", categories: SUP, authorityIds: ["NY-UNCONTESTED-FORMS-001"], documentIds: ["doc.ny_settlement_agreement"] }),
  q({ id: "ny.case.index_number", section: "ny_case", prompt: "If a case has already been started: the index number, county, and filing date", type: "short_text", categories: SUP_ALL, authorityIds: ["NY-CONTESTED-PROCESS-001"] }),
  q({ id: "ny.case.service_facts", section: "ny_case", prompt: "Will the other party accept papers, sign an affidavit, or need formal service? What do you expect?", type: "short_text", categories: SUP, authorityIds: ["NY-UNCONTESTED-FORMS-001"] }),

  // ── Scope of the uncontested resolution ─────────────────────────────
  // Operator directive 2026-07-26: "Everything is fair game because a lawyer
  // is reviewing it. I don't need to guardrail the shit out of this if a
  // competent attorney is there to review it for his or her county."
  // These are FACT questions about what the parties have already settled
  // between themselves — no legal advice, no calculators, no gatekeeping.
  // Custody and child support ask ONLY when there are children; with no
  // children the interview drops straight to equitable distribution.
  q({ id: "ny.scope.custody", section: "ny_scope", prompt: "Have you and the other party already agreed on custody and a parenting schedule for the children?", type: "single_select", categories: SUP, required: true, condition: { kind: "truthy", questionId: "shared.children.any" }, authorityIds: ["NY-UCCJEA-001"], options: [
    { value: "AGREED", label: "Yes — we've agreed" },
    { value: "MOSTLY", label: "Mostly — a few details are open" },
    { value: "NOT_YET", label: "Not yet" },
  ], helpText: "Your attorney papers whatever you two have agreed and advises you on anything still open." }),
  q({ id: "ny.scope.child_support", section: "ny_scope", prompt: "Have you and the other party already agreed on child support?", type: "single_select", categories: SUP, required: true, condition: { kind: "truthy", questionId: "shared.children.any" }, authorityIds: ["NY-CSSA-001"], options: [
    { value: "AGREED", label: "Yes — we've agreed on an amount" },
    { value: "MOSTLY", label: "Mostly — we still need to work out details" },
    { value: "NOT_YET", label: "Not yet" },
  ], helpText: "New York has a child-support formula your attorney applies. Any agreement that departs from it has to say so in writing — that is your attorney's job, not yours." }),
  q({ id: "ny.scope.maintenance", section: "ny_scope", prompt: "Have you and the other party already agreed about spousal support (maintenance) — including agreeing that neither of you will pay it?", type: "single_select", categories: SUP, required: true, authorityIds: ["NY-ED-MAINTENANCE-001"], options: [
    { value: "AGREED_NONE", label: "Yes — neither of us will pay maintenance" },
    { value: "AGREED_AMOUNT", label: "Yes — we've agreed on payments" },
    { value: "NOT_YET", label: "Not yet" },
  ] }),
  q({ id: "ny.scope.equitable_distribution", section: "ny_scope", prompt: "Have you and the other party already agreed on how to divide your property and debts?", type: "single_select", categories: SUP, required: true, authorityIds: ["NY-ED-MAINTENANCE-001"], options: [
    { value: "AGREED", label: "Yes — we've agreed on everything" },
    { value: "MOSTLY", label: "Mostly — some items are still open" },
    { value: "NOT_YET", label: "Not yet" },
  ], helpText: "This covers the house, vehicles, bank and retirement accounts, and any debts in either name." }),
  q({ id: "ny.scope.all_resolved", section: "ny_scope", prompt: "Putting it all together — is everything resolved between you and the other party?", type: "yes_no", categories: SUP, required: true, helpText: "A “no” does not stop anything. It tells your attorney what is still open so they can work it out with you." }),

  // ── Family Court facts ──────────────────────────────────────────────
  q({ id: "ny.fc.relief_sought", section: "ny_case", prompt: "What are you asking the Family Court to address? (Select all that apply)", type: "multi_select", categories: FC, required: true, authorityIds: ["NY-FC-JURISDICTION-001"], options: [
    { value: "CUSTODY", label: "Custody" },
    { value: "VISITATION", label: "Visitation / parenting time" },
    { value: "CHILD_SUPPORT", label: "Child support" },
    { value: "PARENTAGE", label: "Parentage" },
    { value: "FAMILY_OFFENSE", label: "Protection from a family offense" },
  ] }),
  q({ id: "ny.fc.parentage_status", section: "ny_case", prompt: "Is parentage of any child not yet legally established?", type: "yes_no", categories: FC, authorityIds: ["NY-FC-JURISDICTION-001"] }),
  q({ id: "ny.fc.existing_supreme", section: "ny_case", prompt: "Is there a divorce or Supreme Court case pending between you and the other party?", type: "yes_no", categories: FC, authorityIds: ["NY-FC-JURISDICTION-001"] }),

  // ── UCCJEA / UIFSA facts ────────────────────────────────────────────
  q({ id: "ny.uccjea.child_home_state_facts", section: "ny_case", prompt: "For each child: which state have they lived in for the last six months, and with whom?", type: "long_text", categories: ["NY_UCCJEA_INTERSTATE", ...FC, ...SUP], condition: { kind: "truthy", questionId: "shared.children.any" }, authorityIds: ["NY-UCCJEA-001"], helpText: "Which state can decide about the children is a legal determination your attorney makes from these facts." }),
  q({ id: "ny.uccjea.other_state_orders", section: "ny_case", prompt: "Has any other state or country issued a custody or support order for these children?", type: "yes_no", categories: ["NY_UCCJEA_INTERSTATE", ...FC, ...SUP], condition: { kind: "truthy", questionId: "shared.children.any" }, authorityIds: ["NY-UCCJEA-001", "NY-UIFSA-001"], documentIds: ["doc.pleadings_orders"] }),
  q({ id: "ny.uifsa.out_of_state_party", section: "ny_case", prompt: "Does the other party live outside New York? Where?", type: "short_text", categories: ["NY_UCCJEA_INTERSTATE", "NY_FAMILY_COURT_SUPPORT_PARENTAGE"], authorityIds: ["NY-UIFSA-001"] }),

  // ── Family offense / emergency (facts; static safety copy) ─────────
  q({ id: "ny.fo.existing_case", section: "ny_case", prompt: "Is there an active family-offense case or order of protection in any court?", type: "yes_no", categories: ["NY_FAMILY_OFFENSE_OR_EMERGENCY_ESCALATION", ...SUP, ...FC], sensitive: true, authorityIds: ["NY-FC-JURISDICTION-001"], documentIds: ["doc.protective_orders"] }),
  q({ id: "ny.fo.order_detail", section: "ny_case", prompt: "If yes: which court, what county, and until when?", type: "short_text", categories: ["NY_FAMILY_OFFENSE_OR_EMERGENCY_ESCALATION", ...SUP, ...FC], sensitive: true, condition: { kind: "truthy", questionId: "ny.fo.existing_case" }, authorityIds: ["NY-FC-JURISDICTION-001"] }),

  // ── Statement of Net Worth preparation (UCS Rev. 1/1/24 families) ───
  q({ id: "ny.snw.family_data_confirm", section: "ny_financial", prompt: "Confirm your family data (names, dates of birth, addresses) is complete — it becomes the Statement of Net Worth family-data section", type: "yes_no", categories: SUP_ALL, required: true, authorityIds: ["NY-SNW-FORM-001", "NY-MATRIMONIAL-RULES-001"], outputs: [{ form: "NY Statement of Net Worth (UCS Rev. 1/1/24)", field: "I. Family Data" }] }),
  q({ id: "ny.snw.expenses_confirm", section: "ny_financial", prompt: "Confirm your monthly expense entries are complete (they become the SNW expense schedules)", type: "yes_no", categories: SUP_ALL, required: true, authorityIds: ["NY-SNW-FORM-001"], outputs: [{ form: "NY Statement of Net Worth (UCS Rev. 1/1/24)", field: "II. Expenses" }] }),
  q({ id: "ny.snw.income_confirm", section: "ny_financial", prompt: "Confirm your income entries are complete (they become the SNW gross-income section)", type: "yes_no", categories: SUP_ALL, required: true, authorityIds: ["NY-SNW-FORM-001"], outputs: [{ form: "NY Statement of Net Worth (UCS Rev. 1/1/24)", field: "III. Gross Income" }] }),
  q({ id: "ny.snw.assets_confirm", section: "ny_financial", prompt: "Confirm your asset list is complete (it becomes the SNW assets section)", type: "yes_no", categories: SUP_ALL, required: true, authorityIds: ["NY-SNW-FORM-001"], outputs: [{ form: "NY Statement of Net Worth (UCS Rev. 1/1/24)", field: "IV. Assets" }] }),
  q({ id: "ny.snw.liabilities_confirm", section: "ny_financial", prompt: "Confirm your debt list is complete (it becomes the SNW liabilities section)", type: "yes_no", categories: SUP_ALL, required: true, authorityIds: ["NY-SNW-FORM-001"], outputs: [{ form: "NY Statement of Net Worth (UCS Rev. 1/1/24)", field: "V. Liabilities" }] }),
  q({ id: "ny.snw.docs_request", section: "ny_financial", prompt: "Statement of Net Worth supporting documents", type: "document_request", categories: SUP_ALL, authorityIds: ["NY-SNW-FORM-001"], documentIds: ["doc.ny_snw_support"] }),
  q({ id: "ny.snw.health_coverage", section: "ny_financial", prompt: "Health-insurance coverage in force for you, the other party, and the children (carrier, who pays)", type: "long_text", categories: SUP_ALL, authorityIds: ["NY-SNW-FORM-001"], documentIds: ["doc.insurance_policies"] }),

  // ── Post-judgment (Supreme) ─────────────────────────────────────────
  q({ id: "ny.pj.judgment_date", section: "ny_postjudgment", prompt: "Date of your NY judgment or the order you want changed/enforced", type: "date", categories: ["NY_SUPREME_POST_JUDGMENT"], required: true, authorityIds: ["NY-CONTESTED-PROCESS-001"], documentIds: ["doc.ny_judgment"] }),
  q({ id: "ny.pj.relief", section: "ny_postjudgment", prompt: "What are you asking for?", type: "single_select", categories: ["NY_SUPREME_POST_JUDGMENT"], required: true, options: [
    { value: "ENFORCE", label: "Enforce an existing judgment/order" },
    { value: "MODIFY_MAINTENANCE", label: "Change maintenance" },
    { value: "MODIFY_SUPPORT", label: "Change child support" },
    { value: "MODIFY_PARENTING", label: "Change parenting arrangements" },
    { value: "OTHER", label: "Something else" },
  ] }),
  q({ id: "ny.pj.changed_circumstances", section: "ny_postjudgment", prompt: "What has changed since the judgment/order (facts and dates)?", type: "long_text", categories: ["NY_SUPREME_POST_JUDGMENT"], required: true }),
  q({ id: "ny.pj.compliance", section: "ny_postjudgment", prompt: "Describe any missed payments or violations (what, when, amounts)", type: "long_text", categories: ["NY_SUPREME_POST_JUDGMENT"], condition: { kind: "eq", questionId: "ny.pj.relief", value: "ENFORCE" } }),

  // ── Phase-2 settlement terms (uncontested stipulation inputs) ────────
  // FACTS + the parties' OWN agreement only. The division is printed in the
  // stipulation verbatim; nothing here generates legal terms. Incomes feed
  // the DRL § 236(B)(6) guideline recital (statutory arithmetic, computed
  // deterministically). [ATTORNEY REVIEW REQUIRED] on all wording.
  q({ id: "ny.settlement.plaintiff_income", section: "ny_settlement", prompt: "Your annual gross income (before taxes), approximately", type: "money", categories: SUP, required: true, helpText: "Used for the required spousal-maintenance guideline notice in your agreement. An estimate is fine — your attorney confirms it." }),
  q({ id: "ny.settlement.defendant_income", section: "ny_settlement", prompt: "The other party's annual gross income (before taxes), as best you know", type: "money", categories: SUP, required: true }),
  q({ id: "ny.settlement.maintenance_waived", section: "ny_settlement", prompt: "Have you and the other party agreed that NEITHER of you will pay spousal support (maintenance) to the other?", type: "yes_no", categories: SUP, required: true, helpText: "If you have agreed on support payments instead, answer No — your attorney will draft those terms with you." }),
  q({ id: "ny.settlement.division_terms", section: "ny_settlement", prompt: "What have you two agreed about who keeps each asset and who pays each debt? One item per line (for example: “I keep the Honda and its loan”).", type: "long_text", categories: SUP, required: true, helpText: "Write it in your own words — this is your agreement, and your attorney turns it into the formal document." }),

  // ── Attorney-only determinations (NY) ───────────────────────────────
  q({ id: "ny.det.residence_satisfied", section: "ny_case", prompt: "ATTORNEY DETERMINATION: Which DRL § 230 residence pathway (if any) is satisfied on these facts?", type: "attorney_determination", audience: "ATTORNEY", authorityIds: ["NY-DIVORCE-RESIDENCE-001"] }),
  q({ id: "ny.det.grounds", section: "ny_case", prompt: "ATTORNEY DETERMINATION: Which DRL § 170 ground(s) will be pleaded?", type: "attorney_determination", audience: "ATTORNEY", categories: SUP, authorityIds: ["NY-DIVORCE-GROUNDS-001"] }),
  q({ id: "ny.det.court_selection", section: "ny_case", prompt: "ATTORNEY DETERMINATION: Supreme Court vs Family Court posture (FCA § 115 / Art. 6 / Art. 8).", type: "attorney_determination", audience: "ATTORNEY", authorityIds: ["NY-FC-JURISDICTION-001"] }),
  q({ id: "ny.det.uccjea", section: "ny_case", prompt: "ATTORNEY DETERMINATION: UCCJEA home-state / jurisdiction analysis (DRL Art. 5-A).", type: "attorney_determination", audience: "ATTORNEY", authorityIds: ["NY-UCCJEA-001"], condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "ny.det.maintenance_posture", section: "ny_financial", prompt: `ATTORNEY DETERMINATION: Maintenance posture under DRL § 236(B)(5-a)/(6). GUIDELINE YEAR APPLIED: ${MAINTENANCE_GUIDELINES.year} — payor income cap ${usd(MAINTENANCE_GUIDELINES.incomeCap)}, effective ${MAINTENANCE_GUIDELINES.effective}. No calculator implemented; use official UCS tools.`, type: "attorney_determination", audience: "ATTORNEY", categories: SUP_ALL, authorityIds: ["NY-ED-MAINTENANCE-001", "NY-MAINT-CS-TOOLS-001"] }),
  q({ id: "ny.det.cssa_posture", section: "ny_financial", prompt: `ATTORNEY DETERMINATION: CSSA child-support posture (FCA § 413 / DRL § 240 [needs cite check]). GUIDELINE YEAR APPLIED: ${CSSA_GUIDELINES.year} — combined parental income cap ${usd(CSSA_GUIDELINES.combinedIncomeCap)}, self-support reserve ${usd(CSSA_GUIDELINES.selfSupportReserve)}, effective ${CSSA_GUIDELINES.effective} (${CSSA_GUIDELINES.chartLabel}). No calculator implemented; use official worksheets.`, type: "attorney_determination", audience: "ATTORNEY", authorityIds: ["NY-CSSA-001", "NY-MAINT-CS-TOOLS-001"], condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "ny.det.ed_posture", section: "ny_financial", prompt: "ATTORNEY DETERMINATION: Equitable-distribution issues requiring analysis (DRL § 236(B)(5)).", type: "attorney_determination", audience: "ATTORNEY", categories: SUP_ALL, authorityIds: ["NY-ED-MAINTENANCE-001"] }),
  q({ id: "ny.det.fo_escalation", section: "ny_case", prompt: "ATTORNEY DETERMINATION: Family-offense escalation / protective steps required (FCA Art. 8)?", type: "attorney_determination", audience: "ATTORNEY", authorityIds: ["NY-FC-JURISDICTION-001"] }),
];
