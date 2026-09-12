/**
 * NY UD-10 (Findings of Fact and Conclusions of Law) and UD-11 (Judgment
 * of Divorce) — what the judge signs. Court-completed fields (Part, date,
 * Justice) are blanks. Child findings and decretal paragraphs come from
 * children.ts, in the official rev. 3/1/26 structure, and appear ONLY when
 * the payload asserts children.
 *
 * Residence finding: `residencyBasis` (the value the Case check and the
 * Complaint plead) is authoritative; the legacy A–F letters are honored
 * as a fallback. The ReportLab UD-10 read only the letter and defaulted
 * to option A (one year + married in NY) — a matter pleading the two-year
 * prong could print a different prong on its findings. Fixed here.
 */
import type { Paragraph, Table } from "docx";
import { nyCaption, para, r, blank, body, heading, columns, pageBreak, s, type WordForm, type WordPayload } from "../../engine";
import { countyName, truthy } from "../../text";
import { findingsClause, judgmentClause, ud10ChildFindings, ud11ChildDecrees } from "./children";
import { fileToken } from "./ud1";

const S = { spacing: "single" as const };

const RESIDENCY_TEXTS: Record<string, string> = {
  A: "The Plaintiff has resided in New York State for a continuous period of at least one (1) year immediately preceding the commencement of this divorce action and the parties were married in New York State.",
  B: "The Plaintiff has resided in New York State for a continuous period of at least one (1) year immediately preceding the commencement of this divorce action and the parties have resided as married persons in New York State.",
  C: "The Plaintiff has resided in New York State for a continuous period of at least one (1) year immediately preceding the commencement of this divorce action and the cause of action occurred in New York State.",
  D: "The cause of action occurred in New York State and both parties were residents of New York State at the time of commencement of this action.",
  E: "The parties were married in New York State and both parties were residents of New York State at the time of commencement of this action.",
  F: "The Plaintiff has resided in New York State for a continuous period of at least two (2) years immediately preceding the commencement of this divorce action.",
};

export function residencyLetter(p: WordPayload): string {
  const basis = s(p.residencyBasis).toLowerCase();
  const byBasis: Record<string, string> = { two_year: "F", one_year_married: "A", one_year_spouses: "B", one_year_cause: "C" };
  if (byBasis[basis]) return byBasis[basis];
  const legacy = s(p.residencyType).toUpperCase();
  return RESIDENCY_TEXTS[legacy] ? legacy : "F";
}

/** The "At the Matrimonial/IAS Part" court header both forms open with. */
function courtHeader(county: string, honIndent: number): Paragraph[] {
  return [
    para("At the Matrimonial/IAS Part _____ of", S),
    para("New York State Supreme Court at", S),
    para(`the Courthouse, ${county} County,`, S),
    para(`on ${blank(28)}.`, S),
    para("", S),
    para("Present:", S),
    para(`Hon. ${blank(30)}`, S),
    para("Justice/Referee", { ...S, left: honIndent }),
    para("", S),
  ];
}

/** "FIRST: text" — bold label, double-spaced body. */
function finding(label: string, text: string): Paragraph {
  return para([r(`${label} `, { bold: true }), r(text)], { align: "both", after: 6 });
}

/** "ORDERED AND ADJUDGED, text" — bold prefix, double-spaced body. */
function decree(prefix: string, text: string): Paragraph {
  return para([r(`${prefix} `, { bold: true }), r(text)], { align: "both", firstLine: 0.5, after: 6 });
}

function judgeSignature(enter = false): (Paragraph | Table)[] {
  return [
    para("", S),
    para(`Dated: ${blank(23)}`, S),
    para("", S),
    columns([], [...(enter ? [para("ENTER:", S), para("", S)] : []), para(blank(34), S), para("Justice of the Supreme Court / Referee", { ...S, align: "center" })]),
  ];
}

