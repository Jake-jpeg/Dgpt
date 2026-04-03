// /api/validate-session/route.ts
// ═══════════════════════════════════════════════════════════════
// Validates Stripe checkout session and issues a signed HTTP-only
// cookie (dgpt_session) that the chat route uses for auth.
//
// WHAT CHANGED:
// - After confirming payment with Stripe, signs an HMAC token and
//   sets it as an HTTP-only cookie in the response.
// - Extracts state + tier from Stripe metadata so the cookie
//   carries which state the user paid for.
// - Chat route verifies this cookie — no more naked endpoints.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  signSessionToken,
  buildSessionCookie,
  SESSION_TTL_MS,
  type SessionPayload,
} from '@/lib/session-token';

// Lazy initialization to avoid build-time errors
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripe;
};

// Free access keys — must match create-checkout
const FREE_ACCESS_KEYS = (process.env.FREE_ACCESS_KEYS || '').split(',').filter(Boolean);

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ valid: false, error: 'No session ID' }, { status: 400 });
    }

    // ── Free access key bypass ───────────────────────────────
    if (sessionId.startsWith('cs_free_')) {
      const parts = sessionId.replace('cs_free_', '').split('_');
      const key = parts.slice(0, -1).join('_');

      if (FREE_ACCESS_KEYS.includes(key)) {
        const paymentIntentId = 'pi_free_' + key;

        // Extract state from the URL referrer or default to 'ny'
        // Free keys get access to all states
        const referer = req.headers.get('referer') || '';
        const stateMatch = referer.match(/\/(\w{2})\/forms/);
        const state = stateMatch?.[1] || 'ny';

        const payload: SessionPayload = {
          paymentIntentId,
          state,
          tier: 'free',
          iat: Date.now(),
          exp: Date.now() + SESSION_TTL_MS,
          email: null,
        };

        const token = signSessionToken(payload);
        const response = NextResponse.json({
          valid: true,
          paymentIntentId,
          customerEmail: null,
        });
        response.headers.set('Set-Cookie', buildSessionCookie(token));
        return response;
      }
    }

    // ── Validate real Stripe session ─────────────────────────
    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const paymentIntentId = session.payment_intent as string;
      const customerEmail = session.customer_details?.email || null;
      const state = (session.metadata?.state as string) || 'ny';
      const tier = (session.metadata?.tier as string) || 'pro_se';

      const payload: SessionPayload = {
        paymentIntentId,
        state,
        tier,
        iat: Date.now(),
        exp: Date.now() + SESSION_TTL_MS,
        email: customerEmail,
      };

      const token = signSessionToken(payload);
      const response = NextResponse.json({
        valid: true,
        paymentIntentId,
        customerEmail,
      });
      response.headers.set('Set-Cookie', buildSessionCookie(token));
      return response;
    }

    return NextResponse.json({ valid: false, error: 'Payment not completed' });

  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ valid: false, error: 'Invalid session' }, { status: 400 });
  }
}
