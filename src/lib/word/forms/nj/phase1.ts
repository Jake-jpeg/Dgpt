/**
 * NJ Phase 1 — Complaint for Divorce (irreconcilable differences only,
 * N.J.S.A. 2A:34-2(i)), Summons, and the Certification of Verification and
 * Non-Collusion. Pro-se style, as the RL generators produced them.
 */
import type { Paragraph, Table } from "docx";
import { njCaption, para, blank, body, columns, pageBreak, s, type WordForm, type WordPayload } from "../../engine";
import { joinParts, pleadingDate } from "../../text";
import { fileToken } from "../ny/ud1";

const S = { spacing: "single" as const };

export interface NjCommon {
  pName: string;
  pAddress: string;
  pCityStateZip: string;
  pPhone: string;
  pFullCityState: string;
  dName: string;
  dAddress: string;
  dCityStateZip: string;
  dFullCityState: string;
  county: string;
  docket: string;
}

export function njCommon(p: WordPayload): NjCommon {
  return {
    pName: s(p.plaintiffName),
    pAddress: s(p.plaintiffAddress),
    pCityStateZip: s(p.plaintiffCityStateZip),
    pPhone: s(p.plaintiffPhone),
    pFullCityState: s(p.plaintiffFullCityState),
    dName: s(p.defendantName),
    dAddress: s(p.defendantAddress),
    dCityStateZip: s(p.defendantCityStateZip),
    dFullCityState: s(p.defendantFullCityState),
    county: s(p.filingCounty),
    docket: s(p.docketNumber),
  };
}

export function njCap(c: NjCommon, title: string[], civilAction = false) {
  return njCaption({
    county: c.county,
    plaintiff: c.pName,
    defendant: c.dName,
    title,
    docketNo: c.docket,
    civilAction,
    proSe: { name: c.pName, address: c.pAddress, cityStateZip: c.pCityStateZip, phone: c.pPhone },
  });
}

/** "Dated: ____" on the left, name + "Plaintiff, Pro-Se" on the right. */
export function proSeSignature(name: string, role = "Plaintiff, Pro-Se"): (Paragraph | Table)[] {
  return [para("", S), columns([para(`Dated: ${blank(15)}`, S)], [para(blank(34), S), para(name, S), para(role, S)])];
}

/** "1.  text" numbered pleading paragraph, double-spaced, hanging. */
export function numbered(n: string, text: string): Paragraph {
  return para(`${n}\t${text}`, { align: "both", left: 0.5, hanging: 0.5, tabs: [{ pos: 0.5 }] });
}

/* ── Complaint ────────────────────────────────────────────────────────── */

export function complaint(p: WordPayload): WordForm {
  const c = njCommon(p);
  const marriageDate = pleadingDate(s(p.marriageDate)) || blank(16);
  const ceremony = s(p.ceremonyType).toLowerCase() === "religious" ? "religious" : "civil";
  const ceremonyLocation = s(p.ceremonyLocation) || blank(20);
  const residencyParty = (s(p.residencyParty) || "plaintiff").toLowerCase();
  const pBody = joinParts([c.pAddress, c.pFullCityState]);
  const dBody = joinParts([c.dAddress, c.dFullCityState]);

  const residency =
    residencyParty === "both"
      ? "Both the Plaintiff and the Defendant were bona fide residents of the " +
        "State of New Jersey when this cause of action arose and have ever since " +
        "and for more than one year next preceding the commencement of this action " +
        "continued to be such bona fide residents."
      : residencyParty === "defendant"
        ? "The Defendant was a bona fide resident of the State of New Jersey when " +
          "this cause of action arose and has ever since and for more than one year " +
          "next preceding the commencement of this action continued to be such bona " +
          "fide resident."
        : "The Plaintiff was a bona fide resident of the State of New Jersey when " +
          "this cause of action arose and has ever since and for more than one year " +
          "next preceding the commencement of this action continued to be such bona " +
          "fide resident.";

  const children: (Paragraph | Table)[] = [
    ...njCap(c, ["COMPLAINT FOR DIVORCE"]),
    body(
      `The Plaintiff, ${c.pName.toUpperCase()}, currently residing at ${pBody}, ` +
        `by way of Complaint against the Defendant, ${c.dName.toUpperCase()}, says:`,
      { firstLine: 0 }
    ),
    numbered("1.", `The Plaintiff was lawfully married to Defendant on ${marriageDate} in a ${ceremony} ceremony in ${ceremonyLocation}.`),
    numbered("2.", residency),
    numbered("3.", `The Plaintiff presently resides at ${pBody}.`),
    numbered("4.", `The Defendant presently resides at ${dBody}.`),
    numbered(
      "5.",
      "At the time the within cause of action arose, the Plaintiff resided in " +
        `the State of New Jersey and, therefore, venue is properly situated in the County of ${c.county}.`
    ),
    numbered(
      "6.",
      "Irreconcilable differences have arisen between the parties, which have caused " +
        "the breakdown of the marriage for a period of six (6) months or more and which " +
        "make it appear that the marriage should be dissolved. There is no reasonable " +
        "prospect of reconciliation."
    ),
    numbered(
      "7.",
      "During the course of the marriage, the Plaintiff and Defendant have NOT " +
        "legally and / or beneficially acquired assets, both real and personal, which " +
        "may be subject to equitable distribution, pursuant to N.J.S.A. 2A:34-23.1."
    ),
    numbered(
      "8.",
      "There have been no previous proceedings between the parties hereto respecting " +
        "the dissolution of the marriage, or the support or maintenance of either party " +
        "in any Court in any State."
    ),
    body("WHEREFORE, the Plaintiff demands judgment as follows:", { firstLine: 0, keepNext: true }),
    numbered("a.", "Dissolving the marriage between the parties pursuant to N.J.S.A. 2A:34-2;"),
    numbered("b.", "Granting such other relief as this Court deems equitable and just."),
    ...proSeSignature(c.pName),
  ];
  return { children, formLabel: "(Complaint for Divorce)", filename: `NJ_Complaint_${fileToken(c.pName)}.docx` };
}

