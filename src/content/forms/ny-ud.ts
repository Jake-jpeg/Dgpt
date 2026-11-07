/**
 * The New York uncontested-divorce packet, described (2026-11-07).
 *
 * Reference content for /forms and for the reader's guide on the articles:
 * what each official form IS, who signs it, when it is used, and what it
 * looks like on the page — never what to put in it. The guide explains a
 * form; it does not fill one in or say what a particular reader should
 * write (the solid black door). Links go to the court system's own pages.
 *
 * Sources: NY Unified Court System, Uncontested Divorce Forms & Instructions
 * (https://ww2.nycourts.gov/divorce/forms_instructions/index.shtml) and the
 * DIY Uncontested Divorce Program (https://www.nycourts.gov/courthelp/diy/divorce.shtml).
 * [ATTORNEY VERIFY descriptions against the current form revisions before launch.]
 */
export interface UdForm {
  code: string;
  title: string;
  titleKo: string;
  /** When in the case it is used. */
  stage: "Starting the case" | "The packet (after the other spouse signs)" | "After the judgment";
  stageKo: string;
  /** Who signs it. */
  signedBy: string;
  signedByKo: string;
  /** What it is for, plainly. */
  purpose: string;
  purposeKo: string;
  /** What the page looks like: its parts, top to bottom. */
  looksLike: string[];
  looksLikeKo: string[];
  official: string;
}

const FORMS_INDEX = "https://ww2.nycourts.gov/divorce/forms_instructions/index.shtml";

