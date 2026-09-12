/**
 * NY uncontested packet — the short forms: UD-4 (+UD-4a), UD-5, UD-9, UD-12.
 * Each consumes the same caption vocabulary; the CPLR 2106 affirmation is
 * VERBATIM (no comma after "New York" — the statute's own wording).
 */
import type { Paragraph, Table } from "docx";
import { nyCaption, para, r, blank, body, heading, columns, pageBreak, s, type WordForm, type WordPayload } from "../../engine";
import { countyName } from "../../text";
import { fileToken } from "./ud1";

const S = { spacing: "single" as const };

/** CPLR 2106 affirmation — verbatim statutory language. */
export function affirmation2106(name = ""): string {
  const who = name || blank(24);
  return (
    `I, ${who} (print or type name), affirm this ___ day of ______, ____, under the ` +
    "penalties of perjury under the laws of New York, which may include a fine or " +
    "imprisonment, that the foregoing is true, except as to matters alleged on " +
    "information and belief and as to those matters I believe it to be true, and I " +
    "understand that this document may be filed in an action or proceeding in a court of law."
  );
}

/** Right-half signature line + caption beneath. */
export function sigLine(...captions: string[]): (Paragraph | Table)[] {
  return [para("", S), columns([], [para(blank(34), S), ...captions.map((c) => para(c, S))])];
}

function common(p: WordPayload) {
  const county = countyName(s(p.county) || s(p.filingCounty));
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  const indexNo = s(p.indexNumber);
  const stateSigned = (s(p.stateSigned) || "NEW YORK").toUpperCase();
  const countySigned = (s(p.countySigned) || county).toUpperCase();
  return { county, plaintiff, defendant, indexNo, stateSigned, countySigned };
}

/* ── UD-4 / UD-4a ─────────────────────────────────────────────────────── */

export function ud4(p: WordPayload): WordForm {
  const c = common(p);
  const serviceMethod = s(p.serviceMethod).toLowerCase();
  const serverName = s(p.serverName);
  const serverAddress = s(p.serverAddress);
  const serviceDate = s(p.serviceDate);
  const serviceAddress = s(p.serviceAddress);
  const personalBox = serviceMethod === "personal" ? "[X]" : "[ ]";
  const mailBox = serviceMethod === "mail" ? "[X]" : "[ ]";

  const children: (Paragraph | Table)[] = [
    ...nyCaption({ county: c.county, plaintiff: c.plaintiff, defendant: c.defendant, title: "SWORN STATEMENT OF REMOVAL OF BARRIERS TO REMARRIAGE", indexNo: c.indexNo }),
    para(`STATE OF ${c.stateSigned}, COUNTY OF ${c.countySigned}, ss:`, S),
    para("", S),
    body(`${c.plaintiff}, being duly sworn, deposes and says:`, { firstLine: 0 }),
    body("1.  I am the Plaintiff in this action.", { firstLine: 0 }),
    body("2.  The parties to this action were married in a religious ceremony.", { firstLine: 0 }),
    body("3.  The Defendant has waived in writing the requirements of DRL §253.", { firstLine: 0, italic: true }),
    body(affirmation2106(), { firstLine: 0 }),
    ...sigLine(c.plaintiff, "Plaintiff's Signature"),
    pageBreak(),
    heading("Affirmation of Service"),
    para([r("SUPREME COURT OF THE STATE OF NEW YORK", { bold: true })], S),
    para([r(`COUNTY OF ${c.county.toUpperCase()}`, { bold: true })], S),
    para("", S),
    para(`${c.plaintiff} v. ${c.defendant}`, S),
    para("", S),
    body(
      `${serverName || blank(29)} being sworn, says, I am not a party to the action, and am over 18 years of age. ` +
        `I reside at ${serverAddress || blank(53)}.`,
      { firstLine: 0 }
    ),
    body(
      `On ${serviceDate || blank(19)}, I served a true copy of the within Sworn Statement of Removal of Barriers to Remarriage on the Defendant:`,
      { firstLine: 0 }
    ),
    para(`${personalBox}  personally at ${serviceMethod === "personal" && serviceAddress ? serviceAddress : blank(58)}`, { ...S, left: 0.3 }),
    para([r("OR", { bold: true })], { ...S, align: "center" }),
    para(
      `${mailBox}  by depositing a true copy thereof enclosed in a post-paid wrapper, in an official ` +
        "depository under the exclusive care and custody of the U.S. Postal Service within " +
        "New York State, to the address designated by the Defendant at:",
      { ...S, left: 0.3, hanging: 0.0, align: "both" }
    ),
    para(serviceMethod === "mail" && serviceAddress ? serviceAddress : blank(70), { ...S, left: 0.5 }),
    para("", S),
    body(affirmation2106(serverName), { firstLine: 0 }),
    ...sigLine("Server's Signature"),
    para([r("OR", { bold: true })], { ...S, align: "center" }),
    para("Service of the within document is hereby acknowledged.", S),
    ...sigLine("Defendant's Signature"),
  ];
  return { children, formLabel: "(Form UD-4 / UD-4a)", filename: `NY_UD4_${fileToken(c.plaintiff)}.docx` };
}

/* ── UD-5 ─────────────────────────────────────────────────────────────── */

