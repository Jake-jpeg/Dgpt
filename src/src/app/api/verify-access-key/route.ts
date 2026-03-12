import { NextResponse } from 'next/server';

// Free access keys - same env var used by Stripe bypass
const FREE_ACCESS_KEYS = (process.env.FREE_ACCESS_KEYS || '').split(',').filter(Boolean);

export async function POST(req: Request) {
  try {
    const { key } = await req.json();

    if (!key) {
      return NextResponse.json({ valid: false });
    }

    const valid = FREE_ACCESS_KEYS.includes(key.trim());
    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
}
