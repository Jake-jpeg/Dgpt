/**
 * Public config for the beta gate page: whether the gate is on, and whether
 * a CAPTCHA must be solved (plus the Turnstile site key, which is public by
 * design). Never exposes the access keys or the Turnstile secret.
 */
import { betaGateEnabled, turnstileConfigured } from "@/lib/beta";

export async function GET() {
  return Response.json({
    gate: betaGateEnabled(),
    captcha: turnstileConfigured(),
    siteKey: turnstileConfigured() ? process.env.TURNSTILE_SITE_KEY : null,
  });
}
