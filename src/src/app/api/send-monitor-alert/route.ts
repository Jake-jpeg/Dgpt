// /api/send-monitor-alert/route.ts
// Sends state law monitor alerts to admin@divorcegpt.com via Resend
// Called by the /api/monitor route when changes are detected

import { NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'DivorceGPT <noreply@divorcegpt.com>';

export async function POST(req: Request) {
  try {
    const { to, subject, body } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured — logging alert to console');
      console.log(`[MONITOR ALERT] To: ${to}\nSubject: ${subject}\n\n${body}`);
      return NextResponse.json({ error: 'Email service not configured', logged: true }, { status: 500 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        text: body,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Monitor alert email error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
