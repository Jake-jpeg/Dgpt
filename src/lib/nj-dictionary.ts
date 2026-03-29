import { Locale } from './ny-dictionary';

export const njDictionary: Record<Locale, any> = {
  en: {
    hero: {
      title: "New Jersey Uncontested Divorce",
      subtitle: "Made Simple",
      description: "Get your divorce forms prepared and explained in plain language. No lawyers needed for simple, uncontested cases.",
      cta: "Check If You Qualify",
      fee: "$99 one-time fee • No hidden costs"
    },
    howToUse: {
      title: "How to Use",
      subtitle: "Quick tips to get the most out of DivorceGPT",
      cards: [
        { title: "Create Your Forms", desc: "Answer the questions. DivorceGPT prepares your documents step by step." },
        { title: "Reference Your Forms", desc: "Tell DivorceGPT which form you're asking about — Complaint, Certifications, Final Judgment, etc." },
        { title: "Ask About Filing", desc: "Not sure what to do with your forms? Ask about the filing process, court locations, fees, or what happens next." }
      ]
    },
    howItWorks: {
      title: "How It Works",
      subtitle: "Two phases. Answer questions, file your documents, done.",
      steps: [
        { title: "Check Eligibility", desc: "Answer a few questions to confirm this service is right for you." },
        { title: "Pay $99", desc: "One-time payment. No hidden fees. No subscriptions." },
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
        continueButton: "Continue with DivorceGPT ($99)"
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
  }
};
