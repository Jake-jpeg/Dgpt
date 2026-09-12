/**
 * NY Verified Complaint (Action for Divorce) — Phase 1.
 *
 * Hanging-indent numbered allegations (FIRST … NINTH) double-spaced per
 * 22 NYCRR 202.5(a)(1); the WHEREFORE demand list; the attorney signature
 * block; a VERIFICATION page with the STATE/COUNTY ss.: block; the Part 130
 * certification. Every allegation traces to a payload field; the child
 * paragraph comes from children.ts so it can never disagree with UD-6/7/10/11.
 */
import type { Paragraph, Table } from "docx";
import { nyCaption, para, r, blank, body, pleading, heading, columns, pageBreak, s, obj, type WordForm, type WordPayload } from "../../engine";
import { countyName, pleadingDate, titleCase } from "../../text";
import { childCount, complaintClause } from "./children";
import { fileToken } from "./ud1";

// The attorney signature block is FIRM CONFIGURATION, not a code constant:
// mappings.ts sends attorneyName / attorneyFirm / attorneyAddress /
// attorneyPhone from the FIRM_ATTORNEY_* env (Judiciary Law § 470 note
// there). The ReportLab generator hardcoded one firm's address as a
// fallback; this engine prints blanks instead — a pleading never carries an
// address nobody configured, and the pilot-hardening rule keeps office
// locations out of src/.

// Jake-confirmed standard WHEREFORE bundle (attorney-editable).
const STANDARD_RELIEF = [
  "Granting a judgment of absolute divorce in favor of the Plaintiff and against the " +
    "Defendant, dissolving the marriage between the parties;",
  "Granting the Plaintiff equitable distribution of all marital property pursuant to " +
    "Domestic Relations Law § 236(B), and/or a distributive award;",
  "Declaring the separate property of each party;",
  "Awarding maintenance in accordance with the parties' agreement, or as the Court " +
    "deems just and proper;",
  "Awarding the Plaintiff exclusive use and occupancy of the marital residence;",
  "Awarding the Plaintiff counsel fees, expert fees, and the costs and disbursements of " +
    "this action pursuant to Domestic Relations Law § 237; and",
  "Granting the Plaintiff such other and further relief as this Court deems just and proper.",
];

const CHILD_RELIEF = [
  "Awarding custody and a parenting schedule for the unemancipated children of " +
    "the marriage in accordance with the parties' agreement and the best interests " +
    "of the children;",
  "Awarding child support in accordance with the Child Support Standards Act, " +
    "Domestic Relations Law § 240(1-b), including the parties' pro rata shares of " +
    "health-care and child-care expenses;",
];

/** The WHEREFORE clause — a complaint reciting children must also demand child relief. */
export function reliefBundle(children = 0): string[] {
  const relief = [...STANDARD_RELIEF];
  if (children > 0) relief.splice(3, 0, ...CHILD_RELIEF);
  return relief;
}

