/**
 * New Jersey intake module — the second playbook, NOT a second engine.
 *
 * This file is data. The orchestrator, sequencer, and constitution are
 * untouched and shared: an NJ matter runs the same interview machinery as a
 * NY matter and differs only in which items it is handed. That is the whole
 * "one engine, two playbooks" rule, and it is why nothing here imports from
 * the intake runtime.
 *
 * SCOPE (operator decision, 2026-08-12): uncontested Superior Court,
 * Chancery Division, Family Part dissolutions, pleaded on IRRECONCILABLE
 * DIFFERENCES ONLY (N.J.S.A. 2A:34-2(i)). The fault grounds — adultery,
 * desertion, extreme cruelty, addiction, institutionalization, imprisonment,
 * deviant sexual conduct — and the 18-month separation ground are NOT
 * offered. This mirrors the NY decision to offer only DRL § 170(7): listing
 * fault grounds beside the no-fault one misled a live client into believing
 * a physical separation was required. It is not required in either state.
 *
 * AUTHORITY IDS ARE DELIBERATELY EMPTY. The legal-authority snapshot
 * (src/config/legal-authority/ny/records.json) is New York only, and
 * validate.ts rejects any authorityId absent from it. Inventing NJ records —
 * with retrievedAt dates and official-source URLs — would be fabricating
 * legal research, so every NJ item is `authorityIds: []`, which the type
 * documents as "purely factual". The statutes below appear ONLY as static
 * help text and attorney-determination prompts, never as a client-facing
 * legal conclusion. An NJ records.json is follow-up work that belongs to
 * docs/legal-authority/LEGAL-CONTENT-CHANGE-CONTROL.md, not to this commit.
 */
import type { DocumentCatalogItem, IntakeItem, IntakeSection, MatterCategory } from "@/lib/intake2/types";

export const NJ_SECTIONS: IntakeSection[] = [
  { id: "nj_case", title: "New Jersey case details", order: 30, description: "Facts specific to a New Jersey Superior Court, Chancery Division, Family Part matter." },
  // Cloned from ny_scope: same questions, same purpose, NJ vocabulary.
  { id: "nj_scope", title: "What still needs to be worked out", order: 33, description: "Which parts of the divorce you and the other party have already settled between yourselves. Your attorney reviews every answer — nothing here is decided by this questionnaire." },
];

export const NJ_DOCUMENTS: DocumentCatalogItem[] = [
  { id: "doc.nj_settlement_agreement", title: "Marital Settlement Agreement", requestText: "Your signed Marital Settlement Agreement (sometimes called a property settlement agreement), if you have one." },
];

const CRR = "COUNSEL_REVIEW_REQUIRED" as const;
const NJ: MatterCategory[] = ["NJ_SUPER_UNCONTESTED"];

function q(partial: Partial<IntakeItem> & Pick<IntakeItem, "id" | "section" | "prompt" | "type">): IntakeItem {
  return { jurisdiction: "NJ", required: false, audience: "CLIENT", authorityIds: [], reviewStatus: CRR, categories: NJ, ...partial };
}

