/**
 * NJ Phase 2 — Acknowledgment of Service (with notarization page), the
 * two self-represented CDR certifications (R. 5:4-2(h)), and the short-form
 * Certification of Insurance Coverage (R. 5:4-2(f)).
 */
import type { Paragraph, Table } from "docx";
import { para, blank, body, columns, pageBreak, heading, type WordForm, type WordPayload } from "../../engine";
import { fileToken } from "../ny/ud1";
import { njCommon, njCap, numbered, proSeSignature } from "./phase1";

const S = { spacing: "single" as const };

export const NJ_CERTIFY =
  "I certify that the foregoing statements made by me are true. I am aware " +
  "that if any of the foregoing statements made by me are willfully false, I am " +
  "subject to punishment.";

export function acknowledgment(p: WordPayload): WordForm {
  const c = njCommon(p);
  const T = { ...S, tabs: [{ pos: 3.5 }] };
  const children: (Paragraph | Table)[] = [
    ...njCap(c, ["ACKNOWLEDGMENT OF SERVICE"]),
    numbered("1.", `I, ${c.dName}, am the Defendant in the above captioned matter.`),
    numbered(
      "2.",
      "I hereby acknowledge that I have received a copy of the Summons and " +
        "Complaint for Divorce, together with all accompanying documents filed " +
        "in this action."
    ),
    numbered(
      "3.",
      "I understand that I have thirty-five (35) days from the date of this " +
        "Acknowledgment to file an Answer, Counterclaim, or Appearance with the court."
    ),
    numbered(
      "4.",
      "I waive formal service of process by the Sheriff or other authorized " +
        "process server, and I accept service of the above documents voluntarily."
    ),
    numbered(
      "5.",
      "I understand that this Acknowledgment of Service has the same legal " +
        "effect as if I had been personally served with these documents, pursuant to R. 4:4-6."
    ),
    body(NJ_CERTIFY, { firstLine: 0 }),
    ...proSeSignature(c.dName, "Defendant"),
    pageBreak(),
    heading("NOTARIZATION"),
    para("", S),
    para(`STATE OF ${blank(24)}\t)`, T),
    para("\t) SS.", T),
    para(`COUNTY OF ${blank(24)}\t)`, T),
    para("", S),
    body(
      `BE IT REMEMBERED that on this ________ day of ${blank(24)}, ` +
        "20____, before me, the subscriber, a Notary Public, personally appeared " +
        `${c.dName.toUpperCase()}, who, I am satisfied, is the person named in the foregoing ` +
        "Acknowledgment of Service, to whom I first made known the contents thereof, " +
        "and thereupon the party acknowledged that the party signed, sealed, and " +
        "delivered the same as the party's voluntary act and deed, for the uses and " +
        "purposes therein expressed.",
      { firstLine: 0 }
    ),
    para("", S),
    columns(
      [],
      [
        para("Subscribed and sworn to before me", S),
        para("on:", S),
        para("", S),
        para("", S),
        para(blank(34), S),
        para("Notary Public", S),
        para("", S),
        para("My Commission Expires:", S),
        para("", S),
        para("", S),
        para("", S),
        para("(Notary Stamp / Seal)", S),
      ]
    ),
  ];
  return { children, formLabel: "(Acknowledgment of Service)", filename: `NJ_Acknowledgment_${fileToken(c.pName)}.docx` };
}

function cdr(p: WordPayload, party: "plaintiff" | "defendant"): WordForm {
  const c = njCommon(p);
  const certifying = party === "plaintiff" ? c.pName : c.dName;
  const role = party === "plaintiff" ? "Plaintiff" : "Defendant";
  const children: (Paragraph | Table)[] = [
    ...njCap(c, [`${role.toUpperCase()}'S CERTIFICATION OF`, "NOTIFICATION OF COMPLEMENTARY", "DISPUTE RESOLUTION (CDR)", "ALTERNATIVES"]),
    body(`${certifying}, being of full age, hereby certifies as follows:`, { firstLine: 0 }),
    numbered("1.", `I am the ${role} in the above captioned matter, and I am not represented by an attorney.`),
    numbered("2.", "I make this Certification pursuant to New Jersey Court Rule 5:4-2(h)."),
    numbered(
      "3.",
      'I have read the document titled, "Descriptive Material (R. 5:4-2(h)) ' +
        "Divorce or Dissolution - Dispute Resolution Alternatives to Conventional " +
        'Litigation."'
    ),
    numbered("4.", "I understand that there are other options available to resolve the issues in this case instead of going to trial."),
    body(NJ_CERTIFY, { firstLine: 0 }),
    ...proSeSignature(certifying, `${role}, Pro-Se`),
  ];
  return { children, formLabel: `(${role}'s CDR Certification)`, filename: `NJ_CDR_${role}_${fileToken(c.pName)}.docx` };
}

export function cdr_plaintiff(p: WordPayload): WordForm {
  return cdr(p, "plaintiff");
}
export function cdr_defendant(p: WordPayload): WordForm {
  return cdr(p, "defendant");
}

export function insurance(p: WordPayload): WordForm {
  const c = njCommon(p);
  const children: (Paragraph | Table)[] = [
    ...njCap(c, ["CERTIFICATION OF INSURANCE", "COVERAGE PURSUANT TO", "R. 5:4-2(f)"]),
    body(`${c.pName}, being of full age, hereby certifies as follows:`, { firstLine: 0 }),
    numbered("1.", "I am the Plaintiff in the above captioned matter and I make this Certification pursuant to R. 5:4-2(f)."),
    numbered(
      "2.",
      "The only relief sought in this action is the dissolution of the marriage. " +
        "No claims for alimony, child support, equitable distribution, or any other " +
        "financial relief are being made in this action."
    ),
    numbered(
      "3.",
      "Pursuant to R. 5:4-2(f), because the only relief sought is dissolution " +
        "of the marriage, the detailed insurance affidavit otherwise required by " +
        "R. 5:4-2(f) is not required, and this Certification is submitted in lieu thereof."
    ),
    numbered(
      "4.",
      "To the best of my knowledge and belief, no insurance coverage pertaining " +
        "to the parties has been canceled or modified within the ninety (90) days " +
        "preceding the date of this Certification."
    ),
    numbered("5.", "I understand that all existing insurance coverage shall be maintained pending further Order of the Court, pursuant to R. 5:4-2(f)."),
    body(NJ_CERTIFY, { firstLine: 0 }),
    ...proSeSignature(c.pName),
  ];
  return { children, formLabel: "(Certification of Insurance Coverage)", filename: `NJ_Insurance_${fileToken(c.pName)}.docx` };
}
