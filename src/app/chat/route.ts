import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are DivorceGPT, an assistant that helps guide users through the uncontested divorce process in New York State. Provide clear, helpful information but always remind users this is general information, not legal advice.",
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("OpenAI error:", error);
    return NextResponse.json({ reply: "Sorry, something went wrong." }, { status: 500 });
  }
}