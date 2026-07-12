/**
 * New Jersey intake module — FACTS mapped to the researched authority
 * snapshot (src/config/legal-authority/nj/records.json). No item asks the
 * client for a legal conclusion; no calculators are implemented. All
 * wording COUNSEL_REVIEW_REQUIRED.
 */
import type { DocumentCatalogItem, IntakeItem, IntakeSection, MatterCategory } from "@/lib/intake2/types";

export const NJ_SECTIONS: IntakeSection[] = [
  { id: "nj_case", title: "New Jersey case details", order: 30, description: "Facts specific to a New Jersey Family Part matter." },
  { id: "nj_financial", title: "New Jersey financial disclosure (CIS preparation)", order: 31, description: "New Jersey uses a Case Information Statement for financial disclosure. These answers prepare it." },
  { id: "nj_postjudgment", title: "After-judgment changes", order: 32 },
];

export const NJ_DOCUMENTS: DocumentCatalogItem[] = [
  { id: "doc.nj_cis_support", title: "CIS supporting documents", requestText: "Documents supporting your Case Information Statement (recent pay stubs, last tax return, current account statements)." },
  { id: "doc.nj_judgment", title: "Judgment of divorce / existing NJ orders", requestText: "Your NJ judgment of divorce and any orders you want reviewed." },
];

const CRR = "COUNSEL_REVIEW_REQUIRED" as const;
const FM: MatterCategory[] = ["NJ_FM_DIVORCE_UNCONTESTED", "NJ_FM_DIVORCE_CONTESTED"];
const FM_ALL: MatterCategory[] = [...FM, "NJ_FM_POST_JUDGMENT"];
const FD: MatterCategory[] = ["NJ_FD_CUSTODY_PARENTING", "NJ_FD_SUPPORT_PARENTAGE"];

function q(partial: Partial<IntakeItem> & Pick<IntakeItem, "id" | "section" | "prompt" | "type">): IntakeItem {
  return { jurisdiction: "NJ", required: false, audience: "CLIENT", authorityIds: [], reviewStatus: CRR, ...partial };
}

