/**
 * Client-facing copy for the door (/portal), the second spouse's notice
 * (/join) and the compliance footer — attorney-controlled config
 * (2026-10-30, operator prompt "hero copy / FAQ / compliance footer /
 * second-spouse notice").
 *
 * Every string here is read by one or both spouses. Two languages, one
 * source: `en` is the operator's approved English; `ko` is a DRAFT
 * translation.
 *
 *   [ATTORNEY REVIEW — KOREAN] Every `ko` string in this file was drafted by
 *   the assistant on 2026-10-30 and has NOT been reviewed by a Korean-
 *   speaking attorney. Review before public launch. Legal terms of art are
 *   rendered in the respectful register (존댓말) with the English term kept
 *   in parentheses where a Korean reader may know the English word.
 *
 * Words that must never appear in anything a spouse reads are grep-guarded
 * by tests (see FORBIDDEN_CLIENT_WORDS in june-copy.ts).
 */
import { feePhrase } from "./pricing";
import { softwareCompanyName } from "./branding";

export type Lang = "en" | "ko";

const FEE = feePhrase();
const FEE_LO = FEE.lo;
const FEE_HI = FEE.hi;
const FEE_RANGE_EN = FEE.flat ? `Flat fee ${FEE_LO}` : `Flat fee ${FEE_LO}–${FEE_HI}, depending on children and assets`;
const FEE_RANGE_KO = FEE.flat ? `정액 수임료 ${FEE_LO}` : `정액 수임료 ${FEE_LO}–${FEE_HI} (자녀 및 재산 유무에 따라 결정)`;
const SOFTWARE = softwareCompanyName();

/* ── Hero ────────────────────────────────────────────────────────────── */

export const HERO = {
  en: {
    eyebrow: (firm: string) => `${firm} · New York`,
    headline1: "An uncontested New York divorce, reviewed by a lawyer.",
    headline2: "Get started in three minutes.",
    sub: (firm: string) =>
      `For New York couples who already agree. The software prepares your papers from what you both tell it; one spouse retains ${firm}, an independent law firm, whose attorney reviews everything, meets you both, and hands you a finished set to file. The other spouse signs in separately to confirm the terms — and is free to have their own attorney review everything. ${FEE.flat ? `Flat ${FEE_LO}` : `From ${FEE_LO}`}, plus court filing fees.`,
    cta: "Start with June",
    ctaNote: `June is an automated assistant made by ${SOFTWARE}, which is not a law firm. June is not a lawyer and does not give legal advice.`,
    haveCase: "I already have a case",
    // NJ RPC 7.1(a)(4)(v) / NY RPC 7.1: a fee RANGE must say what the fee depends on.
    meta: [`New York`, `English · 한국어`, `Attorney-reviewed`, FEE_RANGE_EN],
    howTitle: "How it works",
    how: [
      ["Meet June", "An automated assistant takes eight quick details and tells you your exact fee."],
      ["Our client completes the interview", "The other spouse signs in separately and confirms the terms — without seeing the client's answers."],
      ["The attorney compares and meets you both", "A one-hour video meeting; the attorney corrects the papers."],
      ["You file the finished papers", "At the County Clerk or through NYSCEF — the firm shows you exactly how."],
    ] as [string, string][],
  },
  ko: {
    eyebrow: (firm: string) => `${firm} · 뉴욕`,
    headline1: "변호사가 검토하는 뉴욕 합의 이혼.",
    headline2: "3분이면 시작할 수 있습니다.",
    sub: (firm: string) =>
      `이미 모든 사항에 합의하신 뉴욕 부부를 위한 서비스입니다. 소프트웨어가 두 분이 입력한 내용으로 서류를 준비하고, 배우자 한 분이 독립 로펌인 ${firm}을 선임하면 그 변호사가 모든 내용을 검토하고 두 분을 만난 뒤 완성된 서류를 드립니다 — 제출은 직접 하십니다. 다른 배우자는 별도로 로그인하여 합의 내용을 확인하며, 본인의 변호사에게 모든 내용을 검토받으실 수 있습니다. ${FEE.flat ? `정액 ${FEE_LO}` : `${FEE_LO}부터`}, 법원 접수 비용 별도.`,
    cta: "June과 시작하기",
    ctaNote: `June은 로펌이 아닌 ${SOFTWARE}가 만든 자동화된 도우미입니다. June은 변호사가 아니며 법률 자문을 제공하지 않습니다.`,
    haveCase: "이미 사건이 있습니다",
    meta: [`뉴욕`, `English · 한국어`, `변호사 검토`, FEE_RANGE_KO],
    howTitle: "진행 방법",
    how: [
      ["June과 대화", "자동화된 도우미가 여덟 가지 간단한 정보를 받고 정확한 수임료를 안내합니다."],
      ["의뢰인이 질문지를 작성합니다", "다른 배우자는 별도로 로그인하여 의뢰인의 답변을 보지 않고 합의 내용을 확인합니다."],
      ["변호사가 비교하고 두 분을 만납니다", "1시간 화상 미팅 후 변호사가 서류를 수정합니다."],
      ["완성된 서류를 직접 제출합니다", "County Clerk 또는 NYSCEF로 — 방법은 로펌이 정확히 안내합니다."],
    ] as [string, string][],
  },
} as const;

