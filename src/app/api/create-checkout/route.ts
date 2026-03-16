import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStateConfig, getStateTiers } from '@/lib/states';

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
    const { returnUrl, freeKey, state, tier } = await req.json();
    const stateCode = state || 'ny';
    const statePrefix = `/${stateCode}`;
    const stateConfig = getStateConfig(stateCode);

    // ---------------------------------------------------------------------------
    // Resolve pricing: tier-based if provided, else legacy flat price
    // ---------------------------------------------------------------------------
    let unitAmount = stateConfig?.price || 9900; // fallback to $99
    let productName = stateConfig?.stripeProductName || 'DivorceGPT';
    let productDescription = stateConfig?.stripeProductDescription || '';
    let tierId = tier || 'pro_se';

    if (tier) {
      const tiers = getStateTiers(stateCode);
      const matched = tiers.find(t => t.id === tier);
      if (matched && matched.price > 0) {
        unitAmount = matched.price;
        productName = `DivorceGPT — ${stateConfig?.name || stateCode.toUpperCase()} (${matched.label})`;
        productDescription = matched.description;
        tierId = matched.id;
      }
    }

    // Check for free access key bypass
    if (freeKey && FREE_ACCESS_KEYS.includes(freeKey)) {
      const bypassSessionId = 'cs_free_' + freeKey + '_' + Date.now();
      return NextResponse.json({
        sessionId: bypassSessionId,
        url: `${returnUrl}${statePrefix}/forms?session_id=${bypassSessionId}&tier=${tierId}`
      });
    }

    // Create real Stripe checkout session
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: productName,
            description: productDescription,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${returnUrl}${statePrefix}/forms?session_id={CHECKOUT_SESSION_ID}&tier=${tierId}`,
      cancel_url: `${returnUrl}${statePrefix}/select`,
      // Collect email for magic link session resume
      customer_creation: 'always',
      // Metadata for tracking
      metadata: {
        product: 'divorcegpt',
        state: stateCode,
        tier: tierId,
        version: '2.0',
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
