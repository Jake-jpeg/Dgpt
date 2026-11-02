/**
 * NY UD-8 Child Support Worksheet, UD-8a Support Collection Unit Information
 * Sheet, UD-8b Qualified Medical Child Support Order (children only).
 *
 * UD-8 prints every CSSA step the engine computed (cssa.ts) and leaves the
 * attorney's lines — income above the cap, maintenance, other-children
 * support, add-ons, deviation — as labeled blanks beside the parties' own
 * words about what they agreed. UD-8a/8b carry identification and the
 * coverage terms with blanks for what the firm completes at filing.
 */
import type { Paragraph, Table } from "docx";
import { nyCaption, para, r, blank, body, heading, s, columns, type WordForm, type WordPayload } from "../../engine";
import { countyName, formatAddressLines } from "../../text";
import { childRows, childCount } from "./children";
import { computeCssa, money, pct, FICA } from "./cssa";
import { fileToken } from "./ud1";

const S = { spacing: "single" as const };

function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** The payload is strings only; children travel as JSON and flags one per line. */
function withRecords(p: WordPayload): WordPayload {
  let children: unknown = [];
  try {
    children = JSON.parse(s(p.childrenJson) || "[]");
  } catch {
    children = [];
  }
  const reviewFlags = s(p.reviewFlags).split("\n").map((f) => f.trim()).filter(Boolean);
  return { ...p, children, reviewFlags };
}

function line(label: string, value: string): Paragraph {
  return para([r(`${label}  `), r(value, { bold: true })], { ...S, left: 0.3, after: 2 });
}

/** Who is custodial for worksheet purposes: payload.custodialParty = "plaintiff" | "defendant" | "shared". */
function roles(p: WordPayload): { custodial: string; nonCustodial: string; custodialGross: number; nonCustodialGross: number; shared: boolean; note: string } {
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  const pInc = num(p.plaintiffIncome);
  const dInc = num(p.defendantIncome);
  const cp = s(p.custodialParty).toLowerCase();
  if (cp === "defendant") return { custodial: defendant, nonCustodial: plaintiff, custodialGross: dInc, nonCustodialGross: pInc, shared: false, note: "" };
  if (cp === "shared") {
    // Shared custody: the higher-earning parent is treated as non-custodial for the guideline computation (Bast v. Rossoff).
    const plaintiffPays = pInc >= dInc;
    return {
      custodial: plaintiffPays ? defendant : plaintiff,
      nonCustodial: plaintiffPays ? plaintiff : defendant,
      custodialGross: plaintiffPays ? dInc : pInc,
      nonCustodialGross: plaintiffPays ? pInc : dInc,
      shared: true,
      note: "The parties report roughly equal parenting time. For the guideline computation the higher-earning parent is treated as the non-custodial parent (Bast v. Rossoff, 91 N.Y.2d 723). ATTORNEY DETERMINATION on the final arrangement.",
    };
  }
  return { custodial: plaintiff, nonCustodial: defendant, custodialGross: pInc, nonCustodialGross: dInc, shared: false, note: cp ? "" : "Custodial parent not stated in the intake — Plaintiff assumed. ATTORNEY VERIFY." };
}

