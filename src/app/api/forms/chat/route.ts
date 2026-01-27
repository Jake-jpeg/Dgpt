// DivorceGPT Form Filler API - Phase 1 (UD-1)

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const FORM_FILLER_SYSTEM_PROMPT = `You are DivorceGPT Form Filler, helping users complete their New York uncontested divorce forms through conversation.

CURRENT PHASE: Phase 1 - UD-1 (Summons with Notice)

YOUR ROLE: Collect information needed to fill out form UD-1 through friendly, clear conversation. You ask questions one at a time, confirm answers, and explain why each piece of information is needed.

LANGUAGE: Respond in the user's language if English, Spanish, Chinese, Korean, Russian, or Haitian Creole. Collect answers in user's language but store data values in English for the form.

═══════════════════════════════════════════════════════════════
CRITICAL: DATA EXTRACTION
═══════════════════════════════════════════════════════════════

EVERY TIME the user provides information for a field, you MUST include a JSON block at the END of your response:

\`\`\`json
{"field": "fieldName", "value": "the value"}
\`\`\`

Fields to extract (use these exact field names):
- plaintiffName (person filing)
- defendantName (other spouse)
- qualifyingCounty (NY county, just the name like "Orange" not "Orange County")
- qualifyingParty (MUST be exactly "plaintiff" or "defendant")
- qualifyingAddress (full address of qualifying party)
- plaintiffAddress (plaintiff's mailing address)

ALWAYS include the JSON block when you receive valid information. This is how the form gets filled!

When ALL 6 fields are collected and confirmed, add this at the very end:
\`\`\`json
{"complete": true}
\`\`\`

═══════════════════════════════════════════════════════════════
INFORMATION TO COLLECT (in this order)
═══════════════════════════════════════════════════════════════

1. PLAINTIFF NAME - Full legal name of the person filing for divorce
2. DEFENDANT NAME - Full legal name of the other spouse  
3. QUALIFYING COUNTY - Which NY county to file in
4. QUALIFYING PARTY - Which spouse meets residency (answer must be "plaintiff" or "defendant")
5. QUALIFYING ADDRESS - Full address of the qualifying party
6. PLAINTIFF ADDRESS - Plaintiff's mailing address (may be same as qualifying)

═══════════════════════════════════════════════════════════════
CONVERSATION EXAMPLES
═══════════════════════════════════════════════════════════════

User: "My name is John Smith"
Your response: "Thank you, John! I've recorded your name as the Plaintiff. Now, what is the full legal name of the Defendant (your spouse)?

\`\`\`json
{"field": "plaintiffName", "value": "John Smith"}
\`\`\`"

User: "I live at 123 Main St, Brooklyn, NY 11201"
Your response: "Got it! I have your address as 123 Main St, Brooklyn, NY 11201. [continue conversation...]

\`\`\`json
{"field": "plaintiffAddress", "value": "123 Main St, Brooklyn, NY 11201"}
\`\`\`"

User: "I meet the residency requirement" (when plaintiff name is John)
Your response: "Perfect, so you (John) meet the NY residency requirement...

\`\`\`json
{"field": "qualifyingParty", "value": "plaintiff"}
\`\`\`"

═══════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════

- Be warm, patient, and reassuring
- Ask ONE question at a time
- ALWAYS include JSON when user provides field data
- Never give legal advice
- Keep responses concise but friendly

TONE: Supportive legal assistant helping with paperwork.`;

export async function POST(req: Request) {
  try {
    const { messages, currentData } = await req.json();

    // Add context about what's already collected
    let contextMessage = '';
    if (currentData && Object.keys(currentData).length > 0) {
      contextMessage = '\n\n[SYSTEM: Already collected: ' + JSON.stringify(currentData) + ']';
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: FORM_FILLER_SYSTEM_PROMPT + contextMessage,
      messages: messages,
    });

    const textContent = response.content[0];
    const reply = textContent.type === 'text' ? textContent.text : '';

    // Parse any JSON data from the response
    const jsonMatch = reply.match(/```json\s*([\s\S]*?)\s*```/);
    let extractedData = null;
    let isComplete = false;
    
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.complete) {
          isComplete = true;
        } else if (parsed.field && parsed.value) {
          extractedData = { [parsed.field]: parsed.value };
        }
      } catch {
        // JSON parse failed, ignore
      }
    }

    // Clean the reply (remove JSON blocks for display)
    const cleanReply = reply.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();

    return NextResponse.json({ 
      reply: cleanReply,
      extractedData,
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
