import { Locale } from './ny-dictionary';

export const njDictionary: Record<Locale, any> = {
  en: {
    hero: {
      title: "New Jersey Uncontested Divorce",
      subtitle: "Made Simple",
      description: "Get your divorce forms prepared and explained in plain language. No lawyers needed for simple, uncontested cases.",
      cta: "Check If You Qualify",
      fee: "$500 one-time fee • No hidden costs"
    },
    howToUse: {
      title: "How to Use",
      subtitle: "Quick tips to get the most out of DivorceGPT",
      cards: [
        { title: "Create Your Forms", desc: "Answer the questions. DivorceGPT prepares your documents step by step." },
        { title: "Reference Your Forms", desc: "Tell DivorceGPT which form you're asking about — Complaint, Certifications, Final Judgment, etc." },
        { title: "Korean & English", desc: "Ask in Korean or English — whichever you prefer. 한국어 또는 영어로 질문하세요." },
        { title: "Ask About Filing", desc: "Not sure what to do with your forms? Ask about the filing process, court locations, fees, or what happens next." }
      ]
    },
    howItWorks: {
      title: "How It Works",
      subtitle: "Two phases. Answer questions, file your documents, done.",
      steps: [
        { title: "Check Eligibility", desc: "Answer a few questions to confirm this service is right for you." },
        { title: "Pay $500", desc: "One-time payment. No hidden fees. No subscriptions." },
        { title: "Get Your Forms", desc: "Receive your prepared divorce forms ready for filing." },
        { title: "Ask Questions", desc: "Use DivorceGPT to understand any part of the process." }
      ]
    },
    eligibilitySection: {
      title: "Is This Right For You?",
      subtitle: "This service is for New Jersey uncontested divorces with:",
      items: [
        "No children under 18 and neither party is pregnant",
        "No property or debts to divide",
        "No alimony / spousal support",
        "Both spouses agree to divorce",
        "Spouse will sign documents",
        "12+ months NJ residency"
      ],
      cta: "Check Your Eligibility"
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        { q: "Is this legal advice?", a: "No. DivorceGPT explains what divorce forms ask for and how to file them. It does not provide legal advice. For legal advice, consult an attorney." },
        { q: "What technology powers DivorceGPT?", a: "DivorceGPT uses advanced AI technology via a secure commercial API. Under our API provider's terms, your inputs are not used for AI model training and are automatically deleted within days. June Guided Solutions, LLC (the company behind DivorceGPT) does not retain any chat history or conversation data. If you need support, you must provide your own screenshot of the conversation — we have no way to retrieve it." },
        { q: "How long does the process take?", a: "You can complete your forms in minutes, but the overall divorce process takes time — the court needs to process filings between each phase. Timeline varies by county. Your session remains valid for 12 months to cover even the slowest courts." },
        { q: "How do I access my session?", a: "After payment, you'll be redirected to your session page. Bookmark this page — the URL is your access link. There are no accounts or passwords." },
        { q: "What if my spouse won't cooperate?", a: "This service is for uncontested divorces where both spouses agree. If your spouse won't cooperate, you may need a contested divorce attorney." },
        { q: "Can I get a refund?", a: "If you don't qualify after the eligibility check, you won't be charged. Once forms are generated, refunds are not available." }
      ]
    },
    qualify: {
      title: "Check Your Eligibility",
      subtitle: "Answer these questions to confirm this service is right for your situation.",
      successTitle: "You Qualify!",
      successMsg: "Based on your answers, you're eligible for our New Jersey uncontested divorce service.",
      failTitle: "Not Eligible",
      failMsg: "Based on your answers, this service may not be right for your situation.",
      reasons: "Reasons:",
      consult: "You may need to consult with a family law attorney for your specific situation.",
      yes: "Yes",
      no: "No",
      submit: "Check Eligibility",
      continue: "Continue to Payment",
      back: "Back to Home",
      questions: {
        residency: { q: "Has at least one spouse lived in New Jersey continuously for at least 12 months?", d: "NJ requires 12 consecutive months of residency by at least one party before filing." },
        children: { q: "Are there any unemancipated children of the marriage, or is either party currently pregnant?", d: "Includes children under 18 who are not self-supporting. If either spouse is currently pregnant, this must be answered Yes." },
        property: { q: "Is there any property, debts, pensions, or retirement accounts to divide?", d: "Real estate, 401(k), large debts, etc." },
        support: { q: "Is either spouse asking for spousal support (alimony)?", d: "Either now or in the future." },
        uncontested: { q: "Do both spouses agree to the divorce and will both cooperate with signing the required documents?", d: "Both parties want the divorce and the other spouse will sign Acknowledgment of Service before a notary." },
        military: { q: "Is your spouse currently serving in the U.S. military?", d: "Active duty, reserves on active orders, or National Guard on federal activation." },
        domesticViolence: { q: "Has there been any domestic violence case, restraining order, or order of protection between you and your spouse?", d: "This includes any current or past TRO, final restraining order, order of protection, or DV complaint — even if it was dismissed or withdrawn." }
      },
      militaryDisqualification: "DivorceGPT cannot prepare documents for cases where a spouse is currently serving in the U.S. military.\n\nActive duty service members have special legal protections under the Servicemembers Civil Relief Act (SCRA), including protections against default judgments. These cases require additional procedural steps and court oversight that fall outside the scope of this document preparation service.\n\nWe recommend consulting with a family law attorney who handles military divorce cases.",
      dvDisqualification: "DivorceGPT cannot prepare documents for cases involving domestic violence history between the parties.\n\nDomestic violence cases — including active or past restraining orders, orders of protection, or DV complaints — create legal complexities that fall outside the scope of this document preparation service. These may include address confidentiality requirements, modified service procedures, custody presumptions, and mandatory court disclosures.\n\nEven if the order was dismissed or has expired, the history must be disclosed on court forms and may affect how the court processes your case.\n\nWe recommend consulting with a family law attorney experienced in domestic violence matters. If you are in danger, contact the National Domestic Violence Hotline at 1-800-799-7233.",
      disclosure: {
        title: "What DivorceGPT Does",
        description: "DivorceGPT is a document preparation service. It uses the official forms required by the New Jersey Superior Court, Chancery Division — Family Part.",
        serviceTitle: "The service:",
        services: [
          "Transfers your answers onto the required forms",
          "Displays plain-language labels identifying what information each form field requests",
          "Generates a PDF packet for your review before filing"
        ],
        disclaimer: "DivorceGPT does not review your answers for legal sufficiency, provide legal advice, or represent you in court.",
        freeFormsTitle: "Free Forms Available",
        freeFormsDesc: "Official divorce forms are available from the New Jersey Courts website (njcourts.gov). DivorceGPT automates filling them in — you can always file them yourself for free.",
        continueButton: "Continue with DivorceGPT ($500)"
      },
      fields: {
        plaintiffName: { label: "Plaintiff Name", desc: "Person filing" },
        defendantName: { label: "Defendant Name", desc: "Other spouse" },
        filingCounty: { label: "Filing County", desc: "Where to file" },
        residencyBasis: { label: "Residency Basis", desc: "Who qualifies" },
        qualifyingAddress: { label: "Qualifying Address", desc: "Residency address" },
        phone: { label: "Phone", desc: "Court contact" },
        plaintiffAddress: { label: "Plaintiff Address", desc: "Mailing address" },
        defendantAddress: { label: "Defendant Address", desc: "Service address" },
        ceremonyType: { label: "Ceremony Type", desc: "Civil or Religious" },
        indexNumber: { label: "Docket Number", desc: "From clerk" },
        summonsDate: { label: "Filing Date", desc: "Date Complaint was filed with clerk" },
        marriageDate: { label: "Marriage Date", desc: "When married" },
        marriageCity: { label: "Marriage City", desc: "Where married" },
        marriageCounty: { label: "Marriage County", desc: "County where married" },
        marriageState: { label: "Marriage State", desc: "State/Country" },
        breakdownDate: { label: "Separation Date", desc: "Irreconcilable differences" },
        entryDate: { label: "Judgment Entry Date", desc: "Date clerk entered Final Judgment" },
        currentAddress: { label: "Current Address", desc: "For mailing" },
        summonsWithNotice: "Complaint for Divorce"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "Form Assistant",
      welcome: "Welcome to DivorceGPT",
      intro: "I can help explain your New Jersey divorce forms, what they ask for, and how to file them.",
      placeholder: "Ask about your divorce forms...",
      disclaimer: "DivorceGPT explains forms and procedures and may contain errors. This is not legal advice.",
      suggestions: [
        "What is the Complaint for Divorce?",
        "How do I file in Bergen County?",
        "What are filing fees?",
        "What are irreconcilable differences?"
      ]
    },
    forms: {
      hidePanel: "Hide Panel",
      showPanel: "Show Panel",
      sessionActive: "Session active",
      complete: "Complete",
      phase: "Phase",
      commence: "Commence",
      submit: "Submit",
      finalize: "Finalize",
      forms: "FORMS",
      divorceWorkflow: "DIVORCE WORKFLOW",
      needHelp: "Need help?",
      askInChat: "Just ask in the chat!",
      allDone: "All done!",
      askQuestions: "Ask questions about filing, procedures, or forms.",
      downloadUD1: "Download Complaint",
      downloadPackage: "Download Package",
      downloadFinalForms: "Download Final Forms",
      generating: "Generating...",
      haveIndexNumber: "I have my Docket Number → Phase 2",
      judgmentEntered: "Judgment Entered → Phase 3",
      startOver: "Start over",
      goBackPhase1: "← Go back to Phase 1",
      goBackPhase2: "← Go back to Phase 2",
      hidePanelContinue: "Hide Panel & Continue Chatting",
      typeAnswer: "Type your answer...",
      askAnything: "Ask me anything about your forms..."
    },
    legal: {
      privacyTitle: "Privacy Policy",
      termsTitle: "Terms of Service",
      lastUpdated: "Last updated: January 25, 2026",
      backHome: "Back to Home",
      officialNotice: "OFFICIAL NOTICE: The legally binding terms below are presented in English to ensure accuracy with New Jersey State law.",
      sections: {
        agreement: "Agreement to Terms",
        advice: "Important: Not Legal Advice",
        service: "Service Description",
        eligibility: "Eligibility",
        ai: "AI-Generated Content",
        payment: "Payment and Refunds",
        liability: "Limitation of Liability",
        contact: "Contact Us"
      }
    }
  },
  ko: {
    hero: {
      title: "뉴저지 무분쟁 이혼",
      subtitle: "간편하게",
      description: "이혼 양식을 쉬운 언어로 준비하고 설명해 드립니다. 간단한 무분쟁 사건에는 변호사가 필요하지 않습니다.",
      cta: "자격 확인하기",
      fee: "$500 일회성 비용 • 숨겨진 비용 없음"
    },
    howToUse: {
      title: "사용 방법",
      subtitle: "DivorceGPT를 최대한 활용하기 위한 빠른 팁",
      cards: [
        { title: "양식 작성", desc: "질문에 답하세요. DivorceGPT가 단계별로 문서를 준비합니다." },
        { title: "양식 참조", desc: "어떤 양식에 대해 묻고 있는지 DivorceGPT에 알려주세요 — 소장, 인증서, 최종 판결 등." },
        { title: "한국어 & 영어", desc: "한국어 또는 영어로 편하게 질문하세요. Ask in Korean or English." },
        { title: "제출에 대해 질문", desc: "양식으로 무엇을 해야 할지 모르시나요? 제출 과정, 법원 위치, 수수료 또는 다음 단계에 대해 질문하세요." }
      ]
    },
    howItWorks: {
      title: "작동 방식",
      subtitle: "두 단계. 질문에 답하고, 문서를 제출하면 끝.",
      steps: [
        { title: "자격 확인", desc: "몇 가지 질문에 답하여 이 서비스가 적합한지 확인하세요." },
        { title: "$500 결제", desc: "일회성 결제. 숨겨진 수수료 없음. 구독 없음." },
        { title: "양식 받기", desc: "제출 준비가 완료된 이혼 양식을 받으세요." },
        { title: "질문하기", desc: "DivorceGPT를 사용하여 과정의 모든 부분을 이해하세요." }
      ]
    },
    eligibilitySection: {
      title: "이것이 적합한가요?",
      subtitle: "이 서비스는 다음 조건의 뉴저지 무분쟁 이혼을 위한 것입니다:",
      items: [
        "18세 미만 자녀 없음",
        "분할할 재산이나 채무 없음",
        "배우자 부양료 요청 없음",
        "양측 모두 이혼에 동의",
        "배우자가 문서에 서명할 것임",
        "NJ 거주 12개월 이상"
      ],
      cta: "자격 확인하기"
    },
    faq: {
      title: "자주 묻는 질문",
      items: [
        { q: "이것이 법률 자문인가요?", a: "아닙니다. DivorceGPT는 이혼 양식이 무엇을 요구하는지와 제출 방법을 설명합니다. 법률 자문을 제공하지 않습니다. 법률 자문은 변호사에게 문의하세요." },
        { q: "DivorceGPT는 어떤 기술을 사용하나요?", a: "DivorceGPT는 안전한 상용 API를 통해 고급 AI 기술을 사용합니다. API 제공업체의 약관에 따라 귀하의 입력은 AI 모델 학습에 사용되지 않으며 며칠 내에 자동 삭제됩니다. June Guided Solutions, LLC(DivorceGPT 운영 회사)는 채팅 기록이나 대화 데이터를 일절 보관하지 않습니다. 지원이 필요한 경우 대화 스크린샷을 직접 제공해야 합니다 — 저희는 대화를 복구할 수 없습니다." },
        { q: "절차는 얼마나 걸리나요?", a: "양식은 몇 분 안에 완료할 수 있지만 전체 이혼 절차에는 시간이 걸립니다. 법원이 각 단계 사이에 제출물을 처리해야 합니다. 기간은 카운티에 따라 다릅니다. 세션은 12개월 동안 유효합니다." },
        { q: "세션에 어떻게 접근하나요?", a: "결제 후 세션 페이지로 리디렉션됩니다. 이 페이지를 북마크하세요 — URL이 접근 링크입니다. 계정이나 비밀번호가 없습니다." },
        { q: "배우자가 협조하지 않으면 어떻게 하나요?", a: "이 서비스는 양측이 동의하는 무분쟁 이혼을 위한 것입니다. 배우자가 협조하지 않으면 분쟁 이혼 변호사가 필요할 수 있습니다." },
        { q: "환불받을 수 있나요?", a: "자격 확인 후 자격이 안 되면 청구되지 않습니다. 양식이 생성되면 환불할 수 없습니다." }
      ]
    },
    qualify: {
      title: "자격 확인",
      subtitle: "이 질문에 답하여 이 서비스가 귀하의 상황에 적합한지 확인하세요.",
      successTitle: "자격이 됩니다!",
      successMsg: "귀하의 답변에 따르면 뉴저지 무분쟁 이혼 서비스를 이용할 자격이 있습니다.",
      failTitle: "자격 미달",
      failMsg: "귀하의 답변에 따르면 이 서비스가 귀하의 상황에 적합하지 않을 수 있습니다.",
      reasons: "이유:",
      consult: "귀하의 특정 상황에 대해 가정법 변호사와 상담해야 할 수 있습니다.",
      yes: "예",
      no: "아니오",
      submit: "자격 확인",
      continue: "결제로 계속",
      back: "홈으로 돌아가기",
      questions: {
        residency: { q: "배우자 중 최소 한 명이 뉴저지에 최소 12개월 연속 거주했나요?", d: "NJ는 제출 전 최소 한 쪽이 12개월 연속 거주해야 합니다." },
        children: { q: "결혼에서 미성년 자녀가 있나요, 또는 현재 임신 중인가요?", d: "자립하지 못하는 18세 미만 자녀를 포함합니다. 배우자 중 한 명이 현재 임신 중이면 예라고 답해야 합니다." },
        property: { q: "분할할 재산, 채무, 연금 또는 퇴직 계좌가 있나요?", d: "부동산, 401(k), 큰 채무 등." },
        support: { q: "배우자 중 누가 배우자 부양료를 요청하고 있나요?", d: "현재 또는 미래에." },
        uncontested: { q: "양측 모두 이혼에 동의하며, 필요한 서류 서명에 협조할 것인가요?", d: "양측 모두 이혼을 원하며, 상대 배우자가 공증인 앞에서 송달 확인서에 서명할 것입니다." },
        military: { q: "배우자가 현재 미국 군대에서 복무하고 있나요?", d: "현역, 현역 명령의 예비군, 또는 연방 활성화된 주 방위군." },
        domesticViolence: { q: "귀하와 배우자 사이에 가정 폭력 사건, 접근 금지 명령 또는 보호 명령이 있었나요?", d: "현재 또는 과거의 임시 접근 금지 명령, 최종 접근 금지 명령, 보호 명령 또는 가정 폭력 고소를 포함합니다 — 기각되거나 철회된 경우에도." }
      },
      militaryDisqualification: "DivorceGPT는 배우자가 현재 미국 군대에서 복무하는 경우 문서를 준비할 수 없습니다.\n\n현역 군인은 군인 민사 구제법(SCRA)에 따라 결석 판결 보호를 포함한 특별 법적 보호를 받습니다.\n\n군사 이혼 사건을 처리하는 가정법 변호사와 상담하시기 바랍니다.",
      dvDisqualification: "DivorceGPT는 당사자 간 가정 폭력 이력이 있는 경우 문서를 준비할 수 없습니다.\n\n가정 폭력 사건은 이 문서 준비 서비스의 범위를 벗어나는 법적 복잡성을 만듭니다.\n\n명령이 기각되었거나 만료된 경우에도 이력은 법원 양식에 공개해야 합니다.\n\n가정 폭력 문제에 경험이 있는 가정법 변호사와 상담하시기 바랍니다. 위험에 처해 있다면 전국 가정 폭력 핫라인 1-800-799-7233으로 연락하세요.",
      disclosure: {
        title: "DivorceGPT의 기능",
        description: "DivorceGPT는 문서 준비 서비스입니다. 뉴저지 고등법원 형평법부 — 가정부에서 요구하는 공식 양식을 사용합니다.",
        serviceTitle: "서비스 내용:",
        services: [
          "귀하의 답변을 필요한 양식에 입력합니다",
          "각 양식 필드가 요청하는 정보를 식별하는 쉬운 언어 레이블을 표시합니다",
          "제출 전 검토할 PDF 패키지를 생성합니다"
        ],
        disclaimer: "DivorceGPT는 귀하의 답변의 법적 충분성을 검토하지 않으며, 법률 자문을 제공하지 않으며, 법정에서 귀하를 대리하지 않습니다.",
        freeFormsTitle: "무료 양식 이용 가능",
        freeFormsDesc: "공식 이혼 양식은 뉴저지 법원 웹사이트(njcourts.gov)에서 이용할 수 있습니다. DivorceGPT는 작성을 자동화합니다 — 항상 직접 무료로 제출할 수 있습니다.",
        continueButton: "DivorceGPT 계속 사용($500)"
      },
      fields: {
        plaintiffName: { label: "원고 이름", desc: "제출자" },
        defendantName: { label: "피고 이름", desc: "상대 배우자" },
        filingCounty: { label: "제출 카운티", desc: "제출 장소" },
        residencyBasis: { label: "거주 근거", desc: "누가 자격이 있는지" },
        qualifyingAddress: { label: "자격 주소", desc: "거주 주소" },
        phone: { label: "전화번호", desc: "법원 연락처" },
        plaintiffAddress: { label: "원고 주소", desc: "우편 주소" },
        defendantAddress: { label: "피고 주소", desc: "송달 주소" },
        ceremonyType: { label: "결혼식 유형", desc: "민사 또는 종교" },
        indexNumber: { label: "사건 번호", desc: "서기로부터" },
        summonsDate: { label: "제출 날짜", desc: "소장 제출 날짜" },
        marriageDate: { label: "결혼 날짜", desc: "결혼 시기" },
        marriageCity: { label: "결혼 도시", desc: "결혼 장소" },
        marriageCounty: { label: "결혼 카운티", desc: "결혼한 카운티" },
        marriageState: { label: "결혼 주", desc: "주/국가" },
        breakdownDate: { label: "별거 날짜", desc: "화해 불가능한 차이" },
        entryDate: { label: "판결 등록 날짜", desc: "최종 판결 등록 날짜" },
        currentAddress: { label: "현재 주소", desc: "우편용" },
        summonsWithNotice: "이혼 소장"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "양식 도우미",
      welcome: "DivorceGPT에 오신 것을 환영합니다",
      intro: "뉴저지 이혼 양식, 요구 사항 및 제출 방법을 설명해 드릴 수 있습니다.",
      placeholder: "이혼 양식에 대해 질문하세요...",
      disclaimer: "DivorceGPT는 양식과 절차를 설명하며 오류가 있을 수 있습니다. 이것은 법률 자문이 아닙니다.",
      suggestions: [
        "이혼 소장이란 무엇인가요?",
        "Bergen 카운티에서 어떻게 제출하나요?",
        "제출 수수료는 얼마인가요?",
        "화해 불가능한 차이란 무엇인가요?"
      ]
    },
    forms: {
      hidePanel: "패널 숨기기",
      showPanel: "패널 표시",
      sessionActive: "세션 활성",
      complete: "완료",
      phase: "단계",
      commence: "시작",
      submit: "제출",
      finalize: "마무리",
      forms: "양식",
      divorceWorkflow: "이혼 워크플로우",
      needHelp: "도움이 필요하세요?",
      askInChat: "채팅에서 질문하세요!",
      allDone: "모두 완료!",
      askQuestions: "제출, 절차 또는 양식에 대해 질문하세요.",
      downloadUD1: "소장 다운로드",
      downloadPackage: "패키지 다운로드",
      downloadFinalForms: "최종 양식 다운로드",
      generating: "생성 중...",
      haveIndexNumber: "사건 번호가 있습니다 → 단계 2",
      judgmentEntered: "판결 등록됨 → 단계 3",
      startOver: "다시 시작",
      goBackPhase1: "← 단계 1로 돌아가기",
      goBackPhase2: "← 단계 2로 돌아가기",
      hidePanelContinue: "패널 숨기고 채팅 계속",
      typeAnswer: "답변을 입력하세요...",
      askAnything: "양식에 대해 무엇이든 질문하세요..."
    },
    legal: {
      privacyTitle: "개인정보 처리방침",
      termsTitle: "서비스 약관",
      lastUpdated: "최종 업데이트: 2026년 1월 25일",
      backHome: "홈으로 돌아가기",
      officialNotice: "공식 통지: 아래의 법적 구속력 있는 조건은 뉴저지 주법과의 정확성을 보장하기 위해 영어로 제시됩니다.",
      sections: {
        agreement: "약관 동의",
        advice: "중요: 법률 자문이 아님",
        service: "서비스 설명",
        eligibility: "자격",
        ai: "AI 생성 콘텐츠",
        payment: "결제 및 환불",
        liability: "책임 제한",
        contact: "연락처"
      }
    }
  },
};
