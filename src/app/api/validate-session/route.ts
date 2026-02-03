import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
  apiVersion: '2023-10-16' 
});

// Free access keys - must match create-checkout
const FREE_ACCESS_KEYS = (process.env.FREE_ACCESS_KEYS || '').split(',').filter(Boolean);

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json({ valid: false, error: 'No session ID' }, { status: 400 });
    }

    // Check for free access key bypass
    if (sessionId.startsWith('cs_free_')) {
      // Extract the key from cs_free_{key}_{timestamp}
      const parts = sessionId.replace('cs_free_', '').split('_');
      const key = parts.slice(0, -1).join('_'); // Everything except last part (timestamp)
      
      if (FREE_ACCESS_KEYS.includes(key)) {
        return NextResponse.json({ 
          valid: true,
          paymentIntentId: 'pi_free_' + key,
          customerEmail: null,
        });
      }
    }

    // Validate real Stripe session
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