export const NJ_ITEMS: IntakeItem[] = [
  // ── Residence / venue facts (2A:34-8, -10) ──────────────────────────
  q({ id: "nj.case.resident_now", section: "nj_case", prompt: "Do you currently live in New Jersey?", type: "yes_no", required: true, authorityIds: ["NJ-DIVORCE-JURISDICTION-001"] }),
  q({ id: "nj.case.resident_since", section: "nj_case", prompt: "Since when have you continuously lived in New Jersey?", type: "date", condition: { kind: "truthy", questionId: "nj.case.resident_now" }, authorityIds: ["NJ-DIVORCE-JURISDICTION-001"], helpText: "New Jersey has residence requirements for divorce cases. Your attorney determines whether they are satisfied — just give the date." }),
  q({ id: "nj.case.spouse_resident", section: "nj_case", prompt: "Does the other party currently live in New Jersey?", type: "yes_no", authorityIds: ["NJ-DIVORCE-JURISDICTION-001"] }),
  q({ id: "nj.case.county", section: "nj_case", prompt: "Which New Jersey county do you live in?", type: "single_select", required: true, authorityIds: ["NJ-COURT-RULES-PART5-001"], options: ["Atlantic","Bergen","Burlington","Camden","Cape May","Cumberland","Essex","Gloucester","Hudson","Hunterdon","Mercer","Middlesex","Monmouth","Morris","Ocean","Passaic","Salem","Somerset","Sussex","Union","Warren"].map((c) => ({ value: c.toUpperCase().replace(/ /g, "_"), label: c })) }),

  // ── Grounds facts (2A:34-2) — facts only ────────────────────────────
  q({ id: "nj.case.grounds_facts", section: "nj_case", prompt: "Which of these describes your situation? (Select all that apply — your attorney will determine the legal basis.)", type: "multi_select", categories: FM, required: true, authorityIds: ["NJ-DIVORCE-GROUNDS-001"], options: [
    { value: "IRRECONCILABLE_6MO", label: "We have had serious differences for at least six months and I don't believe we can reconcile" },
    { value: "SEPARATED_18MO", label: "We have lived apart for 18 months or more" },
    { value: "DESERTION_12MO", label: "The other party left more than 12 months ago" },
    { value: "CRUELTY", label: "There has been cruel treatment" },
    { value: "ADULTERY", label: "There has been adultery" },
    { value: "OTHER", label: "Something else / not sure" },
  ] }),
  q({ id: "nj.case.grounds_dates", section: "nj_case", prompt: "Approximate dates for what you selected (when differences began, when you separated, etc.)", type: "long_text", categories: FM, condition: { kind: "answered", questionId: "nj.case.grounds_facts" }, authorityIds: ["NJ-DIVORCE-GROUNDS-001"] }),
  q({ id: "nj.case.civil_union", section: "nj_case", prompt: "Is this matter about a civil union rather than a marriage?", type: "yes_no", categories: FM_ALL, authorityIds: ["NJ-CIVILUNION-DISSOLUTION-001"] }),

  // ── Posture (contested vs uncontested) — facts ──────────────────────
  q({ id: "nj.case.agreement_posture", section: "nj_case", prompt: "As of today, where do things stand between you and the other party?", type: "single_select", categories: FM, required: true, options: [
    { value: "FULL_AGREEMENT", label: "We agree on everything" },
    { value: "PARTIAL", label: "We agree on some things" },
    { value: "NO_AGREEMENT", label: "We don't agree / we are not talking" },
    { value: "UNKNOWN", label: "I don't know yet" },
  ] }),
  q({ id: "nj.case.service_facts", section: "nj_case", prompt: "Will the other party accept papers, or will they need to be formally served? What do you expect?", type: "short_text", categories: FM, authorityIds: ["NJ-DIVORCE-PROCESS-001"] }),

  // ── FD (non-dissolution) facts ──────────────────────────────────────
  q({ id: "nj.fd.relief_sought", section: "nj_case", prompt: "What are you asking the court to address? (Select all that apply)", type: "multi_select", categories: FD, required: true, authorityIds: ["NJ-FD-NONDISSOLUTION-001", "NJ-DOCKETS-001"], options: [
    { value: "CUSTODY", label: "Custody" },
    { value: "PARENTING_TIME", label: "Parenting time" },
    { value: "CHILD_SUPPORT", label: "Child support" },
    { value: "PARENTAGE", label: "Parentage" },
    { value: "MEDICAL_SUPPORT", label: "Health coverage for a child" },
  ] }),
  q({ id: "nj.fd.parentage_status", section: "nj_case", prompt: "Is parentage of any child not yet legally established?", type: "yes_no", categories: FD, authorityIds: ["NJ-FD-NONDISSOLUTION-001"] }),

  // ── Custody / support inputs (facts) ────────────────────────────────
  q({ id: "nj.case.custody_facts_confirm", section: "nj_case", prompt: "You told us about the current parenting arrangements earlier. Anything New Jersey-specific to add (county programs, existing FD/FV dockets)?", type: "long_text", categories: [...FM, ...FD], condition: { kind: "truthy", questionId: "shared.children.any" }, authorityIds: ["NJ-CUSTODY-001", "NJ-DOCKETS-001"] }),
  q({ id: "nj.case.support_existing", section: "nj_case", prompt: "Is child support currently being paid through NJ probation / income withholding?", type: "yes_no", categories: [...FM, ...FD], condition: { kind: "truthy", questionId: "shared.children.any" }, authorityIds: ["NJ-CS-GUIDELINES-001"] }),

  // ── UCCJEA / UIFSA facts ────────────────────────────────────────────
  q({ id: "nj.uccjea.child_home_state_facts", section: "nj_case", prompt: "For each child: which state have they lived in for the last six months, and with whom?", type: "long_text", categories: ["NJ_UCCJEA_INTERSTATE", ...FD, ...FM], condition: { kind: "truthy", questionId: "shared.children.any" }, authorityIds: ["NJ-UCCJEA-001"], helpText: "Which state can decide about the children is a legal determination your attorney makes from these facts." }),
  q({ id: "nj.uccjea.other_state_orders", section: "nj_case", prompt: "Has any other state or country issued a custody or support order for these children?", type: "yes_no", categories: ["NJ_UCCJEA_INTERSTATE", ...FD, ...FM], condition: { kind: "truthy", questionId: "shared.children.any" }, authorityIds: ["NJ-UCCJEA-001", "NJ-UIFSA-001"], documentIds: ["doc.pleadings_orders"] }),
  q({ id: "nj.uifsa.out_of_state_party", section: "nj_case", prompt: "Does the other party live outside New Jersey? Where?", type: "short_text", categories: ["NJ_UCCJEA_INTERSTATE", "NJ_FD_SUPPORT_PARENTAGE"], authorityIds: ["NJ-UIFSA-001"] }),

  // ── DV / emergency escalation (facts; static safety copy) ───────────
  q({ id: "nj.dv.active_fv_docket", section: "nj_case", prompt: "Is there an active New Jersey FV (domestic violence) case or restraining order?", type: "yes_no", categories: ["NJ_EMERGENCY_OR_DV_ESCALATION", ...FM, ...FD], sensitive: true, authorityIds: ["NJ-DV-PDVA-001", "NJ-DOCKETS-001"], documentIds: ["doc.protective_orders"] }),
  q({ id: "nj.dv.tro_fro_status", section: "nj_case", prompt: "If yes: is it a temporary (TRO) or final (FRO) restraining order, and what county?", type: "short_text", categories: ["NJ_EMERGENCY_OR_DV_ESCALATION", ...FM, ...FD], sensitive: true, condition: { kind: "truthy", questionId: "nj.dv.active_fv_docket" }, authorityIds: ["NJ-DV-PDVA-001"] }),

  // ── CIS preparation (Appendix V / CN 10482 field families) ──────────
  q({ id: "nj.cis.part_a_case", section: "nj_financial", prompt: "Case caption facts (your county, docket number if you have one)", type: "short_text", categories: FM_ALL, authorityIds: ["NJ-CIS-FORM-001"], outputs: [{ form: "NJ-CIS (Appendix V)", field: "Part A — Case Information" }] }),
  q({ id: "nj.cis.income_confirm", section: "nj_financial", prompt: "Confirm your income entries are complete — the NJ Case Information Statement requires them under oath", type: "yes_no", categories: FM_ALL, required: true, authorityIds: ["NJ-CIS-FORM-001"], outputs: [{ form: "NJ-CIS (Appendix V)", field: "Part C — Income Information" }] }),
  q({ id: "nj.cis.budget_confirm", section: "nj_financial", prompt: "Confirm your monthly expense entries are complete (they become the CIS budget schedules)", type: "yes_no", categories: FM_ALL, required: true, authorityIds: ["NJ-CIS-FORM-001"], outputs: [{ form: "NJ-CIS (Appendix V)", field: "Part D — Monthly Expenses (Schedule A/B/C)" }] }),
  q({ id: "nj.cis.assets_confirm", section: "nj_financial", prompt: "Confirm your asset and debt lists are complete (they become the CIS balance sheet)", type: "yes_no", categories: FM_ALL, required: true, authorityIds: ["NJ-CIS-FORM-001"], outputs: [{ form: "NJ-CIS (Appendix V)", field: "Part E — Balance Sheet (Assets & Liabilities)" }] }),
  q({ id: "nj.cis.insurance_detail", section: "nj_financial", prompt: "Health, life, auto, and homeowner coverage in force for the family (carrier + who is covered)", type: "long_text", categories: FM_ALL, authorityIds: ["NJ-CIS-FORM-001"], outputs: [{ form: "NJ-CIS (Appendix V)", field: "Part B — Insurance Coverage" }], documentIds: ["doc.insurance_policies"] }),
  q({ id: "nj.cis.docs_request", section: "nj_financial", prompt: "CIS supporting documents", type: "document_request", categories: FM_ALL, authorityIds: ["NJ-CIS-FORM-001"], documentIds: ["doc.nj_cis_support"] }),
  q({ id: "nj.clis.confidential_ack", section: "nj_financial", prompt: "New Jersey courts require a Confidential Litigant Information Sheet with personal identifiers. The firm will prepare it; the identifiers are kept confidential. Please confirm you understand.", type: "yes_no", categories: [...FM_ALL, ...FD], required: true, sensitive: true, authorityIds: ["NJ-CLIS-FORM-001"] }),

  // ── Post-judgment (FM) ──────────────────────────────────────────────
  q({ id: "nj.pj.judgment_date", section: "nj_postjudgment", prompt: "Date of your NJ judgment or the order you want changed/enforced", type: "date", categories: ["NJ_FM_POST_JUDGMENT"], required: true, authorityIds: ["NJ-POSTJUDGMENT-KIT-001"], documentIds: ["doc.nj_judgment"] }),
  q({ id: "nj.pj.relief", section: "nj_postjudgment", prompt: "What are you asking for?", type: "single_select", categories: ["NJ_FM_POST_JUDGMENT"], required: true, authorityIds: ["NJ-POSTJUDGMENT-KIT-001"], options: [
    { value: "ENFORCE", label: "Enforce an existing order" },
    { value: "MODIFY_SUPPORT", label: "Change support" },
    { value: "MODIFY_PARENTING", label: "Change parenting arrangements" },
    { value: "OTHER", label: "Something else" },
  ] }),
  q({ id: "nj.pj.changed_circumstances", section: "nj_postjudgment", prompt: "What has changed since the judgment/order (facts and dates)?", type: "long_text", categories: ["NJ_FM_POST_JUDGMENT"], required: true, authorityIds: ["NJ-POSTJUDGMENT-KIT-001"] }),
  q({ id: "nj.pj.compliance", section: "nj_postjudgment", prompt: "Describe any missed payments or violations (what, when, amounts)", type: "long_text", categories: ["NJ_FM_POST_JUDGMENT"], condition: { kind: "eq", questionId: "nj.pj.relief", value: "ENFORCE" } }),
  q({ id: "nj.pj.counsel_fees", section: "nj_postjudgment", prompt: "Are you asking the court to address counsel fees?", type: "yes_no", categories: ["NJ_FM_POST_JUDGMENT"], authorityIds: ["NJ-ALIMONY-001"] }),

  // ── Attorney-only determinations (NJ) ───────────────────────────────
  q({ id: "nj.det.residence_satisfied", section: "nj_case", prompt: "ATTORNEY DETERMINATION: Does New Jersey satisfy the applicable residence requirement (N.J.S.A. 2A:34-10) on these facts?", type: "attorney_determination", audience: "ATTORNEY", authorityIds: ["NJ-DIVORCE-JURISDICTION-001"] }),
  q({ id: "nj.det.grounds", section: "nj_case", prompt: "ATTORNEY DETERMINATION: Which N.J.S.A. 2A:34-2 cause(s) will be pleaded?", type: "attorney_determination", audience: "ATTORNEY", categories: FM, authorityIds: ["NJ-DIVORCE-GROUNDS-001"] }),
  q({ id: "nj.det.venue", section: "nj_case", prompt: "ATTORNEY DETERMINATION: Proper county/venue for filing.", type: "attorney_determination", audience: "ATTORNEY", authorityIds: ["NJ-COURT-RULES-PART5-001"] }),
  q({ id: "nj.det.uccjea", section: "nj_case", prompt: "ATTORNEY DETERMINATION: UCCJEA home-state / jurisdiction analysis (N.J.S.A. 2A:34-53 et seq.).", type: "attorney_determination", audience: "ATTORNEY", authorityIds: ["NJ-UCCJEA-001"], condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "nj.det.support_guidelines", section: "nj_financial", prompt: "ATTORNEY DETERMINATION: Child-support guidelines applicability/deviations (Appendix IX). No calculator is implemented; use official worksheets.", type: "attorney_determination", audience: "ATTORNEY", authorityIds: ["NJ-CS-GUIDELINES-001"], condition: { kind: "truthy", questionId: "shared.children.any" } }),
  q({ id: "nj.det.alimony_posture", section: "nj_financial", prompt: "ATTORNEY DETERMINATION: Alimony posture under N.J.S.A. 2A:34-23 (type, duration analysis).", type: "attorney_determination", audience: "ATTORNEY", categories: FM_ALL, authorityIds: ["NJ-ALIMONY-001"] }),
  q({ id: "nj.det.ed_posture", section: "nj_financial", prompt: "ATTORNEY DETERMINATION: Equitable-distribution issues requiring analysis (2A:34-23 family; 23.1 [needs cite check]).", type: "attorney_determination", audience: "ATTORNEY", categories: FM_ALL, authorityIds: ["NJ-EQUITABLE-DISTRIBUTION-001"] }),
  q({ id: "nj.det.dv_escalation", section: "nj_case", prompt: "ATTORNEY DETERMINATION: PDVA escalation / protective steps required?", type: "attorney_determination", audience: "ATTORNEY", authorityIds: ["NJ-DV-PDVA-001"] }),
];
