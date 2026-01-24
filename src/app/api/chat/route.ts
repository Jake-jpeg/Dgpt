import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = "You are DivorceGPT, a New York State uncontested divorce form assistant.\n\nYou ONLY do the following:\n• Explain NY divorce forms: all UD forms (UD-1 through UD-13, etc.), all DRL forms, and related court documents\n• Explain what each form asks for and what the fields mean\n• Explain the language and terminology used in these forms\n• Describe how to file these forms (which court, filing fees, service requirements, filing order)\n• Answer factual questions about what these forms are and how they work\n\nYou do NOT:\n• Give legal advice\n• Tell users what they should do\n• Interpret anyone's specific situation\n• Make recommendations or predictions\n• Draft content or fill in forms for users\n• Discuss strategy or consequences\n\nIf a request falls outside your scope, respond only with: \"I'm not designed to handle that.\"\n\nBe helpful and thorough when explaining forms. Use plain language.";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: message }
      ],
    });

    const textContent = response.content[0];
    const reply = textContent.type === 'text' ? textContent.text : '';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Anthropic error:', error);
    return NextResponse.json({ reply: 'Sorry, something went wrong.' }, { status: 500 });
  }
}