/* ── FAQ (operator's six Q&As, 2026-10-30; two answers amended on audit) ── */

export interface Faq {
  q: string;
  a: string;
}

export const faqFor = (firm: string): Record<Lang, { title: string; items: Faq[] }> => ({
  en: {
    title: "Questions people ask",
    // Consolidated 2026-10-31 (operator): one answer on representation,
    // one on the two sign-ins, instead of six overlapping ones.
    items: [
      {
        q: "Who makes this, and who is my lawyer?",
        a: `DivorceGPT is software made by ${SOFTWARE}, which is not a law firm and gives no legal advice. Your lawyer is ${firm}, an independent law firm that you retain under its own written agreement. The firm represents the spouse who retains it only; it does not represent or advise the other spouse — who is free to have any attorney of their choosing review the agreement before signing.`,
      },
      {
        q: "Why two sign-ins?",
        a: "So each of you speaks for yourself. Our client completes the interview. The other spouse signs in separately and, without seeing the client's answers, confirms the terms of the agreement and provides the information the court papers require — nothing more. The attorney compares the two before anything is drafted; if a term doesn't match, it's raised with both of you first. What the other spouse enters is seen by the firm and isn't confidential from it.",
      },
      {
        q: "What does \"uncontested\" mean here?",
        a: "You both already agree on everything: property, debts, support and, if you have children, custody and parenting time. If anything is disputed, this isn't the right service, and the attorney will discuss other options with our client.",
      },
      {
        // Court fees verified 2026-10-30: NJ $300 complaint + $25 parenting
        // workshop when custody/parenting time is sought (njcourts.gov
        // self-help/divorce); NY $335 = index number $210 + RJI $95 + note of
        // issue $30 (CPLR 8018, 8020). [ATTORNEY VERIFY before launch — fees change.]
        q: "What does the fee cover — and what doesn't it?",
        a: `${FEE.flat ? `The firm's flat ${FEE_LO} covers` : `The firm's fee covers`} the attorney's review of the papers the software prepared, the corrections, the one-hour meeting with both of you, and a finished, signable set. You file it yourself — at the County Clerk or through NYSCEF — and the firm shows you exactly how. New York court filing fees are separate, paid directly to the court — currently about $335 (index number, RJI and note of issue).`,
      },
      {
        q: "We're in New Jersey — can you help?",
        a: "Not through this site yet: DivorceGPT takes New York cases only for now. If both of you live in New Jersey, contact the firm directly.",
      },
      {
        q: "What is June?",
        a: "An automated assistant that facilitates intake: she explains the process, collects basic information, and tells you your fee. She is not a lawyer, gives no legal advice, and a licensed attorney reviews everything she collects.",
      },
    ],
  },
  ko: {
    title: "자주 묻는 질문",
    items: [
      {
        q: "누가 만든 서비스이고, 제 변호사는 누구인가요?",
        a: `DivorceGPT는 로펌이 아닌 ${SOFTWARE}가 만든 소프트웨어이며 법률 자문을 제공하지 않습니다. 귀하의 변호사는 별도의 서면 계약으로 선임하시는 독립 로펌 ${firm}입니다. 로펌은 선임한 배우자만을 대리하며 다른 배우자를 대리하거나 자문하지 않습니다. 다른 배우자는 서명 전에 원하시는 변호사에게 합의서 검토를 받으실 수 있습니다.`,
      },
      {
        q: "왜 두 사람이 따로 로그인하나요?",
        a: "각자 본인의 입장을 직접 말씀하시기 위해서입니다. 의뢰인이 질문지를 작성하고, 다른 배우자는 별도로 로그인하여 의뢰인의 답변을 보지 않은 채 합의 내용을 확인하고 법원 서류에 필요한 정보만 제공합니다. 변호사는 서류 작성 전에 양쪽 내용을 비교하며, 일치하지 않는 항목이 있으면 먼저 두 분과 이야기합니다. 다른 배우자가 입력한 내용은 로펌이 열람하며 로펌에 대해 비밀로 유지되지 않습니다.",
      },
      {
        q: "여기서 \"합의 이혼(uncontested)\"이란 무엇인가요?",
        a: "재산, 채무, 부양비, 그리고 자녀가 있는 경우 양육권과 면접교섭 등 모든 사항에 대해 두 분이 이미 합의하신 경우입니다. 한 가지라도 다툼이 있다면 이 서비스는 적합하지 않으며, 변호사가 의뢰인과 다른 방법을 상의합니다.",
      },
      {
        q: "수임료에 포함되는 것과 포함되지 않는 것은?",
        a: `로펌의 ${FEE.flat ? `정액 ${FEE_LO}` : "수임료"}에는 소프트웨어가 준비한 서류에 대한 변호사 검토, 수정, 두 분과의 1시간 미팅, 그리고 서명 가능한 완성본이 포함됩니다. 제출은 County Clerk 또는 NYSCEF를 통해 직접 하시며, 방법은 로펌이 정확히 안내합니다. 뉴욕 법원 접수 비용은 별도로 법원에 직접 납부하며 현재 약 $335입니다 (index number, RJI, note of issue).`,
      },
      {
        q: "뉴저지에 살고 있는데 도움을 받을 수 있나요?",
        a: "아직 이 사이트를 통해서는 어렵습니다. DivorceGPT는 현재 뉴욕 사건만 받고 있습니다. 두 분 모두 뉴저지에 거주하신다면 로펌에 직접 문의해 주세요.",
      },
      {
        q: "June은 무엇인가요?",
        a: "접수 절차를 돕는 자동화된 도우미입니다. 진행 방법을 설명하고 기본 정보를 수집하며 수임료를 안내합니다. June은 변호사가 아니고 법률 자문을 제공하지 않으며, 수집된 모든 내용은 면허를 가진 변호사가 검토합니다.",
      },
    ],
  },
});

