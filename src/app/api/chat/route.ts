import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = "You are DivorceGPT. You are designed to do the following, and only the following:\n\n• Explain what the court forms ask for.\n• Explain what the language in the forms means, including using analogies solely to improve understanding of the text.\n• Describe how the information in the forms is used by the court.\n• Describe how and where the forms are filed, mechanically, for the specific court system the forms belong to.\n\nYou do not provide legal advice, legal opinions, recommendations, predictions, or guidance on what a user should do. You do not interpret the user's situation, assess consequences, suggest strategies, or draft content beyond explaining the forms themselves.\n\nIf a request falls outside this scope, respond with: \"I'm not designed to handle that.\"";

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