export function ud5(p: WordPayload): WordForm {
  const c = common(p);
  const serviceWithinNY = s(p.serviceWithinNY) !== "false";
  const defendantAppeared = s(p.defendantAppeared) !== "false";
  const serviceLocation = serviceWithinNY ? "within" : "outside";
  const children: (Paragraph | Table)[] = [
    ...nyCaption({ county: c.county, plaintiff: c.plaintiff, defendant: c.defendant, title: "AFFIRMATION OF REGULARITY", indexNo: c.indexNo }),
    para(`STATE OF ${c.stateSigned}, COUNTY OF ${c.countySigned}, ss:`, S),
    para("", S),
    body("1.  I am the Plaintiff herein. This is a matrimonial action.", { firstLine: 0 }),
    body(
      `2.  The Summons with Notice and the Notice of Automatic Orders and the Notice of Guideline Maintenance were personally served upon the Defendant herein, ${serviceLocation} the State of New York as appears in the affidavit or affirmation of service submitted herewith.`,
      { firstLine: 0 }
    ),
    body(
      defendantAppeared
        ? "3.  Defendant has appeared on his or her own behalf and executed an affidavit or affirmation that this matter be placed on the matrimonial calendar immediately."
        : "3.  Defendant is in default for failure to serve a notice of appearance or failure to answer the complaint served in this action in due time, and the time to answer has not been extended by stipulation, court order, or otherwise.",
      { firstLine: 0 }
    ),
    body("4.  No other action or proceeding for divorce, annulment, or dissolution of marriage has been commenced by or against either party in this or any other court.", { firstLine: 0 }),
    body("5.  The papers submitted herewith are in proper form.", { firstLine: 0 }),
    body(affirmation2106(), { firstLine: 0 }),
    ...sigLine(c.plaintiff, "Plaintiff's Signature"),
  ];
  return { children, formLabel: "(Form UD-5)", filename: `NY_UD5_${fileToken(c.plaintiff)}.docx` };
}

/* ── UD-9 ─────────────────────────────────────────────────────────────── */

export function ud9(p: WordPayload): WordForm {
  const c = common(p);
  const dateFiled = s(p.dateSummonsFiled) || blank(20);
  const dateServed = s(p.dateSummonsServed) || blank(20);
  const pAddr = s(p.plaintiffAddress);
  const pPhone = s(p.plaintiffPhone) || "N/A";
  const dAddr = s(p.defendantAddress);
  const dPhone = s(p.defendantPhone) || "N/A";
  const T = { ...S, tabs: [{ pos: 1.8 }, { pos: 3.0 }, { pos: 4.0 }] };
  const children: (Paragraph | Table)[] = [
    para([r("NOTE OF ISSUE - UNCONTESTED DIVORCE", { bold: true, size: 28 })], { ...S, align: "center" }),
    para("", S),
    para("For Use of Clerk", { ...S, align: "right" }),
    para("", S),
    ...nyCaption({ county: c.county, plaintiff: c.plaintiff, defendant: c.defendant, title: "NOTE OF ISSUE", indexNo: c.indexNo, calendar: true }),
    para([r("NO TRIAL", { bold: true })], S),
    para("", S),
    para("FILED BY:\t[X]  Plaintiff\t[ ]  Defendant", T),
    para("", S),
    para(`DATE SUMMONS FILED: ${dateFiled}`, S),
    para(`DATE SUMMONS SERVED: ${dateServed}`, S),
    para("DATE ISSUE JOINED:\tNOT JOINED -\t[X]  Waiver\t[ ]  Default", T),
    para("\t\t[ ]  Stipulation/Separation Agreement", T),
    para("NATURE OF ACTION:\tUNCONTESTED DIVORCE", T),
    para("RELIEF:\tABSOLUTE DIVORCE", T),
    para("", S),
    para("[X]  Plaintiff", S),
    para("Office and P.O. Address:", S),
    para(pAddr || "N/A", S),
    para(`Phone No.: ${pPhone}`, S),
    para("Fax No.: N/A", S),
    para("", S),
    para("[X]  Defendant", S),
    para("Office and P.O. Address:", S),
    para(dAddr || "N/A", S),
    para(`Phone No.: ${dPhone}`, S),
    para("Fax No.: N/A", S),
  ];
  return { children, formLabel: "(Form UD-9)", filename: `NY_UD9_${fileToken(c.plaintiff)}.docx` };
}

/* ── UD-12 ────────────────────────────────────────────────────────────── */

export function ud12(p: WordPayload): WordForm {
  const c = common(p);
  if (!c.county) throw new Error("VALIDATION: County is required");
  if (!c.plaintiff) throw new Error("VALIDATION: Plaintiff name is required");
  const children: (Paragraph | Table)[] = [
    ...nyCaption({ county: c.county, plaintiff: c.plaintiff, defendant: c.defendant, title: "PART 130 CERTIFICATION", indexNo: c.indexNo }),
    para(
      [
        r("CERTIFICATION: ", { bold: true }),
        r(
          "I hereby certify that all of the papers that I have served, filed or submitted to " +
            "the court in this divorce action are not frivolous as defined in subsection (c) of " +
            "Section 130-1.1 of the Rules of the Chief Administrator of the Courts."
        ),
      ],
      { align: "both" }
    ),
    para("", S),
    para(`Dated: ${blank(15)}`, S),
    ...sigLine("SIGNATURE"),
    ...sigLine("Print or type name below signature"),
  ];
  return { children, formLabel: "(Form UD-12)", filename: `NY_UD12_${fileToken(c.plaintiff)}.docx` };
}
