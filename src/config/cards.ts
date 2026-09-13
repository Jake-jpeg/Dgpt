/**
 * ATTORNEY-CONTROLLED CONFIG — static referral / rejection / deflection cards.
 *
 * Every card the user can ever see is defined here, verbatim. The application
 * serves these cards by ID; nothing composes or generates card text at
 * runtime. Copy marked [ATTORNEY TO SUPPLY] is a Stage-1 placeholder for the
 * attorney to replace — do not ship to real users until replaced.
 */

import { firmContactLine } from "./firm-contact";

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
        label: "New York State Bar Association Lawyer Referral and Information Service",
        value: "1-800-342-3661 · nysba.org",
      },
    ],
  },

  /**
   * Shown ONCE on any DV disclosure — past or present, resolved or active —
   * and the interview CONTINUES (operator, 2026-09-13: "even DV is fair game
   * because a lawyer is reviewing the whole thing"). The session is flagged
   * DV_DISCLOSED_ATTORNEY_REVIEW; this card's job is to put two HUMAN
   * channels in front of the client — the firm directly, and the county
   * courthouse's domestic-violence unit — plus the hotline. It never
   * assesses severity.
   *
   * FIRM_CONTACT_LINE is filled at serve time (getCard) from the firm's
   * configuration (src/config/firm-contact.ts); src/lib/config-guard.ts
   * warns while it still resolves to a placeholder.
   */
  DV_RESOURCES: {
    id: "DV_RESOURCES",
    title: "Thank you for telling us — your attorney will review this personally",
    body:
      "Because domestic violence can affect how a divorce should be handled, " +
      "a licensed attorney at the firm will look at your case personally " +
      "before anything is filed. You can keep going with the questions here " +
      "whenever you are ready, and you can also reach a person directly: " +
      "[FIRM_CONTACT_LINE], or ask for the Safe Passage / domestic-violence " +
      "resources at your New York county courthouse — they can help whether " +
      "the matter is past or current.",
    resources: [
      {
        label: "Contact the firm",
        value: "[FIRM_CONTACT_LINE]",
      },
      {
        label: "Domestic Violence / Victim's unit",
        value:
          "Ask at your New York county courthouse (past or current matters)",
      },
      {
        label: "If you are in immediate danger",
        value:
          "Call 911 · NYS Domestic & Sexual Violence Hotline (24/7): 800-942-6906 · Text: 844-997-2121",
      },
    ],
  },

  /** The New Jersey playbook's DV card — same handling, the state's own resources. */
  DV_RESOURCES_NJ: {
    id: "DV_RESOURCES_NJ",
    title: "Thank you for telling us — your attorney will review this personally",
    body:
      "Because domestic violence can affect how a divorce should be handled, " +
      "a licensed attorney at the firm will look at your case personally " +
      "before anything is filed. You can keep going with the questions here " +
      "whenever you are ready, and you can also reach a person directly: " +
      "[FIRM_CONTACT_LINE], or ask for the domestic-violence unit at the " +
      "Family Division of your county's Superior Court — they can help " +
      "whether the matter is past or current.",
    resources: [
      {
        label: "Contact the firm",
        value: "[FIRM_CONTACT_LINE]",
      },
      {
        label: "Domestic Violence unit",
        value:
          "Ask at the Family Division of the Superior Court in your county (past or current matters)",
      },
      {
        label: "If you are in immediate danger",
        value:
          "Call 911 · New Jersey Statewide Domestic Violence Hotline (24/7): 1-800-572-SAFE (7233)",
      },
    ],
  },

  /** Served on complexity/disagreement/valuation trips and the deferred custody tier. */
  // [ATTORNEY REVIEW REQUIRED — NY] NY bar-referral card copy pending counsel sign-off.
  NY_BAR_REFERRAL: {
    id: "NY_BAR_REFERRAL",
    title: "Your matter needs more than this intake can offer",
    body:
      "This online intake only handles fully uncontested matters where " +
      "everything is already agreed. Based on your answers, your situation " +
      "needs individual legal attention. The New York State Bar Association's " +
      "Lawyer Referral and Information Service can connect you with an attorney " +
      "in your county.",
    resources: [
      {
        label: "New York State Bar Association Lawyer Referral and Information Service",
        value: "1-800-342-3661 · nysba.org",
      },
    ],
  },

  /**
   * Phase-1 attorney-review stop: served when a gate answer takes the case
   * outside the automated Phase-1 lane (residency short of the two-year
   * ground, or unemancipated children). NOT a rejection — the firm reviews
   * and takes it from there. Warmer than the bar-referral card: these are
   * the firm's OWN prospective clients, routed to counsel.
   */
  // [ATTORNEY REVIEW REQUIRED — NY] Phase-1 review-stop copy pending counsel sign-off.
  PHASE1_ATTORNEY_REVIEW: {
    id: "PHASE1_ATTORNEY_REVIEW",
    title: "An attorney needs to look at this first",
    body:
      "Thanks — you haven't done anything wrong, and this isn't a rejection. " +
      "Based on your answers, your situation has a detail that the online " +
      "intake isn't allowed to handle on its own, so a licensed attorney at " +
      "the firm needs to review it before anything moves forward. Your " +
      "answers so far have been saved for that review, and the firm will " +
      "contact you about next steps. Nothing will be filed without an " +
      "attorney's review and your say-so.",
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

const CONTACT_TOKEN = "[FIRM_CONTACT_LINE]";

/**
 * Serve a card. The firm's contact line is configuration, resolved here so
 * a card never carries a placeholder the firm has already filled in env.
 * Unconfigured → the neutral phrase "the firm directly" (never a fake
 * number); config-guard.ts is what nags about that.
 */
export function getCard(id: CardId): StaticCard {
  const card = CARDS[id] as StaticCard;
  const line = firmContactLine() || "the firm directly";
  const fill = (t: string) => t.split(CONTACT_TOKEN).join(line);
  return {
    id: card.id,
    title: fill(card.title),
    body: fill(card.body),
    ...(card.resources ? { resources: card.resources.map((r) => ({ label: fill(r.label), value: fill(r.value) })) } : {}),
  };
}
