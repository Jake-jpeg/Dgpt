import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Free access keys - bypass Stripe for testing/promos
const FREE_ACCESS_KEYS = (process.env.FREE_ACCESS_KEYS || '').split(',').filter(Boolean);

export async function POST(req: Request) {
  try {
    const { returnUrl, freeKey } = await req.json();
    
    // Check for free access key bypass
    if (freeKey && FREE_ACCESS_KEYS.includes(freeKey)) {
      const bypassSessionId = 'cs_free_' + freeKey + '_' + Date.now();
      return NextResponse.json({ 
        sessionId: bypassSessionId,
        url: `${returnUrl}/forms?session_id=${bypassSessionId}`
      });
    }
    
    // Create real Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'DivorceGPT - NY Uncontested Divorce Forms',
            description: 'Document preparation for New York uncontested divorces. No legal advice provided.',
          },
          unit_amount: 2000, // $20.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${returnUrl}/forms?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}/agree`,
      // Collect email for magic link session resume
      customer_creation: 'always',
      // Metadata for tracking
      metadata: {
        product: 'divorcegpt',
        version: '1.0',
      },
    });
    
    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url 
    });
    
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
