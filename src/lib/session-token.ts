// /lib/session-token.ts
// ═══════════════════════════════════════════════════════════════
// Shared session token utility for DivorceGPT
// Signs and verifies HMAC-SHA256 tokens for cookie-based auth.
// No external dependencies — uses Node.js built-in crypto.
//
// Required env var: SESSION_SECRET (64+ char hex string)
// Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// ═══════════════════════════════════════════════════════════════

import { createHmac, timingSafeEqual } from 'crypto';

// ── Config ─────────────────────────────────────────────────────
const SESSION_SECRET = process.env.SESSION_SECRET || '';
export const SESSION_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours
export const COOKIE_NAME = 'dgpt_session';

// ── Types ──────────────────────────────────────────────────────
export interface SessionPayload {
  /** Stripe payment_intent ID (e.g., pi_abc123) or pi_free_keyname */
  paymentIntentId: string;
  /** State code the user paid for (e.g., "ny", "nj") */
  state: string;
  /** Tier ID (e.g., "pro_se", "full_service") */
  tier: string;
  /** Issued-at timestamp in Unix ms */
  iat: number;
  /** Expiration timestamp in Unix ms */
  exp: number;
  /** Customer email from Stripe (null for free keys) */
  email: string | null;
}

// ── Sign ───────────────────────────────────────────────────────
/**
 * Creates a signed session token: base64url(payload).base64url(hmac)
 * The payload is NOT encrypted — it's just signed. Don't put secrets in it.
 */
export function signSessionToken(payload: SessionPayload): string {
  if (!SESSION_SECRET) throw new Error('SESSION_SECRET not configured');

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');

  return `${payloadB64}.${sig}`;
}

// ── Verify ─────────────────────────────────────────────────────
/**
 * Verifies signature and expiration. Returns payload or null.
 * Uses timing-safe comparison to prevent signature timing attacks.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!SESSION_SECRET || !token) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sig] = parts;

  // Verify signature (timing-safe)
  const expectedSig = createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  try {
    const sigBuf = Buffer.from(sig, 'base64url');
    const expectedBuf = Buffer.from(expectedSig, 'base64url');
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
  } catch {
    return null;
  }

  // Parse payload
  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }

  // Check expiration
  if (!payload.exp || Date.now() > payload.exp) return null;

  // Basic shape validation
  if (typeof payload.paymentIntentId !== 'string' || !payload.paymentIntentId) return null;
  if (typeof payload.state !== 'string' || !payload.state) return null;

  return payload;
}

// ── Cookie helpers ─────────────────────────────────────────────
/**
 * Builds a Set-Cookie header value for the session token.
 * HTTP-only, Secure, SameSite=Lax, path=/.
 * Max-Age matches the token's remaining TTL.
 */
export function buildSessionCookie(token: string, maxAgeMs: number = SESSION_TTL_MS): string {
  const maxAgeSec = Math.floor(maxAgeMs / 1000);
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${maxAgeSec}`,
    'SameSite=Lax',
  ];

  // Only set Secure in production (HTTPS)
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  return parts.join('; ');
}

/**
 * Extracts the session token from a request's Cookie header.
 */
export function extractSessionToken(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match?.[1] || null;
}