export function ud10(p: WordPayload): WordForm {
  const county = countyName(s(p.county) || s(p.filingCounty));
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  const indexNo = s(p.indexNumber);
  const marriageDate = s(p.marriageDate) || blank(16);
  const marriageCity = s(p.marriageCity) || blank(16);
  const marriageCounty = s(p.marriageCounty) || blank(16);
  const marriageState = s(p.marriageState) || blank(16);
  const religious = truthy(s(p.religiousCeremony));
  const filingDate = s(p.filingDate) || s(p.summonsDate) || blank(16);
  const ceremonyCheck = religious ? "[ ] civil / [X] religious" : "[X] civil / [ ] religious";

  const children: (Paragraph | Table)[] = [
    ...courtHeader(county, 0.55),
    ...nyCaption({ county, plaintiff, defendant, title: "FINDINGS OF FACT AND CONCLUSIONS OF LAW", indexNo, calendar: true }),
    body(
      "The issues of this action having been submitted to OR been heard before me as one of the Justices/Referees of this Court at Part _____ hereof, " +
        `held in and for the County of ${county} on ${blank(16)}, and having considered the allegations and proofs of the respective parties, and due deliberation having been had thereon.`,
      { firstLine: 0 }
    ),
    body(
      "NOW, after reading and considering the papers submitted hearing the testimony, I do hereby make the following findings of essential facts which I deem established by the evidence and reach the following conclusions of law.",
      { firstLine: 0 }
    ),
    pageBreak(),
    heading("FINDINGS OF FACT"),
    finding("FIRST:", "Plaintiff and Defendant were both eighteen (18) years of age or over when this action was commenced."),
    finding("SECOND:", RESIDENCY_TEXTS[residencyLetter(p)]),
    finding("THIRD:", `Plaintiff and Defendant were married on ${marriageDate} in ${marriageCity}, County of ${marriageCounty}, State of ${marriageState}, in a ${ceremonyCheck} ceremony.`),
    finding("FOURTH:", "No decree, judgment, or order of divorce, annulment, or dissolution of marriage has been granted to either party against the other in any Court of competent jurisdiction of this state or any other state, territory, or country, and there is no other action pending for divorce by either party against the other in any Court."),
    finding("FIFTH:", `This action was commenced by filing the Summons With Notice with the County Clerk on ${filingDate}. Defendant was served personally with the above stated pleadings and the Notice of Automatic Orders. Defendant appeared and waived his/her right to answer, and neither admitted nor denied the allegations in plaintiff's complaint, and consented to entry of judgment.`),
    finding("SIXTH:", "The Supreme Court of the State of New York has jurisdiction over the subject matter of this action and the parties hereto, and venue is proper in this Court."),
    finding("SEVENTH:", "The Notice of Automatic Orders was duly served upon Defendant and no violations thereof are alleged."),
    finding("EIGHTH:", "Neither Plaintiff nor Defendant is in the military service of the United States of America, the State of New York, or any other state, and no protections under the Servicemembers Civil Relief Act apply."),
    finding("NINTH:", findingsClause(p)),
    finding("TENTH:", "The grounds for divorce that are alleged in the Verified Complaint were proved as follows: The relationship between Plaintiff and Defendant has broken down irretrievably for a period of at least six (6) months as stated in the Plaintiff's Affidavit. (DRL §170 subd. 7)"),
    finding(
      "ELEVENTH:",
      religious
        ? "A sworn statement pursuant to DRL §253 that Plaintiff has taken all steps within his or her power to remove all barriers to Defendant's remarriage following the divorce was served upon Defendant."
        : "A sworn statement as to the removal of barriers to remarriage is not required because the parties were married in a civil ceremony."
    ),
    finding("TWELFTH:", "No maintenance was awarded because neither party seeks maintenance."),
    finding("THIRTEENTH:", "Equitable Distribution is not an issue."),
    finding("FOURTEENTH:", "All issues of equitable distribution of marital property, maintenance, and child support have been resolved or are not in issue, and no other ancillary relief is sought by either party."),
    finding("FIFTEENTH:", "Compliance with DRL §255(1) and (2) has been satisfied. Each party has been provided notice as required by DRL §255(1)."),
    ...ud10ChildFindings(p).map(([label, text]) => finding(label, text)),
    pageBreak(),
    heading("CONCLUSIONS OF LAW"),
    finding("FIRST:", "Residency as required by DRL §230 has been satisfied."),
    finding("SECOND:", "The requirements of DRL §255 have been satisfied."),
    finding("THIRD:", "The requirements of DRL §236(B)(2)(b) have been satisfied."),
    finding("FOURTH:", "The requirements of DRL §236(B)(6) have been satisfied."),
    finding("FIFTH:", "All economic issues of equitable distribution of marital property, the payment or waiver of spousal support, the payment of child support, the payment of counsel and experts' fees and expenses as well as the custody and visitation with the minor children of the marriage have been resolved by the parties or determined by the court and incorporated into the judgment of divorce."),
    finding("SIXTH:", "Plaintiff is entitled to a judgment of divorce on the ground of DRL §170 subd. (7) and granting the incidental relief awarded."),
    ...judgeSignature(),
  ];
  return { children, formLabel: "(Form UD-10)", filename: `NY_UD10_${fileToken(plaintiff)}.docx` };
}

