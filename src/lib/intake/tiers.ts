/**
 * Tier branching + routing rules.
 *
 * TIER_BRANCH asks two fixed questions (assets, alimony) and decides:
 *   NONE + NONE            → TIER1 (adds the explicit no-assets / no-alimony
 *                            confirmations to the intake)
 *   settled/agreed answers → TIER2 (ED capture + maintenance capture)
 *   any dispute/uncertainty → OUT → NY bar-referral card
 *
 * Routing rules on Tier-2 answers:
 *   QDRO-needed            → IN SCOPE: flag for attorney, continue.
 *   valuation needed /
 *   business interest /
 *   disagreement/unsure    → OUT → NY bar-referral card.
 */
import type { CardId } from "@/config/cards";

export const BRANCH_QUESTIONS = {
  branch_assets: {
    id: "branch_assets",
    prompt:
      "Do you and your spouse have marital property or debts to divide (real estate, vehicles, accounts, retirement, debts)?",
    options: [
      { value: "NONE", label: "No — nothing to divide" },
      { value: "SETTLED", label: "Yes — and we fully agree how to divide everything" },
      { value: "UNSURE", label: "Yes — but we're unsure or don't fully agree" },
    ],
  },
  branch_alimony: {
    id: "branch_alimony",
    prompt: "What about alimony / spousal maintenance?",
    options: [
      { value: "NONE", label: "Neither of us is seeking alimony" },
      {
        value: "AGREED",
        label: "We have agreed on alimony terms (including an agreed waiver)",
      },
      { value: "UNSURE", label: "We haven't agreed / we're not sure" },
    ],
  },
} as const;

export type BranchOutcome =
  | { outcome: "TIER1" }
  | { outcome: "TIER2" }
  | { outcome: "OUT"; card: CardId; auditEvent: string };

export function evaluateBranch(assets: string, alimony: string): BranchOutcome {
  const validAssets = BRANCH_QUESTIONS.branch_assets.options.map((o) => o.value as string);
  const validAlimony = BRANCH_QUESTIONS.branch_alimony.options.map((o) => o.value as string);
  if (!validAssets.includes(assets) || !validAlimony.includes(alimony)) {
    throw new Error("VALIDATION: invalid branch answer");
  }
  if (assets === "UNSURE" || alimony === "UNSURE") {
    return { outcome: "OUT", card: "NY_BAR_REFERRAL", auditEvent: "SCOPE_OUT_BRANCH_UNSURE" };
  }
  if (assets === "NONE" && alimony === "NONE") return { outcome: "TIER1" };
  return { outcome: "TIER2" };
}

// ── Retirement clarification tree routing ────────────────────────────

export interface RetirementAccount {
  accountType:
    | "401K"
    | "IRA_TRADITIONAL"
    | "IRA_ROTH"
    | "PENSION"
    | "MILITARY"
    | "DEFERRED_COMP"
    | "UNSURE";
  holder: "CLIENT" | "SPOUSE";
  division: "KEEP_OWN" | "SPLIT_AGREED" | "OTHER_AGREED" | "UNSURE";
}

export type AnswerRouting =
  | { outcome: "CONTINUE"; qdroFlag?: boolean; attorneyFlags?: string[] }
  | { outcome: "OUT"; card: CardId; auditEvent: string };

/**
 * Route a single validated answer. Called by the answers endpoint for every
 * field with routing significance; pure and unit-testable.
 */
export function routeAnswer(fieldId: string, value: unknown): AnswerRouting {
  switch (fieldId) {
    case "ed_business_interest":
      // Business interest → out (needs valuation / individual attention).
      return value === true
        ? { outcome: "OUT", card: "NY_BAR_REFERRAL", auditEvent: "SCOPE_OUT_BUSINESS" }
        : { outcome: "CONTINUE" };

    case "ed_valuation_needed":
      return value === true
        ? { outcome: "OUT", card: "NY_BAR_REFERRAL", auditEvent: "SCOPE_OUT_VALUATION" }
        : { outcome: "CONTINUE" };

    case "ed_retirement_accounts": {
      const accounts = value as RetirementAccount[];
      let qdro = false;
      const flags: string[] = [];
      for (const a of accounts) {
        // Disagreement / uncertainty about division → out.
        if (a.division === "UNSURE") {
          return {
            outcome: "OUT",
            card: "NY_BAR_REFERRAL",
            auditEvent: "SCOPE_OUT_RETIREMENT_DISAGREEMENT",
          };
        }
        // QDRO-needed = IN SCOPE: flag for the attorney and continue.
        if (a.division === "SPLIT_AGREED" || a.division === "OTHER_AGREED") {
          if (a.accountType === "401K" || a.accountType === "PENSION") {
            qdro = true;
            flags.push("QDRO_NEEDED");
          }
          if (a.accountType === "MILITARY") {
            qdro = true;
            flags.push("MILITARY_RETIREMENT_DIVISION");
          }
          if (a.accountType === "DEFERRED_COMP") {
            flags.push("DEFERRED_COMP_DIVISION");
          }
          // IRA division (traditional or Roth) transfers without a QDRO —
          // no flag needed.
        }
        if (a.accountType === "UNSURE") {
          flags.push("RETIREMENT_TYPE_UNSURE");
        }
      }
      return { outcome: "CONTINUE", qdroFlag: qdro, attorneyFlags: dedupe(flags) };
    }

    case "grounds_basis":
      // "Something else / not sure" stays in scope but is flagged — the
      // attorney resolves grounds at the consult; the bot never advises.
      return value === "OTHER_UNSURE"
        ? { outcome: "CONTINUE", attorneyFlags: ["GROUNDS_UNRESOLVED"] }
        : { outcome: "CONTINUE" };

    case "prior_actions_any":
      return value === true
        ? { outcome: "CONTINUE", attorneyFlags: ["PRIOR_OR_PENDING_ACTIONS"] }
        : { outcome: "CONTINUE" };

    default:
      return { outcome: "CONTINUE" };
  }
}

function dedupe(a: string[]): string[] {
  return [...new Set(a)];
}
