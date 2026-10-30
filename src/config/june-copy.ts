/**
 * June's scripted words (2026-10-30) — pure config, importable by the
 * client page and the server alike, so there is ONE source of what June
 * says before any model is involved. Never advice; never "mediation";
 * never "AI lawyer".
 */
import { quoteFor, formatUsd } from "./pricing";

export const JUNE_NAME = "June";

export function juneOpening(firmName: string): string[] {
  const lo = formatUsd(quoteFor({ children: false, assets: false }).total);
  const hi = formatUsd(quoteFor({ children: true, assets: true }).total);
  return [
    `Hi, I'm ${JUNE_NAME}. DivorceGPT is a service of ${firmName}. I'm the assistant who gets your case set up; the firm's attorney reviews everything, meets with both of you, and prepares and files the divorce. I'm not a lawyer and I can't give legal advice.`,
    `Here's how it works. You and your spouse each sign in with your own account and each answer the same questionnaire, separately — neither of you sees the other's answers. When you've both finished, the attorney compares them: if you agree on everything, your case goes to the firm for review and a one-hour video meeting with both of you. If something doesn't match, the attorney talks it through with you before anything is drafted.`,
    `The fee is a flat ${lo} for an uncontested divorce with no minor children and no assets or debts to divide, and up to ${hi} when there are children and assets. I'll give you the exact number in a minute. Nothing is paid here — the firm handles that directly.`,
    `I'll ask you eight quick things to set this up. You can ask me a question at any point.`,
  ];
}

/** Words that must never appear in anything the two spouses read (grep-guarded by tests). */
export const FORBIDDEN_CLIENT_WORDS = ["mediation", "ai lawyer", "robot lawyer"];
