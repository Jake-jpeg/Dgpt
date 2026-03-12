// NY Form Language Reference
// Extracted from divorcegpt-pdf ReportLab generators
// This is what the PDFs actually say

export const NY_FORM_LANGUAGE = `
═══════════════════════════════════════════════════════════════
EXACT FORM LANGUAGE — WHAT DIVORCEGPT'S NY PDFs ACTUALLY SAY
═══════════════════════════════════════════════════════════════

All NY forms share the same caption format:
  SUPREME COURT OF THE STATE OF NEW YORK / COUNTY OF [COUNTY uppercase]
  [Plaintiff Name], Plaintiff, -against- [Defendant Name], Defendant.
  Index No.: [number/year]

────────────────────────────────────────────────────────────
UD-1: SUMMONS WITH NOTICE
────────────────────────────────────────────────────────────
Title: "SUMMONS WITH NOTICE"
Subtitle: "ACTION FOR A DIVORCE"

Venue basis: "[Qualifying party] resides at: [qualifying address]"
"To the above named Defendant:"

Grounds notice: "The nature of this action is to dissolve the marriage between the parties, on the grounds of irretrievable breakdown in relationship for a period of six months, pursuant to DRL §170(7)."

Relief: States nature of relief sought (dissolution only, no ancillary relief: "NONE").

────────────────────────────────────────────────────────────
UD-5: AFFIRMATION OF REGULARITY
────────────────────────────────────────────────────────────
Title: "AFFIRMATION"

Para 2: "The Summons with Notice and the Notice of Automatic Orders and the Notice of Guideline Maintenance were personally served upon the Defendant herein, [within/without] the State of New York as appears in the affidavit or affirmation of service submitted herewith."

Para 3 (if defendant appeared): "Defendant has appeared on his or her own behalf and executed an affidavit or affirmation that this matter be placed on the matrimonial calendar immediately."
Para 3 (if default): "Defendant is in default for failure to serve a notice of appearance or failure to answer the complaint served in this action in due time, and the time to answer has not been extended by stipulation, court order, or otherwise."

Para 4: "No other action or proceeding for divorce, annulment, or dissolution of marriage has been commenced by or against either party in this or any other court."
Para 5: "The papers submitted herewith are in proper form."

────────────────────────────────────────────────────────────
UD-6: AFFIRMATION OF PLAINTIFF
────────────────────────────────────────────────────────────
Title: "AFFIRMATION OF PLAINTIFF"

Opening: "[plaintiffName], affirms the following under the penalties of perjury:"

Para 1: "I am the Plaintiff in this action. I reside at [address]. Defendant resides at [address]."

Para 2: Residency basis — one of six options (A through F) matching DRL §230:
  A: "The parties were married in New York State and Plaintiff has resided in New York State for a continuous period of at least one year..."
  B: "The parties have resided as married persons in New York State and Plaintiff has resided..."
  C: "The cause of action occurred in New York State and Plaintiff has resided..."
  D: "The cause of action occurred in New York State and both parties were residents..."
  E: "The parties were married in New York State and both parties were residents..."
  F: "Either party has resided in New York State for a continuous period of at least two years..."

Para 3: "Plaintiff and Defendant were married on [date] in [city, county, state]."
  → States whether ceremony was religious or civil.

Para 4: "There are no children of the marriage under the age of 21."
Para 5: "The grounds for divorce are: DRL §170 subd. (7) - The relationship between Plaintiff and Defendant has broken down irretrievably for a period of at least six months."
Para 6a: "I am not seeking equitable distribution other than what was already agreed to in a written stipulation. I understand that I may be prevented from further asserting my right to equitable distribution."
Para 6b: "I am not seeking maintenance as payee."
Para 6c: "Since the grounds alleged are DRL §170(7), all economic issues of equitable distribution of marital property, the payment or waiver of spousal support have been resolved by the parties and there are no children of the marriage."

Para 7 (religious): "I have taken or will take all steps solely within my power to remove any barriers to the Defendant's remarriage."
Para 7 (civil): "The Barriers to Remarriage provisions (DRL §253) do not apply as the marriage was not performed in a religious ceremony."

Para 8: "Defendant is not in the active military service of this state, any other state of this nation, or of the United States."
Para 9: "No other action or proceeding for divorce, annulment, or dissolution of marriage has been commenced by or against either party in this or any other court."
Para 10: "I have been provided a copy of Notice Relating to Health Care of the Parties. I fully understand that upon the entrance of this divorce judgment, I may no longer be allowed to receive health coverage under my former spouse's health insurance plan."
Para 11: "I acknowledge receipt of the Notice of Guideline Maintenance."

────────────────────────────────────────────────────────────
UD-7: AFFIRMATION OF DEFENDANT
────────────────────────────────────────────────────────────
Title: "AFFIRMATION OF DEFENDANT"

Opening: "[defendantName], affirms the following under the penalties of perjury:"

Para intro: "I am the Defendant in the within action for divorce, and I am over the age of 18. I reside at [address]."

Para 1: "I admit service of the Summons with Notice dated [date], wherein the grounds for divorce alleged are: DRL §170 subd. (7) - The relationship between Plaintiff and Defendant has broken down irretrievably for a period of at least six months."
  "I also admit service of the Notice of Automatic Orders and the Notice of Guideline Maintenance."

Para 2: "I appear in this action; however, I do not intend to respond to the summons or answer the complaint, and I waive the twenty (20) or thirty (30) day period provided by law to respond to the summons or answer the complaint. I waive the forty (40) day waiting period to place this matter on the calendar, and I hereby consent to this action being placed on the uncontested divorce calendar immediately."

Para 4: "[X] I waive service of all further papers in this action except for a copy of the final Judgment of Divorce."

Para 5a: "I am not seeking equitable distribution other than what was already agreed to in a written stipulation. I understand that I may be prevented from further asserting my right to equitable distribution."
Para 5b: "[X] I am not seeking maintenance as payee."

Para 6a (religious): "I will take or have taken all steps solely within my power to remove any barriers to the Plaintiff's remarriage."
Para 6b (religious): "[ ] I waive the requirements of DRL §253 subdivisions (2), (3), and (4)."
Para 6 (civil): "The Barriers to Remarriage provisions (DRL §253) do not apply as the marriage was not performed in a religious ceremony."

Para 7: "There are no children of the marriage under the age of 21."
Para 8: "I have been provided a copy of Notice Relating to Health Care of the Parties. I fully understand that upon the entrance of this divorce judgment, I may no longer be allowed to receive health coverage under my former spouse's health insurance plan."
Para 9: "I acknowledge receipt of the Notice of Guideline Maintenance."

CRITICAL: UD-7 contains the DRL §253 barriers-to-remarriage language. There is NO separate waiver document.

────────────────────────────────────────────────────────────
UD-9: NOTE OF ISSUE
────────────────────────────────────────────────────────────
Title: "NOTE OF ISSUE — UNCONTESTED MATRIMONIAL"
Pre-filled: "NO TRIAL", Filed by Plaintiff (checked), Nature: "UNCONTESTED DIVORCE", Relief: "ABSOLUTE DIVORCE"
Shows filing date, service date, issue joined status (Waiver checked for appeared defendant, Default for defaulted).

────────────────────────────────────────────────────────────
UD-10: FINDINGS OF FACT AND CONCLUSIONS OF LAW
────────────────────────────────────────────────────────────
Title: "FINDINGS OF FACT AND CONCLUSIONS OF LAW"

FIRST: "Plaintiff and Defendant were both eighteen (18) years of age or over when this action was commenced."

SECOND: Residency basis (A-F, matches UD-6 Para 2).

THIRD: "Plaintiff and Defendant were married on [date] in [city], County of [county], State of [state], in a [civil/religious] ceremony."

FOURTH: "No decree, judgment, or order of divorce, annulment, or dissolution of marriage has been granted to either party against the other in any Court of competent jurisdiction..."

FIFTH: "This action was commenced by filing the Summons With Notice with the County Clerk on [date]. Defendant was served personally... Defendant appeared and waived his/her right to answer..."

SIXTH: "The Supreme Court of the State of New York has jurisdiction over the subject matter of this action and the parties hereto, and venue is proper in this Court."

SEVENTH: "The Notice of Automatic Orders was duly served upon Defendant and no violations thereof are alleged."

EIGHTH: "Neither Plaintiff nor Defendant is in the military service of the United States of America, the State of New York, or any other state..."

────────────────────────────────────────────────────────────
UD-11: JUDGMENT OF DIVORCE
────────────────────────────────────────────────────────────
Title: "JUDGMENT OF DIVORCE"

Key ORDERED AND ADJUDGED paragraphs:
- "...the marriage between [Plaintiff] and [Defendant] is hereby dissolved by reason of the Irretrievable Breakdown of the marriage relationship for a period of at least six (6) months pursuant to DRL §170(7)"
- "...there are no children of the marriage"
- "...no award of maintenance is made to either party, neither party having requested maintenance"
- "...equitable distribution of marital property is not in issue, there being no marital property to distribute"
- Religious: "...Plaintiff has complied with DRL §253 by filing a sworn statement that Plaintiff has taken all steps within his or her power to remove all barriers to Defendant's remarriage"
- Civil: "...compliance with DRL §253 regarding removal of barriers to remarriage is not required as the parties were married in a civil ceremony"
- "...the parties have been provided notice pursuant to DRL §255 regarding health care coverage continuation, tax consequences, and other rights affected by this judgment"

────────────────────────────────────────────────────────────
UD-12: PART 130 CERTIFICATION
────────────────────────────────────────────────────────────
Title: "PART 130 CERTIFICATION"
Simple certification that the filing is not frivolous under 22 NYCRR §130-1.1a.

────────────────────────────────────────────────────────────
UD-14: NOTICE OF ENTRY
────────────────────────────────────────────────────────────
Title: "NOTICE OF ENTRY"
"PLEASE TAKE NOTICE that the attached is a true copy of a judgment of divorce in this matter that was entered in the Office of the County Clerk of [County] County, on [date]."

────────────────────────────────────────────────────────────
UD-15: AFFIRMATION OF SERVICE BY MAIL OF JUDGMENT OF DIVORCE
────────────────────────────────────────────────────────────
Title: "AFFIRMATION OF SERVICE BY MAIL OF JUDGMENT OF DIVORCE WITH NOTICE OF ENTRY"
Affirms mailing of JOD + Notice of Entry to defendant at their current address.

────────────────────────────────────────────────────────────
UD-4: SWORN STATEMENT OF REMOVAL OF BARRIERS TO REMARRIAGE (Religious only)
────────────────────────────────────────────────────────────
Title: "SWORN STATEMENT OF REMOVAL OF BARRIERS TO REMARRIAGE"
DRL §253 compliance. Plaintiff swears they have taken/will take all steps to remove barriers.
Includes Affidavit of Service page (service on defendant).
"The Defendant has waived in writing the requirements of DRL §253." (if applicable)

────────────────────────────────────────────────────────────
FIELD FORMAT EXPECTATIONS
────────────────────────────────────────────────────────────

• plaintiffName / defendantName → Used as-is throughout
• qualifyingCounty → Just county name (e.g., "Kings"), used as "COUNTY OF KINGS"
• qualifyingParty → "plaintiff" or "defendant" — determines venue basis on UD-1
• qualifyingAddress → Address of qualifying party for venue
• indexNumber → Format: "12345/2026"
• summonsDate → Date UD-1 was filed with County Clerk
• marriageDate → Written out (e.g., "January 15, 2010")
• marriageCity / marriageCounty / marriageState → Used in UD-6 para 3, UD-10 THIRD
• breakdownDate → When relationship irretrievably broke down (6+ months ago)
• ceremonyType → "civil" or "religious" — affects UD-4 inclusion, DRL §253 language in UD-6/7/11
• judgmentEntryDate → Date clerk entered JOD (Phase 3)
• defendantCurrentAddress → For UD-15 service (may differ from Phase 1 address)
`;
