/**
 * The firm's human contact line — the one thing a client must always be
 * able to find on any card or message that says "talk to a person".
 *
 * Resolved from configuration, never invented (2026-09-13, after the live
 * run showed "please contact the firm to continue" with no name, phone, or
 * email on it):
 *   1. FIRM_CONTACT — a complete line the firm wrote itself, if set.
 *   2. Otherwise composed from the signature-block env the Word engine
 *      already requires: FIRM_ATTORNEY_FIRM (or the operating firm name),
 *      FIRM_ATTORNEY_PHONE, and the NEXT_PUBLIC_INQUIRY_EMAIL mailbox.
 *   3. Otherwise "" — callers render a neutral "the firm" and never a
 *      placeholder.
 *
 * Server-side only for the phone (FIRM_ATTORNEY_* are not NEXT_PUBLIC); the
 * cards that carry it are served by API routes, so that is where it lands.
 */
export function firmContactLine(): string {
  const explicit = (process.env.FIRM_CONTACT ?? "").trim();
  if (explicit) return explicit;
  const firm = (process.env.FIRM_ATTORNEY_FIRM ?? process.env.NEXT_PUBLIC_OPERATING_FIRM_NAME ?? "").trim();
  const phone = (process.env.FIRM_ATTORNEY_PHONE ?? "").trim();
  const email = (process.env.NEXT_PUBLIC_INQUIRY_EMAIL ?? "").trim();
  const reach = [phone, email].filter(Boolean).join(" · ");
  if (!firm && !reach) return "";
  if (!reach) return firm;
  return firm ? `${firm} — ${reach}` : reach;
}