export function ud8(raw: WordPayload): WordForm {
  const p = withRecords(raw);
  const county = countyName(s(p.county) || s(p.filingCounty));
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  const indexNo = s(p.indexNumber);
  const n = childCount(p);
  const rr = roles(p);
  const c = computeCssa({ custodialGross: rr.custodialGross, nonCustodialGross: rr.nonCustodialGross, children: n });
  const agreement = s(p.childSupportTerms);
  const flags = Array.isArray(p.reviewFlags) ? (p.reviewFlags as unknown[]).map(String) : [];

  const children: (Paragraph | Table)[] = [
    ...nyCaption({ county, plaintiff, defendant, title: "CHILD SUPPORT WORKSHEET", indexNo, subtitle: "(DRL § 240(1-b))" }),
    para(`Guideline year applied: ${c.guidelineYear} — ${c.chart}. Combined parental income cap ${money(c.cap)}; self-support reserve ${money(c.reserve.selfSupportReserve)}; poverty level ${money(c.reserve.povertyLevel)}.`, { ...S, size: 20, after: 8 }),
    ...(rr.note ? [para([r(rr.note, { bold: true, size: 20 })], { ...S, after: 8 })] : []),
    ...flags.map((f) => para([r(`REVIEW: ${f}`, { bold: true, size: 20 })], { ...S, after: 4 })),
    heading(`Number of children: ${n}`),
    ...childRows(p).map((ch) => para(`• ${ch.name}${ch.dob ? `, born ${ch.dob}` : ""}`, { ...S, left: 0.3 })),
    para("", S),
    heading("STEP 1 — GROSS INCOME (annual)"),
    line(`Custodial parent (${rr.custodial}):`, money(c.custodial.gross)),
    line(`Non-custodial parent (${rr.nonCustodial}):`, money(c.nonCustodial.gross)),
    para("", S),
    heading("STEP 2 — DEDUCTIONS"),
    line(`FICA actually paid (computed at ${FICA.year} rates — Social Security ${pct(FICA.socialSecurityRate)} to ${money(FICA.socialSecurityWageBase)}, Medicare ${pct(FICA.medicareRate)}):`, ""),
    line(`  Custodial parent:`, money(c.custodial.fica)),
    line(`  Non-custodial parent:`, money(c.nonCustodial.fica)),
    line("Maintenance paid to a former spouse / to the other party under this agreement:", `$${blank(12)}`),
    line("Child support actually paid for children of a prior relationship:", `$${blank(12)}`),
    line("Public assistance / SSI received:", `$${blank(12)}`),
    para("", S),
    heading("STEP 3 — ADJUSTED AND COMBINED PARENTAL INCOME"),
    line(`Custodial parent adjusted income:`, money(c.custodial.adjusted)),
    line(`Non-custodial parent adjusted income:`, money(c.nonCustodial.adjusted)),
    line(`Combined parental income:`, money(c.combined)),
    line(`Combined income up to the ${money(c.cap)} cap:`, money(c.combinedUpToCap)),
    line(`Combined income above the cap (court's discretion, DRL § 240(1-b)(f)):`, c.aboveCap > 0 ? `${money(c.aboveCap)} — ATTORNEY DETERMINATION` : "$0.00"),
    para("", S),
    heading("STEP 4 — PERCENTAGE AND BASIC OBLIGATION"),
    line(`Statutory percentage for ${n} child${n === 1 ? "" : "ren"}:`, pct(c.percentage)),
    line(`Basic child support obligation on combined income up to the cap (annual):`, money(c.basicAnnual)),
    para("", S),
    heading("STEP 5 — PRO RATA SHARES"),
    line(`Custodial parent's share:`, pct(c.custodial.share)),
    line(`Non-custodial parent's share:`, pct(c.nonCustodial.share)),
    line(`Non-custodial parent's share of the basic obligation (annual):`, money(c.ncpAnnualBeforeReserve)),
    para("", S),
    heading("STEP 6 — SELF-SUPPORT RESERVE TEST (DRL § 240(1-b)(d))"),
    line(
      "Result:",
      c.reserve.applied === "NONE"
        ? "The non-custodial parent's income after the obligation exceeds the self-support reserve; no adjustment."
        : c.reserve.applied === "RESERVE"
          ? `The obligation would reduce the non-custodial parent below the self-support reserve; the obligation is the greater of (income − reserve) and $50 per month.`
          : "The non-custodial parent's income is below the poverty level; the obligation is $25 per month."
    ),
    para("", S),
    heading("STEP 7 — PRESUMPTIVE BASIC CHILD SUPPORT (non-custodial parent)"),
    line("Annual:", money(c.ncpAnnual)),
    line("Monthly:", money(c.ncpMonthly)),
    line("Weekly:", money(c.ncpWeekly)),
    para("", S),
    heading("STEP 8 — ADD-ONS (pro rata, DRL § 240(1-b)(c)(4)–(7))"),
    line("Child care expenses:", `$${blank(12)} per ${blank(8)} — non-custodial share $${blank(10)}`),
    line("Health insurance premium for the children:", `$${blank(12)} per ${blank(8)} — non-custodial share $${blank(10)}`),
    line("Unreimbursed health expenses:", `pro rata, ${pct(c.nonCustodial.share)} non-custodial / ${pct(c.custodial.share)} custodial`),
    line("Educational expenses (if ordered):", `$${blank(12)}`),
    para("", S),
    heading("STEP 9 — THE PARTIES' AGREEMENT"),
    body(agreement ? `In the parties' own words: "${agreement}"` : "The parties' agreement on child support was not stated in the intake.", { firstLine: 0 }),
    body(
      "Where the agreed amount differs from the presumptive amount above, the agreement must state that the parties were advised of the Child Support Standards Act, what the presumptive amount would be, and the reasons for the deviation (DRL § 240(1-b)(h)). ATTORNEY DETERMINATION.",
      { firstLine: 0 }
    ),
    para("", S),
    columns([para("Dated: ____________________", S)], [para(blank(34), S), para("Attorney for Plaintiff", S)]),
  ];
  return { children, formLabel: "(Form UD-8)", filename: `NY_UD8_${fileToken(plaintiff)}.docx` };
}

