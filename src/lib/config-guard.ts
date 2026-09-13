/**
 * Boot-time config guard.
 *
 * Stage 1 ships with [ATTORNEY TO SUPPLY] placeholders throughout the
 * attorney-controlled config — acceptable while testing. But the DV exit
 * card is the one card where an unfilled placeholder is genuinely bad: it is
 * the human handoff for a person who just disclosed domestic violence, and
 * it must carry a real firm contact.
 *
 * So: in production, the server REFUSES TO BOOT while the DV card still
 * contains placeholder text (see src/instrumentation.ts). In development it
 * logs a loud warning instead.
 */
import { getCard, type StaticCard } from "@/config/cards";
import { isProduction } from "@/lib/env";
import { betaGateEnabled } from "@/lib/beta";

// A legacy [ATTORNEY TO SUPPLY] marker, an unresolved [FIRM_CONTACT_LINE]
// token, or the neutral fallback getCard substitutes when no firm contact
// is configured (2026-09-13: the DV card is now served with the firm's
// contact line from env — FIRM_CONTACT, or FIRM_ATTORNEY_FIRM/PHONE +
// NEXT_PUBLIC_INQUIRY_EMAIL — so "filled in" means "configured").
const PLACEHOLDER = /\[ATTORNEY TO SUPPLY|\[FIRM_CONTACT_LINE\]|^the firm directly$/i;

export function dvCardHasPlaceholder(card: StaticCard = getCard("DV_RESOURCES")): boolean {
  if (PLACEHOLDER.test(card.body) || PLACEHOLDER.test(card.title)) return true;
  return (card.resources ?? []).some(
    (r) => PLACEHOLDER.test(r.label) || PLACEHOLDER.test(r.value)
  );
}

export function assertCriticalCopyReady(card?: StaticCard): void {
  if (!dvCardHasPlaceholder(card)) return;
  const msg =
    "DV resources card (src/config/cards.ts → DV_RESOURCES) has no firm " +
    "contact: set FIRM_CONTACT, or FIRM_ATTORNEY_FIRM + FIRM_ATTORNEY_PHONE " +
    "(and NEXT_PUBLIC_INQUIRY_EMAIL), before this can serve real users.";
  // "Shipping" means serving the public. A production deployment behind the
  // beta access gate (FREE_ACCESS_KEYS set) is closed testing, not shipping —
  // warn loudly but let it boot. A production deployment with the gate OFF
  // is public: refuse to serve until the card is filled.
  if (isProduction() && !betaGateEnabled()) {
    throw new Error(`SHIP_BLOCKER: ${msg}`);
  }
  console.warn(`⚠ CONFIG GUARD (${isProduction() ? "beta-gated production" : "non-production"}): ${msg}`);
}
