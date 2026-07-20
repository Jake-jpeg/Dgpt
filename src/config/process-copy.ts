/**
 * ATTORNEY-CONTROLLED CONFIG — scripted process explanations and "why we ask"
 * copy. Served verbatim by copy ID. [ATTORNEY TO SUPPLY] marks Stage-1
 * placeholders to be replaced before real use.
 */

export const PROCESS_COPY = {
  WELCOME:
    "[ATTORNEY TO SUPPLY] Welcome. This is a structured intake for uncontested " +
    "New York divorces. It is not legal advice and it is not a chatbot — it " +
    "collects the information the attorney needs, checks that your matter fits " +
    "this service, and hands everything to the attorney for review. You'll be " +
    "asked for both spouses' names first so the office can run a required " +
    "conflict-of-interest check before anything else is collected.",

  PRE_GATE_EXPLAINER:
    "[ATTORNEY TO SUPPLY] Before any details are collected, every law office " +
    "must check for conflicts of interest. We only ask for both parties' names " +
    "at this step — nothing else is collected or kept unless the check clears.",

  SCOPE_GATE_EXPLAINER:
    "[ATTORNEY TO SUPPLY] A few threshold questions decide whether this online " +
    "intake fits your situation. If it doesn't, you'll see referral information " +
    "instead — and nothing you entered will be kept.",

  INTAKE_EXPLAINER:
    "[ATTORNEY TO SUPPLY] The following questions collect the facts the " +
    "attorney needs for an uncontested filing. Answer as accurately as you " +
    "can; the attorney reviews everything with you before anything is filed.",

  READY_FOR_REVIEW:
    "[ATTORNEY TO SUPPLY] Your intake is complete and has been sent to the " +
    "attorney for review. The office will contact you to schedule a " +
    "consultation. Nothing is filed and no engagement exists until the " +
    "attorney confirms it with you directly.",

  WHY_IDENTITY:
    "[ATTORNEY TO SUPPLY] Why we ask: attorney ethics rules require a conflict " +
    "check against both spouses' names before an intake can begin.",
  // NJ-law explanation removed in the NY-only pass. Do NOT substitute NY law
  // here — legal explanations are operator-authored. The NY version must
  // explain, in plain language, the DRL § 230 residence requirement the firm
  // relies on (its alternatives include one-year residence with a NY
  // connection and a two-year residence path), without stating a single
  // threshold as if it were the only rule.
  WHY_RESIDENCY:
    "[ATTORNEY TO SUPPLY — NY] Why we ask: New York sets residence requirements " +
    "for filing a divorce here (see DRL § 230). The attorney confirms whether " +
    "your situation meets them.",
  WHY_VENUE:
    "[ATTORNEY TO SUPPLY] Why we ask: the county tells us where the case would " +
    "be filed. It does not disqualify you.",
  WHY_DV:
    "[ATTORNEY TO SUPPLY] Why we ask: matters involving domestic violence need " +
    "individual attention this online intake can't provide safely.",
  WHY_CHILDREN:
    "[ATTORNEY TO SUPPLY] Why we ask: matters involving children aren't " +
    "handled by this online intake at this time.",
  WHY_COMPLEXITY:
    "[ATTORNEY TO SUPPLY] Why we ask: this intake only fits matters where " +
    "everything is already fully agreed between the spouses.",
  WHY_GROUNDS:
    "[ATTORNEY TO SUPPLY] Why we ask: every divorce filing states a legal " +
    "ground; for uncontested matters this is usually irreconcilable differences.",
  WHY_MARRIAGE:
    "[ATTORNEY TO SUPPLY] Why we ask: the filing must identify when and where " +
    "the marriage took place.",
  WHY_PARTIES:
    "[ATTORNEY TO SUPPLY] Why we ask: the court papers must identify both " +
    "parties and provide an address where your spouse can be served.",
  WHY_SEPARATION:
    "[ATTORNEY TO SUPPLY] Why we ask: the filing describes the separation facts.",
  WHY_CONFIRMATIONS:
    "[ATTORNEY TO SUPPLY] Why we ask: these confirmations establish that your " +
    "matter fits the streamlined uncontested process.",
  WHY_ED:
    "[ATTORNEY TO SUPPLY] Why we ask: the settlement paperwork must describe " +
    "what you both agreed about property and debts.",
  WHY_RETIREMENT:
    "[ATTORNEY TO SUPPLY] Why we ask: retirement accounts are divided " +
    "differently depending on the account type, so we ask which kind each one is.",
  WHY_MAINTENANCE:
    "[ATTORNEY TO SUPPLY] Why we ask: the agreement must state the spousal " +
    "maintenance terms you both agreed to.",
  WHY_NAME_CHANGE:
    "[ATTORNEY TO SUPPLY] Why we ask: a divorce judgment can restore a prior " +
    "name if requested.",
  WHY_PRIOR_ACTIONS:
    "[ATTORNEY TO SUPPLY] Why we ask: the court requires disclosure of prior " +
    "or pending cases between the parties.",
} as const;

export type ProcessCopyId = keyof typeof PROCESS_COPY;

export function getProcessCopy(id: ProcessCopyId): string {
  return PROCESS_COPY[id];
}