export const NJ_ITEMS: IntakeItem[] = [
  // ── Residence facts (N.J.S.A. 2A:34-10) ─────────────────────────────
  // NJ has ONE residency rule and it is flat: one year of continuous
  // residence before filing. No NY-style § 230 pathway tiers, so the
  // interview asks the two facts and lets the attorney apply the rule.
  q({ id: "nj.case.resident_now", section: "nj_case", prompt: "Do you currently live in New Jersey?", type: "yes_no", required: true }),
  q({ id: "nj.case.resident_since", section: "nj_case", prompt: "Since when have you continuously lived in New Jersey?", type: "date", condition: { kind: "truthy", questionId: "nj.case.resident_now" }, helpText: "New Jersey generally asks that one spouse has lived here continuously for at least a year before filing. Your attorney determines whether that is satisfied — just give the date." }),
  q({ id: "nj.case.county", section: "nj_case", prompt: "Which New Jersey county do you live in (or expect the case to proceed in)?", type: "short_text", required: true, helpText: "This becomes the county in your case caption. Your attorney confirms where the case is actually filed." }),

  // ── Grounds facts (N.J.S.A. 2A:34-2(i)) ─────────────────────────────
  q({ id: "nj.case.grounds_facts", section: "nj_case", prompt: "Have you and the other party had irreconcilable differences for at least six months, with no reasonable prospect of getting back together?", type: "single_select", required: true, helpText: "This is what New Jersey asks for in an uncontested divorce. It does NOT require living apart — you can still be in the same home. Only one of you has to state it, and the other party does not have to agree with the reason.", options: [
    { value: "IRRECONCILABLE_6MO", label: "Yes — for six months or more, and there is no reasonable prospect of reconciliation" },
    { value: "OTHER", label: "No, or I'm not sure — I'd like the attorney to look at this" },
  ] }),
  q({ id: "nj.case.grounds_dates", section: "nj_case", prompt: "Roughly when did the irreconcilable differences begin? (a month and year is fine)", type: "short_text", condition: { kind: "answered", questionId: "nj.case.grounds_facts" } }),

  // ── Commencement / service posture ──────────────────────────────────
  q({ id: "nj.case.docket_number", section: "nj_case", prompt: "If a case has already been started: the FM docket number, county, and filing date", type: "short_text", helpText: "New Jersey dissolution cases carry an “FM” docket number. Leave this blank if nothing has been filed yet." }),
  q({ id: "nj.case.service_facts", section: "nj_case", prompt: "Will the other party accept papers, sign an acknowledgment, or need formal service? What do you expect?", type: "short_text" }),
  q({ id: "nj.case.signed_agreement", section: "nj_case", prompt: "Do you already have a signed Marital Settlement Agreement?", type: "yes_no", documentIds: ["doc.nj_settlement_agreement"] }),

  // ── Scope of the uncontested resolution (cloned from ny_scope) ──────
  // Same fact questions as New York, same no-gatekeeping posture: these ask
  // what the parties have ALREADY settled between themselves. NJ vocabulary
  // differs in one place — "alimony", not "maintenance".
  q({ id: "nj.scope.custody", section: "nj_scope", prompt: "Have you and the other party already agreed on custody and a parenting schedule for the children?", type: "single_select", required: true, condition: { kind: "truthy", questionId: "shared.children.any" }, options: [
    { value: "AGREED", label: "Yes — we've agreed" },
    { value: "MOSTLY", label: "Mostly — a few details are open" },
    { value: "NOT_YET", label: "Not yet" },
  ], helpText: "Your attorney papers whatever you two have agreed and advises you on anything still open." }),
  q({ id: "nj.scope.child_support", section: "nj_scope", prompt: "Have you and the other party already agreed on child support?", type: "single_select", required: true, condition: { kind: "truthy", questionId: "shared.children.any" }, options: [
    { value: "AGREED", label: "Yes — we've agreed on an amount" },
    { value: "MOSTLY", label: "Mostly — we still need to work out details" },
    { value: "NOT_YET", label: "Not yet" },
  ], helpText: "New Jersey has child-support guidelines your attorney applies. Any agreement that departs from them has to say so in writing — that is your attorney's job, not yours." }),
  q({ id: "nj.scope.alimony", section: "nj_scope", prompt: "Have you and the other party already agreed about alimony (spousal support) — including agreeing that neither of you will pay it?", type: "single_select", required: true, options: [
    { value: "AGREED_NONE", label: "Yes — neither of us will pay alimony" },
    { value: "AGREED_AMOUNT", label: "Yes — we've agreed on payments" },
    { value: "NOT_YET", label: "Not yet" },
  ] }),
  q({ id: "nj.scope.equitable_distribution", section: "nj_scope", prompt: "Have you and the other party already agreed on how to divide your property and debts?", type: "single_select", required: true, options: [
    { value: "AGREED", label: "Yes — we've agreed on everything" },
    { value: "MOSTLY", label: "Mostly — some items are still open" },
    { value: "NOT_YET", label: "Not yet" },
  ], helpText: "This covers the house, vehicles, bank and retirement accounts, and any debts in either name." }),
  q({ id: "nj.scope.all_resolved", section: "nj_scope", prompt: "Putting it all together — is everything resolved between you and the other party?", type: "yes_no", required: true, helpText: "A “no” does not stop anything. It tells your attorney what is still open so they can work it out with you." }),

  // ── Attorney-only determinations (NJ) ───────────────────────────────
  q({ id: "nj.det.residence_satisfied", section: "nj_case", prompt: "ATTORNEY DETERMINATION: Is the N.J.S.A. 2A:34-10 one-year continuous-residence requirement satisfied on these facts?", type: "attorney_determination", audience: "ATTORNEY" }),
  q({ id: "nj.det.grounds", section: "nj_case", prompt: "ATTORNEY DETERMINATION: Confirm the N.J.S.A. 2A:34-2(i) irreconcilable-differences ground is properly pleaded (six months, no reasonable prospect of reconciliation).", type: "attorney_determination", audience: "ATTORNEY" }),
  q({ id: "nj.det.venue", section: "nj_case", prompt: "ATTORNEY DETERMINATION: Confirm venue — the Superior Court, Chancery Division, Family Part county in which this matter is filed.", type: "attorney_determination", audience: "ATTORNEY" }),
  // NO GUIDELINE FIGURE HERE, ON PURPOSE. New Jersey has no alimony
  // guideline cap or formula analogous to the NY § 236(B)(6) income cap;
  // 2A:34-23(b) is a statutory FACTOR analysis. The NY determinations carry
  // a "GUIDELINE YEAR APPLIED" recital because NY publishes one. Printing an
  // invented number here would be worse than printing nothing.
  q({ id: "nj.det.alimony_posture", section: "nj_case", prompt: "ATTORNEY DETERMINATION: Alimony posture under N.J.S.A. 2A:34-23 — statutory factor analysis. New Jersey publishes no guideline formula or income cap; no calculator is implemented and none should be inferred.", type: "attorney_determination", audience: "ATTORNEY" }),
  q({ id: "nj.det.ed_posture", section: "nj_case", prompt: "ATTORNEY DETERMINATION: Equitable-distribution issues requiring analysis (N.J.S.A. 2A:34-23.1).", type: "attorney_determination", audience: "ATTORNEY" }),
];