export function ud8a(raw: WordPayload): WordForm {
  const p = withRecords(raw);
  const county = countyName(s(p.county) || s(p.filingCounty));
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  const indexNo = s(p.indexNumber);
  const rr = roles(p);
  const n = childCount(p);
  const c = computeCssa({ custodialGross: rr.custodialGross, nonCustodialGross: rr.nonCustodialGross, children: n });
  const pAddr = s(p.plaintiffAddress) ? formatAddressLines(s(p.plaintiffAddress)).join(", ") : blank(40);
  const dAddr = s(p.defendantAddress) ? formatAddressLines(s(p.defendantAddress)).join(", ") : blank(40);

  const children: (Paragraph | Table)[] = [
    ...nyCaption({ county, plaintiff, defendant, title: "SUPPORT COLLECTION UNIT INFORMATION SHEET", indexNo }),
    para("Complete only where support is to be paid through the Support Collection Unit. Social Security numbers are NEVER collected online — write them in by hand.", { ...S, size: 20, after: 8 }),
    heading("CUSTODIAL PARENT"),
    line("Name:", rr.custodial),
    line("Address:", rr.custodial === plaintiff ? pAddr : dAddr),
    line("Date of birth:", s(rr.custodial === plaintiff ? p.plaintiffDob : p.defendantDob) || blank(14)),
    line("Social Security No.:", "_____ - _____ - _________"),
    para("", S),
    heading("NON-CUSTODIAL PARENT"),
    line("Name:", rr.nonCustodial),
    line("Address:", rr.nonCustodial === plaintiff ? pAddr : dAddr),
    line("Date of birth:", s(rr.nonCustodial === plaintiff ? p.plaintiffDob : p.defendantDob) || blank(14)),
    line("Social Security No.:", "_____ - _____ - _________"),
    line("Employer (name and address):", s(p.nonCustodialEmployer) || blank(40)),
    para("", S),
    heading("CHILDREN"),
    ...childRows(p).map((ch) => line(`${ch.name}:`, `born ${ch.dob || blank(12)} — SSN _____ - _____ - _________`)),
    para("", S),
    heading("SUPPORT"),
    line("Presumptive basic child support (from UD-8):", `${money(c.ncpMonthly)} per month`),
    line("Amount ordered / agreed:", `$${blank(12)} per ${blank(8)}`),
    line("Payable through the Support Collection Unit:", "[ ] Yes   [ ] No — direct payment"),
    line("Income execution:", "[ ] Immediate   [ ] Upon default (DRL § 240(1-b)(k)/CPLR 5241)"),
    para("", S),
    columns([para("Dated: ____________________", S)], [para(blank(34), S), para("Attorney for Plaintiff", S)]),
  ];
  return { children, formLabel: "(Form UD-8a)", filename: `NY_UD8a_${fileToken(plaintiff)}.docx` };
}

export function ud8b(raw: WordPayload): WordForm {
  const p = withRecords(raw);
  const county = countyName(s(p.county) || s(p.filingCounty));
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  const indexNo = s(p.indexNumber);
  const insurer = s(p.childrenInsurance);
  const kids = childRows(p);

  const children: (Paragraph | Table)[] = [
    ...nyCaption({ county, plaintiff, defendant, title: "QUALIFIED MEDICAL CHILD SUPPORT ORDER", indexNo, calendar: true }),
    body(
      "Upon the Findings of Fact and Conclusions of Law and the Judgment of Divorce entered herein, and the court having determined that health insurance benefits are available to the children of the marriage through a group health plan, it is hereby",
      { firstLine: 0 }
    ),
    body(
      `ORDERED, that ${blank(30)} (the "Participant"), [ ] Plaintiff [ ] Defendant, shall enroll and maintain the following children as beneficiaries under the group health plan of the Participant's employer or other plan provider, ${blank(30)} (the "Plan"), for medical, dental, optical, prescription-drug and hospital coverage:`,
      { firstLine: 0 }
    ),
    ...kids.map((ch) => para(`• ${ch.name}${ch.dob ? `, born ${ch.dob}` : ""} — the custodial parent's address is to be used for the child's mailing address unless the court directs otherwise.`, { ...S, left: 0.5 })),
    body(
      `Coverage currently in force, as reported in the intake: ${insurer || "not stated — ATTORNEY VERIFY"}.`,
      { firstLine: 0 }
    ),
    body(
      "ORDERED, that the Plan administrator shall treat the custodial parent as the alternate recipient's representative for purposes of claims, benefits and notices, and shall not deny enrollment because the child was born out of wedlock, is not claimed as a dependent on the Participant's tax return, or does not reside with the Participant or in the Plan's service area; and it is further",
      { firstLine: 0 }
    ),
    body(
      "ORDERED, that this order is intended to be a Qualified Medical Child Support Order within the meaning of ERISA § 609(a) (29 U.S.C. § 1169(a)) and DRL § 240(1)(c), and the Participant's employer and the Plan administrator shall comply with it until the earliest of each child's twenty-first birthday, emancipation, or further order of the court.",
      { firstLine: 0 }
    ),
    para("", S),
    para("ENTER:", S),
    para("", S),
    para(`${blank(34)}`, { ...S, align: "right" }),
    para("J.S.C.", { ...S, align: "right" }),
  ];
  return { children, formLabel: "(Form UD-8b)", filename: `NY_UD8b_${fileToken(plaintiff)}.docx` };
}
