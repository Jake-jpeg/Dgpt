// /api/send-session-email/route.ts
// Sends the session access link to the customer via Resend
// Called once on first visit after payment

import { NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'DivorceGPT <noreply@divorcegpt.com>';

export async function POST(req: Request) {
  try {
    const { email, sessionUrl } = await req.json();

    if (!email || !sessionUrl) {
      return NextResponse.json(
        { error: 'Missing email or sessionUrl' },
        { status: 400 }
      );
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: 'Your DivorceGPT Session Link — Save This Email',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#1a365d; padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:20px; font-weight:700; color:#ffffff;">⚖️ DivorceGPT</span>
                    <br>
                    <span style="font-size:13px; color:#94a3b8;">by June Guided Solutions, LLC</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px 0; font-size:22px; font-weight:700; color:#18181b;">
                Your Session is Ready
              </h1>
              <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#3f3f46;">
                Thank you for your purchase. Your DivorceGPT session is now active.
              </p>

              <!-- Alert Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:16px;">
                    <p style="margin:0; font-size:14px; font-weight:600; color:#92400e;">
                      ⚠️ IMPORTANT — Save this email
                    </p>
                    <p style="margin:8px 0 0 0; font-size:13px; line-height:1.5; color:#92400e;">
                      The link below is the <u>only way</u> to access your session. There are no accounts or passwords. Bookmark it and keep this email.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${sessionUrl}" style="display:inline-block; background-color:#1a365d; color:#ffffff; font-size:16px; font-weight:600; text-decoration:none; padding:14px 32px; border-radius:9999px;">
                      Open Your Session →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link fallback -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:#f4f4f5; border-radius:8px; padding:12px 16px;">
                    <p style="margin:0 0 4px 0; font-size:12px; color:#71717a;">If the button doesn't work, copy and paste this link:</p>
                    <p style="margin:0; font-size:12px; color:#1a365d; word-break:break-all;">
                      <a href="${sessionUrl}" style="color:#1a365d; text-decoration:underline;">${sessionUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- How it works -->
              <h2 style="margin:0 0 12px 0; font-size:15px; font-weight:600; color:#18181b;">
                How DivorceGPT Works
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:8px 0; border-bottom:1px solid #e4e4e7;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="32" valign="top" style="font-size:14px; font-weight:700; color:#c59d5f;">1.</td>
                        <td style="font-size:14px; line-height:1.5; color:#3f3f46;">
                          <strong>Phase 1 — Commencement:</strong> Answer questions to generate your UD-1 (Summons with Notice). File it with your county clerk to get an Index Number.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0; border-bottom:1px solid #e4e4e7;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="32" valign="top" style="font-size:14px; font-weight:700; color:#c59d5f;">2.</td>
                        <td style="font-size:14px; line-height:1.5; color:#3f3f46;">
                          <strong>Phase 2 — Submission:</strong> Enter your Index Number and marriage details. Download your full filing package (7-8 forms).
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="32" valign="top" style="font-size:14px; font-weight:700; color:#c59d5f;">3.</td>
                        <td style="font-size:14px; line-height:1.5; color:#3f3f46;">
                          <strong>Phase 3 — Post-Judgment:</strong> After your judgment is entered, generate Notice of Entry and Affidavit of Service forms.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Session details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:16px;">
                    <p style="margin:0 0 4px 0; font-size:13px; font-weight:600; color:#166534;">Your session includes:</p>
                    <p style="margin:0; font-size:13px; line-height:1.6; color:#166534;">
                      ✓ All 3 phases of document generation<br>
                      ✓ 12-month access window<br>
                      ✓ Up to 5 downloads per phase<br>
                      ✓ AI-guided form preparation
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0; font-size:13px; color:#71717a;">
                Questions? Email <a href="mailto:admin@divorcegpt.com" style="color:#1a365d;">admin@divorcegpt.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f4f4f5; padding:20px 32px; border-top:1px solid #e4e4e7;">
              <p style="margin:0; font-size:12px; color:#a1a1aa; text-align:center;">
                DivorceGPT is a document preparation service by June Guided Solutions, LLC.<br>
                This is not legal advice. Not a law firm.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Resend API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, id: data.id });

  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
