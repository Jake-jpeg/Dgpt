/**
 * Operating-firm branding. DivorceGPT is workflow software operated BY a law
 * firm; the firm identity is configuration, never hard-coded copy.
 *
 * NEXT_PUBLIC_* because these strings render in client components too. They
 * are display values only — no secret may ever use a NEXT_PUBLIC variable.
 */

export function operatingFirmName(): string {
  return process.env.NEXT_PUBLIC_OPERATING_FIRM_NAME || "J. Kim Law Firm";
}

/**
 * Inquiry mailbox shown on client-facing pages. Empty string when not
 * configured — callers must render a neutral "contact the firm" fallback
 * rather than inventing an address. [NOT CONFIGURED] until the firm sets it.
 */
export function inquiryEmail(): string {
  return process.env.NEXT_PUBLIC_INQUIRY_EMAIL || "";
}
