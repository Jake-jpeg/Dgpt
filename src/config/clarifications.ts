/**
 * ATTORNEY-CONTROLLED CONFIG — the fixed list of scripted clarification
 * questions the intake may ask. The bot's CLARIFICATION response surface can
 * only serve items from this list, by ID. Nothing is composed at runtime.
 */

export interface Clarification {
  id: string;
  text: string;
}

export const CLARIFICATIONS: Clarification[] = [
  {
    id: "CLARIFY_RETIREMENT_TYPE",
    text:
      "[ATTORNEY TO SUPPLY] Which type of retirement account is this? A 401(k) " +
      "or similar employer plan; a Traditional IRA; a Roth IRA; a pension " +
      "(defined benefit); a military retirement; or deferred compensation. " +
      "If you're not sure, check a recent account statement — the type is " +
      "usually printed near the account name — or choose \"I'm not sure\" and " +
      "the attorney will sort it out with you.",
  },
  {
    id: "CLARIFY_IRA_KIND",
    text:
      "[ATTORNEY TO SUPPLY] Is the IRA a Traditional IRA or a Roth IRA? Your " +
      "account statement or the account name will usually say which.",
  },
  {
    id: "CLARIFY_DATE_APPROX",
    text:
      "[ATTORNEY TO SUPPLY] An approximate date is fine — the attorney will " +
      "confirm exact dates with you at the consultation.",
  },
  {
    id: "CLARIFY_PRIOR_NAMES",
    text:
      "[ATTORNEY TO SUPPLY] Prior names include a maiden name, a name from an " +
      "earlier marriage, or any other legal name either of you has used.",
  },
  {
    id: "CLARIFY_SEPARATION",
    text:
      "[ATTORNEY TO SUPPLY] \"Separated\" here means the point when the " +
      "marriage relationship effectively ended — you can still be living at " +
      "the same address.",
  },
  {
    id: "CLARIFY_SERVICE_ADDRESS",
    text:
      "[ATTORNEY TO SUPPLY] We ask for an address where your spouse can " +
      "reliably receive court papers. A home address is best.",
  },
];

export function getClarification(id: string): Clarification | undefined {
  return CLARIFICATIONS.find((c) => c.id === id);
}
