import { NextResponse } from 'next/server';

// STUB: Replace with real Stripe when ready
// import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json({ valid: false, error: 'No session ID' }, { status: 400 });
    }

    // STUB: Accept any session ID that starts with 'cs_test_' for testing
    // In production, this would validate against Stripe API
    if (sessionId.startsWith('cs_test_') || sessionId.startsWith('cs_')) {
      return NextResponse.json({ 
        valid: true,
        // Use the session ID as the payment intent ID for localStorage keying
        paymentIntentId: 'pi_' + sessionId.replace('cs_test_', '').replace('cs_', ''),
        customerEmail: null,
      });
    }
    
    return NextResponse.json({ valid: false, error: 'Invalid session' });
    
    /* PRODUCTION CODE:
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      return NextResponse.json({ 
        valid: true,
        paymentIntentId: session.payment_intent as string,
        customerEmail: session.customer_details?.email || null,
      });
    }
    return NextResponse.json({ valid: false, error: 'Payment not completed' });
    */
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ valid: false, error: 'Invalid session' }, { status: 400 });
  }
}
