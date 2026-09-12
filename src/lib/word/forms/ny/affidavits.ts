/**
 * NY UD-6 (Affirmation of Plaintiff) and UD-7 (Affirmation of Defendant).
 * Sworn documents: the child recital comes from children.ts (never a
 * hardcoded "no children"), the residency section mirrors the official
 * UD-6 rev. 3/1/26 four-option structure, SSNs are NEVER collected online
 * and print as blanks with the form's own instruction to fill them by hand.
 */
import type { Paragraph, Table } from "docx";
import { nyCaption, para, r, blank, body, s, type WordForm, type WordPayload } from "../../engine";
import { countyName, truthy } from "../../text";
import { affidavitClause, ud6EconomicClause } from "./children";
import { affirmation2106, sigLine } from "./packet";
import { fileToken } from "./ud1";

const S = { spacing: "single" as const };
const GROUNDS =
  "DRL §170 subd. (7) - The relationship between Plaintiff and Defendant has broken down irretrievably for a period of at least six months.";
const HEALTH_NOTICE =
  "I have been provided a copy of Notice Relating to Health Care of the Parties. I fully understand that upon the entrance of this divorce judgment, I may no longer be allowed to receive health coverage under my former spouse's health insurance plan.";

function box(mark: boolean): string {
  return mark ? "[X]" : "[ ]";
}

/** Which residence option the affidavit checks — residencyBasis is authoritative; legacy letters honored. */
export function residenceSelection(p: WordPayload): string {
  const basis = s(p.residencyBasis).toLowerCase();
  const legacy = s(p.residencyType).toUpperCase();
  const byBasis: Record<string, string> = { two_year: "1", one_year_married: "2a", one_year_spouses: "2b", one_year_cause: "3" };
  const byLegacy: Record<string, string> = { F: "1", A: "2a", B: "2b", C: "3", D: "4" };
  return byBasis[basis] ?? byLegacy[legacy] ?? "";
}

export function ud6(p: WordPayload): WordForm {
  const county = countyName(s(p.county) || s(p.filingCounty));
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  const indexNo = s(p.indexNumber);
  const pAddr = s(p.plaintiffAddress) || blank(31);
  const dAddr = s(p.defendantAddress) || blank(31);
  const marriageDate = s(p.marriageDate) || blank(16);
  const marriagePlace = s(p.marriagePlace) || `${blank(17)}, ${blank(13)} County, ${blank(14)}`;
  const religious = truthy(s(p.religiousCeremony));
  const stateSigned = (s(p.stateSigned) || "NEW YORK").toUpperCase();
  const countySigned = (s(p.countySigned) || county).toUpperCase();
  const sel = residenceSelection(p);

  const residence: Paragraph[] = [];
  const item = (num: string, sub: string | null, text: string) => {
    if (sub === null) {
      const checked = sel === num || (num === "2" && (sel === "2a" || sel === "2b"));
      residence.push(para(`${box(checked)} ${num}.`, { ...S, left: 0.3 }));
      residence.push(para(text, { ...S, left: 0.7, align: "both", after: 4 }));
    } else {
      residence.push(para(`${box(sel === num + sub)} ${sub}.`, { ...S, left: 0.7 }));
      residence.push(para(text, { ...S, left: 1.1, align: "both", after: 4 }));
    }
  };
  item("1", null, "The Plaintiff has resided in New York State for a continuous period of at least two years immediately preceding the commencement of this divorce action.");
  item("2", null, "The Plaintiff resided in New York State on the date of commencement of this divorce action and for a continuous period of one year immediately preceding the commencement of this divorce action, and:");
  item("2", "a", "The parties were married in New York State.");
  item("2", "b", "The parties have resided as married persons in New York State.");
  item("3", null, "The cause of action occurred in New York State and Plaintiff resided in New York State for a continuous period of at least one year immediately preceding the commencement of this divorce action.");
  item("4", null, "The cause occurred in New York State and both parties were residents at the time of commencement of this divorce action.");

  const children: (Paragraph | Table)[] = [
    ...nyCaption({ county, plaintiff, defendant, title: "AFFIRMATION OF PLAINTIFF", indexNo }),
    para(`STATE OF ${stateSigned}, COUNTY OF ${countySigned}, ss:`, S),
    para("", S),
    para(`${plaintiff}, affirms the following under the penalties of perjury:`, S),
    para("", S),
    body(`1. I am the Plaintiff in this action. I reside at ${pAddr}.`, { firstLine: 0, after: 0 }),
    body(`Defendant resides at ${dAddr}.`, { firstLine: 0 }),
    para("Plaintiff's Social Security Number: _____ - _____ - _________", S),
    para("Defendant's Social Security Number: _____ - _____ - _________", S),
    para([r("(YOU MUST MANUALLY WRITE IN THE FULL SOCIAL SECURITY NUMBERS ABOVE)", { bold: true })], { ...S, after: 8 }),
    para("2. The residency requirement is satisfied as follows:", { ...S, after: 4 }),
    ...residence,
    para("", S),
    body(`3. Plaintiff and Defendant were married on ${marriageDate} in ${marriagePlace}.`, { firstLine: 0, after: 0 }),
    body(religious ? "The marriage was performed in a religious ceremony." : "The marriage was NOT performed in a religious ceremony.", { firstLine: 0 }),
    body(affidavitClause(p, "4."), { firstLine: 0 }),
    body(`5. The grounds for divorce are: ${GROUNDS}`, { firstLine: 0 }),
    body("6a. I am not seeking equitable distribution other than what was already agreed to in a written stipulation. I understand that I may be prevented from further asserting my right to equitable distribution.", { firstLine: 0, after: 0 }),
    body("6b. I am not seeking maintenance as payee.", { firstLine: 0, after: 0 }),
    body(ud6EconomicClause(p), { firstLine: 0 }),
    body(
      religious
        ? "7. I have taken or will take all steps solely within my power to remove any barriers to the Defendant's remarriage."
        : "7. The Barriers to Remarriage provisions (DRL §253) do not apply as the marriage was not performed in a religious ceremony.",
      { firstLine: 0 }
    ),
    body("8. Defendant is not in the active military service of this state, any other state of this nation, or of the United States.", { firstLine: 0 }),
    body("9. No other action or proceeding for divorce, annulment, or dissolution of marriage has been commenced by or against either party in this or any other court.", { firstLine: 0 }),
    body(`10. ${HEALTH_NOTICE}`, { firstLine: 0 }),
    body("11. I acknowledge receipt of the Notice of Guideline Maintenance.", { firstLine: 0 }),
    body(affirmation2106(), { firstLine: 0, keepNext: true }),
    ...sigLine("Plaintiff's Signature", plaintiff),
  ];
  return { children, formLabel: "(Form UD-6)", filename: `NY_UD6_${fileToken(plaintiff)}.docx` };
}