export const NY_UD_FORMS: UdForm[] = [
  {
    code: "UD-1",
    title: "Summons with Notice",
    titleKo: "소환장 (Summons with Notice)",
    stage: "Starting the case",
    stageKo: "사건 시작",
    signedBy: "The plaintiff (or the plaintiff's attorney)",
    signedByKo: "원고 (또는 원고 변호사)",
    purpose:
      "The paper that starts the divorce. It is filed with the County Clerk to get an index number, then served on the other spouse. It tells the other spouse that an action for divorce has begun and what relief is being asked for, without the full complaint.",
    purposeKo: "이혼 소송을 시작하는 서류입니다. 카운티 서기(County Clerk)에 제출하여 사건번호(index number)를 받은 뒤 배우자에게 송달합니다.",
    looksLike: [
      "A caption at the top: Supreme Court of the State of New York, the county, the plaintiff's and defendant's names, and a box for the index number and date filed.",
      "The word SUMMONS WITH NOTICE, then a paragraph addressed to the defendant stating that an action for divorce has been commenced and the time to appear (20 or 30 days depending on how it is served).",
      "A 'Notice' section stating the grounds — in nearly every uncontested case, irretrievable breakdown for at least six months (DRL § 170(7)) — and the relief requested, often with a checklist of ancillary relief such as custody, support, equitable distribution, and a name change.",
      "The plaintiff's or attorney's signature block with address and phone, and the defendant's address for service.",
    ],
    looksLikeKo: ["상단 캡션(법원, 카운티, 원고·피고 이름, 사건번호 칸)", "SUMMONS WITH NOTICE 제목과 피고에게 보내는 통지문", "이혼 사유와 청구 내용이 적힌 'Notice' 부분", "원고 또는 변호사 서명란과 주소"],
    official: FORMS_INDEX,
  },
  {
    code: "UD-2",
    title: "Verified Complaint",
    titleKo: "소장 (Verified Complaint)",
    stage: "Starting the case",
    stageKo: "사건 시작",
    signedBy: "The plaintiff, sworn before a notary (verified)",
    signedByKo: "원고 (공증 선서)",
    purpose:
      "The formal pleading. Numbered paragraphs state the facts the court needs: where the parties live, when and where they married, the children, the ground for divorce, and the relief sought. 'Verified' means the plaintiff swears the statements are true.",
    purposeKo: "공식 소장입니다. 번호가 매겨진 문단으로 거주지, 혼인 일시·장소, 자녀, 이혼 사유, 청구 내용을 진술하고 원고가 사실임을 선서합니다.",
    looksLike: [
      "The same caption as the summons, titled VERIFIED COMPLAINT, 'Action for a Divorce'.",
      "Numbered paragraphs, usually FIRST through about TENTH: residence of each party, the marriage (date, place, civil or religious ceremony), the children with names and birth dates, the residency requirement that is met, the ground, and prior actions.",
      "A 'WHEREFORE' clause listing what the plaintiff asks the court to order.",
      "A verification page: the plaintiff's sworn statement before a notary that the complaint is true.",
    ],
    looksLikeKo: ["소환장과 같은 캡션, 제목 VERIFIED COMPLAINT", "FIRST, SECOND… 번호 문단(거주지, 혼인, 자녀, 사유, 이전 소송)", "청구 내용을 적은 WHEREFORE 조항", "공증 선서 페이지(verification)"],
    official: FORMS_INDEX,
  },
  {
    code: "UD-3",
    title: "Affidavit of Service",
    titleKo: "송달 진술서 (Affidavit of Service)",
    stage: "Starting the case",
    stageKo: "사건 시작",
    signedBy: "The person who delivered the papers (not the plaintiff), sworn before a notary",
    signedByKo: "서류를 전달한 사람 (원고 아님), 공증 선서",
    purpose:
      "Proof that the defendant was personally handed the summons (and complaint, if used) along with the Notice of Automatic Orders and the Notice of Guideline Maintenance. New York requires personal delivery by someone over 18 who is not a party.",
    purposeKo: "피고에게 서류가 직접 전달되었음을 증명합니다. 18세 이상의 제3자가 전달해야 합니다.",
    looksLike: [
      "The caption, titled AFFIDAVIT OF SERVICE.",
      "Blanks for the server's name and address, the date, time and place of delivery, and exactly which papers were delivered.",
      "A description of the person served (sex, skin color, hair, approximate age, height and weight) and a statement about military service.",
      "The server's signature and a notary's jurat.",
    ],
    looksLikeKo: ["캡션, 제목 AFFIDAVIT OF SERVICE", "송달자 이름·주소, 송달 일시·장소, 전달한 서류", "피송달자 인상착의와 군복무 여부 진술", "송달자 서명과 공증"],
    official: FORMS_INDEX,
  },
  {
    code: "UD-4",
    title: "Sworn Statement of Removal of Barriers to Remarriage",
    titleKo: "재혼 장애 제거 선서 진술서 (UD-4)",
    stage: "The packet (after the other spouse signs)",
    stageKo: "패킷 (배우자 서명 후)",
    signedBy: "The plaintiff (and the defendant on UD-4a), sworn",
    signedByKo: "원고 (UD-4a는 피고), 선서",
    purpose:
      "Required only when the marriage was performed in a religious ceremony. The spouse swears they have taken, or will take, all steps within their power to remove any religious barrier to the other spouse's remarriage (DRL § 253).",
    purposeKo: "종교 의식으로 혼인한 경우에만 필요합니다. 배우자의 재혼에 대한 종교적 장애를 제거하겠다는 선서입니다 (DRL § 253).",
    looksLike: ["The caption and title.", "One or two sworn paragraphs tracking the statute's language.", "Signature and notary."],
    looksLikeKo: ["캡션과 제목", "법 조문을 따르는 한두 개의 선서 문단", "서명과 공증"],
    official: FORMS_INDEX,
  },
  {
    code: "UD-5",
    title: "Affirmation of Regularity",
    titleKo: "절차 적법성 확인서 (Affirmation of Regularity)",
    stage: "The packet (after the other spouse signs)",
    stageKo: "패킷 (배우자 서명 후)",
    signedBy: "The plaintiff or the plaintiff's attorney",
    signedByKo: "원고 또는 원고 변호사",
    purpose:
      "A checklist-style statement to the court that the procedural steps were done properly: the summons was served, the defendant appeared (or defaulted), the time to answer has passed, and the papers are ready for the judge.",
    purposeKo: "송달, 피고의 출석 또는 불출석, 답변 기한 경과 등 절차가 적법하게 진행되었음을 법원에 확인하는 서류입니다.",
    looksLike: ["The caption and title.", "Numbered paragraphs with check-boxes describing service and the defendant's appearance or default.", "A request that the matter be placed on the uncontested calendar.", "Signature block."],
    looksLikeKo: ["캡션과 제목", "송달과 피고 출석 여부를 체크하는 번호 문단", "합의 이혼 일정(calendar) 등재 요청", "서명란"],
    official: FORMS_INDEX,
  },
  {
    code: "UD-6",
    title: "Affidavit of Plaintiff",
    titleKo: "원고 진술서 (Affidavit of Plaintiff)",
    stage: "The packet (after the other spouse signs)",
    stageKo: "패킷 (배우자 서명 후)",
    signedBy: "The plaintiff, sworn",
    signedByKo: "원고, 선서",
    purpose:
      "The plaintiff's sworn account of the case for the judge: residence, the marriage, the children, the ground, that the parties' agreement covers support and property, the health-insurance notice, and receipt of the Notice of Guideline Maintenance.",
    purposeKo: "판사를 위한 원고의 선서 진술입니다. 거주, 혼인, 자녀, 사유, 합의 내용, 건강보험 고지, 부양비 가이드라인 고지 수령 등을 진술합니다.",
    looksLike: [
      "The caption, titled AFFIDAVIT OF PLAINTIFF, and 'STATE OF NEW YORK, COUNTY OF …, ss.'",
      "Numbered paragraphs 1 through about 11, several with check-boxes (for example the residency option that applies).",
      "Blanks for Social Security numbers that are written in by hand, never typed.",
      "Signature and notary.",
    ],
    looksLikeKo: ["캡션, 제목 AFFIDAVIT OF PLAINTIFF", "1~11번 문단, 일부는 체크박스", "손으로 적는 사회보장번호 칸", "서명과 공증"],
    official: FORMS_INDEX,
  },
  {
    code: "UD-7",
    title: "Affidavit of Defendant",
    titleKo: "피고 진술서 (Affidavit of Defendant)",
    stage: "The packet (after the other spouse signs)",
    stageKo: "패킷 (배우자 서명 후)",
    signedBy: "The defendant (the other spouse), sworn",
    signedByKo: "피고 (상대 배우자), 선서",
    purpose:
      "How the other spouse agrees to the divorce without a fight: they admit service, appear but choose not to answer, waive the waiting periods, consent to the case going on the uncontested calendar, and acknowledge the notices. This is the paper that makes a divorce 'uncontested'.",
    purposeKo: "상대 배우자가 다투지 않고 이혼에 동의하는 서류입니다. 송달을 인정하고 답변하지 않기로 하며, 대기 기간을 포기하고 합의 이혼 일정에 동의합니다.",
    looksLike: ["The caption, titled AFFIDAVIT OF DEFENDANT.", "Numbered paragraphs with check-boxes: admits service, waives time to answer, not in the military, waives further papers except the judgment.", "Signature and notary."],
    looksLikeKo: ["캡션, 제목 AFFIDAVIT OF DEFENDANT", "체크박스가 있는 번호 문단(송달 인정, 답변 기간 포기, 군복무 아님 등)", "서명과 공증"],
    official: FORMS_INDEX,
  },
  {
    code: "UD-8",
    title: "Child Support Worksheet (with UD-8a and UD-8b)",
    titleKo: "자녀양육비 계산서 (UD-8, 8a, 8b)",
    stage: "The packet (after the other spouse signs)",
    stageKo: "패킷 (배우자 서명 후)",
    signedBy: "Prepared by the plaintiff or attorney; UD-8b is signed by the judge",
    signedByKo: "원고 또는 변호사가 작성; UD-8b는 판사 서명",
    purpose:
      "Used only when there are children under 21. The worksheet walks through the Child Support Standards Act arithmetic: each parent's income, deductions, the combined income up to the cap, the statutory percentage, each parent's share, and the resulting amount. UD-8a is the Support Collection Unit information sheet; UD-8b is the Qualified Medical Child Support Order for health coverage.",
    purposeKo: "21세 미만 자녀가 있을 때만 사용합니다. 자녀양육비 기준법(CSSA)에 따른 계산 과정을 보여줍니다. UD-8a는 양육비 징수처 정보, UD-8b는 의료보험 명령입니다.",
    looksLike: [
      "A multi-step worksheet with lines for each parent's gross income, FICA and other deductions, combined parental income, the percentage for the number of children, and each parent's pro-rata share.",
      "Lines for add-ons (child care, health insurance, unreimbursed medical) and for any agreed deviation with the reasons.",
      "UD-8a: a one-page form of names, addresses, dates of birth, Social Security numbers and the support amount for the Support Collection Unit.",
      "UD-8b: an order format with 'ORDERED' paragraphs directing a parent's health plan to cover the children.",
    ],
    looksLikeKo: ["부모 각자의 소득, 공제, 합산 소득, 비율, 분담 비율을 적는 단계별 계산서", "추가 비용과 합의된 편차 사유 칸", "UD-8a: 징수처용 한 페이지 정보지", "UD-8b: 자녀 의료보험을 명하는 명령문"],
    official: FORMS_INDEX,
  },
  {
    code: "UD-9",
    title: "Note of Issue",
    titleKo: "쟁점 통지서 (Note of Issue)",
    stage: "The packet (after the other spouse signs)",
    stageKo: "패킷 (배우자 서명 후)",
    signedBy: "The plaintiff or attorney",
    signedByKo: "원고 또는 변호사",
    purpose: "The court's calendaring form — it asks the clerk to place the case on the uncontested matrimonial calendar for a judge to review. It carries its own filing fee.",
    purposeKo: "사건을 합의 이혼 일정에 올려 판사가 검토하도록 요청하는 법원 서식입니다. 별도 접수 비용이 있습니다.",
    looksLike: ["A boxed court form with the caption, the index number, the date the summons was filed and served, the nature of the action ('Matrimonial, uncontested'), and the attorney's or party's information."],
    looksLikeKo: ["캡션, 사건번호, 소환장 제출·송달일, 사건 성격('Matrimonial, uncontested')이 적힌 박스 서식"],
    official: FORMS_INDEX,
  },
  {
    code: "UD-10",
    title: "Findings of Fact and Conclusions of Law",
    titleKo: "사실 인정 및 법률 판단 (UD-10)",
    stage: "The packet (after the other spouse signs)",
    stageKo: "패킷 (배우자 서명 후)",
    signedBy: "Prepared for the judge's signature",
    signedByKo: "판사 서명을 위해 준비",
    purpose:
      "A proposed document the judge signs: the court's findings (who the parties are, that the residency requirement is met, the ground, the children, the agreement) and its legal conclusions (that the plaintiff is entitled to a divorce and how the ancillary issues are resolved).",
    purposeKo: "판사가 서명하는 제안 문서입니다. 법원의 사실 인정과 법률 판단을 담습니다.",
    looksLike: ["The caption with 'calendar' details, titled FINDINGS OF FACT AND CONCLUSIONS OF LAW.", "Numbered 'Findings of Fact' paragraphs, then numbered 'Conclusions of Law'.", "A signature line for the Justice of the Supreme Court."],
    looksLikeKo: ["캡션, 제목 FINDINGS OF FACT AND CONCLUSIONS OF LAW", "번호가 매겨진 사실 인정 문단과 법률 판단 문단", "대법원 판사 서명란"],
    official: FORMS_INDEX,
  },
  {
    code: "UD-11",
    title: "Judgment of Divorce",
    titleKo: "이혼 판결 (Judgment of Divorce)",
    stage: "The packet (after the other spouse signs)",
    stageKo: "패킷 (배우자 서명 후)",
    signedBy: "The judge",
    signedByKo: "판사",
    purpose:
      "The order that ends the marriage. It recites that the court has considered the papers, grants the divorce on the stated ground, and sets out the ancillary terms — usually by incorporating the parties' written agreement, which 'survives and is not merged' into the judgment.",
    purposeKo: "혼인을 종료시키는 명령입니다. 이혼을 허가하고 부수적 조건을 정하며, 보통 당사자의 서면 합의를 포함합니다.",
    looksLike: ["The caption, titled JUDGMENT OF DIVORCE, with 'Present: Hon. …'.", "Recital paragraphs ('the plaintiff having …') followed by 'ORDERED, ADJUDGED AND DECREED' paragraphs.", "Paragraphs on the agreement, children, support, name change, and the Certificate of Dissolution.", "The judge's signature and the County Clerk's entry stamp."],
    looksLikeKo: ["캡션, 제목 JUDGMENT OF DIVORCE", "경위 문단과 'ORDERED, ADJUDGED AND DECREED' 문단", "합의서, 자녀, 부양비, 개명, 이혼 증명서 관련 문단", "판사 서명과 서기 등록 도장"],
    official: FORMS_INDEX,
  },
  {
    code: "UD-12",
    title: "Part 130 Certification",
    titleKo: "Part 130 인증서 (UD-12)",
    stage: "The packet (after the other spouse signs)",
    stageKo: "패킷 (배우자 서명 후)",
    signedBy: "The plaintiff or attorney",
    signedByKo: "원고 또는 변호사",
    purpose: "A short certification required by court rule (22 NYCRR Part 130) that the papers are not frivolous and the signer has read them.",
    purposeKo: "법원 규칙(22 NYCRR Part 130)에 따라 서류가 경솔하지 않음을 서명자가 확인하는 짧은 인증서입니다.",
    looksLike: ["The caption and a single certification paragraph with signature."],
    looksLikeKo: ["캡션과 한 문단의 인증문, 서명"],
    official: FORMS_INDEX,
  },
  {
    code: "UD-13",
    title: "Request for Judicial Intervention (RJI, form UCS-840)",
    titleKo: "재판 개입 요청서 (RJI, UCS-840)",
    stage: "The packet (after the other spouse signs)",
    stageKo: "패킷 (배우자 서명 후)",
    signedBy: "The plaintiff or attorney",
    signedByKo: "원고 또는 변호사",
    purpose: "The court-system form that asks for a judge to be assigned to the case. It is the state's own fillable PDF and is filed with its own fee.",
    purposeKo: "사건에 판사를 배정해 달라고 요청하는 법원 시스템 서식입니다. 별도 접수 비용이 있습니다.",
    looksLike: ["A dense one-page state form with check-boxes for the nature of the action (Matrimonial — Uncontested), the parties and their attorneys, and related actions."],
    looksLikeKo: ["사건 성격, 당사자, 변호사, 관련 사건을 체크하는 빽빽한 한 페이지 주 서식"],
    official: "https://ww2.nycourts.gov/forms/index.shtml",
  },
  {
    code: "UD-14",
    title: "Notice of Entry",
    titleKo: "등록 통지 (Notice of Entry)",
    stage: "After the judgment",
    stageKo: "판결 후",
    signedBy: "The plaintiff or attorney",
    signedByKo: "원고 또는 변호사",
    purpose: "A notice served on the other spouse after the judge signs, stating that the Judgment of Divorce was entered in the County Clerk's office on a given date. Serving it starts the time to appeal.",
    purposeKo: "판사 서명 후 판결이 카운티 서기 사무소에 등록되었음을 상대 배우자에게 알리는 통지입니다.",
    looksLike: ["The caption, titled NOTICE OF ENTRY, one paragraph, the date of entry, and the signature block."],
    looksLikeKo: ["캡션, 제목 NOTICE OF ENTRY, 한 문단, 등록일, 서명란"],
    official: FORMS_INDEX,
  },
  {
    code: "UD-15",
    title: "Affirmation of Service (of the Judgment)",
    titleKo: "판결 송달 확인서 (UD-15)",
    stage: "After the judgment",
    stageKo: "판결 후",
    signedBy: "The person who mailed the judgment",
    signedByKo: "판결문을 우송한 사람",
    purpose: "Proof that a copy of the signed Judgment of Divorce with Notice of Entry was mailed to the other spouse.",
    purposeKo: "서명된 이혼 판결문과 등록 통지가 상대 배우자에게 우송되었음을 증명합니다.",
    looksLike: ["The caption, a short sworn paragraph naming the papers mailed, the date and address, and the signature."],
    looksLikeKo: ["캡션, 우송한 서류·날짜·주소를 적은 짧은 선서 문단, 서명"],
    official: FORMS_INDEX,
  },
  {
    code: "DOH-2168",
    title: "Certificate of Dissolution of Marriage",
    titleKo: "혼인 해소 증명서 (DOH-2168)",
    stage: "The packet (after the other spouse signs)",
    stageKo: "패킷 (배우자 서명 후)",
    signedBy: "The plaintiff or attorney",
    signedByKo: "원고 또는 변호사",
    purpose: "The Department of Health's vital-records form filed with the packet so the state records the divorce. It asks for identifying information about both spouses and the marriage.",
    purposeKo: "주 보건부의 인구동태 기록 서식입니다. 두 배우자와 혼인에 관한 식별 정보를 기재합니다.",
    looksLike: ["A one-page state form with boxes for each spouse's name, birth date, birthplace, race and education, the date and place of marriage, the number of children, and the court and judgment date."],
    looksLikeKo: ["두 배우자의 이름, 생년월일, 출생지, 혼인 일시·장소, 자녀 수, 법원과 판결일을 적는 한 페이지 주 서식"],
    official: FORMS_INDEX,
  },
];

export function findUdForm(code: string): UdForm | undefined {
  const c = code.trim().toUpperCase().replace(/\s+/g, "");
  return NY_UD_FORMS.find((f) => f.code.toUpperCase().replace(/\s+/g, "") === c);
}

/** Compact text the guide can quote from — never advice, only description. */
export function udFormsForPrompt(): string {
  return NY_UD_FORMS.map((f) => `${f.code} — ${f.title}. ${f.stage}. Signed by: ${f.signedBy}. ${f.purpose} Looks like: ${f.looksLike.join(" ")} Official: ${f.official}`).join("\n");
}
