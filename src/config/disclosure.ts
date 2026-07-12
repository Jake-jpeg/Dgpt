/**
 * Relationship disclosure — shown to the client BEFORE conflict screening
 * and re-acknowledged whenever the version changes. Versioned so every
 * acknowledgment records exactly which text was accepted.
 *
 * [COUNSEL REVIEW REQUIRED] — this language was drafted for structure and
 * plain-language tone; the supervising attorney must review and approve the
 * final wording before live client use. This marker lives in source
 * documentation only and is never rendered to an end user.
 *
 * Operating firm branding comes from NEXT_PUBLIC_OPERATING_FIRM_NAME (see
 * src/config/branding.ts); no firm name is hard-coded here.
 */
import { operatingFirmName } from "@/config/branding";

export const DISCLOSURE_VERSION = "2026-07.1";

export interface Disclosure {
  version: string;
  title: string;
  paragraphs: string[];
  acknowledgeLabel: string;
}

export function getDisclosure(): Disclosure {
  const firm = operatingFirmName();
  return {
    version: DISCLOSURE_VERSION,
    title: "About this portal and your relationship with the firm",
    paragraphs: [
      `${firm} is the provider of legal services. Any legal representation is provided by the firm and its attorneys — not by this software.`,
      `DivorceGPT is workflow software used by ${firm} to organize information you provide and to identify items that may be missing. The software does not independently provide legal advice.`,
      `Your representation is controlled by the written engagement agreement between you and ${firm}. Using this portal does not create or expand the scope of that agreement.`,
      `Everything of substance prepared with the help of this software is reviewed by an attorney. No document is shared with you, signed, or filed unless an attorney has approved that exact version.`,
      `Please do not use this portal as your only way to tell the firm about anything urgent. If a matter is time-sensitive, contact the firm directly using the contact information in your engagement agreement.`,
      `If any information you enter here is inaccurate or incomplete, tell the firm as soon as possible so it can be corrected.`,
    ],
    acknowledgeLabel:
      "I have read and understand the statements above.",
  };
}
