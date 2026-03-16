import { NextResponse } from 'next/server';

// Referral intake endpoint
// Receives form data from /refer page and forwards to admin
// Future: store in DB, integrate with CRM, auto-match attorneys

export async function POST(req: Request) {
  try {
    const { name, email, phone, state, issueType, message } = await req.json();

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !state || !issueType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const referralData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || 'Not provided',
      state,
      issueType,
      message: message?.trim() || 'None',
      submittedAt: new Date().toISOString(),
    };

    // ---------------------------------------------------------------------------
    // Send notification email via the existing send-session-email infrastructure
    // or a dedicated email service. For now, use the monitor alert endpoint
    // as a lightweight notification pipe.
    // ---------------------------------------------------------------------------
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-monitor-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `[DivorceGPT Referral] New attorney referral — ${name.trim()} (${state.toUpperCase()})`,
          body: `
NEW ATTORNEY REFERRAL REQUEST
==============================
Name:       ${referralData.name}
Email:      ${referralData.email}
Phone:      ${referralData.phone}
State:      ${referralData.state.toUpperCase()}
Issue:      ${referralData.issueType}
Message:    ${referralData.message}
Submitted:  ${referralData.submittedAt}
==============================
          `.trim(),
        }),
      });
    } catch (emailError) {
      // Log but don't fail the request — referral data is captured
      console.error('Failed to send referral notification email:', emailError);
    }

    // Log to server console for backup
    console.log('[REFERRAL]', JSON.stringify(referralData));

    return NextResponse.json({ success: true, referralId: `ref_${Date.now()}` });
  } catch (error) {
    console.error('Referral API error:', error);
    return NextResponse.json(
      { error: 'Failed to submit referral' },
      { status: 500 }
    );
  }
}