/* ── Sign-in card ────────────────────────────────────────────────────── */

export const SIGNIN = {
  en: {
    kicker: "Already have a case?",
    title: "Sign back in.",
    sub: "Use the Google (Gmail) or Microsoft (Outlook.com / Hotmail) account you used before. If your spouse sent you an invitation, open that link instead — it signs you in and seats you on the case.",
    google: "Continue with Google",
    msa: "Continue with Outlook / Hotmail",
    staff: (firm: string) => `${firm} staff:`,
  },
  ko: {
    kicker: "이미 사건이 있으신가요?",
    title: "다시 로그인하세요.",
    sub: "이전에 사용하신 Google(Gmail) 또는 Microsoft(Outlook.com / Hotmail) 계정으로 로그인하세요. 배우자가 초대 링크를 보냈다면 그 링크를 여세요 — 로그인과 동시에 사건에 참여하게 됩니다.",
    google: "Google로 계속하기",
    msa: "Outlook / Hotmail로 계속하기",
    staff: (firm: string) => `${firm} 직원:`,
  },
} as const;

/* ── Second-spouse notice (RPC 4.3, both states) ─────────────────────── */

/** Bump when the words change — the acknowledgment stores the version it was given. */
export const SPOUSE_NOTICE_VERSION = "2026-10-30.1";

export const SPOUSE_NOTICE = {
  en: {
    title: "Please read before you continue",
    // Operator's three sentences, plus one on confidentiality (audit): the
    // second spouse must not mistake the system for a neutral or private
    // channel — RPC 4.3 requires correcting that misunderstanding.
    body: (firm: string) =>
      `${firm} represents your spouse, not you. We cannot give you legal advice. You have the right to consult your own attorney before signing anything. What you enter here is provided to ${firm}, your spouse's attorney, and is not confidential as to the firm.`,
    ack: "I have read and understand this notice.",
    cta: "Join and start my questionnaire",
  },
  ko: {
    title: "계속하기 전에 읽어 주세요",
    body: (firm: string) =>
      `${firm}은 귀하가 아닌 귀하의 배우자를 대리합니다. 저희는 귀하께 법률 자문을 드릴 수 없습니다. 귀하는 어떤 서류에든 서명하기 전에 본인의 변호사와 상담할 권리가 있습니다. 여기에 입력하시는 내용은 귀하 배우자의 변호사인 ${firm}에 제공되며, 로펌에 대해 비밀로 유지되지 않습니다.`,
    ack: "위 안내문을 읽고 이해했습니다.",
    cta: "참여하고 질문지 시작하기",
  },
} as const;

/* ── Compliance footer (NY RPC 7.1(f), 7.1(h); harmless in NJ) ──────── */

export const FOOTER = {
  en: { attorneyAdvertising: "Attorney Advertising" },
  ko: { attorneyAdvertising: "변호사 광고 (Attorney Advertising)" },
} as const;

/**
 * Office address and phone for the footer. NY RPC 7.1(h) requires the
 * principal law office address and telephone number on the website. Set
 * NEXT_PUBLIC_FIRM_ADDRESS / NEXT_PUBLIC_FIRM_PHONE in the deployment — the
 * repo is public, so no address lives in source. Until set, the visible
 * placeholders make the gap obvious.
 */
export function firmAddressLine(): string {
  return process.env.NEXT_PUBLIC_FIRM_ADDRESS || "[FIRM ADDRESS]";
}
export function firmPhoneLine(): string {
  return process.env.NEXT_PUBLIC_FIRM_PHONE || "[FIRM PHONE]";
}

/* ── UI chrome ───────────────────────────────────────────────────────── */

export const LANG_TOGGLE: Record<Lang, string> = { en: "English", ko: "한국어" };