/* ── Summons ──────────────────────────────────────────────────────────── */

export function summons(p: WordPayload): WordForm {
  const c = njCommon(p);
  const J = { ...S, align: "both" as const, after: 8 };
  const children: (Paragraph | Table)[] = [
    ...njCap(c, ["SUMMONS"], true),
    para("STATE OF NEW JERSEY", { ...S, bold: true }),
    para(`TO THE DEFENDANT(S) NAMED ABOVE:   ${c.dName.toUpperCase()}`, { ...S, bold: true, after: 8 }),
    para(
      "The plaintiff, named above, has filed a lawsuit against you in the " +
        "Superior Court of New Jersey. The complaint attached to this summons " +
        "states the basis for this lawsuit. If you dispute this complaint, you " +
        "or your attorney must file a written answer or motion and proof of " +
        "service with the deputy clerk of the Superior Court in the county " +
        "listed above within 35 days from the date you received this summons, " +
        "not counting the date you received it. (A directory of the addresses " +
        "of each deputy clerk of the Superior Court is available in the Civil " +
        "Division Management Office in the county listed above and online at " +
        "http://www.njcourts.gov.)",
      J
    ),
    para(
      "If the complaint is one in foreclosure, then you must file your " +
        "written answer or motion and proof of service with the Clerk of the " +
        "Superior Court, Hughes Justice Complex, P.O. Box 971, Trenton, NJ " +
        "08625-0971. A filing fee payable to the Treasurer, State of New " +
        "Jersey and a completed Case Information Statement (available from the " +
        "deputy clerk of the Superior Court) must accompany your answer or " +
        "motion when it is filed. You must also send a copy of your answer or " +
        "motion to plaintiff's attorney whose name and address appear above, " +
        "or to plaintiff, if no attorney is named above. A telephone call will " +
        "not protect your rights; you must file and serve a written answer or " +
        "motion (with fee of $175.00 and completed Case Information Statement) " +
        "if you want the court to hear your defense.",
      J
    ),
    para(
      "If you do not file and serve a written answer or motion within 35 " +
        "days, the court may enter a judgment against you for the relief " +
        "plaintiff demands, plus interest and costs of suit. If judgment is " +
        "entered against you, the Sheriff may seize your money, wages or " +
        "property to pay all or part of the judgment.",
      J
    ),
    pageBreak(),
    para(
      "If you cannot afford an attorney, you may call the Legal Services " +
        "office in the county where you live or the Legal Services of New " +
        "Jersey Statewide Hotline at 1-888-LSNJ-LAW (1-888-576-5529). If you " +
        "do not have an attorney and are not eligible for free legal " +
        "assistance, you may obtain a referral to an attorney by calling one " +
        "of the Lawyer Referral Services. A directory with contact information " +
        "for local Legal Services Offices and Lawyer Referral Services is " +
        "available in the Civil Division Management Office in the county " +
        "listed above and online at http://www.njcourts.gov.",
      J
    ),
    para("", S),
    columns([], [para("/s/ Michelle M. Smith", S), para("", S), para("Michelle M. Smith, Esq.", S), para("Clerk of the Superior Court", S)]),
    para("", S),
    para(`Dated: ${blank(15)}`, S),
    para("", S),
    para("", S),
    para("Name of defendant to be served:", S),
    para(c.dName, S),
    para("", S),
    para("Address of defendant to be served:", S),
    para(c.dAddress, S),
    para(c.dCityStateZip, S),
  ];
  return { children, formLabel: "(Summons)", filename: `NJ_Summons_${fileToken(c.pName)}.docx` };
}

/* ── Certification of Verification and Non-Collusion ──────────────────── */

export function verification(p: WordPayload): WordForm {
  const c = njCommon(p);
  const children: (Paragraph | Table)[] = [
    ...njCap(c, ["CERTIFICATION OF VERIFICATION", "AND NON-COLLUSION"]),
    body(`I, ${c.pName}, of full age, certify as follows:`, { firstLine: 0 }),
    numbered("1.", "I am the plaintiff in the foregoing complaint."),
    numbered(
      "2.",
      "The allegations of the complaint are true to the best of my knowledge, " +
        "information, and belief. The complaint is made in truth and good faith and " +
        "without collusion for the causes set forth therein."
    ),
    numbered(
      "3.",
      "The matter in controversy in the within action is not the subject of any other " +
        "action pending in any court or of a pending arbitration proceeding, nor is any " +
        "such court action or arbitration proceeding presently contemplated. There are " +
        "no other persons who should be joined in this action at this time."
    ),
    body(
      "I certify that the foregoing statements made by me are true. I am aware " +
        "that if any of the foregoing statements made by me are willfully false, I am " +
        "subject to punishment.",
      { firstLine: 0 }
    ),
    ...proSeSignature(c.pName),
  ];
  return { children, formLabel: "(Certification of Verification and Non-Collusion)", filename: `NJ_Verification_${fileToken(c.pName)}.docx` };
}
