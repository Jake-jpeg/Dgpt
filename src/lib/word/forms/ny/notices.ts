/**
 * The two notices served with the summons in every New York matrimonial
 * action:
 *
 *   • NOTICE OF AUTOMATIC ORDERS — DRL § 236(B)(2)(b); text prescribed by
 *     22 NYCRR 202.16(a). The orders bind the plaintiff on filing and the
 *     defendant on service.
 *   • NOTICE OF GUIDELINE MAINTENANCE — DRL § 236(B)(6); the notice the
 *     parties acknowledge in UD-6 ¶ 11 and UD-7 ¶ 9, carrying the current
 *     income cap from src/config/legal/ny-guidelines-2026.ts.
 *
 * Both are prescribed text with a caption; the engine prints them verbatim.
 * [ATTORNEY VERIFY: the wording below against the current UCS notice forms
 * before first use — the rule text is stable, the UCS layout is revised
 * from time to time.]
 */
import type { Paragraph, Table } from "docx";
import { nyCaption, para, r, body, s, type WordForm, type WordPayload } from "../../engine";
import { countyName } from "../../text";
import { MAINTENANCE_GUIDELINES, usd } from "@/config/legal/ny-guidelines-2026";
import { fileToken } from "./ud1";

const S = { spacing: "single" as const };

export const AUTOMATIC_ORDERS_PARAGRAPHS: string[] = [
  "(1) ORDERED: Neither party shall sell, transfer, encumber, conceal, assign, remove or in any way dispose of, without the consent of the other party in writing, or by order of the court, any property (including, but not limited to, real estate, personal property, cash accounts, stocks, mutual funds, bank accounts, cars and boats) individually or jointly held by the parties, except in the usual course of business, for customary and usual household expenses or for reasonable attorney's fees in connection with this action.",
  "(2) ORDERED: Neither party shall transfer, encumber, assign, remove, withdraw or in any way dispose of any tax deferred funds, stocks or other assets held in any individual retirement accounts, 401K accounts, profit sharing plans, Keogh accounts, or any other pension or retirement account, and the parties shall further refrain from applying for or requesting the payment of retirement benefits or annuity payments of any kind, without the consent of the other party in writing, or upon further order of the court; except that any party who is already in pay status may continue to receive such payments thereunder.",
  "(3) ORDERED: Neither party shall incur unreasonable debts hereafter, including, but not limited to further borrowing against any credit line secured by the family residence, further encumbrancing any assets, or unreasonably using credit cards or cash advances against credit cards, except in the usual course of business or for customary or usual household expenses, or for reasonable attorney's fees in connection with this action.",
  "(4) ORDERED: Neither party shall cause the other party or the children of the marriage to be removed from any existing medical, hospital and dental insurance coverage, and each party shall maintain the existing medical, hospital and dental insurance coverage in full force and effect.",
  "(5) ORDERED: Neither party shall change the beneficiaries of any existing life insurance policies, and each party shall maintain the existing life insurance, automobile insurance, homeowners and renters insurance policies in full force and effect.",
];

export function automaticOrders(p: WordPayload): WordForm {
  const county = countyName(s(p.county) || s(p.filingCounty));
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  const indexNo = s(p.indexNumber);

  const children: (Paragraph | Table)[] = [
    ...nyCaption({ county, plaintiff, defendant, title: "NOTICE OF AUTOMATIC ORDERS", indexNo, subtitle: "(DRL § 236(B)(2)(b); 22 NYCRR 202.16(a))" }),
    body(
      "PURSUANT TO the Uniform Rules of the Trial Courts, and DOMESTIC RELATIONS LAW § 236 Part B, Section 2, both you and your spouse (the petitioner and respondent) are bound by the following AUTOMATIC ORDERS, which have been entered against you and your spouse in your divorce action pursuant to 22 NYCRR § 202.16(a), and which shall remain in full force and effect during the pendency of the action unless terminated, modified or amended by further order of the court or upon written agreement between the parties:",
      { firstLine: 0 }
    ),
    ...AUTOMATIC_ORDERS_PARAGRAPHS.map((t) => body(t, { firstLine: 0 })),
    body(
      "IMPORTANT NOTE: After service of the Summons with Notice or Summons and Complaint for divorce, if you or your spouse wishes to modify or dissolve the automatic orders, you must ask the court for approval to do so, or enter into a written modification agreement with your spouse duly signed and acknowledged before a notary public.",
      { firstLine: 0 }
    ),
    para("", S),
    para([r("Dated: ____________________", {})], S),
    para("", S),
    para(`${plaintiff}, Plaintiff, by ______________________________, Attorney for Plaintiff`, S),
  ];
  return { children, formLabel: "(Notice of Automatic Orders)", filename: `NY_AutomaticOrders_${fileToken(plaintiff)}.docx` };
}

export function guidelineMaintenance(p: WordPayload): WordForm {
  const county = countyName(s(p.county) || s(p.filingCounty));
  const plaintiff = s(p.plaintiffName);
  const defendant = s(p.defendantName);
  const indexNo = s(p.indexNumber);
  const cap = usd(MAINTENANCE_GUIDELINES.incomeCap);

  const children: (Paragraph | Table)[] = [
    ...nyCaption({ county, plaintiff, defendant, title: "NOTICE OF GUIDELINE MAINTENANCE", indexNo, subtitle: "(DRL § 236(B)(6))" }),
    body(
      "You should know that spousal support or maintenance (formerly called alimony) is money paid by one spouse to the other during or after a divorce. Under New York law, there is a formula to set the amount and the length of time that spousal maintenance may be paid. A court may deviate from the formula if it finds that the guideline amount is unjust or inappropriate after considering the statutory factors.",
      { firstLine: 0 }
    ),
    body(
      `The formula applies to the first ${cap} of the payor's annual income (the "income cap", effective ${MAINTENANCE_GUIDELINES.effective}, adjusted every two years). ${MAINTENANCE_GUIDELINES.formulaNote}`,
      { firstLine: 0 }
    ),
    body(`${MAINTENANCE_GUIDELINES.durationNote}`, { firstLine: 0 }),
    body(
      "The parties may agree to maintenance in an amount and for a duration different from the guideline, or to waive maintenance, in a written agreement, provided the agreement states that the parties have been advised of the guideline, what the guideline amount would be, and, if different, the reasons for the deviation.",
      { firstLine: 0 }
    ),
    body(
      "A copy of the Maintenance Guidelines Calculator and further information is available at www.nycourts.gov/divorce. This notice is informational only and does not determine any party's entitlement to or obligation for maintenance.",
      { firstLine: 0 }
    ),
    para("", S),
    para(`Guideline year applied: ${MAINTENANCE_GUIDELINES.year} — ${MAINTENANCE_GUIDELINES.citation}`, { ...S, size: 20 }),
    para("", S),
    para("Dated: ____________________", S),
    para("", S),
    para(`${plaintiff}, Plaintiff, by ______________________________, Attorney for Plaintiff`, S),
  ];
  return { children, formLabel: "(Notice of Guideline Maintenance)", filename: `NY_GuidelineMaintenance_${fileToken(plaintiff)}.docx` };
}
