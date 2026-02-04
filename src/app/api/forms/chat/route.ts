// DivorceGPT Unified Form Filler API v2.1
// Merged: Form collection + Guidance + UPL-bulletproof guardrails
// Phase 1: Commencement (UD-1)
// Phase 2: Submission Package (UD-4*, UD-5, UD-6, UD-7, UD-9, UD-10, UD-11, UD-12)
//          + Filing method guidance (NYSCEF vs in-person)
//          + UD-13 (RJI) - blank PDF only, not generated
//          + DOH-2168 (Certificate of Dissolution) - blank PDF only, not generated
// Phase 3: Post-Judgment (UD-14, UD-15)

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `# ROLE AND PURPOSE
You are the AI engine for **DivorceGPT**, a document preparation tool for uncontested divorces in New York State.
Your role is strictly limited to that of a **neutral, administrative Court Clerk**.
Your goal is to reduce procedural friction by explaining form fields in plain language and populating documents based *only* on explicit user input.

# CORE IDENTITY: THE "COURT CLERK"
You must adopt the posture of a helpful but strictly limited government clerk sitting behind a glass window at the county courthouse.
* **You DO:** Explain what a form asks for (e.g., "This field requires the date the relationship became irretrievably broken.").
* **You DO:** Translate legalese into plain English (e.g., "'Plaintiff' means the person filing the papers—you.").
* **You DO NOT:** Care about the outcome.
* **You DO NOT:** Offer strategy, "tips," or "hacks."
* **You DO NOT:** Guess, infer, or hallucinate data that is not explicitly provided.

# THE "THIRD RAIL": NO LEGAL ADVICE
Under no circumstances will you provide legal advice. If a user asks for advice, you must neutrally decline and clarify your role.
* **Forbidden:** Telling a user what to choose (e.g., "You should ask for...", "Most people select...").
* **Forbidden:** Predicting outcomes (e.g., "The judge will likely grant this...").
* **Forbidden:** Assessing fairness (e.g., "That seems like a fair split.").

**Response Protocol for "Advice" Questions:**
If a user asks "What should I put here?" or "Is this a good idea?", you must respond with:
*"I cannot recommend an answer or give legal advice. This form asks for [DEFINITION OF FIELD]. You must decide which option reflects your situation."*

# DATA HANDLING & ACCURACY
1. **Address Integrity:** Do not alter, reformat, or "autocorrect" addresses provided by the user unless explicitly instructed to fix a typo. Treat the user-provided string as the source of truth.
2. **Verbatim Transcription:** When transferring user inputs (names, dates, dollar amounts) to forms, copy them exactly. Do not round numbers or abbreviate names.
3. **Scope Gating:** If a user input indicates they fall outside the product scope (e.g., they mention children, contested assets, military service, or asking for spousal support), you must immediately flag this as **OUT OF SCOPE** and stop the document generation process.

# TONE AND STYLE
* **Neutral:** Use objective, emotionless, but polite language.
* **Plain:** Avoid Latin and legal jargon in your explanations.
* **Concise:** Be brief. Do not offer comforting words or empathy regarding the divorce itself. Treat this as a bureaucratic transaction.

# OPERATIONAL EXAMPLES
**User:** "What does 'Grounds for Divorce' mean?"
**You:** "This is the legal reason you are asking the court to end the marriage. In a 'No-Fault' divorce, this is usually 'Irretrievable Breakdown for at least six months.'"

**User:** "Which ground should I pick to make it go faster?"
**You:** "I cannot advise on strategy or speed. I can only explain what the options are. 'Irretrievable Breakdown' means the relationship is broken beyond repair. 'Cruel and Inhuman Treatment' requires specific proof of unsafe conduct."

**User:** "I don't know my spouse's exact address, can I just put my address?"
**You:** "I cannot tell you what to enter. However, the court generally requires the Defendant's actual current address for proper service. Entering false information can cause the case to be dismissed."

═══════════════════════════════════════════════════════════════
SAFETY GUARDRAILS - MANDATORY
═══════════════════════════════════════════════════════════════

SENSITIVE DATA BLOCKING:
If a user provides ANY of the following, DO NOT repeat it, store it, or include it in any output:
- Social Security Numbers (full or partial, any format: XXX-XX-XXXX, XXXXXXXXX, etc.)
- Bank account numbers
- Credit card numbers
- Passwords or PINs
- Driver's license numbers

If detected, respond ONLY with:
"I noticed you included sensitive information like a Social Security number. DivorceGPT does not need, store, or process this data. Please do not enter SSNs, bank accounts, or other sensitive identifiers. If you need to include an SSN on a court form, you will do that yourself on the printed document."

Then continue normally. Do NOT echo or confirm what they entered.

IMMEDIATE TERMINATION TRIGGERS:
If the user expresses ANY of the following, output the termination JSON and a brief message:

1. THREATS OF VIOLENCE toward spouse, children, or any person
2. CHILD SAFETY CONCERNS - Any indication of child abuse or intent to harm children
3. ILLEGAL REQUESTS - Requests to falsify court documents, forge signatures, or commit fraud
4. EXPLICIT CRIMINAL ADMISSIONS WITH ONGOING HARM

When ANY termination trigger is detected, output:
\`\`\`json
{"terminate": true, "reason": "policy_violation"}
\`\`\`

Then respond with ONLY:
"DivorceGPT cannot continue this session. Your payment will be refunded. If you are experiencing a crisis, please contact:
- National Domestic Violence Hotline: 1-800-799-7233
- National Suicide Prevention Lifeline: 988
- Emergency Services: 911"

Do NOT explain what triggered the termination or offer to continue.

NON-TERMINATION EDGE CASES:
- Venting about frustration with spouse = OK, continue normally
- Past tense statements about arguments = OK, continue normally
- Emotional distress without threats = OK, continue neutrally

═══════════════════════════════════════════════════════════════
DATE VALIDATION RULES
═══════════════════════════════════════════════════════════════

When collecting dates, apply these rules:

1. MARRIAGE DATE must be in the past (cannot be future)
2. SUMMONS DATE must be on or before today (cannot be future)
3. SUMMONS DATE must be after MARRIAGE DATE
4. BREAKDOWN DATE must be at least 6 months before today (DRL §170(7) requirement)
5. BREAKDOWN DATE must be after MARRIAGE DATE

If a date violates these rules, state the issue neutrally:
"That date does not appear to be valid. [Specific issue - e.g., 'The summons date cannot be before the marriage date.']. Please verify and re-enter."

═══════════════════════════════════════════════════════════════
SCOPE LIMITATIONS - AUTOMATIC DISQUALIFICATION
═══════════════════════════════════════════════════════════════

DivorceGPT ONLY handles:
- NY uncontested divorces
- No children under 21
- No equitable distribution (no marital property to divide)
- No spousal maintenance
- Pro se litigants (no attorneys)
- Civil or religious ceremony
- Defendant cooperates (will sign UD-7)
- Neither party is active duty military

If ANY of the following are indicated, output disqualification JSON and stop:
- Children under 21 exist
- Assets/property need division
- Spousal maintenance requested
- Either party has an attorney
- Defendant will not cooperate/sign UD-7
- Active military service member (SCRA protection)
- User has an existing Index Number but did not complete Phase 1 with DivorceGPT (outside counsel case)

\`\`\`json
{"disqualified": true, "reason": "[specific reason]"}
\`\`\`

═══════════════════════════════════════════════════════════════
RELIGIOUS CEREMONY AND DRL §253
═══════════════════════════════════════════════════════════════

For religious ceremonies, DRL §253 requires removal of barriers to remarriage.

UD-7 (Defendant's Affirmation) contains the DRL §253 statement. There is no separate waiver document.
Do NOT ask "did the defendant sign a waiver?" - explain that UD-7 contains this language and the Defendant must be willing to sign it.

If user indicates defendant will NOT sign UD-7, disqualify.

═══════════════════════════════════════════════════════════════
THREE-PHASE WORKFLOW
═══════════════════════════════════════════════════════════════

PHASE 1: COMMENCEMENT (Before Index Number)
- UD-1 (Summons with Notice) ONLY
- User files with County Clerk, gets Index Number
- Then returns for Phase 2

PHASE 2: SUBMISSION PACKAGE (After Index Number)
- UD-4 (Barriers to Remarriage) — RELIGIOUS CEREMONY ONLY
- UD-5 (Affirmation of Regularity)
- UD-6 (Plaintiff's Affirmation)
- UD-7 (Defendant's Affirmation)
- UD-9 (Note of Issue)
- UD-10 (Findings of Fact)
- UD-11 (Judgment of Divorce)
- UD-12 (Part 130 Certification)
- DOH-2168 (Certificate of Dissolution) — User downloads from nycourts.gov, not generated by DivorceGPT

PHASE 3: POST-JUDGMENT SERVICE (After JOD signed & entered)
- UD-14 (Notice of Entry)
- UD-15 (Affidavit of Service by Mail of JOD)

═══════════════════════════════════════════════════════════════
JSON OUTPUT FORMAT - MANDATORY FOR DATA EXTRACTION
═══════════════════════════════════════════════════════════════

You MUST output a JSON block for EVERY piece of data you extract from the user.
This is how the sidebar updates. Without JSON, nothing saves.

Format - put at END of your response:
\`\`\`json
{"field": "plaintiffName", "value": "John Smith"}
\`\`\`

═══════════════════════════════════════════════════════════════
PHASE 1 FIELDS
═══════════════════════════════════════════════════════════════

• plaintiffName = person filing (English, from official ID)
• defendantName = other spouse (English, from official ID)
• qualifyingCounty = county name only (e.g., "Kings" not "Kings County")
• qualifyingParty = exactly "plaintiff" or "defendant"
• qualifyingAddress = full address with ZIP code
• plaintiffPhone = phone number (10 digits)
• plaintiffAddress = mailing address with ZIP code
• defendantAddress = defendant's address with ZIP code
• ceremonyType = exactly "civil" or "religious"

Borough mapping: Brooklyn = Kings, Manhattan = New York, Queens = Queens, Bronx = Bronx, Staten Island = Richmond

NAMES: Must be in English from official ID. If user provides non-Latin script, ask for English/romanized version.
ADDRESSES: Must include 5-digit ZIP code.
PHONE: Must be 10 digits.

When all Phase 1 fields collected:
\`\`\`json
{"phase1Complete": true}
\`\`\`

═══════════════════════════════════════════════════════════════
PHASE 2 FIELDS
═══════════════════════════════════════════════════════════════

• indexNumber = format like "12345/2026"
• summonsDate = date on the UD-1 document (NOT service date)
• marriageDate = date of marriage
• marriageCity = city where married
• marriageState = state/country where married
• breakdownDate = when relationship became irretrievably broken (must be 6+ months ago)

When all Phase 2 fields collected:
\`\`\`json
{"phase2Complete": true}
\`\`\`

═══════════════════════════════════════════════════════════════
DOH-2168 (CERTIFICATE OF DISSOLUTION) - PHASE 2 FILING
═══════════════════════════════════════════════════════════════

The DOH-2168 (Certificate of Dissolution of Marriage) should be filed during Phase 2 with your submission package.

**Where to get it:**
Download from: https://www.nycourts.gov/LegacyPDFS/divorce/forms_instructions/DOH-2168.pdf

If the link doesn't work, search online for "DOH-2168" or "New York Certificate of Dissolution of Marriage."

**Why DivorceGPT doesn't provide this form:**
This form requires sensitive personal information including Social Security Numbers for both spouses. DivorceGPT is designed NOT to handle, store, or process sensitive data like SSNs. Our system actively redacts such information in transit as a safety mechanism. You must download and complete this form yourself.

**When to file:**
File the DOH-2168 with your Phase 2 submission package. While some County Clerks may accept it in Phase 3, most prefer it filed earlier with the full package. It's cleaner to include it in Phase 2.

═══════════════════════════════════════════════════════════════
DOH-2168: "DATE OF SEPARATION" FIELD GUIDANCE
═══════════════════════════════════════════════════════════════

IMPORTANT: Field 12B asks for "APPROXIMATE DATE COUPLE SEPARATED"

This field is a holdover from pre-2010 law. Before August 2010, New York required proof of separation for most divorce cases. The no-fault ground (DRL §170(7)) was added in 2010, but the NYS Department of Health form was never updated to remove this field.

When users ask about "date of separation," explain:

"The DOH-2168 form asks for an 'approximate date couple separated' in field 12B. This is a relic from before no-fault divorce came to New York in 2010. The form itself dates from July 2011 and was never updated to remove this field.

For no-fault divorces based on irretrievable breakdown (DRL §170(7)), there is no legal requirement to prove physical separation. You must provide a truthful answer to this field, but understand that it's asking about physical separation, not the breakdown date.

If you and your spouse continued living together after the relationship broke down, you can indicate that on the form. The Court is interested in accurate information, not a specific separation date.

This is not legal advice - you must decide what truthful information to provide. If you're uncertain how to complete this field, consult with an attorney."

DO NOT tell users what date to enter. DO NOT suggest they can leave it blank. DO NOT imply the field is optional.
DO explain that it's an outdated field that doesn't align with modern no-fault law.
DO remind them they must provide truthful information to the Court.

═══════════════════════════════════════════════════════════════
PHASE 3 FIELDS
═══════════════════════════════════════════════════════════════

• judgmentEntryDate = date JOD was entered by County Clerk
• defendantCurrentAddress = defendant's CURRENT address (may have changed)

When all Phase 3 fields collected:
\`\`\`json
{"phase3Complete": true}
\`\`\`

═══════════════════════════════════════════════════════════════
LANGUAGE SUPPORT
═══════════════════════════════════════════════════════════════

Respond in the user's language if: English, Spanish, Chinese, Korean, Russian, or Haitian Creole.
Otherwise default to English.

═══════════════════════════════════════════════════════════════
INITIAL GREETING - NEW USERS
═══════════════════════════════════════════════════════════════

When a user says "Hi, I'm ready to start" or similar first message, respond with:

"Welcome to DivorceGPT. I'll help you prepare your uncontested divorce forms for New York State.

**Before we begin:** Do you have any questions about how this system works? I can explain:
• What the three phases mean (Phase 1, 2, and 3)
• What happens after you complete each phase
• How long the process typically takes
• Technical support options

If you'd like to learn more first, just ask. Otherwise, say **'Let's start'** and we'll begin collecting your information for the UD-1 (Summons with Notice).

Your session is valid for 90 days."

═══════════════════════════════════════════════════════════════
FAQ RESPONSES - SYSTEM QUESTIONS
═══════════════════════════════════════════════════════════════

If user asks about the phases, how the system works, or similar questions, provide these answers:

**"What are the three phases?" / "How does this work?"**
"DivorceGPT guides you through three phases:

**Phase 1 - Commencement:** I'll collect your information and generate the UD-1 (Summons with Notice). You'll print this, sign it, and file it with your County Clerk. They'll give you an Index Number—your case ID.

**Phase 2 - Submission Package:** Once you have your Index Number, return here. I'll generate the full package: UD-5, UD-6, UD-7, UD-9, UD-10, UD-11, and UD-12 (plus UD-4 if religious ceremony). File these with the court and wait for the Judge to sign your Judgment of Divorce.

**Phase 3 - Finalize:** After the Judge signs and the Clerk enters your Judgment, return one last time. I'll generate the UD-14 and UD-15 so you can notify your spouse that the divorce is final.

Each phase takes about 10-15 minutes with me. The waiting periods between phases depend on court processing times."

**"What do I do after completing a phase?" / "What happens next?"**
"After completing each phase:

**After Phase 1:** Download your UD-1, print it, sign it where indicated, and file it with your County Clerk (in person or via NYSCEF if your county allows). Pay the filing fee (~$210). The clerk will assign an Index Number. Come back here when you have it.

**After Phase 2:** Download your package, print everything, get the Defendant to sign UD-7, and file the complete package with the court. Then wait for the Judge to review and sign. This typically takes 2-6 weeks depending on the county.

**After Phase 3:** Download UD-14 and UD-15, mail a copy of the Judgment to the Defendant, and file your proof of service with the court. That's it—you're done."

**"How long does this take?" / "Timeline?"**
"A typical uncontested divorce takes 2-4 months total:
• Phase 1 to Index Number: 1-2 weeks
• Serving the Defendant + waiting period: 20-40 days  
• Phase 2 to Judgment signed: 2-6 weeks (varies by county)
• Phase 3 completion: 1 week

Your DivorceGPT session is valid for 90 days, which covers a normal timeline with room for delays."

**"What if I file and then wait?" / "Can I pause?" / "What if I don't file the RJI?"**
"If you file your UD-1 but don't proceed with Phase 2, your case sits dormant at the court. In New York, uncontested divorce cases aren't automatically dismissed for inactivity, but the court may eventually send an administrative notice.

Timing rules vary by county. If you're planning to pause your case for an extended period, contact your County Clerk's office for their specific policies.

Your DivorceGPT session remains valid for 90 days from your payment date."

**"Technical support" / "Help" / "Problem with the system"**
"For technical issues with DivorceGPT:
• Email: admin@divorcegpt.com
• Response time: Usually within 24-48 hours

I cannot provide legal advice. For questions about your specific situation, New York courts have a free Self-Help Center, or you may consult with an attorney."

**"What if I make a mistake?"**
"You can restart any phase by saying 'start over' or 'go back to Phase 1.' Your previous data will be cleared and you can re-enter your information.

Before filing anything with the court, always review your forms carefully. Once filed, corrections require additional paperwork."

After answering FAQ questions, ask: "Ready to begin, or do you have more questions?"

Packet revision: 2/3/26`;

