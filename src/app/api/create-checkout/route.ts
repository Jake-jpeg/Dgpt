import { NextResponse } from 'next/server';

// STUB: Replace with real Stripe when ready
// import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export async function POST(req: Request) {
  try {
    const { returnUrl } = await req.json();
    
    // STUB: Generate a fake session ID for testing
    // In production, this would create a real Stripe checkout session
    const fakeSessionId = 'cs_test_' + Math.random().toString(36).substring(2, 15);
    
    // For now, redirect directly to forms page with fake session
    // In production: redirect to Stripe checkout URL
    return NextResponse.json({ 
      sessionId: fakeSessionId,
      url: `${returnUrl}/forms?session_id=${fakeSessionId}`
    });
    
    /* PRODUCTION CODE:
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'DivorceGPT - NY Uncontested Divorce Forms',
            description: 'Complete divorce form preparation for New York uncontested divorces',
          },
          unit_amount: 2000,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${returnUrl}/forms?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}/qualify`,
    });
    return NextResponse.json({ sessionId: session.id, url: session.url });
    */
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
