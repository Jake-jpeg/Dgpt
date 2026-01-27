import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const { returnUrl } = await req.json();
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'DivorceGPT - NY Uncontested Divorce Forms',
              description: 'Complete divorce form preparation for New York uncontested divorces',
            },
            unit_amount: 2000, // $20.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl}/forms?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}/qualify`,
      // Store for 30 days - customer can return via email link
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 min checkout window
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