export function ud7(p: WordPayload): WordForm {
  const county = countyName(s(p.county) || s(p.filingCounty));
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  const indexNo = s(p.indexNumber);
  const dAddr = s(p.defendantAddress) || blank(45);
  const summonsDate = s(p.summonsDate) || blank(15);
  const religious = truthy(s(p.religiousCeremony));
  const stateSigned = (s(p.stateSigned) || "NEW YORK").toUpperCase();
  const countySigned = (s(p.countySigned) || county).toUpperCase();

  const children: (Paragraph | Table)[] = [
    ...nyCaption({ county, plaintiff, defendant, title: "AFFIRMATION OF DEFENDANT", indexNo }),
    para(`STATE OF ${stateSigned}, COUNTY OF ${countySigned}, ss:`, S),
    para("", S),
    para(`${defendant}, affirms the following under the penalties of perjury:`, S),
    para("", S),
    body(`I am the Defendant in the within action for divorce, and I am over the age of 18. I reside at ${dAddr}.`, { firstLine: 0 }),
    body(`1. I admit service of the Summons with Notice dated ${summonsDate}, wherein the grounds for divorce alleged are: ${GROUNDS}`, { firstLine: 0, after: 0 }),
    body("I also admit service of the Notice of Automatic Orders and the Notice of Guideline Maintenance.", { firstLine: 0 }),
    body(
      "2. I appear in this action; however, I do not intend to respond to the summons or answer the complaint, and I waive the twenty (20) or thirty (30) day period provided by law to respond to the summons or answer the complaint. I waive the forty (40) day waiting period to place this matter on the calendar, and I hereby consent to this action being placed on the uncontested divorce calendar immediately.",
      { firstLine: 0 }
    ),
    body("3. [X] I am not a member of the military service of this state, any other state, or this nation.", { firstLine: 0 }),
    body("4. [X] I waive service of all further papers in this action except for a copy of the final Judgment of Divorce.", { firstLine: 0 }),
    body("5a. I am not seeking equitable distribution other than what was already agreed to in a written stipulation. I understand that I may be prevented from further asserting my right to equitable distribution.", { firstLine: 0, after: 0 }),
    body("5b. [X] I am not seeking maintenance as payee.", { firstLine: 0 }),
    ...(religious
      ? [
          body("6a. I will take or have taken all steps solely within my power to remove any barriers to the Plaintiff's remarriage.", { firstLine: 0, after: 0 }),
          body("6b. [ ] I waive the requirements of DRL §253 subdivisions (2), (3), and (4).", { firstLine: 0 }),
        ]
      : [body("6. The Barriers to Remarriage provisions (DRL §253) do not apply as the marriage was not performed in a religious ceremony.", { firstLine: 0 })]),
    body(affidavitClause(p, "7."), { firstLine: 0 }),
    body(`8. ${HEALTH_NOTICE}`, { firstLine: 0 }),
    body("9. I acknowledge receipt of the Notice of Guideline Maintenance.", { firstLine: 0 }),
    body(affirmation2106(), { firstLine: 0, keepNext: true }),
    ...sigLine("Defendant's Signature", defendant),
  ];
  return { children, formLabel: "(Form UD-7)", filename: `NY_UD7_${fileToken(plaintiff)}.docx` };
}
