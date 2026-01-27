import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json({ valid: false, error: 'No session ID' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      return NextResponse.json({ 
        valid: true,
        paymentIntentId: session.payment_intent as string,
        customerEmail: session.customer_details?.email || null,
      });
    }
    
    return NextResponse.json({ valid: false, error: 'Payment not completed' });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ valid: false, error: 'Invalid session' }, { status: 400 });
  }
}
