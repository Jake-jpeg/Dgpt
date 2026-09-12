/**
 * NY Phase 3 — UD-14 (Notice of Entry) and UD-15 (Affirmation of Service
 * by Mail of the JOD). The entry date exists only on the clerk's stamp and
 * the server is a third party over 18 — both are completed by hand, so
 * they print as blanks. Nothing is invented.
 */
import type { Paragraph, Table } from "docx";
import { nyCaption, para, blank, body, columns, s, type WordForm, type WordPayload } from "../../engine";
import { countyName } from "../../text";
import { fileToken } from "./ud1";

const S = { spacing: "single" as const };

function addrLines(a: string): string[] {
  if (!a) return [];
  const i = a.indexOf(", ");
  return i > 0 ? [a.slice(0, i), a.slice(i + 2)] : [a];
}

export function ud14(p: WordPayload): WordForm {
  const county = countyName(s(p.county) || s(p.filingCounty));
  if (!county) throw new Error("VALIDATION: County is required");
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  if (!plaintiff) throw new Error("VALIDATION: Plaintiff name is required");
  if (!defendant) throw new Error("VALIDATION: Defendant name is required");
  const indexNo = s(p.indexNumber);
  const pAddr = s(p.plaintiffAddress);
  const dAddr = s(p.defendantAddress);
  const entry = s(p.judgmentEntryDate) || `_____ day of ${blank(15)}, 20___`;
  const children: (Paragraph | Table)[] = [
    ...nyCaption({ county, plaintiff, defendant, title: "NOTICE OF ENTRY", indexNo }),
    body(
      "PLEASE TAKE NOTICE that the attached is a true copy of a judgment of divorce in " +
        `this matter that was entered in the Office of the County Clerk of ${county} County, on ${entry}.`,
      { firstLine: 0 }
    ),
    para(`Dated: ${blank(15)}`, S),
    para("", S),
    columns([], [para(plaintiff, S), para("Plaintiff", S), ...addrLines(pAddr).map((l) => para(l, S))]),
    para("", S),
    para("TO:", S),
    para("", S),
    para(defendant, S),
    para("Defendant", S),
    ...addrLines(dAddr).map((l) => para(l, S)),
  ];
  return { children, formLabel: "(Form UD-14)", filename: `NY_UD14_${fileToken(plaintiff)}.docx` };
}

export function ud15(p: WordPayload): WordForm {
  const county = countyName(s(p.county) || s(p.filingCounty));
  if (!county) throw new Error("VALIDATION: County is required");
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  if (!plaintiff) throw new Error("VALIDATION: Plaintiff name is required");
  if (!defendant) throw new Error("VALIDATION: Defendant name is required");
  const indexNo = s(p.indexNumber);
  const dAddr = s(p.defendantCurrentAddress) || s(p.defendantAddress);
  const T = { ...S, tabs: [{ pos: 2.5 }, { pos: 2.8 }] };
  const children: (Paragraph | Table)[] = [
    ...nyCaption({ county, plaintiff, defendant, title: "AFFIRMATION OF SERVICE BY MAIL OF JUDGMENT OF DIVORCE WITH NOTICE OF ENTRY", indexNo }),
    para("STATE OF NEW YORK\t)", T),
    para("\t)\tSS.:", T),
    para(`COUNTY OF ${blank(15)}\t)`, T),
    para("", S),
    para("", S),
    para(`${blank(32)}, residing at ${blank(33)},`, S),
    para("says, I am not a party to the action, and am over 18 years of age.", S),
    para("", S),
    para(
      `On ${blank(15)}, I served a copy of the Judgment of Divorce with Notice of Entry upon ` +
        "the Defendant by mailing a true copy of such papers enclosed and properly sealed in an envelope " +
        "which I deposited in an official United States Post Office depository under the exclusive care and " +
        "custody of the United States Postal Service addressed to:",
      { ...S, align: "both" }
    ),
    para("", S),
    para(defendant, S),
    ...addrLines(dAddr).map((l) => para(l, S)),
    para("", S),
    columns([para("", S), para(`Dated: ${blank(15)}`, S)], [para("Server's", S), para(`Signature: ${blank(24)}`, S), para("", S), para(`Print Name: ${blank(22)}`, S)]),
    para("", S),
    para(
      `I, ${blank(24)}, affirm this ___ day of ______, ____, under the penalties of perjury ` +
        "under the laws of New York, which may include a fine or imprisonment, that the foregoing is true, " +
        "except as to matters alleged on information and belief and as to those matters I believe it to be true, " +
        "and I understand that this document may be filed in an action or proceeding in a court of law.",
      { ...S, align: "both" }
    ),
    para("", S),
    para("", S),
    columns([], [para(blank(34), S), para("Server's Signature", { ...S, align: "center" })]),
  ];
  return { children, formLabel: "(Form UD-15)", filename: `NY_UD15_${fileToken(plaintiff)}.docx` };
}
