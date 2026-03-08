// NJ Form Language Reference
// Extracted from divorcegpt-pdf ReportLab generators
// This is what the PDFs actually say — the AI should know this verbatim

export const NJ_FORM_LANGUAGE = `
═══════════════════════════════════════════════════════════════
EXACT FORM LANGUAGE — WHAT DIVORCEGPT'S PDFs ACTUALLY SAY
═══════════════════════════════════════════════════════════════

These are the actual words on the documents DivorceGPT generates.
When a user asks "what does my form say?" — refer to this section.
When collecting data, ensure it matches the format expectations below.

All NJ forms share the same caption format:
  [Plaintiff Name, uppercase], Plaintiff, vs. [Defendant Name, uppercase], Defendant.
  SUPERIOR COURT OF NEW JERSEY / CHANCERY DIVISION- FAMILY PART / [COUNTY] COUNTY
  DOCKET NO.: [FM-XX-XXXXXX-XX or "FM-" if not yet assigned]

All certifications end with:
  "I certify that the foregoing statements made by me are true. I am aware that if any of the foregoing statements made by me are willfully false, I am subject to punishment."

────────────────────────────────────────────────────────────
COMPLAINT FOR DIVORCE
────────────────────────────────────────────────────────────
Title: "COMPLAINT FOR DIVORCE"

Opening: "The Plaintiff, [NAME uppercase], currently residing at [full address], by way of Complaint against the Defendant, [NAME uppercase], says:"

Paragraph 1 (Marriage): "The Plaintiff was lawfully married to Defendant on [marriageDate] in a [civil/religious] ceremony in [ceremonyLocation]."
  → ceremonyLocation is constructed as "the Borough of [city], State of [state]"
  → AI collects marriageCity and marriageState separately; generator constructs the location string

Paragraph 2 (Residency — varies by residencyParty):
  If plaintiff: "The Plaintiff was a bona fide resident of the State of New Jersey when this cause of action arose and has ever since and for more than one year next preceding the commencement of this action continued to be such bona fide resident."
  If defendant: Same language but "The Defendant was..."
  If both: "Both the Plaintiff and the Defendant were bona fide residents..."

Paragraph 3 (Plaintiff address): "The Plaintiff presently resides at [full address]."

Paragraph 4 (Defendant address): "The Defendant presently resides at [full address]."

Paragraph 5 (Venue): "At the time the within cause of action arose, the Plaintiff resided in the State of New Jersey and, therefore, venue is properly situated in the County of [filingCounty]."
  → filingCounty should be just the county name (e.g., "Bergen"), NOT "Bergen County" — the generator adds "County of"

Paragraph 6 (Irreconcilable differences): "Irreconcilable differences have arisen between the parties, which have caused the breakdown of the marriage for a period of six (6) months or more and which make it appear that the marriage should be dissolved. There is no reasonable prospect of reconciliation."

Paragraph 7 (No assets): "During the course of the marriage, the Plaintiff and Defendant have NOT legally and / or beneficially acquired assets, both real and personal, which may be subject to equitable distribution, pursuant to N.J.S.A. 2A:34-23.1."

Paragraph 8 (No prior proceedings): "There have been no previous proceedings between the parties hereto respecting the dissolution of the marriage, or the support or maintenance of either party in any Court in any State."

WHEREFORE: "WHEREFORE, the Plaintiff demands judgment as follows:
  a. Dissolving the marriage between the parties pursuant to N.J.S.A. 2A:34-2;
  b. Granting such other relief as this Court deems equitable and just."

Signed by: Plaintiff, Pro-Se. Dated line left, signature right.

────────────────────────────────────────────────────────────
CERTIFICATION OF VERIFICATION AND NON-COLLUSION
────────────────────────────────────────────────────────────
Title: "CERTIFICATION OF VERIFICATION AND NON-COLLUSION"

Opening: "I, [plaintiffName], of full age, certify as follows:"

Paragraph 1: "I am the plaintiff in the foregoing complaint."

Paragraph 2: "The allegations of the complaint are true to the best of my knowledge, information, and belief. The complaint is made in truth and good faith and without collusion for the causes set forth therein."

Paragraph 3: "The matter in controversy in the within action is not the subject of any other action pending in any court or of a pending arbitration proceeding, nor is any such court action or arbitration proceeding presently contemplated. There are no other persons who should be joined in this action at this time."

Signed by: Plaintiff, Pro-Se.

────────────────────────────────────────────────────────────
SUMMONS
────────────────────────────────────────────────────────────
Title: "CIVIL ACTION — SUMMONS"

Header: "STATE OF NEW JERSEY"
"TO THE DEFENDANT(S) NAMED ABOVE: [DEFENDANT NAME uppercase]"

Body (verbatim): "The plaintiff, named above, has filed a lawsuit against you in the Superior Court of New Jersey. The complaint attached to this summons states the basis for this lawsuit. If you dispute this complaint, you or your attorney must file a written answer or motion and proof of service with the deputy clerk of the Superior Court in the county listed above within 35 days from the date you received this summons, not counting the date you received it."

[Additional paragraphs about foreclosure (not applicable), fee of $175.00, and legal services contacts]

"If you do not file and serve a written answer or motion within 35 days, the court may enter a judgment against you for the relief plaintiff demands, plus interest and costs of suit."

────────────────────────────────────────────────────────────
CDR CERTIFICATION — PLAINTIFF (CN 10889)
────────────────────────────────────────────────────────────
Title: "PLAINTIFF'S CERTIFICATION OF NOTIFICATION OF COMPLEMENTARY DISPUTE RESOLUTION (CDR) ALTERNATIVES"

Opening: "[plaintiffName], being of full age, hereby certifies as follows:"

Paragraph 1: "I am the Plaintiff in the above captioned matter, and I am not represented by an attorney."

Paragraph 2: "I make this Certification pursuant to New Jersey Court Rule 5:4-2(h)."

Paragraph 3: References reading "Descriptive Material (R. 5:4-2(h)) Divorce or Dissolution - Dispute Resolution Alternatives to Conventional Litigation" (CN 10888).

Paragraph 4: "I understand that there are other options available to resolve the issues in this case instead of going to trial."

Signed by: Plaintiff, Pro-Se.

────────────────────────────────────────────────────────────
CDR CERTIFICATION — DEFENDANT (CN 10889)
────────────────────────────────────────────────────────────
Title: "DEFENDANT'S CERTIFICATION OF NOTIFICATION OF COMPLEMENTARY DISPUTE RESOLUTION (CDR) ALTERNATIVES"

Same structure as plaintiff version but:
Opening: "[defendantName], being of full age, hereby certifies as follows:"
Paragraph 1: "I am the Defendant in the above captioned matter, and I am not represented by an attorney."

Signed by: Defendant, Pro-Se.

────────────────────────────────────────────────────────────
CERTIFICATION OF INSURANCE COVERAGE
────────────────────────────────────────────────────────────
Title: "CERTIFICATION OF INSURANCE COVERAGE PURSUANT TO R. 5:4-2(f)"

Opening: "[plaintiffName], being of full age, hereby certifies as follows:"

Paragraph 1: "I am the Plaintiff in the above captioned matter and I make this Certification pursuant to R. 5:4-2(f)."

Paragraph 2: "The only relief sought in this action is the dissolution of the marriage. No claims for alimony, child support, equitable distribution, or any other financial relief are being made in this action."

Paragraph 3: "Pursuant to R. 5:4-2(f), because the only relief sought is dissolution of the marriage, the detailed insurance affidavit otherwise required by R. 5:4-2(f) is not required, and this Certification is submitted in lieu thereof."

Paragraph 4: "To the best of my knowledge and belief, no insurance coverage pertaining to the parties has been canceled or modified within the ninety (90) days preceding the date of this Certification."

Paragraph 5: "I understand that all existing insurance coverage shall be maintained pending further Order of the Court, pursuant to R. 5:4-2(f)."

Signed by: Plaintiff, Pro-Se.

────────────────────────────────────────────────────────────
ACKNOWLEDGMENT OF SERVICE (Phase 2)
────────────────────────────────────────────────────────────
Title: "ACKNOWLEDGMENT OF SERVICE"

Paragraphs (defendant signs):
1. "I, [defendantName], am the Defendant in the above captioned matter."
2. "I hereby acknowledge that I have received a copy of the Summons and Complaint for Divorce, together with all accompanying documents filed in this action."
3. "I understand that I have thirty-five (35) days from the date of this Acknowledgment to file an Answer, Counterclaim, or Appearance with the court."
4. "I waive formal service of process by the Sheriff or other authorized process server, and I accept service of the above documents voluntarily."
5. "I understand that this Acknowledgment of Service has the same legal effect as if I had been personally served with these documents, pursuant to R. 4:4-6."

Signed by: Defendant, Pro-Se. Requires notarization.

────────────────────────────────────────────────────────────
PLAINTIFF'S CERTIFICATION FOR DIVORCE WITHOUT COURT APPEARANCE (CN 12620)
────────────────────────────────────────────────────────────
Title: "PLAINTIFF'S CERTIFICATION IN SUPPORT OF JUDGMENT OF DIVORCE WITHOUT A COURT APPEARANCE"

Opening: "I, [plaintiffName], of full age, hereby certify:"

Section I — Cause of Action:
1. "I am the Plaintiff, and I am filing this Certification in support of my request for a Judgment of Divorce without appearing in court."
  a. "I filed a Complaint for Divorce."
  b. "I certify to the truth of the Complaint."
  c. "The Defendant filed an Acknowledgment of Service."
  d. "I do not want to reconcile with the Defendant."

2. "I am aware that I have a right to a trial, and I am waiving that right."
3. "I am aware that if there is a trial, the outcome could be different."
4. "There are no other closed or open cases in this court or any other court between me and the other party."
5. "No property was bought, owned, or received during the marriage that needs to be legally divided."
6. "I am not seeking child support, custody, or parenting time."
7. "I further certify to the following:"
  a. "There is no other property or debt to be divided."

Signed by: Plaintiff, Pro-Se.

────────────────────────────────────────────────────────────
DEFENDANT'S CERTIFICATION FOR DIVORCE WITHOUT COURT APPEARANCE (CN 12620)
────────────────────────────────────────────────────────────
Title: "DEFENDANT'S CERTIFICATION IN SUPPORT OF JUDGMENT OF DIVORCE WITHOUT A COURT APPEARANCE"

Same structure as plaintiff version but:
Opening: "I, [defendantName], of full age, hereby certify:"
1. "I am the Defendant, and I am filing this Certification in support of my request for a Judgment of Divorce without appearing in court."
  a. "I have read the Complaint for Divorce filed by the Plaintiff."
  b. "I certify to the truth of the Complaint as it pertains to the grounds for divorce."
  c. "I filed an Acknowledgment of Service."
  d. "I do not want to reconcile with the Plaintiff."

Signed by: Defendant, Pro-Se.

────────────────────────────────────────────────────────────
PROPOSED FINAL JUDGMENT OF DIVORCE
────────────────────────────────────────────────────────────
Title: "FINAL JUDGMENT OF DIVORCE"

Preamble: "This matter having been opened to the Court by Plaintiff, [NAME uppercase], appearing pro se, and Defendant, [NAME uppercase], appearing pro se; and the Court having considered the Complaint for Divorce and the Certifications in Support of Judgment of Divorce Without a Court Appearance filed by both parties; and it appearing that the parties were married on [marriageDate] in a [civil/religious] ceremony in [ceremonyLocation]; and that the parties having proved a cause of action for divorce under N.J.S.A. 2A:34-2; in such case made and provided, entitling the parties to be granted a Judgment of Divorce; and it further appearing that the parties have been a bona fide resident of the State of New Jersey for more than one year next preceding the commencement of this action, and jurisdiction having been acquired over the parties pursuant to the Rules governing the Court; and for good cause shown;"

IT IS ORDERED: "on this _____ day of _______________, 20___, by the Superior Court of New Jersey, Chancery Division, Family Part, [COUNTY] County, State of New Jersey;"

ORDERED AND ADJUDGED: "that this Court, by virtue of the power and authority of this Court and of the acts of the Legislature in such case made and provided, does hereby order that the Plaintiff, [NAME], and the Defendant, [NAME], be divorced from the bond of matrimony for the cause aforesaid, and that the parties and each of them be freed from the obligations thereof and that the marriage between the parties is hereby dissolved; and it is further"

Additional paragraphs:
- "that neither party shall have an alimony obligation to the other"
- "that there is no equitable distribution between the parties in that there is no real property, personal property nor any debt to be divided between them"
- "that this case was decided based on the papers filed and without a court hearing"
- "that all issues pleaded and not resolved in this Judgment are deemed abandoned"
- "that a copy of the within Judgment shall be served upon all parties within seven (7) days of its receipt from the Court"

Signed by: "Hon. ________________________, J.S.C."

────────────────────────────────────────────────────────────
FIELD FORMAT EXPECTATIONS
────────────────────────────────────────────────────────────

• plaintiffName / defendantName → Used as-is in body, UPPERCASED in caption and certain paragraphs
• filingCounty → Just county name (e.g., "Bergen"), generator adds "County of" or "COUNTY"
• marriageDate → Written out (e.g., "July 11, 2006"), used verbatim
• ceremonyType → "civil" or "religious" → appears as "a civil ceremony" or "a religious ceremony"
• ceremonyLocation → DERIVED by generator from marriageCity + marriageState
  → Constructs "the Borough of [city], State of [state]"
  → AI must collect marriageCity and marriageState separately
• plaintiffAddress / defendantAddress → Full address with ZIP for caption header
  → Generator splits into street line + city/state/zip line for the pro se header
  → Body text uses "[street], [city], [state]" format (no ZIP in body)
• docketNumber → "FM-XX-XXXXXX-XX" or "FM-" if not yet assigned
• residencyParty → "plaintiff", "defendant", or "both" — determines Paragraph 2 of Complaint
`;
