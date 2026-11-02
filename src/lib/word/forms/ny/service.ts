/**
 * NY UD-3 — Affidavit of Service (personal delivery of the Summons with
 * Notice or Summons and Verified Complaint, with the Notice of Automatic
 * Orders and the Notice of Guideline Maintenance). The server of process
 * completes the service facts by hand; the engine prefills the caption, the
 * defendant's name and last known address, and the list of papers served.
 */
import type { Paragraph, Table } from "docx";
import { nyCaption, para, r, blank, body, s, type WordForm, type WordPayload } from "../../engine";
import { countyName, formatAddressLines } from "../../text";
import { fileToken } from "./ud1";

const S = { spacing: "single" as const };

export function ud3(p: WordPayload): WordForm {
  const county = countyName(s(p.county) || s(p.filingCounty));
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  const indexNo = s(p.indexNumber);
  const dAddr = s(p.defendantAddress);
  const dAddrLines = dAddr ? formatAddressLines(dAddr) : [blank(40)];
  const complaintServed = s(p.complaintServed) === "true";
  const papers = complaintServed
    ? "Summons and Verified Complaint, Notice of Automatic Orders, and Notice of Guideline Maintenance"
    : "Summons with Notice, Notice of Automatic Orders, and Notice of Guideline Maintenance";

  const flags = s(p.reviewFlags).split("\n").map((f) => f.trim()).filter(Boolean);
  const children: (Paragraph | Table)[] = [
    ...nyCaption({ county, plaintiff, defendant, title: "AFFIDAVIT OF SERVICE", indexNo }),
    ...flags.map((f) => para([r(`REVIEW: ${f}`, { bold: true, size: 20 })], { ...S, after: 4 })),
    para(`STATE OF NEW YORK, COUNTY OF ${blank(18)}, ss:`, S),
    para("", S),
    para(`${blank(34)}, being duly sworn, deposes and says:`, S),
    para("", S),
    body(`1. I am over 18 years of age and I am not a party to this action. I reside at ${blank(46)}.`, { firstLine: 0 }),
    body(
      `2. On ${blank(14)}, 20${blank(3)}, at ${blank(8)} ${"[ ] a.m. [ ] p.m."}, at ${dAddrLines.join(", ")}, I served the within ${papers} upon ${defendant}, the Defendant named herein, by delivering a true copy of each to the Defendant personally.`,
      { firstLine: 0 }
    ),
    body(
      "3. I knew the person so served to be the person described as the Defendant in this action. I asked the Defendant whether the Defendant is in the military service of the United States or of the State of New York and received a negative reply. The Defendant was wearing ordinary civilian clothes and no military uniform. Upon information and belief, based upon the conversation and observation described above, the Defendant is not in the military service.",
      { firstLine: 0 }
    ),
    body(
      `4. A description of the Defendant, or other person served on behalf of the Defendant, is as follows: Sex ${blank(8)}  Color of skin ${blank(10)}  Color of hair ${blank(10)}  Approximate age ${blank(6)}  Approximate height ${blank(8)}  Approximate weight ${blank(8)}  Other identifying features ${blank(24)}.`,
      { firstLine: 0 }
    ),
    body(
      "5. [ ] (Check if applicable) The Summons with Notice served bore, in the Plaintiff's handwriting or by the Plaintiff's attorney, the index number and the date of filing with the County Clerk.",
      { firstLine: 0 }
    ),
    para("", S),
    para(`${blank(34)}`, { ...S, align: "right" }),
    para("Signature of Process Server", { ...S, align: "right" }),
    para(`${blank(34)}`, { ...S, align: "right" }),
    para("Print Name (License No., if any)", { ...S, align: "right" }),
    para("", S),
    para(`Sworn to before me on this ${blank(4)} day of ${blank(14)}, 20${blank(3)}.`, S),
    para("", S),
    para(`${blank(34)}`, S),
    para("Notary Public", S),
  ];
  return { children, formLabel: "(Form UD-3)", filename: `NY_UD3_${fileToken(plaintiff)}.docx` };
}