export const ORDINALS = ["FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "SIXTH", "SEVENTH", "EIGHTH", "NINTH", "TENTH", "ELEVENTH", "TWELFTH"];

/** The FIRST allegation — pleads the DRL § 230 prong actually satisfied. */
export function residencyClause(residentParty: string, basis = "two_year"): string {
  const party = residentParty === "plaintiff" ? "The Plaintiff" : residentParty === "defendant" ? "The Defendant" : "Both parties";
  const verb = residentParty === "plaintiff" || residentParty === "defendant" ? "has" : "have";
  const lowered = party.toLowerCase().replace("the p", "the P").replace("the d", "the D");
  const oneYearTail =
    `${lowered} ${verb} resided in the State of New York for a continuous period of at ` +
    "least one year immediately preceding the commencement of this action.";
  if (basis === "one_year_married") return "The parties were married in the State of New York, and " + oneYearTail;
  if (basis === "one_year_spouses") return "The parties have resided in the State of New York as spouses, and " + oneYearTail;
  if (basis === "one_year_cause") return "The cause of action occurred in the State of New York, and " + oneYearTail;
  return (
    `${party} ${verb} resided in the State of New York for a continuous period of at ` +
    "least two years immediately preceding the commencement of this action."
  );
}

export function marriageClause(marriageDate: string, marriagePlace: string, ceremonyType: string): string {
  const dateStr = pleadingDate(marriageDate) || blank(20);
  const place = (marriagePlace || blank(20)).trim();
  if (ceremonyType === "religious") {
    return (
      `The parties were married to each other on ${dateStr}, in ${place}. The ` +
      "marriage was performed by a clergyman, minister, or a leader of the Society " +
      "for Ethical Culture."
    );
  }
  return (
    `The parties were married to each other on ${dateStr}, in a civil ceremony in ` +
    `${place}. The marriage was not performed by a clergyman, minister, or a leader ` +
    "of the Society for Ethical Culture."
  );
}

export function drl253Clause(ceremonyType: string): string {
  if (ceremonyType === "religious") {
    return (
      "The marriage having been solemnized by a religious ceremony, the Plaintiff " +
      "has taken, or will take prior to the entry of final judgment, all steps " +
      "solely within the Plaintiff's power to remove any barrier to the Defendant's " +
      "remarriage, pursuant to Domestic Relations Law § 253."
    );
  }
  return (
    "The parties married in a civil ceremony and, therefore, the provisions of " +
    "Domestic Relations Law § 253 are not applicable."
  );
}

/** Attorney block values — env-driven upstream (mappings.ts); blanks when unset. */
export function attorneyBlock(p: WordPayload): { name: string; firm: string; address: string[]; phone: string } {
  const address = s(p.attorneyAddress);
  return {
    name: s(p.attorneyName) || blank(28),
    firm: s(p.attorneyFirm) || blank(28),
    address: address ? address.split(/\\n|\n/).map((l) => l.trim()).filter(Boolean) : [blank(28), blank(28)],
    phone: s(p.attorneyPhone) || blank(16),
  };
}

/** The STATE OF NEW YORK ) ss.: COUNTY OF X ) block. */
export function ssBlock(countyUpper: string): Paragraph[] {
  const S = { spacing: "single" as const, tabs: [{ pos: 2.7 }] };
  return [
    para("STATE OF NEW YORK\t)", S),
    para("\t) ss.:", S),
    para(`COUNTY OF ${countyUpper}\t)`, S),
  ];
}

export function complaint(p: WordPayload): WordForm {
  const county = countyName(s(p.county) || s(p.filingCounty));
  if (!county) throw new Error("VALIDATION: County is required");
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  if (!plaintiff || !defendant) throw new Error("VALIDATION: Plaintiff and Defendant names are required");
  const plaintiffAddr = s(p.plaintiffAddress);
  const defendantAddr = s(p.defendantAddress);
  if (!plaintiffAddr || !defendantAddr) throw new Error("VALIDATION: Both party addresses are required");
  const residentParty = (s(p.residentParty) || "plaintiff").toLowerCase();
  const ceremonyType = (s(p.ceremonyType) || "civil").toLowerCase();
  const children = childCount(p);
  const atty = attorneyBlock(p);
  const dateSigned = s(p.dateSigned) || blank(20);
  const relief = Array.isArray(p.reliefBundle) && p.reliefBundle.length ? (p.reliefBundle as string[]) : reliefBundle(children);
  const residencyBasis = (s(p.residencyBasis) || "two_year").toLowerCase();
  const countyUpper = county.toUpperCase();

  const allegations = [
    residencyClause(residentParty, residencyBasis),
    "Both parties are over the age of eighteen (18) years as of the date set forth herein.",
    marriageClause(s(p.marriageDate), s(p.marriagePlace), ceremonyType),
    drl253Clause(ceremonyType),
    complaintClause(p),
    `The Plaintiff resides at ${plaintiffAddr}. The Defendant resides at ${defendantAddr}.`,
    "This marriage has never been altered or dissolved by any judgment of divorce, " +
      "annulment, or dissolution of marriage issued by any court of competent " +
      "jurisdiction.",
    "No other action or proceeding between the parties for divorce, annulment, " +
      "separation, or dissolution of the marriage is pending in this or any other " +
      "court of competent jurisdiction.",
    "The grounds for divorce, pursuant to Subdivision (7) of Section 170 of the " +
      "Domestic Relations Law, are as follows: the relationship between the parties " +
      "has broken down irretrievably for a period of at least six months.",
  ];

  const S = { spacing: "single" as const };
  const children_: (Paragraph | Table)[] = [
    ...nyCaption({ county, plaintiff, defendant, title: "VERIFIED COMPLAINT", subtitle: "ACTION FOR A DIVORCE" }),
    body(`Plaintiff, by ${atty.name}, complaining of the Defendant, as and for a Verified Complaint, alleges:`, { firstLine: 0 }),
    ...allegations.map((text, i) => pleading(ORDINALS[i], text)),
    body("WHEREFORE, the Plaintiff demands judgment against the Defendant as follows:", { firstLine: 0, keepNext: true }),
    ...relief.map((item, i) => para([r(`${String.fromCharCode(65 + i)}.\t`), r(item)], { ...S, left: 0.75, hanging: 0.4, tabs: [{ pos: 0.75 }], after: 6, align: "both" })),
    para("", S),
    para(`Dated: ${dateSigned}`, S),
    columns([], [para(blank(34), S), para(atty.name, S), para("Attorney for Plaintiff", S), para(atty.firm, S), ...atty.address.map((l) => para(l, S)), para(atty.phone, S)]),
    pageBreak(),
    heading("VERIFICATION", { underline: true }),
    ...ssBlock(countyUpper),
    para("", S),
    body(
      `${titleCase(plaintiff)}, being duly sworn, deposes and says: I am the ` +
        "Plaintiff in the within action for a divorce. I have read the foregoing " +
        "Verified Complaint and know the contents thereof. The contents are true to my " +
        "own knowledge, except as to matters therein stated to be alleged upon " +
        "information and belief, and as to those matters I believe them to be true.",
      { firstLine: 0 }
    ),
    columns([], [para(blank(34), S), para(titleCase(plaintiff), S)]),
    para("", S),
    para("Sworn to before me on", S),
    para(`${blank(20)}, 20___`, S),
    para("", S),
    para("", S),
    para(blank(30), S),
    para("Notary Public", S),
    para("", S),
    para("", { ...S, after: 2 }),
    para(
      "Pursuant to 22 NYCRR § 130-1.1-a, the undersigned, an attorney admitted to " +
        "practice in the courts of New York State, certifies that, upon information and " +
        "belief and reasonable inquiry, the contentions contained in the annexed " +
        "document are not frivolous.",
      { ...S, align: "both", before: 12 }
    ),
    columns([], [para(blank(34), S), para(atty.name, S)]),
  ];
  return { children: children_, formLabel: "(Verified Complaint)", filename: `NY_Verified_Complaint_${fileToken(plaintiff)}.docx` };
}

export { obj };
