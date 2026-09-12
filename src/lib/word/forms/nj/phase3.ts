/**
 * NJ Phase 3 — the proposed Final Judgment of Divorce and each party's
 * Certification in Support of Judgment of Divorce Without a Court Appearance.
 * The judge's name and the entry date are the Court's to fill.
 */
import type { Paragraph, Table } from "docx";
import { para, r, blank, body, columns, s, type WordForm, type WordPayload } from "../../engine";
import { pleadingDate } from "../../text";
import { fileToken } from "../ny/ud1";
import { njCommon, njCap, numbered, proSeSignature } from "./phase1";

const S = { spacing: "single" as const };

function decree(prefix: string, text: string): Paragraph {
  return para(prefix ? [r(`${prefix} `, { bold: true }), r(text)] : [r(text)], { align: "both", firstLine: 0.5, after: 6 });
}

export function jod(p: WordPayload): WordForm {
  const c = njCommon(p);
  const marriageDate = pleadingDate(s(p.marriageDate)) || blank(16);
  const ceremony = s(p.ceremonyType).toLowerCase() === "religious" ? "religious" : "civil";
  const ceremonyLocation = s(p.ceremonyLocation) || blank(20);
  const P = c.pName.toUpperCase();
  const D = c.dName.toUpperCase();
  const children: (Paragraph | Table)[] = [
    ...njCap(c, ["FINAL JUDGMENT OF DIVORCE"]),
    decree(
      "THIS MATTER",
      `having been opened to the Court by Plaintiff, ${P}, appearing pro se, and Defendant, ${D}, ` +
        "appearing pro se; and the Court having considered the Complaint for " +
        "Divorce and the Certifications in Support of Judgment of Divorce " +
        "Without a Court Appearance filed by both parties; and it appearing " +
        `that the parties were married on ${marriageDate} in a ${ceremony} ` +
        `ceremony in ${ceremonyLocation}; and that the parties having proved ` +
        "a cause of action for divorce under N.J.S.A. 2A:34-2; in such case " +
        "made and provided, entitling the parties to be granted a Judgment of " +
        "Divorce; and it further appearing that the parties have been a bona fide " +
        "resident of the State of New Jersey for more than one year next preceding " +
        "the commencement of this action, and jurisdiction having been acquired " +
        "over the parties pursuant to the Rules governing the Court; and for good cause shown;"
    ),
    decree(
      "",
      `It is therefore on this __________ day of ${blank(24)}, 20____, by the Superior Court of New Jersey, Chancery Division, Family ` +
        `Part, ${c.county.toUpperCase()} County, State of New Jersey;`
    ),
    decree(
      "ORDERED and ADJUDGED",
      "that this Court, by virtue of the power and " +
        "authority of this Court and of the acts of the Legislature in such case " +
        `made and provided, does hereby order that the Plaintiff, ${P}, ` +
        `and the Defendant, ${D}, be divorced from the bond of matrimony ` +
        "for the cause aforesaid, and that the parties and each of them be freed " +
        "from the obligations thereof and that the marriage between the parties is " +
        "hereby dissolved; and it is further"
    ),
    decree("ORDERED AND ADJUDGED,", "that neither party shall have an alimony obligation to the other; and it is further"),
    decree(
      "ORDERED",
      "that there is no equitable distribution between the parties " +
        "in that there is no real property, personal property nor any debt to " +
        "be divided between them; and it is further"
    ),
    decree("ORDERED", "that this case was decided based on the papers filed and without a court hearing; and it is further"),
    decree("ORDERED and ADJUDGED", "that all issues pleaded and not resolved in this Judgment are deemed abandoned; and it is further"),
    decree("ORDERED and ADJUDGED", "that a copy of the within Judgment shall be served upon all parties within seven (7) days of its receipt from the Court."),
    para("", S),
    para("", S),
    columns([], [para(blank(34), S), para(`Hon. ${blank(24)}, J.S.C.`, S)]),
  ];
  return { children, formLabel: "(Final Judgment of Divorce)", filename: `NJ_JOD_${fileToken(c.pName)}.docx` };
}

function jodCert(p: WordPayload, party: "plaintiff" | "defendant"): WordForm {
  const c = njCommon(p);
  const role = party === "plaintiff" ? "Plaintiff" : "Defendant";
  const me = party === "plaintiff" ? c.pName : c.dName;
  const sub = (label: string, text: string) => para(`${label}\t${text}`, { align: "both", left: 1.0, hanging: 0.5, tabs: [{ pos: 1.0 }] });
  const children: (Paragraph | Table)[] = [
    ...njCap(c, [`${role.toUpperCase()}'S CERTIFICATION IN`, "SUPPORT OF JUDGMENT OF DIVORCE", "WITHOUT A COURT APPEARANCE"]),
    body(`I, ${me}, of full age, hereby certify:`, { firstLine: 0 }),
    para([r("I.  Cause of Action", { bold: true })], { ...S, after: 8 }),
    numbered("1.", `I am the ${role}, and I am filing this Certification in support of my request for a Judgment of Divorce without appearing in court.`),
    sub("a.", party === "plaintiff" ? "I filed a Complaint for Divorce." : "I have read the Complaint for Divorce filed by the Plaintiff."),
    sub("b.", party === "plaintiff" ? "I certify to the truth of the Complaint." : "I certify to the truth of the Complaint as it pertains to the grounds for divorce."),
    sub("c.", party === "plaintiff" ? "The Defendant filed an Acknowledgment of Service." : "I filed an Acknowledgment of Service."),
    sub("d.", party === "plaintiff" ? "I do not want to reconcile with the Defendant." : "I do not want to reconcile with the Plaintiff."),
    numbered("2.", "I am aware that I have a right to a trial, and I am waiving that right."),
    numbered("3.", "I am aware that if there is a trial, the outcome could be different."),
    numbered("4.", "There are no other closed or open cases in this court or any other court between me and the other party."),
    numbered("5.", "No property was bought, owned, or received during the marriage that needs to be legally divided."),
    numbered("6.", "I am not seeking child support, custody, parenting time, or alimony/spousal support."),
    numbered("7.", "I further certify to the following:"),
    sub("a.", "There is no other property or debt to be divided."),
    sub("b.", "There are no other issues between the Plaintiff and Defendant."),
    body(
      "I certify that the statements made by me are true. I am aware that if any " +
        "of the statements made by me are willfully false, I am subject to punishment by the court.",
      { firstLine: 0 }
    ),
    ...proSeSignature(me, `${role}, Pro-Se`),
  ];
  return { children, formLabel: `(${role}'s Certification in Support of JOD)`, filename: `NJ_JOD_Cert_${role}_${fileToken(c.pName)}.docx` };
}

export function jod_cert_plaintiff(p: WordPayload): WordForm {
  return jodCert(p, "plaintiff");
}
export function jod_cert_defendant(p: WordPayload): WordForm {
  return jodCert(p, "defendant");
}
