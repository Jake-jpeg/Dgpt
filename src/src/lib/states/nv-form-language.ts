// NV Form Language Reference
// Extracted from divorcegpt-pdf ReportLab generators
// This is what the PDFs actually say

export const NV_FORM_LANGUAGE = `
===============================================================
EXACT FORM LANGUAGE - WHAT DIVORCEGPT'S NV PDFs ACTUALLY SAY
===============================================================

These are the actual words on the documents DivorceGPT generates for Nevada.
When a user asks "what does my form say?" - refer to this section.
When collecting data, ensure it matches the format expectations below.

All NV forms share the same caption format:
  IN THE [X] JUDICIAL DISTRICT COURT OF THE STATE OF NEVADA
  IN AND FOR THE COUNTY OF [COUNTY uppercase]
  [First Spouse Name], First Joint Petitioner,
  and
  [Second Spouse Name], Second Joint Petitioner.
  Case No. [assigned by clerk]
  Dept. No. [blank]

NOTE: NV uses "Joint Petitioners" NOT "Plaintiff/Defendant" because
this is a Joint Petition. Both spouses are petitioners filing together.

------------------------------------------------------------
JOINT PETITION FOR DIVORCE (No Children)
------------------------------------------------------------
Title: "JOINT PETITION FOR DIVORCE (No Children)"
Subtitle: "(Pursuant to NRS 125.182 through NRS 125.184)"

Section 1 - Marriage:
"We were married on [marriageDate] in [marriageCity], [marriageState]."
"We have been married for [X] years."

Section 2 - Residency:
"[residentSpouseName] has been a resident of Nevada and has been
physically present and domiciled in Nevada for at least six weeks
immediately preceding the filing of this Petition."

Section 3 - Addresses:
"First Joint Petitioner: [firstSpouseAddress], [firstSpouseCityStateZip]"
"Phone: [firstSpousePhone] Email: [firstSpouseEmail]"
"Second Joint Petitioner: [secondSpouseAddress], [secondSpouseCityStateZip]"
"Phone: [secondSpousePhone] Email: [secondSpouseEmail]"

Section 4 - Pregnancy:
"The wife is not pregnant." (pre-filled for DivorceGPT scope)

Section 5 - Children:
"We have no minor children born to or adopted by us during this
marriage, and no children are expected."

Section 6 - Community Property:
Option A (checked if 'none'): "We have no community property."
Option B (checked if 'already_divided'): "We have already divided
our community property by agreement and each Joint Petitioner has
received his/her share."

Section 7 - Community Debt:
Option A (checked if 'none'): "We have no community debts."
Option B (checked if 'already_divided'): "We have already divided
our community debts by agreement and each Joint Petitioner has
assumed his/her share."

Section 8 - Certification:
"We certify that to the best of our knowledge there are no
other community assets or community debts not listed above."

Section 9 - Spousal Support:
"Neither of us is asking for spousal support (alimony) from
the other."

Section 10 - Name Change:
If restoring: "[Name] requests that his/her name be changed
from [marriedName] to [maidenName]."
If not: "No name change is requested."

Sections 11-13 (boilerplate):
"We have made this agreement freely, voluntarily, and without
coercion."
"We understand that by filing this Joint Petition, we are asking
the Court to end our marriage and divide our property and debts
according to this agreement."
"We agree that this Court has jurisdiction over this matter."

Prayer for Relief:
"WHEREFORE, the Joint Petitioners pray:
1. That the bonds of matrimony between us be dissolved on the
   grounds of incompatibility;
2. That the Court approve the above agreements regarding community
   property, community debt, and spousal support;
3. That the Court grant any other relief it deems just and proper."

Signature blocks:
"First Joint Petitioner: _________________________ Date: _______"
"Second Joint Petitioner: ________________________ Date: _______"

Verification pages (pages 6 and 7 - one per petitioner):
"I declare under penalty of perjury under the law of the State
of Nevada that the foregoing is true and correct."
Each verification includes a notary block.

------------------------------------------------------------
DECREE OF DIVORCE (No Children)
------------------------------------------------------------
Title: "DECREE OF DIVORCE (No Children)"
NV court format with line numbers 1-28 on left margin.

Finding 1: "The Court finds that it has jurisdiction over the
parties and the subject matter of this action."

Finding 2: "[residentSpouseName] has been a resident of Nevada
and has been physically present and domiciled in Nevada for at
least six weeks immediately preceding the filing of this Petition."

Finding 3: "The parties were married on [marriageDate] in
[marriageCity], [marriageState]."

Finding 4: "Incompatibility has been established as grounds for
divorce pursuant to NRS 125.010."

Finding 5: "The wife is not pregnant."
Finding 6: "There are no minor children of this marriage."

Finding 7 (community property):
"The parties have no community property." OR
"The parties have already divided their community property by agreement."

Finding 8 (community debt):
"The parties have no community debts." OR
"The parties have already divided their community debts by agreement."

Finding 9: "Neither party is awarded spousal support."

Finding 10 (name change, if applicable):
"[Name]'s name is restored to [maidenName]."

Finding 11: "The parties have entered into this agreement freely,
voluntarily, and without coercion."

Order: "NOW THEREFORE, IT IS HEREBY ORDERED, ADJUDGED, AND DECREED:"
"1. The bonds of matrimony between [firstSpouseName] and
[secondSpouseName] are hereby dissolved on the grounds of
incompatibility."
"2. The agreements of the parties regarding community property
and community debt as set forth in the Joint Petition are
approved and incorporated herein."
"3. Neither party is awarded spousal support."
"4. Each party shall pay his/her own attorney fees and costs."

Signature block:
"DISTRICT JUDGE"
"Date: _____________"

Party acknowledgment signature blocks at bottom.

------------------------------------------------------------
AFFIDAVIT OF RESIDENT WITNESS
------------------------------------------------------------
Title: "AFFIDAVIT OF RESIDENT WITNESS"

Header block (witness info):
"[witnessName]"
"[witnessAddress]"
"[witnessCityStateZip]"
"Telephone: [witnessPhone]"
"E-mail: [witnessEmail]"

Body paragraphs:
Para 1: "I, [witnessName], being first duly sworn, depose and say:"

Para 2: "I am a resident of the State of Nevada and have resided
in Nevada for [witnessYearsInNV] years. I currently reside at
[witnessStreetCityState]."

Para 3: "I am personally acquainted with [residentSpouseName],
who resides at [residentSpouseAddress]."

Para 4: "I know of my own knowledge that [residentSpouseName]
has been a resident of the State of Nevada and has been
physically present and domiciled in Nevada since [residencySinceDate]."

Para 5: "I see [residentSpouseName] approximately
[witnessTimesPerWeek] times per week."

Para 6: "My relationship to [residentSpouseName] is:
[witnessRelationship]."

Para 7: "This affidavit is made in support of the Joint Petition
for Divorce filed by [residentSpouseName]."

Signature and notary block:
"Witness Signature: _________________________ Date: _______"
"SUBSCRIBED AND SWORN to before me this ___ day of ________, 20__."
"NOTARY PUBLIC"

------------------------------------------------------------
CIVIL (FAMILY/JUVENILE-RELATED) COVER SHEET
------------------------------------------------------------
Title: "CIVIL (FAMILY/JUVENILE-RELATED) COVER SHEET"
Reference: "Pursuant to NRS 3.275, Rev. P3.2"

Section I - Party Information:
"Plaintiff/Petitioner: [firstSpouseName], [firstSpouseAddress],
[firstSpouseCityStateZip]"
"D.O.B.: [firstSpouseDOB]"
"E-mail address: [firstSpouseEmail]"
"Attorney: Self-Represented"

"Defendant/Respondent/Co-petitioner: [secondSpouseName],
[secondSpouseAddress], [secondSpouseCityStateZip]"
"D.O.B.: [secondSpouseDOB]"
"E-mail address: [secondSpouseEmail]"
"Attorney: Self-Represented"

"Interpreter required: No" (pre-checked)

Section II - Nature of Controversy:
Pre-checked: "Joint Petition - Without Children"
Under "Marriage Dissolution Case" in "Domestic Relations
Case Filing Types"

Note at bottom: "For Clark and Washoe Counties, please use their
Family Court Cover Sheet for family-related case filings."

------------------------------------------------------------
FIELD FORMAT EXPECTATIONS
------------------------------------------------------------

PARTY NAMES:
- firstSpouseName / secondSpouseName -> Used as-is throughout all forms
- NV uses "Joint Petitioner" NOT "Plaintiff/Defendant"
- Names should be in English from official ID

ADDRESSES (split format):
- firstSpouseAddress = street address (e.g., "1234 Las Vegas Blvd S")
- firstSpouseCityStateZip = city, state, zip (e.g., "Las Vegas, NV 89109")
- Same pattern for secondSpouse and witness

COUNTY:
- county = just county name (e.g., "Clark"), NOT "Clark County"
- NV has 17 counties: Carson City, Churchill, Clark, Douglas, Elko,
  Esmeralda, Eureka, Humboldt, Lander, Lincoln, Lyon, Mineral,
  Nye, Pershing, Storey, Washoe, White Pine

DATES:
- marriageDate -> Written out (e.g., "January 15, 2010")
- residencySinceDate -> Date format (e.g., "January 1, 2025")

COMMUNITY PROPERTY/DEBT:
- communityPropertyOption -> "none" or "already_divided"
- communityDebtOption -> "none" or "already_divided"

NAME CHANGE:
- nameChange1 -> "none" or "restore"
- If "restore": nameChange1MarriedName + nameChange1MaidenName required
- Same for nameChange2

RESIDENT SPOUSE:
- residentSpouseName -> Which spouse meets 6-week NV residency
- Must match either firstSpouseName or secondSpouseName exactly

WITNESS (third party - NOT a spouse):
- witnessName, witnessAddress, witnessCityStateZip
- witnessPhone, witnessEmail
- witnessYearsInNV -> number of years (e.g., "15")
- witnessTimesPerWeek -> frequency (e.g., "3")
- witnessRelationship -> e.g., "friend", "coworker", "neighbor"
`;
