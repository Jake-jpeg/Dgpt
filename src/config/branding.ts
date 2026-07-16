/**
 * Operating-firm branding. DivorceGPT is workflow software operated BY a law
 * firm; the firm identity is configuration, never hard-coded copy.
 *
 * NEXT_PUBLIC_* because these strings render in client components too. They
 * are display values only — no secret may ever use a NEXT_PUBLIC variable.
 */

export function operatingFirmName(): string {
  return process.env.NEXT_PUBLIC_OPERATING_FIRM_NAME || "Jake Kim Law Firm";
}

/**
 * Inquiry mailbox shown on client-facing pages. Empty string when not
 * configured — callers must render a neutral "contact the firm" fallback
 * rather than inventing an address. [NOT CONFIGURED] until the firm sets it.
 */
export function inquiryEmail(): string {
  return process.env.NEXT_PUBLIC_INQUIRY_EMAIL || "";
}

/**
 * Operator / IP identity fields (see docs/OPERATOR-AND-IP-OWNERSHIP.md).
 * Facts are NEVER invented here:
 *
 *  - The legal-services provider is ALWAYS the operating firm — a hard
 *    product rule, not a configurable business fact.
 *  - The copyright line defaults to the statement already present in the
 *    landing-page footer since before this pass ("© June Guided Solutions,
 *    LLC.") — an existing source-material statement, not a new claim.
 *  - The software OWNER is not clearly established in existing source
 *    material: [OWNER CONFIRMATION REQUIRED]. The accessor returns "" until
 *    the owner sets NEXT_PUBLIC_SOFTWARE_OWNER; public copy must OMIT the
 *    statement rather than render a placeholder.
 */

/** Client-facing legal-services provider — always the operating firm. */
export function legalServicesProvider(): string {
  return operatingFirmName();
}

/** Portal operator. Existing copy: "workflow software used by {firm}". */
export function portalOperator(): string {
  return process.env.NEXT_PUBLIC_PORTAL_OPERATOR || operatingFirmName();
}

/** Software owner — [OWNER CONFIRMATION REQUIRED]; empty ⇒ omit publicly. */
export function softwareOwner(): string {
  return process.env.NEXT_PUBLIC_SOFTWARE_OWNER || "";
}

/** Copyright owner shown in the footer copyright line. */
export function copyrightOwner(): string {
  return process.env.NEXT_PUBLIC_COPYRIGHT_OWNER || "June Guided Solutions, LLC";
}
