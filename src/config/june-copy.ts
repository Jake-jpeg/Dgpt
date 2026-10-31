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
    `Hi, I'm ${JUNE_NAME}, an automated assistant for ${firmName}. I help with intake: I explain how this works, take a few details, and tell you your fee. I'm not a lawyer and I can't give legal advice — a licensed attorney reviews everything.`,
    `Here's how it works. The spouse who retains the firm — that's you, if you go ahead — completes the interview; the firm's attorney represents you, prepares the agreement and the divorce papers, files them, and sees the case through to judgment. Your spouse signs in separately to confirm the terms and provide what the court papers need, without seeing your answers; the firm does not represent them, and they're free to have their own attorney review everything. The attorney compares the two of you before anything is drafted, and meets you both on a one-hour video call.`,
    `The fee is a flat ${lo} for an uncontested divorce with no minor children and no assets or debts to divide, and up to ${hi} when there are children and assets. I'll give you the exact number in a minute. Nothing is paid here — the firm handles that directly.`,
    `I'll ask you eight quick things to set this up. You can ask me a question at any point.`,
  ];
}

/** Words that must never appear in anything the two spouses read (grep-guarded by tests). */
export const FORBIDDEN_CLIENT_WORDS = ["mediation", "ai lawyer", "robot lawyer"];
