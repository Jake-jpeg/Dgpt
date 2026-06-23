// ───────────────────────────────────────────────────────────────
// Korean blog content. Add new posts to the POSTS array.
// Body is structured (heading + paragraphs) so it renders without any
// markdown dependency. Brand names stay in English inside Korean text.
// ───────────────────────────────────────────────────────────────

export interface BlogSection {
  heading?: string;
  paragraphs: string[];
}

export interface BlogPost {
  slug: string;
  title: string;        // Korean title
  description: string;  // Korean meta description (SEO)
  date: string;         // ISO date
  readingTime: string;  // e.g. "5분"
  sections: BlogSection[];
}

export const POSTS: BlogPost[] = [
  {
    slug: "welcome-korean-uncontested-divorce",
    title: "DivorceGPT에 오신 것을 환영합니다 — 한국어로 준비하는 뉴욕·뉴저지 합의 이혼",
    description:
      "뉴욕과 뉴저지에서 변호사 없이 합의 이혼(무쟁점 이혼) 서류를 한국어로 준비하는 방법을 안내합니다. DivorceGPT가 어떻게 도와드리는지, 누가 이용할 수 있는지 알아보세요.",
    date: "2026-06-23",
    readingTime: "6분",
    sections: [
      {
        paragraphs: [
          "안녕하세요. DivorceGPT는 뉴욕과 뉴저지에서 합의 이혼 서류를 준비하시는 분들을 위한 한국어·영어 서비스입니다. 이 첫 글에서는 합의 이혼이 무엇인지, 어떤 경우에 이용하실 수 있는지, 그리고 한국어 지원이 어떻게 이루어지는지 간단히 설명해 드립니다.",
        ],
      },
      {
        heading: "합의 이혼(무쟁점 이혼)이란 무엇인가요?",
        paragraphs: [
          "합의 이혼은 두 배우자가 이혼 자체와 주요 조건에 모두 동의하여 다툼 없이 진행하는 이혼을 말합니다. 영어로는 'uncontested divorce'라고 합니다. 법정에서 다투는 절차가 없기 때문에 시간과 비용이 크게 줄어듭니다.",
          "DivorceGPT는 가장 단순한 형태의 합의 이혼을 대상으로 합니다. 즉, 미성년 자녀가 없고, 나눠야 할 재산이나 부채가 없으며, 어느 쪽도 배우자 부양료(위자료)를 청구하지 않고, 두 분 모두 이혼에 동의하는 경우입니다.",
        ],
      },
      {
        heading: "누가 이용할 수 있나요?",
        paragraphs: [
          "다음 조건에 모두 해당하시면 DivorceGPT를 이용하실 수 있습니다. 미성년 자녀가 없고 임신 중이 아니어야 하며, 분할할 재산·연금·부채가 없어야 합니다. 배우자 부양료 청구가 없어야 하고, 두 분이 이혼에 합의해야 하며, 상대 배우자가 서류 절차에 협조해야 합니다. 또한 최소 한 분이 거주 요건(residency)을 충족해야 합니다.",
          "현역 군인이 관련된 경우, 가정폭력 이력이 있는 경우, 또는 자녀·재산·부양료 등에서 다툼이 있는 경우에는 이 서비스 대상이 아닙니다. 이러한 경우에는 변호사와 상담하시기를 권장합니다.",
        ],
      },
      {
        heading: "어떻게 진행되나요?",
        paragraphs: [
          "먼저 간단한 자격 확인 절차를 거칩니다. 그다음 AI가 질문을 통해 필요한 정보를 모으고, 법원 제출용 서류를 단계별로 준비해 드립니다. 작성된 서류를 직접 검토하신 후 법원에 제출하시면 됩니다.",
          "중요한 점은, 모든 법원 제출 서류는 영어로 작성된다는 것입니다. 뉴욕과 뉴저지 법원은 영어 서류를 요구하기 때문입니다. 다만 안내와 설명은 한국어로 받으실 수 있습니다. 제출 전에 영어 서류를 주의 깊게 검토하시거나, 영어를 읽을 수 있는 분 또는 변호사의 검토를 받으시기를 권장합니다.",
        ],
      },
      {
        heading: "한국어 지원에 대하여",
        paragraphs: [
          "DivorceGPT는 한국어와 영어로 이용하실 수 있습니다. 페이지 상단의 한국어 / EN 버튼으로 언어를 선택하세요. 양식 작성 단계의 AI 도우미는 한국어로 질문에 답하고 절차를 안내합니다.",
          "단, 사회보장번호(SSN), 은행 계좌번호 등 민감한 개인정보는 절대 채팅에 입력하지 마세요. DivorceGPT는 이러한 정보를 필요로 하지 않으며, 저장하거나 처리하지 않습니다. 법원 양식에 해당 정보가 필요한 경우, 출력된 서류에 직접 작성하시면 됩니다.",
        ],
      },
      {
        heading: "중요 고지",
        paragraphs: [
          "DivorceGPT는 서류 준비 서비스이며 법률 사무소가 아닙니다. 법률 자문을 제공하지 않으며, 이용으로 인해 변호사-의뢰인 관계가 성립하지 않습니다. 본 글은 일반적인 정보 제공을 위한 것이며 특정 사안에 대한 법률 자문이 아닙니다. 구체적인 사정이 있으신 경우 라이선스를 보유한 변호사와 상담하시기 바랍니다.",
        ],
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return POSTS.map((p) => p.slug);
}
