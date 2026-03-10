import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripe;
};

// Free access keys - bypass Stripe for testing/promos
const FREE_ACCESS_KEYS = (process.env.FREE_ACCESS_KEYS || '').split(',').filter(Boolean);

export async function POST(req: Request) {
  try {
    const { returnUrl, freeKey, state } = await req.json();
    const statePrefix = state ? `/${state}` : '/ny';

    // State-specific product descriptions
    const stateDescriptions: Record<string, string> = {
      ny: 'AI-powered document preparation for New York uncontested divorces. Includes all phases. 12-month access. No legal advice provided.',
      nj: 'AI-powered document preparation for New Jersey uncontested divorces. Includes all phases. 12-month access. No legal advice provided.',
      nv: 'AI-powered document preparation for Nevada uncontested divorces. Includes all documents. 12-month access. No legal advice provided.',
    };

    // Check for free access key bypass
    if (freeKey && FREE_ACCESS_KEYS.includes(freeKey)) {
      const bypassSessionId = 'cs_free_' + freeKey + '_' + Date.now();
      return NextResponse.json({
        sessionId: bypassSessionId,
        url: `${returnUrl}${statePrefix}/forms?session_id=${bypassSessionId}`
      });
    }

    // Create real Stripe checkout session
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'DivorceGPT by June Guided Solutions, LLC',
            description: stateDescriptions[state || 'ny'] || stateDescriptions.ny,
          },
          unit_amount: 2900, // $29.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${returnUrl}${statePrefix}/forms?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}${statePrefix}/agree`,
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