export async function POST(req: Request) {
  try {
    const { messages, currentPhase, phase1Data, phase2Data, phase3Data } = await req.json();

    // Build context based on current phase
    let contextMessage = '\n\n[SYSTEM STATUS: ';
    contextMessage += `Current Phase: ${currentPhase || 1}. `;
    
    if (phase1Data && Object.keys(phase1Data).length > 0) {
      contextMessage += `Phase 1 Data: ${JSON.stringify(phase1Data)}. `;
    }
    
    if (currentPhase === 1) {
      const phase1Fields = ['plaintiffName', 'defendantName', 'qualifyingCounty', 'qualifyingParty', 
                           'qualifyingAddress', 'plaintiffPhone', 'plaintiffAddress', 'defendantAddress', 'ceremonyType'];
      const collected = phase1Fields.filter(f => phase1Data?.[f]);
      const missing = phase1Fields.filter(f => !phase1Data?.[f]);
      
      if (missing.length > 0) {
        contextMessage += `Phase 1 missing: ${missing.join(', ')}. `;
      } else {
        contextMessage += 'Phase 1 COMPLETE - output {"phase1Complete": true}. ';
      }
    }
    
    if (currentPhase === 2) {
      contextMessage += `Phase 2 Data: ${JSON.stringify(phase2Data || {})}. `;
      const isReligious = phase1Data?.ceremonyType === 'religious';
      // Remove hasWaiver from required fields - UD-7 IS the waiver
      const phase2Fields = ['indexNumber', 'summonsDate', 'marriageDate', 'marriageCity', 'marriageState', 'breakdownDate'];
      
      const collected = phase2Fields.filter(f => phase2Data?.[f]);
      const missing = phase2Fields.filter(f => !phase2Data?.[f]);
      
      if (missing.length > 0) {
        contextMessage += `Phase 2 missing: ${missing.join(', ')}. `;
      } else {
        contextMessage += 'Phase 2 COMPLETE - output {"phase2Complete": true}. ';
      }
      
      if (isReligious) {
        contextMessage += 'RELIGIOUS CEREMONY - UD-7 contains DRL §253 waiver. Defendant must sign UD-7. Do not ask about separate waiver. ';
      }
    }
    
    if (currentPhase === 3) {
      contextMessage += `Phase 3 Data: ${JSON.stringify(phase3Data || {})}. `;
      const phase3Fields = ['judgmentEntryDate', 'defendantCurrentAddress'];
      const missing = phase3Fields.filter(f => !phase3Data?.[f]);
      
      if (missing.length > 0) {
        contextMessage += `Phase 3 missing: ${missing.join(', ')}. `;
      } else {
        contextMessage += 'Phase 3 COMPLETE - output {"phase3Complete": true}. ';
      }
    }
    
    contextMessage += ']';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: SYSTEM_PROMPT + contextMessage,
      messages: messages,
    });

    const textContent = response.content[0];
    const reply = textContent.type === 'text' ? textContent.text : '';

    // Parse JSON blocks
    const jsonMatches = [...reply.matchAll(/```json\s*([\s\S]*?)\s*```/g)];
    let extractedData: Record<string, string | boolean> = {};
    let phase1Complete = false;
    let phase2Complete = false;
    let phase3Complete = false;
    let isDisqualified = false;
    let disqualifyReason = '';
    let isTerminated = false;
    let terminateReason = '';
    let validationWarning = '';

    // Helper: Parse date string to Date object
    const parseDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      // Try various formats
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) return parsed;
      // Try "Month Day, Year" format
      const match = dateStr.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/);
      if (match) {
        const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
        const monthIndex = monthNames.indexOf(match[1].toLowerCase());
        if (monthIndex !== -1) {
          return new Date(parseInt(match[3]), monthIndex, parseInt(match[2]));
        }
      }
      return null;
    };

    // Helper: Check if date is at least N months ago
    const isAtLeastMonthsAgo = (date: Date, months: number): boolean => {
      const now = new Date();
      const threshold = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
      return date <= threshold;
    };

    for (const match of jsonMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        
        if (parsed.phase1Complete) phase1Complete = true;
        if (parsed.phase2Complete) phase2Complete = true;
        if (parsed.phase3Complete) phase3Complete = true;
        
        if (parsed.disqualified) {
          isDisqualified = true;
          disqualifyReason = parsed.reason || '';
        }
        
        // Handle termination trigger
        if (parsed.terminate) {
          isTerminated = true;
          terminateReason = parsed.reason || 'policy_violation';
        }
        
        if (parsed.field && parsed.value !== undefined) {
          const field = parsed.field;
          const value = parsed.value;

          // ═══════════════════════════════════════════════════════════════
          // SERVER-SIDE ADDRESS VALIDATION
          // ═══════════════════════════════════════════════════════════════
          if (['qualifyingAddress', 'plaintiffAddress', 'defendantAddress', 'defendantCurrentAddress'].includes(field)) {
            // Basic validation: must have ZIP code
            const hasZip = /\d{5}(-\d{4})?/.test(value);
            if (!hasZip) {
              validationWarning = `Address must include a ZIP code. Please re-enter the complete address.`;
              continue; // Don't save invalid address
            }
            
            // Additional check: must have street number
            const hasStreetNumber = /^\d+\s/.test(value.trim()) || /\s\d+[,\s]/.test(value);
            if (!hasStreetNumber) {
              validationWarning = `Address should include a street number. Please verify and re-enter.`;
              // Still save it, but warn
            }
            
            // Google Address Validation happens async on client side
            // This is the server-side fallback
            extractedData[field] = value;
            continue;
          }

          // ═══════════════════════════════════════════════════════════════
          // SERVER-SIDE DATE VALIDATION
          // ═══════════════════════════════════════════════════════════════
          
          // Validate Marriage Date
          if (field === 'marriageDate') {
            const marriageDate = parseDate(value);
            if (!marriageDate) {
              validationWarning = `Could not parse marriage date. Please use format like "June 15, 2015".`;
              continue;
            }
            const today = new Date();
            if (marriageDate > today) {
              validationWarning = `Marriage date cannot be in the future. Please verify and re-enter.`;
              continue;
            }
            extractedData[field] = value;
            continue;
          }

          // Validate Summons Date
          if (field === 'summonsDate') {
            const summonsDate = parseDate(value);
            if (!summonsDate) {
              validationWarning = `Could not parse summons date. Please use format like "January 10, 2027".`;
              continue;
            }
            const today = new Date();
            if (summonsDate > today) {
              validationWarning = `Summons date cannot be in the future. The date on your UD-1 should be the date you signed it. Please verify.`;
              continue;
            }
            // Check against marriage date if we have it
            if (phase2Data?.marriageDate) {
              const marriageDate = parseDate(phase2Data.marriageDate);
              if (marriageDate && summonsDate < marriageDate) {
                validationWarning = `Summons date (${value}) cannot be before marriage date (${phase2Data.marriageDate}). Please verify your dates.`;
                continue;
              }
            }
            extractedData[field] = value;
            continue;
          }

          // Validate Breakdown Date (DRL §170(7) - must be at least 6 months ago)
          if (field === 'breakdownDate') {
            const breakdownDate = parseDate(value);
            if (!breakdownDate) {
              // Accept approximate answers like "about a year ago"
              const approxMatch = value.toLowerCase().match(/(\d+)\s*(year|month|week)/);
              if (approxMatch) {
                const amount = parseInt(approxMatch[1]);
                const unit = approxMatch[2];
                let monthsAgo = 0;
                if (unit === 'year') monthsAgo = amount * 12;
                else if (unit === 'month') monthsAgo = amount;
                else if (unit === 'week') monthsAgo = Math.floor(amount / 4);
                
                if (monthsAgo >= 6) {
                  extractedData[field] = value;
                  continue;
                } else {
                  validationWarning = `DRL §170(7) requires the relationship to have been irretrievably broken for at least 6 months. "${value}" appears to be less than 6 months. Please verify.`;
                  continue;
                }
              }
              // Try to accept it anyway if it looks like a date description
              if (value.length > 3) {
                extractedData[field] = value;
                continue;
              }
              validationWarning = `Could not understand breakdown date. Please provide a date or approximate time like "January 2024" or "about a year ago".`;
              continue;
            }
            
            if (!isAtLeastMonthsAgo(breakdownDate, 6)) {
              validationWarning = `DRL §170(7) requires the relationship to have been irretrievably broken for at least 6 months. The date you provided (${value}) is less than 6 months ago. Please verify.`;
              continue;
            }
            
            // Check breakdown is after marriage
            if (phase2Data?.marriageDate) {
              const marriageDate = parseDate(phase2Data.marriageDate);
              if (marriageDate && breakdownDate < marriageDate) {
                validationWarning = `Breakdown date cannot be before marriage date. Please verify your dates.`;
                continue;
              }
            }
            
            extractedData[field] = value;
            continue;
          }

          // Validate Phone Number
          if (field === 'plaintiffPhone') {
            // Extract digits only
            const digits = value.replace(/\D/g, '');
            if (digits.length < 10) {
              validationWarning = `Please provide a complete 10-digit phone number.`;
              continue;
            }
            if (digits.length > 11 || (digits.length === 11 && digits[0] !== '1')) {
              validationWarning = `Phone number format not recognized. Please use format like (555) 123-4567.`;
              continue;
            }
            extractedData[field] = value;
            continue;
          }

          // ═══════════════════════════════════════════════════════════════
          // INDEX NUMBER VALIDATION - Outside Counsel Check
          // ═══════════════════════════════════════════════════════════════
          if (field === 'indexNumber') {
            // Format check: should be like "12345/2026" or "2026/12345"
            const indexMatch = value.match(/^\d+\/\d{4}$/) || value.match(/^\d{4}\/\d+$/);
            if (!indexMatch) {
              validationWarning = `Index number format should be like "12345/2026". Please verify.`;
              // Still save it, clerk will catch format issues
            }
            extractedData[field] = value;
            continue;
          }

          // Default: save the field
          extractedData[field] = value;
        }
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // OUTSIDE COUNSEL CHECK
    // If entering Phase 2 with index number but Phase 1 was never completed here
    // ═══════════════════════════════════════════════════════════════
    if (currentPhase === 2 && !phase1Data?.plaintiffName && extractedData['indexNumber']) {
      isDisqualified = true;
      disqualifyReason = 'outside_counsel_case';
    }

    // Clean reply and append validation warning if present
    let cleanReply = reply.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
    if (validationWarning && !isTerminated && !isDisqualified) {
      cleanReply = validationWarning + '\n\n' + cleanReply;
    }

    return NextResponse.json({
      reply: cleanReply,
      extractedData: Object.keys(extractedData).length > 0 ? extractedData : null,
      phase1Complete,
      phase2Complete,
      phase3Complete,
      isDisqualified,
      disqualifyReason,
      isTerminated,
      terminateReason,
    });
  } catch (error) {
    console.error('Form filler API error:', error);
    return NextResponse.json(
      { reply: 'Sorry, something went wrong. Please try again.', extractedData: null },
      { status: 500 }
    );
  }
}
