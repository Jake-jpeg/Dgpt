/**
 * Sign-up copy (2026-11-07) — attorney-controlled. The sign-up collects a
 * verified identity (Google or Microsoft), a full name and a phone number;
 * nothing else. The reader acknowledges the disclaimers below, versioned, so
 * the record shows exactly what they were told.
 */
export const SIGNUP_DISCLAIMER_VERSION = "2026-11-07.1";

export const SIGNUP_COPY = {
  en: {
    title: "Sign up",
    lede: (firm: string) =>
      `Signing up lets you use the guide on our articles and tells ${firm} you may want to talk. The firm runs a conflict check first; it will call the number you give to follow up. Signing up does not make you a client.`,
    disclaimersTitle: "Please read and acknowledge each of these",
    disclaimers: (firm: string) => [
      `Signing up does not create an attorney-client relationship with ${firm}. You are not a client unless and until you sign a written engagement agreement.`,
      `Do not enter any confidential information anywhere on this site. Nothing you type here is privileged or confidential, and it is not protected by attorney-client privilege.`,
      `${firm}, the law firm assigned to you, will run a conflict check using your name before anyone speaks with you. If a conflict exists the firm will decline, and the little you provided here will not be used for any other purpose.`,
      `Everything on this site is general information about New York law and is attorney advertising. It is not legal advice and it is New York only.`,
      `You are giving your name and phone number so the firm can contact you. They are not shared with anyone else.`,
    ],
    continueGoogle: "Continue with Google",
    continueMsa: "Continue with Microsoft",
    detailsTitle: "Two things, and you're done",
    fullName: "Your full legal name",
    phone: "Mobile number",
    phoneHint: "US number. Used only for the conflict check and to reach you.",
    submit: "Finish sign-up",
    doneTitle: "You're signed up",
    done: (firm: string) => `${firm} will run a conflict check and call you. In the meantime you can use the guide on any article.`,
    toArticles: "Go to the articles",
    status: { NEW: "Conflict check pending", CLEARED: "Cleared — the firm will be in touch", REJECTED: "The firm is unable to assist with this matter" },
    rejected: (firm: string) => `${firm} has reviewed your sign-up and is unable to assist with this matter. Nothing you provided will be used for any other purpose.`,
  },
  ko: {
    title: "가입하기",
    lede: (firm: string) =>
      `가입하시면 저희 글에 있는 안내 도우미를 이용하실 수 있고, ${firm}에 상담 의사를 알리게 됩니다. 로펌은 먼저 이해충돌 확인을 거친 뒤 남겨주신 번호로 연락드립니다. 가입만으로 의뢰인이 되는 것은 아닙니다.`,
    disclaimersTitle: "아래 내용을 모두 읽고 확인해 주세요",
    disclaimers: (firm: string) => [
      `가입은 ${firm}과의 변호사-의뢰인 관계를 형성하지 않습니다. 서면 위임 계약서에 서명하기 전까지는 의뢰인이 아닙니다.`,
      `이 사이트 어디에도 비밀 정보를 입력하지 마세요. 여기에 입력하는 내용은 비밀이 보장되지 않으며 변호사-의뢰인 특권(privilege)의 보호를 받지 않습니다.`,
      `담당 로펌인 ${firm}은 누구와도 대화하기 전에 귀하의 이름으로 이해충돌 확인을 진행합니다. 충돌이 있으면 로펌은 수임을 거절하며, 여기에 제공하신 정보는 다른 목적으로 사용되지 않습니다.`,
      `이 사이트의 모든 내용은 뉴욕 법에 관한 일반 정보이자 변호사 광고입니다. 법률 자문이 아니며 뉴욕에만 해당합니다.`,
      `로펌이 연락할 수 있도록 이름과 전화번호를 제공하시는 것입니다. 다른 누구와도 공유되지 않습니다.`,
    ],
    continueGoogle: "Google로 계속하기",
    continueMsa: "Microsoft로 계속하기",
    detailsTitle: "두 가지만 알려주시면 끝입니다",
    fullName: "법적 성명(전체)",
    phone: "휴대전화 번호",
    phoneHint: "미국 번호. 이해충돌 확인과 연락 목적으로만 사용됩니다.",
    submit: "가입 완료",
    doneTitle: "가입이 완료되었습니다",
    done: (firm: string) => `${firm}이 이해충돌 확인 후 연락드리겠습니다. 그동안 모든 글에서 안내 도우미를 이용하실 수 있습니다.`,
    toArticles: "글 보러 가기",
    status: { NEW: "이해충돌 확인 중", CLEARED: "확인 완료 — 로펌이 연락드립니다", REJECTED: "로펌이 이 사안을 도와드릴 수 없습니다" },
    rejected: (firm: string) => `${firm}이 가입 내용을 검토한 결과 이 사안을 도와드릴 수 없습니다. 제공하신 정보는 다른 목적으로 사용되지 않습니다.`,
  },
} as const;

export const SIGNUP_RETURN_COOKIE = "dgpt_signup_return";

/** Normalize a US phone number to 10 digits; null if it is not one. */
export function normalizeUsPhone(raw: string): { digits: string; display: string } | null {
  const d = raw.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(d)) return null;
  return { digits: d, display: `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` };
}
