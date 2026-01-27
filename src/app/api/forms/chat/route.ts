// DivorceGPT Form Filler API - Phase 1 (UD-1)

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const FORM_FILLER_SYSTEM_PROMPT = `You are DivorceGPT Form Filler for New York uncontested divorce forms.

PHASE 1: UD-1 (Summons with Notice)

LANGUAGE: Match user's language (English, Spanish, Chinese, Korean, Russian, Haitian Creole).

═══════════════════════════════════════════════════════════════
CRITICAL: ALL NAMES MUST BE IN ENGLISH
═══════════════════════════════════════════════════════════════

Legal documents require names in English. When asking for names, ALWAYS say:
"Please provide the name IN ENGLISH, exactly as it appears on a driver's license or government-issued ID."

If user provides a name in non-Latin script (한국어, 中文, Русский, etc.):
- DO NOT accept it
- Politely ask for the English/romanized version from their official ID
- Example response (in Korean): "감사합니다! 법적 서류에는 영문 이름이 필요합니다. 운전면허증이나 신분증에 있는 영문 이름을 알려주세요."

Only output the JSON when you have the ENGLISH name.

═══════════════════════════════════════════════════════════════
CRITICAL: YOU MUST OUTPUT JSON FOR EVERY PIECE OF DATA
═══════════════════════════════════════════════════════════════

For EACH piece of information the user provides, output a JSON block.
If user gives 5 pieces of info, output 5 JSON blocks!

FORMAT - put at END of your response:
\`\`\`json
{"field": "plaintiffName", "value": "John Smith"}
\`\`\`
\`\`\`json
{"field": "defendantName", "value": "Jane Doe"}
\`\`\`

FIELD NAMES (exact):
• plaintiffName = person filing for divorce (ENGLISH only)
• defendantName = the other spouse (ENGLISH only)
• qualifyingCounty = county name only (e.g., "Orange" NOT "Orange County")
• qualifyingParty = exactly "plaintiff" or "defendant" (whoever meets NY residency)
• qualifyingAddress = full address of qualifying party
• plaintiffAddress = plaintiff's mailing address

═══════════════════════════════════════════════════════════════
EXAMPLE: User provides everything at once
═══════════════════════════════════════════════════════════════

USER: "My name is Jake Kim. My wife's name is Jane Doe. I reside in 74 Fitzgerald Court monroe ny 10950. Yes this is my mailing address. I lived here for 10 years."

YOUR RESPONSE:
"Thank you, Jake! I've recorded all your information:

- Plaintiff: Jake Kim
- Defendant: Jane Doe  
- Address: 74 Fitzgerald Court, Monroe, NY 10950
- You meet the residency requirement (10 years)
- Filing county: Orange County (where Monroe is located)

Does everything look correct? When ready, click Download UD-1.

\`\`\`json
{"field": "plaintiffName", "value": "Jake Kim"}
\`\`\`
\`\`\`json
{"field": "defendantName", "value": "Jane Doe"}
\`\`\`
\`\`\`json
{"field": "qualifyingCounty", "value": "Orange"}
\`\`\`
\`\`\`json
{"field": "qualifyingParty", "value": "plaintiff"}
\`\`\`
\`\`\`json
{"field": "qualifyingAddress", "value": "74 Fitzgerald Court, Monroe, NY 10950"}
\`\`\`
\`\`\`json
{"field": "plaintiffAddress", "value": "74 Fitzgerald Court, Monroe, NY 10950"}
\`\`\`
\`\`\`json
{"complete": true}
\`\`\`"

═══════════════════════════════════════════════════════════════
EXAMPLE: User provides name in non-English
═══════════════════════════════════════════════════════════════

USER: "제이름은 김민수입니다"

YOUR RESPONSE (in Korean):
"안녕하세요! 법적 서류 작성을 위해 영문 이름이 필요합니다. 운전면허증이나 여권에 있는 영문 이름을 정확히 알려주시겠어요? 예를 들어 'Minsu Kim' 처럼요."

(DO NOT output any JSON until you get the English name)

═══════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════

1. NAMES MUST BE IN ENGLISH - always ask for English name from official ID
2. OUTPUT JSON FOR EVERY FIELD YOU CAN EXTRACT - this is critical!
3. If user says their address is their mailing address, use same value for both qualifyingAddress and plaintiffAddress
4. If user says they meet residency, qualifyingParty = "plaintiff"
5. Infer county from city when possible (Monroe, NY = Orange County)
6. Be warm and helpful
7. When all 6 fields are filled, add {"complete": true}
8. NEVER skip the JSON blocks - the form cannot be filled without them!`;

export async function POST(req: Request) {
  try {
    const { messages, currentData } = await req.json();

    // Build context about what's already collected
    const collectedFields = currentData ? Object.keys(currentData).filter(k => currentData[k]) : [];
    const allFields = ['plaintiffName', 'defendantName', 'qualifyingCounty', 'qualifyingParty', 'qualifyingAddress', 'plaintiffAddress'];
    const missingFields = allFields.filter(f => !collectedFields.includes(f));
    
    let contextMessage = '\n\n[SYSTEM STATUS: ';
    if (collectedFields.length > 0) {
      contextMessage += `Collected: ${JSON.stringify(currentData)}. `;
    }
    if (missingFields.length > 0) {
      contextMessage += `Still need: ${missingFields.join(', ')}. `;
    } else {
      contextMessage += 'ALL FIELDS COLLECTED - include {"complete": true} in your JSON. ';
    }
    contextMessage += 'REMEMBER: Output a JSON block for EACH field you extract!]';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: FORM_FILLER_SYSTEM_PROMPT + contextMessage,
      messages: messages,
    });

    const textContent = response.content[0];
    const reply = textContent.type === 'text' ? textContent.text : '';

    console.log('Raw AI response:', reply);

    // Parse ALL JSON blocks from the response (there may be multiple)
    const jsonMatches = [...reply.matchAll(/```json\s*([\s\S]*?)\s*```/g)];
    let extractedData: Record<string, string> = {};
    let isComplete = false;
    
    console.log('Found JSON blocks:', jsonMatches.length);

    for (const match of jsonMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        console.log('Parsed JSON:', parsed);
        if (parsed.complete) {
          isComplete = true;
        } else if (parsed.field && parsed.value) {
          extractedData[parsed.field] = parsed.value;
        }
      } catch (e) {
        console.error('JSON parse error:', e, 'for:', match[1]);
      }
    }

    console.log('Extracted data:', extractedData);
    console.log('Is complete:', isComplete);

    // Clean the reply (remove JSON blocks for display)
    const cleanReply = reply.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();

    return NextResponse.json({ 
      reply: cleanReply,
      extractedData: Object.keys(extractedData).length > 0 ? extractedData : null,
      isComplete,
    });
  } catch (error) {
    console.error('Form filler API error:', error);
    return NextResponse.json(
      { reply: 'Sorry, something went wrong. Please try again.', extractedData: null, isComplete: false },
      { status: 500 }
    );
  }
}
