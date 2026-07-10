/**
 * ATTORNEY-CONTROLLED CONFIG — static referral / rejection / deflection cards.
 *
 * Every card the user can ever see is defined here, verbatim. The application
 * serves these cards by ID; nothing composes or generates card text at
 * runtime. Copy marked [ATTORNEY TO SUPPLY] is a Stage-1 placeholder for the
 * attorney to replace — do not ship to real users until replaced.
 */

export interface StaticCard {
  id: string;
  title: string;
  body: string;
  /** Optional labeled resources (e.g. hotlines, referral services). */
  resources?: { label: string; value: string }[];
}

export const CARDS = {
  /** Served on a conflict HIT. The session ends here; nothing substantive is kept. */
  CONFLICT_REFERRAL: {
    id: "CONFLICT_REFERRAL",
    title: "We're unable to assist with this matter",
    body:
      "[ATTORNEY TO SUPPLY — forward-out / referral copy] Based on the information " +
      "provided, our office is unable to assist with this matter. We recommend " +
      "contacting a lawyer referral service to find counsel. No information you " +
      "entered has been retained.",
    resources: [
      {
        label: "Bergen County Bar Association Lawyer Referral Service",
        value: "[ATTORNEY TO SUPPLY — phone / URL]",
      },
    ],
  },

  /** Served when residency requirement is not met. Not auto-resolved — attorney reviews offline. */
  RESIDENCY_ATTORNEY_FLAG: {
    id: "RESIDENCY_ATTORNEY_FLAG",
    title: "This intake can't continue online",
    body:
      "[ATTORNEY TO SUPPLY] New Jersey divorce filings generally require that at " +
      "least one spouse has been a bona fide New Jersey resident for the 12 " +
      "consecutive months before filing. Based on your answer, we can't continue " +
      "this online intake. Limited exceptions exist that only the attorney can " +
      "evaluate — please contact the office to discuss your situation.",
  },

  /**
   * Served on any DV disclosure — past or present, resolved or active.
   * Distinct from the bar referral card. Points to two HUMAN channels: the
   * firm directly, and the county courthouse Domestic Violence / Victim's
   * unit. Same no-retention behavior as a conflict hit: the session ends,
   * nothing substantive is persisted, only a minimal audit that the screen
   * triggered.
   *
   * ⚠ SHIP-BLOCKER PLACEHOLDER: the firm name/phone below MUST be filled in
   * before production. src/lib/config-guard.ts refuses to boot a production
   * server while this card still contains a placeholder.
   */
  DV_RESOURCES: {
    id: "DV_RESOURCES",
    title: "This needs a person, not an automated intake",
    body:
      "Because domestic violence can affect how a divorce should be handled, " +
      "this needs a person, not an automated intake. Please contact " +
      "[ATTORNEY TO SUPPLY — FIRM NAME / PHONE] directly, or reach the " +
      "Domestic Violence / Victim's unit at your county courthouse — every " +
      "New Jersey courthouse has one, and they can help regardless of whether " +
      "the matter is past or current. This intake will not continue here.",
    resources: [
      {
        label: "Contact the firm",
        value: "[ATTORNEY TO SUPPLY — FIRM NAME / PHONE]",
      },
      {
        label: "Domestic Violence / Victim's unit",
        value:
          "At your county courthouse — every New Jersey courthouse has one (past or current matters)",
      },
      {
        label: "If you are in immediate danger",
        value: "Call 911 · NJ Domestic Violence Hotline (24/7): 1-800-572-7233 (1-800-572-SAFE)",
      },
    ],
  },

  /** Served on complexity/disagreement/valuation trips and the deferred custody tier. */
  BERGEN_BAR_REFERRAL: {
    id: "BERGEN_BAR_REFERRAL",
    title: "Your matter needs more than this intake can offer",
    body:
      "[ATTORNEY TO SUPPLY] This online intake only handles fully uncontested " +
      "matters where everything is already agreed. Based on your answers, your " +
      "situation needs individual legal attention. The Bergen County Bar " +
      "Association's Lawyer Referral Service can connect you with an attorney.",
    resources: [
      {
        label: "Bergen County Bar Association Lawyer Referral Service",
        value: "[ATTORNEY TO SUPPLY — phone / URL]",
      },
    ],
  },

  /**
   * The universal deflection: served whenever a user asks the bot anything
   * that would apply information to their facts or seek advice.
   */
  DEFLECT_CONSULT: {
    id: "DEFLECT_CONSULT",
    title: "That's one for the attorney",
    body:
      "[ATTORNEY TO SUPPLY — deflection copy] That's a question about your " +
      "specific situation, and only the attorney can answer it. It will be " +
      "covered at your consultation. This intake can explain what a form asks " +
      "for or define a term, but it can't give legal advice.",
  },

  /** Fallback when the bot cannot classify a request as anything it's allowed to answer. */
  DEFLECT_UNRECOGNIZED: {
    id: "DEFLECT_UNRECOGNIZED",
    title: "I can't help with that here",
    body:
      "[ATTORNEY TO SUPPLY] This intake can explain the process, define terms " +
      "from an approved glossary, and ask the intake questions — nothing else. " +
      "If you have a question about your situation, the attorney will cover it " +
      "at your consultation.",
  },
} as const satisfies Record<string, StaticCard>;

export type CardId = keyof typeof CARDS;

export function getCard(id: CardId): StaticCard {
  return CARDS[id];
}
