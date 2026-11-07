import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { GuideChat } from "@/components/guide-chat";
import { NY_UD_FORMS } from "@/content/forms/ny-ud";
import { operatingFirmName } from "@/config/branding";

/**
 * The New York uncontested-divorce forms, described (2026-11-07). Public.
 * What each form is, who signs it, when, and what it looks like — never what
 * to put in it. The reader's guide at the bottom explains; it does not fill.
 */
export const metadata: Metadata = {
  title: "The New York uncontested divorce forms, explained | DivorceGPT",
  description: "What each UD form in a New York uncontested divorce is, who signs it, when it is used, and what it looks like — UD-1 through UD-15, the RJI and the Certificate of Dissolution.",
};

export default async function FormsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = (await searchParams).lang === "ko" ? "ko" : "en";
  const firm = operatingFirmName();
  const ko = lang === "ko";
  const stages = [...new Set(NY_UD_FORMS.map((f) => f.stage))];

  const hero = (
    <div className="blog-hero">
      <div className="door-topline">
        <p className="eyebrow">{ko ? `${firm} · 변호사 광고` : `${firm} · Attorney Advertising`}</p>
        <div className="lang-toggle" role="group" aria-label="Language">
          <Link href="/forms" className={!ko ? "on" : ""}>English</Link>
          <Link href="/forms?lang=ko" className={ko ? "on" : ""}>한국어</Link>
        </div>
      </div>
      <h1 className="door-h1">{ko ? "뉴욕 합의 이혼 서식, 하나씩 설명합니다." : "The New York uncontested divorce forms, one by one."}</h1>
      <p className="door-copy">
        {ko
          ? "각 서식이 무엇인지, 누가 서명하는지, 언제 쓰이는지, 어떻게 생겼는지 — 일반 정보입니다. 무엇을 적어야 하는지는 변호사에게 물어보세요."
          : "What each form is, who signs it, when it is used, and what it looks like. General information — what to put in one is a question for a lawyer."}
      </p>
    </div>
  );

  return (
    <Shell hero={hero}>
      <div className="blog-article">
        {stages.map((stage) => (
          <section key={stage}>
            <h2>{ko ? NY_UD_FORMS.find((f) => f.stage === stage)?.stageKo : stage}</h2>
            {NY_UD_FORMS.filter((f) => f.stage === stage).map((f) => (
              <details className="faq-item form-item" key={f.code} id={f.code.toLowerCase()}>
                <summary><span className="form-code">{f.code}</span> {ko ? f.titleKo : f.title}</summary>
                <div className="form-body">
                  <p><strong>{ko ? "서명:" : "Signed by:"}</strong> {ko ? f.signedByKo : f.signedBy}</p>
                  <p>{ko ? f.purposeKo : f.purpose}</p>
                  <p><strong>{ko ? "생김새:" : "What it looks like:"}</strong></p>
                  <ul>{(ko ? f.looksLikeKo : f.looksLike).map((l) => <li key={l}>{l}</li>)}</ul>
                  <p><a href={f.official} target="_blank" rel="noopener noreferrer">{ko ? "공식 서식 및 안내 (nycourts.gov)" : "Official form and instructions (nycourts.gov)"}</a></p>
                </div>
              </details>
            ))}
          </section>
        ))}
        <div className="notice notice-info blog-callout">
          {ko
            ? "이 페이지는 일반적인 정보이며 법률 자문이 아닙니다. 변호사-의뢰인 관계가 성립하지 않습니다. 변호사 광고."
            : "This page provides general information only. It is not legal advice, and reading it does not create an attorney-client relationship. Attorney Advertising."}
        </div>
        <GuideChat lang={lang} />
      </div>
    </Shell>
  );
}
