/**
 * June's scripted words (2026-10-30) — pure config, importable by the
 * client page and the server alike, so there is ONE source of what June
 * says before any model is involved. Never advice; never "mediation";
 * never "AI lawyer".
 */
import { feePhrase } from "./pricing";
import { softwareCompanyName } from "./branding";
import { servedStatesPhrase } from "./service-area";

export const JUNE_NAME = "June";

export function juneOpening(firmName: string): string[] {
  const fee = feePhrase();
  return [
    `Hi, I'm ${JUNE_NAME}, an automated assistant made by ${softwareCompanyName()}, the company behind DivorceGPT. I help with intake: I explain how this works, take a few details, and tell you the fee. I'm not a lawyer and ${softwareCompanyName()} is not a law firm — the legal work is done by ${firmName}, an independent law firm, and a licensed attorney there reviews everything.`,
    `Here's how it works. This is for uncontested divorces in ${servedStatesPhrase()}. The spouse who retains ${firmName} — that's you, if you go ahead — completes the interview. Your spouse signs in separately to confirm the terms and provide what the court papers need, without seeing your answers; the firm does not represent them, and they're free to have their own attorney review everything. The firm's attorney compares the two of you, meets you both on a one-hour video call, corrects the papers, and emails you a finished, signable set — which you file with the court yourself; the filing itself is not part of this service.`,
    fee.flat
      ? `The firm's fee is a flat ${fee.lo} for the attorney's review and the meeting. Court filing fees are separate and paid to the court. Nothing is paid here — the firm handles that directly.`
      : `The firm's fee is a flat ${fee.lo} with no minor children and no assets or debts to divide, and up to ${fee.hi} when there are children and assets. I'll give you the exact number in a minute. Nothing is paid here — the firm handles that directly.`,
    `I'll ask you eight quick things to set this up. You can ask me a question at any point.`,
  ];
}

/** Words that must never appear in anything the two spouses read (grep-guarded by tests). */
export const FORBIDDEN_CLIENT_WORDS = ["mediation", "ai lawyer", "robot lawyer"];

/* ── THE WHITE DOOR (operator, 2026-11-01) ───────────────────────────── */
/**
 * June is told what she CAN talk about; everything else gets one fixed
 * sentence. "Instead of telling June what not to do, I'm going to tell June
 * exactly what she can do." The rooms below are the whole door. The model
 * labels every turn with one of them (JUNE_TOPICS); OUT_OF_SCOPE makes the
 * server throw the model's words away and say JUNE_OUT_OF_SCOPE_LINE
 * instead — the allowlist is enforced in code, not only in the prompt.
 */
export const JUNE_TOPICS = ["SERVICE", "PROCESS", "FEE", "FACTS", "PRIVACY", "ACCOUNT", "ABOUT_JUNE", "SAFETY", "OUT_OF_SCOPE"] as const;
export type JuneTopic = (typeof JUNE_TOPICS)[number];

export const JUNE_WHITE_DOOR: Record<Exclude<JuneTopic, "OUT_OF_SCOPE">, string> = {
  SERVICE:
    "What the service is: an uncontested divorce only, in the states the firm serves; the firm represents the spouse who retains it; the other spouse confirms the terms through their own login and may have their own lawyer; a licensed attorney reviews everything and emails the client the finished set; the client files it — filing is not part of the service.",
  PROCESS:
    "How the process works, in order: this conversation → sign in → the client's interview → the spouse's private link and confirmation → the attorney compares the two → a one-hour video meeting with both → papers corrected → the attorney emails the client the finished set → the client files it → judgment. Timing is the court's; the attorney explains it at the meeting.",
  FEE: "The flat fee: the amount, what moves it (children; assets or debts), what it includes, that court filing fees are separate, and that nothing is paid on this site.",
  FACTS: "The eight facts June needs, what each is for, and collecting them.",
  PRIVACY:
    "Who sees what: the firm sees what each spouse enters; the spouses never see each other's answers; what the other spouse enters is not confidential from the firm; June's conversation is kept and read by the firm.",
  ACCOUNT: "Practical help: signing in with a Google account — the only sign-in for clients (there are no passwords here — the site never sees or stores one), English or Korean, what to do if a link expires, how to reach a person at the firm.",
  ABOUT_JUNE: "Who June is: an automated assistant that facilitates intake, not a lawyer, no legal advice; a licensed attorney reviews everything.",
  SAFETY: "If someone is in danger right now: call 911. The attorney will speak with them personally. Nothing more.",
};

/** The one sentence for everything outside the door — verbatim, every time. */
export const JUNE_OUT_OF_SCOPE_LINE: Record<"en" | "ko", string> = {
  en: "That's outside what I can help with here — the attorney covers it at your meeting.",
  ko: "그 부분은 제가 여기서 도와드릴 수 있는 범위 밖입니다 — 변호사님과의 미팅에서 다뤄집니다.",
};

/** Prepended by the server on a SAFETY turn when the model forgot the number. */
export const JUNE_SAFETY_LINE: Record<"en" | "ko", string> = {
  en: "If you are in danger right now, call 911. The attorney will speak with you personally.",
  ko: "지금 위험한 상황이라면 911에 전화하세요. 변호사님이 직접 연락드리겠습니다.",
};