export function ud11(p: WordPayload): WordForm {
  const county = countyName(s(p.county) || s(p.filingCounty));
  if (!county) throw new Error("VALIDATION: County is required");
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  if (!plaintiff) throw new Error("VALIDATION: Plaintiff name is required");
  if (!defendant) throw new Error("VALIDATION: Defendant name is required");
  const indexNo = s(p.indexNumber);
  const religious = truthy(s(p.religiousCeremony));
  const pAddr = s(p.plaintiffAddress) || blank(25);
  const dAddr = s(p.defendantAddress) || blank(25);
  const OAA = "ORDERED AND ADJUDGED,";

  const children: (Paragraph | Table)[] = [
    ...courtHeader(county, 0.7),
    ...nyCaption({ county, plaintiff, defendant, title: "JUDGMENT OF DIVORCE", indexNo, calendar: true }),
    body(`This action was submitted to this court for consideration this _____ day of ${blank(15)} .`, { firstLine: 0, after: 0 }),
    body("Plaintiff presented a Summons With Notice and Affidavit of Plaintiff constituting the facts of the matter.", { firstLine: 0, after: 0 }),
    body("The Defendant has appeared and waived his or her right to answer.", { firstLine: 0, after: 0 }),
    body("The Court accepted written proof of non-military status.", { firstLine: 0, after: 0 }),
    body(`The Plaintiff's address is ${pAddr}, and social security number is ${blank(25)}. The Defendant's address is ${dAddr}, and social security number is ${blank(25)}.`, { firstLine: 0 }),
    decree("NOW,", "on motion of the Plaintiff, it is"),
    decree("ORDERED AND ADJUDGED", "that the Referee's Report, if any, is hereby confirmed; and it is further"),
    decree(OAA, `that the marriage between ${plaintiff}, Plaintiff, and ${defendant}, Defendant, is hereby dissolved by reason of the Irretrievable Breakdown of the marriage relationship for a period of at least six (6) months pursuant to DRL §170(7); and it is further`),
    decree(OAA, judgmentClause(p)),
    ...ud11ChildDecrees(p).map((d) => decree(OAA, d + "; and it is further")),
    decree(OAA, "that no award of maintenance is made to either party, neither party having requested maintenance; and it is further"),
    decree(OAA, "that equitable distribution of marital property is not in issue, there being no marital property to distribute; and it is further"),
    decree(
      OAA,
      religious
        ? "that Plaintiff has complied with DRL §253 by filing a sworn statement that Plaintiff has taken all steps within his or her power to remove all barriers to Defendant's remarriage; and it is further"
        : "that compliance with DRL §253 regarding removal of barriers to remarriage is not required as the parties were married in a civil ceremony; and it is further"
    ),
    decree(OAA, "that any applications to enforce or modify the provisions of this Judgment shall be brought in a County wherein one of the parties resides; and it is further"),
    decree(OAA, "that the parties have been provided notice pursuant to DRL §255 regarding health care coverage continuation, tax consequences, and other rights affected by this judgment; and it is further"),
    decree(OAA, "that this judgment shall be entered and that the marriage of the parties is dissolved as of the date of entry of this judgment."),
    ...judgeSignature(true),
  ];
  return { children, formLabel: "(Form UD-11)", filename: `NY_UD11_${fileToken(plaintiff)}.docx` };
}
