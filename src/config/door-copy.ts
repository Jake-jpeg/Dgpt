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
import { quoteFor, formatUsd } from "./pricing";

export type Lang = "en" | "ko";

const FEE_LO = formatUsd(quoteFor({ children: false, assets: false }).total);
const FEE_HI = formatUsd(quoteFor({ children: true, assets: true }).total);

/* ── Hero ────────────────────────────────────────────────────────────── */

export const HERO = {
  en: {
    eyebrow: (firm: string) => `${firm} · New York & New Jersey`,
    headline1: "Your divorce, handled by a lawyer.",
    headline2: "Get started in three minutes.",
    sub: `For genuinely uncontested divorces in New York and New Jersey. One spouse hires our firm; the other spouse participates through their own separate login and may have their own attorney review the agreement. An attorney reviews everything and files your papers — flat fee from ${FEE_LO}, plus court filing fees.`,
    cta: "Start with June",
    ctaNote: "June is an automated assistant, not a lawyer, and does not give legal advice.",
    haveCase: "I already have a case",
    // NJ RPC 7.1(a)(4)(v) / NY RPC 7.1: a fee RANGE must say what the fee depends on.
    meta: [`English · 한국어`, `Attorney-reviewed`, `Flat fee ${FEE_LO}–${FEE_HI}, depending on children and assets`],
    howTitle: "How it works",
    how: [
      ["Meet June", "Our set-up assistant takes eight quick details and gives you your exact fee."],
      ["Each of you completes the interview", "Separately, on your own phone. Neither of you sees the other's answers."],
      ["The attorney compares and meets you", "A one-hour video meeting with both of you before anything is drafted."],
      ["Prepared and filed by the firm", "You receive the finished papers from the firm."],
    ] as [string, string][],
  },
  ko: {
    eyebrow: (firm: string) => `${firm} · 뉴욕 & 뉴저지`,
    headline1: "변호사가 진행하는 이혼.",
    headline2: "3분이면 시작할 수 있습니다.",
    sub: `뉴욕과 뉴저지의 진정한 합의 이혼(uncontested divorce)을 위한 서비스입니다. 배우자 한 분이 저희 로펌을 선임하고, 다른 배우자는 별도의 본인 계정으로 참여하며 본인의 변호사에게 합의서 검토를 받으실 수 있습니다. 변호사가 모든 내용을 검토하고 서류를 법원에 제출합니다 — 정액 수임료 ${FEE_LO}부터, 법원 접수 비용 별도.`,
    cta: "June과 시작하기",
    ctaNote: "June은 자동화된 도우미이며 변호사가 아닙니다. 법률 자문을 제공하지 않습니다.",
    haveCase: "이미 사건이 있습니다",
    meta: [`English · 한국어`, `변호사 검토`, `정액 수임료 ${FEE_LO}–${FEE_HI} (자녀 및 재산 유무에 따라 결정)`],
    howTitle: "진행 방법",
    how: [
      ["June과 대화", "준비 도우미 June이 여덟 가지 간단한 정보를 받고 정확한 수임료를 안내합니다."],
      ["각자 질문지 작성", "각자의 휴대폰으로 따로 작성합니다. 서로의 답변은 볼 수 없습니다."],
      ["변호사가 비교하고 만납니다", "서류 작성 전에 두 분과 함께 1시간 화상 미팅을 진행합니다."],
      ["로펌이 작성하고 제출합니다", "완성된 서류를 로펌으로부터 받으십니다."],
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
    items: [
      {
        q: "Who does the attorney represent?",
        a: `${firm} represents one spouse — the one who hires us. We do not represent the other spouse and cannot give them legal advice.`,
      },
      {
        // AUDIT: the operator's draft read "We can connect your spouse with an
        // independent attorney for a flat-fee review." Steering the adverse,
        // unrepresented spouse to a particular lawyer sits badly with
        // NY/NJ RPC 4.3 (the only advice permitted is to secure counsel) and
        // invites RPC 7.2 referral questions. Neutral wording instead.
        q: "Does my spouse need their own lawyer?",
        a: "Not required, but they're free to have one. Your spouse may have any attorney of their choosing review the agreement before signing it.",
      },
      {
        // AUDIT: "we'll discuss other options" → with whom is now explicit,
        // so the unrepresented spouse does not read it as an offer to them.
        q: "What counts as \"uncontested\"?",
        a: "You both already agree on everything: property, debts, support, and, if you have children, custody and parenting time. If you disagree on anything, this service isn't the right fit, and we will discuss other options with the spouse who hired us.",
      },
      {
        q: "Why do we each log in separately?",
        a: "Each spouse answers the same questions privately. The attorney compares the answers to confirm you truly agree before anything is drafted.",
      },
      {
        q: "What does the flat fee include?",
        // Court fees verified 2026-10-30: NJ $300 complaint + $25 parenting
        // workshop when custody/parenting time is sought (njcourts.gov
        // self-help/divorce); NY $335 = index number $210 + RJI $95 + note of
        // issue $30 (CPLR 8018, 8020). [ATTORNEY VERIFY before launch — fees change.]
        a: "Preparing the agreement and divorce papers, attorney review, filing, and obtaining the judgment. Court filing fees are separate — currently about $335 in New York and $300 in New Jersey, plus a $25 parenting-workshop fee in New Jersey when there are children.",
      },
      {
        q: "Is June a lawyer?",
        a: "No. June is an automated assistant that collects your information. June does not give legal advice. A licensed attorney reviews everything.",
      },
    ],
  },
  ko: {
    title: "자주 묻는 질문",
    items: [
      {
        q: "변호사는 누구를 대리하나요?",
        a: `${firm}은 배우자 중 한 분, 즉 저희를 선임하신 분만 대리합니다. 다른 배우자는 대리하지 않으며 법률 자문을 드릴 수 없습니다.`,
      },
      {
        q: "배우자에게도 변호사가 필요한가요?",
        a: "필수는 아니지만 선임하실 수 있습니다. 배우자께서는 서명 전에 원하시는 변호사에게 합의서 검토를 받으실 수 있습니다.",
      },
      {
        q: "\"합의 이혼(uncontested)\"이란 무엇인가요?",
        a: "재산, 채무, 부양비, 그리고 자녀가 있는 경우 양육권과 면접교섭 등 모든 사항에 대해 두 분이 이미 합의하신 경우입니다. 한 가지라도 의견이 다르다면 이 서비스는 적합하지 않으며, 저희를 선임하신 분과 다른 방법을 상의하겠습니다.",
      },
      {
        q: "왜 각자 따로 로그인하나요?",
        a: "각 배우자가 같은 질문에 비공개로 답합니다. 변호사가 양쪽 답변을 비교하여 서류 작성 전에 실제로 합의가 이루어졌는지 확인합니다.",
      },
      {
        q: "정액 수임료에는 무엇이 포함되나요?",
        a: "합의서 및 이혼 서류 작성, 변호사 검토, 법원 제출, 그리고 판결(judgment) 취득이 포함됩니다. 법원 접수 비용은 별도이며, 현재 뉴욕 약 $335, 뉴저지 $300이고 뉴저지에서 자녀가 있는 경우 부모 교육(parenting workshop) 비용 $25가 추가됩니다.",
      },
      {
        q: "June은 변호사인가요?",
        a: "아닙니다. June은 정보를 수집하는 자동화된 도우미입니다. June은 법률 자문을 제공하지 않습니다. 모든 내용은 면허를 가진 변호사가 검토합니다.",
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
