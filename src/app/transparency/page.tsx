import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What Happens When You Type Into DivorceGPT — And What Doesn't | DivorceGPT",
  description:
    "DivorceGPT's founder — a licensed NY/NJ attorney — breaks down the backend guardrails that block legal advice, destroy sensitive data in transit, and terminate dangerous sessions. Built to survive New York's toughest AI regulations.",
  alternates: {
    canonical: "/transparency",
  },
  openGraph: {
    title: "What Happens When You Type Into DivorceGPT — And What Doesn't",
    description:
      "A licensed attorney breaks down the five backend guardrails that keep DivorceGPT compliant — and why he's publishing them before New York's S7263 forces anyone to.",
    url: "https://divorcegpt.com/transparency",
    siteName: "DivorceGPT",
    type: "article",
    publishedTime: "2026-03-24T00:00:00Z",
    authors: ["Jake Kim"],
  },
};

// Structured data for Google (Article + Author E-E-A-T)
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What Happens When You Type Into DivorceGPT — And What Doesn't",
  description:
    "A plain-English breakdown of the backend guardrails that keep DivorceGPT inside the lines — written by the attorney who built them.",
  datePublished: "2026-03-24",
  dateModified: "2026-03-24",
  author: {
    "@type": "Person",
    name: "Jake Kim",
    jobTitle: "Founder & Licensed Attorney",
    url: "https://www.linkedin.com/in/jakeskim/",
    affiliation: [
      {
        "@type": "Organization",
        name: "June Guided Solutions, LLC",
        url: "https://juneguidedsolutions.com",
      },
      {
        "@type": "Organization",
        name: "Jake Kim Law Firm, LLC",
      },
    ],
    hasCredential: [
      {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "license",
        name: "Attorney — New York Bar",
      },
      {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "license",
        name: "Attorney — New Jersey Bar",
      },
      {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "degree",
        name: "J.D., Rutgers Law School",
      },
      {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "degree",
        name: "B.S. Corporate Finance & Accounting, Bentley University",
      },
    ],
  },
  publisher: {
    "@type": "Organization",
    name: "DivorceGPT by June Guided Solutions, LLC",
    url: "https://divorcegpt.com",
  },
  mainEntityOfPage: "https://divorcegpt.com/transparency",
};

export default function TransparencyPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-zinc-50">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20">
                  <span className="text-lg">⚖️</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1>
                  <p className="text-xs text-zinc-500">by June Guided Solutions, LLC</p>
                </div>
              </Link>
              <Link
                href="/"
                className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#1a365d] via-[#1e3a5f] to-[#234876] pt-16 pb-20">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#c59d5f]/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#c59d5f]/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-[#c59d5f] text-sm font-medium tracking-wide uppercase mb-6">
              <span className="inline-block h-px w-8 bg-[#c59d5f]/60" />
              Engineering &amp; Compliance · March 2026
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
              What Happens When You Type Into DivorceGPT
              <span className="block text-[#c59d5f] mt-1">— And What Doesn't</span>
            </h2>
            <p className="mt-6 text-lg text-zinc-300 leading-relaxed border-l-2 border-[#c59d5f]/40 pl-4">
              A plain-English breakdown of the backend guardrails that keep DivorceGPT inside the lines — written by the attorney who built them.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white font-bold text-sm">
                JK
              </div>
              <div>
                <p className="text-white font-medium text-sm">Jake Kim</p>
                <p className="text-zinc-400 text-xs">Founder, June Guided Solutions, LLC · Licensed Attorney (NY &amp; NJ)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Article Body */}
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">

          {/* — THE HOOK — */}
          <p className="text-lg text-zinc-700 leading-relaxed mb-5">
            Divorce is one of the highest-stakes transactions a person will go through. It restructures everything — finances, housing, identity. The documents you file with the court become a binding legal record. If they&apos;re wrong, the consequences aren&apos;t theoretical. They&apos;re real, and they land on the person who signed them.
          </p>
          <p className="text-lg text-zinc-700 leading-relaxed mb-5">
            I built DivorceGPT because I watched people get crushed by the procedural complexity of an uncontested divorce that should have been straightforward. No kids, no property to divide, both parties agree — and somehow the paperwork still eats $3,000 and six months. That&apos;s not a legal problem. That&apos;s an access-to-justice problem. And it&apos;s one that automation can solve.
          </p>
          <p className="text-lg text-zinc-700 leading-relaxed mb-5">
            But here&apos;s what I understood from day one, because I&apos;ve actually stood in a courtroom and watched a judge kick back defective filings:{" "}
            <span className="font-semibold text-[#1a365d]">
              AI without guardrails in the legal space isn&apos;t innovation. It&apos;s malpractice waiting for a plaintiff.
            </span>
          </p>
          <p className="text-lg text-zinc-700 leading-relaxed mb-5">
            So I built the guardrails first. Before the interface, before the payment flow, before a single PDF was ever generated. The system&apos;s compliance architecture is not a feature I added. It&apos;s the foundation everything else sits on.
          </p>
          <p className="text-lg text-zinc-700 leading-relaxed mb-10">
            This post explains what those guardrails actually do.
          </p>

          {/* — S7263 SECTION — */}
          <h2 className="text-2xl font-bold text-[#1a365d] mt-16 mb-6 pb-3 border-b-2 border-[#c59d5f]">
            Why I&apos;m Writing This Now
          </h2>

          {/* Bill Reference Card */}
          <div className="bg-white border-2 border-[#1a365d] rounded-lg p-5 mb-8">
            <span className="inline-block bg-[#1a365d] text-white text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded mb-3">
              Pending Legislation
            </span>
            <p className="text-sm text-zinc-700 leading-relaxed">
              <strong>New York Senate Bill S7263</strong> — <em>&ldquo;An act to amend the general business law, in relation to imposing liability for damages caused by a chatbot impersonating certain licensed professionals.&rdquo;</em>
            </p>
            <p className="text-sm text-zinc-500 mt-3">
              Introduced by Sen. Kristen Gonzalez (D-Queens), April 2025. Passed the Senate Internet &amp; Technology Committee unanimously on February 25, 2026. Advanced to third reading on March 4, 2026.
            </p>
            <a
              href="https://www.nysenate.gov/legislation/bills/2025/S7263"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-sm font-medium text-[#1a365d] underline decoration-[#c59d5f] underline-offset-2 hover:text-[#c59d5f] transition-colors"
            >
              Full text on NYSenate.gov →
            </a>
          </div>

          <p className="text-zinc-700 leading-relaxed mb-5">
            S7263 would make chatbot deployers civilly liable when their AI provides &ldquo;substantive&rdquo; responses that, if given by a person, would constitute the unauthorized practice of a licensed profession. The bill covers law, medicine, engineering, psychology, social work, and fourteen other licensed fields. It creates a private right of action with attorney&apos;s fee-shifting. Disclaimers do not reduce liability. The bill never defines &ldquo;substantive response,&rdquo; which means the scope of enforcement is, at this point, whatever a plaintiff&apos;s attorney says it is.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-5">
            I understand why this bill exists. Lawmakers in Albany are watching VC-backed AI companies ship reckless products into high-stakes domains with nothing between the user and the model but a disclaimer that says &ldquo;this is not legal advice&rdquo; in 9-point font. That is a legitimate problem. People are getting hurt.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-5">
            But here&apos;s what bills like S7263 rarely account for:{" "}
            <span className="font-semibold text-[#1a365d]">
              the companies with the resources to absorb civil liability at scale are not the ones that will change their behavior.
            </span>{" "}
            They&apos;ll lobby, litigate, or simply price the risk into their margins. The ones who get crushed are the solo developers, the small shops, and — most importantly — the consumers who lose access to affordable tools that were actually doing the work responsibly.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-5">
            I have infinitely more to lose than a Silicon Valley legal-tech startup. I don&apos;t have a legal department. I don&apos;t have a lobbying firm. I have a law license in two states that I&apos;ve spent a decade building, and a product that serves people who can&apos;t afford $3,000 for paperwork. If DivorceGPT crosses a line, I don&apos;t get a fine. I get disbarred.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-5">
            That&apos;s exactly why I&apos;m the one describing my compliance architecture publicly today. Not because a bill forced my hand — every guardrail described below existed before S7263 hit the Senate floor. But because while the debate in Albany centers on what AI companies <em>should</em> do, I&apos;d rather show what I&apos;ve <em>already done</em>.
          </p>
          <p className="text-lg font-semibold text-[#1a365d] mb-5">
            Legislators are drafting the compliance framework. I already hard-coded it.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-10">
            So to any regulator, bar counsel, or legislator reading this: here&apos;s what the system actually does. On the record.
          </p>

          {/* — THE ARCHITECTURE — */}
          <h2 className="text-2xl font-bold text-[#1a365d] mt-16 mb-6 pb-3 border-b-2 border-[#c59d5f]">
            The Architecture: Five Layers of Enforcement
          </h2>

          <p className="text-zinc-700 leading-relaxed mb-5">
            DivorceGPT&apos;s backend is a single API route that handles every user interaction. Every message a user sends passes through a multi-layered compliance system before a response is ever returned. Some of these layers are AI-level instructions. Others are hard-coded server-side validators that override the AI entirely — because I don&apos;t trust any language model, including the one I use, to be the last line of defense on legal compliance.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-8">
            Here&apos;s what each layer does, in plain English.
          </p>

          {/* GUARDRAIL 1: THE KILLSWITCH */}
          <div className="bg-[#f4f1eb] border border-[#e0dbd2] rounded-lg p-6 mb-6 border-l-4 border-l-[#9b2c2c]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9b2c2c] mb-2">Guardrail 01</p>
            <h3 className="text-lg font-bold text-zinc-900 mb-3">The Killswitch — No Legal Advice, Period</h3>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              The AI is instructed, at the system level, to adopt the posture of a county courthouse clerk sitting behind glass. It explains what a form field asks for. It translates legalese into plain English. It populates documents based on exactly what the user tells it.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              That&apos;s all it does. It does not tell you what to choose. It does not predict what a judge will do. It does not assess whether your agreement is fair. It does not recommend a filing county. It does not suggest strategy. These are hard prohibitions enforced at the instruction level, with explicit lists of forbidden language patterns.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              When a user asks &ldquo;What should I put here?&rdquo; the system responds with the definition of the field and tells them: <em>you must decide which option reflects your situation.</em>
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed">
              This distinction — between legal information and legal advice — is the line that separates a document preparation service from the unauthorized practice of law. I drew that line in code because I&apos;ve seen what happens when it gets crossed in a courtroom.
            </p>
          </div>

          {/* GUARDRAIL 2: THE BLACKHOLE */}
          <div className="bg-[#f4f1eb] border border-[#e0dbd2] rounded-lg p-6 mb-6 border-l-4 border-l-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-800 mb-2">Guardrail 02</p>
            <h3 className="text-lg font-bold text-zinc-900 mb-3">The Blackhole — Sensitive Data Gets Destroyed in Transit</h3>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              DivorceGPT does not need your Social Security Number. It does not need your bank account number, your credit card number, your driver&apos;s license, or your passwords. It never asks for them. But people type things into chat boxes that they shouldn&apos;t — because they&apos;re used to filling out forms that demand everything.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              The system handles this at two levels. At the AI instruction level, the model is directed to never repeat, store, or include sensitive identifiers in any output. If it detects an SSN pattern, it responds with a standardized message explaining that DivorceGPT does not process this data and instructs the user to fill that field manually on the printed document.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              At the architectural level, DivorceGPT retains no chat data. There is no database storing your conversation. Session data lives in your browser&apos;s local storage and nowhere else. Your access link is a Stripe-generated magic link with a time-to-live that auto-purges. When it&apos;s gone, it&apos;s gone.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed">
              The forms that require SSNs — like the DOH-2168 (Certificate of Dissolution) — are deliberately excluded from DivorceGPT&apos;s generation pipeline. The system explains why, tells you where to download the form, and sends you on your way. This was a design decision, not a limitation.
            </p>
          </div>

          {/* GUARDRAIL 3: THE BOUNCER */}
          <div className="bg-[#f4f1eb] border border-[#e0dbd2] rounded-lg p-6 mb-6 border-l-4 border-l-[#1a365d]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1a365d] mb-2">Guardrail 03</p>
            <h3 className="text-lg font-bold text-zinc-900 mb-3">The Bouncer — Immediate Termination for Dangerous Input</h3>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              If a user expresses threats of violence toward a spouse, children, or any person — the session terminates. If a user indicates child abuse or intent to harm a child — the session terminates. If a user requests that the system falsify court documents, forge signatures, or commit fraud — the session terminates. If a user makes explicit criminal admissions involving ongoing harm — the session terminates.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              Termination is not a warning. It is immediate and irreversible. The system outputs a standardized response with crisis resources — the National Domestic Violence Hotline, the Suicide Prevention Lifeline, and 911 — and stops. It does not explain what triggered the termination. It does not offer to continue.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed">
              The system also distinguishes between danger signals and normal human emotion. Someone venting frustration about their spouse is not a termination trigger. Someone describing past arguments is not a termination trigger. Emotional distress without threats is not a termination trigger. This distinction matters because divorce is emotionally brutal, and punishing someone for being honest about that would make the system worse, not safer.
            </p>
          </div>

          {/* GUARDRAIL 4: THE WATCHDOG */}
          <div className="bg-[#f4f1eb] border border-[#e0dbd2] rounded-lg p-6 mb-6 border-l-4 border-l-[#c59d5f]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#c59d5f] mb-2">Guardrail 04</p>
            <h3 className="text-lg font-bold text-zinc-900 mb-3">The Watchdog — Automated Scope Enforcement and Disqualification</h3>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              DivorceGPT has a defined scope: uncontested divorce in New York State, no minor children, no property division, no spousal maintenance, both parties cooperating, neither party represented by counsel, neither party on active military duty, and no domestic violence history between the parties.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              If any of those conditions fails, the system disqualifies the user and stops document preparation. This isn&apos;t a soft suggestion. It&apos;s a hard gate. Disqualification triggers include: children under 21, contested assets, spousal support requests, attorney involvement, an uncooperative defendant, active military service (SCRA protection), and any domestic violence history — including expired orders of protection, dismissed complaints, and prior DV-related proceedings.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              On domestic violence specifically: the system applies a permanent, irreversible disqualification. If a user mentions any DV history and then retracts it — says they made it up, were exaggerating, or changed their mind — the disqualification stands. A real DV victim may retract under coercion. The system is designed to account for that possibility and err on the side of safety, every time.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed">
              The military disqualification exists because of the Servicemembers Civil Relief Act. You cannot take a default judgment against an active-duty service member. The system declines these cases with respect. This isn&apos;t a limitation — it&apos;s the law.
            </p>
          </div>

          {/* GUARDRAIL 5: THE SAFETY NET */}
          <div className="bg-[#f4f1eb] border border-[#e0dbd2] rounded-lg p-6 mb-6 border-l-4 border-l-[#276749]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#276749] mb-2">Guardrail 05</p>
            <h3 className="text-lg font-bold text-zinc-900 mb-3">The Safety Net — Server-Side Validation That Doesn&apos;t Trust the AI</h3>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              This is the layer most people don&apos;t think about, and it&apos;s the one I&apos;m most proud of. Every piece of data the AI extracts — names, addresses, dates, phone numbers, index numbers — passes through a server-side validation layer <em>after</em> the AI processes it and <em>before</em>{" "}it&apos;s accepted into the system.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              Names must contain first and last components. No numbers in names. Addresses must include a ZIP code, a state, a street number, and meet a minimum length. Phone numbers must be 10 digits. Marriage dates can&apos;t be in the future. Filing dates can&apos;t precede marriage dates. The breakdown date must satisfy DRL §170(7)&apos;s six-month requirement — calculated from today&apos;s actual date, not the AI&apos;s training data. Judgment entry dates can&apos;t be in the future and can&apos;t precede the filing date.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              The system also cross-checks the user&apos;s filing county against their address. If someone provides a Bronx address but selects Kings County, the system flags the mismatch immediately — it doesn&apos;t wait, it doesn&apos;t continue collecting data, it stops and asks the user to resolve the discrepancy.
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed">
              None of this relies on the AI being correct. The server-side validators are hard-coded logic — regex patterns, date arithmetic, field completeness checks. They exist because I don&apos;t trust a language model to be the final gatekeeper on data that will end up in a court filing. The AI is the interface. The server is the authority.
            </p>
          </div>

          {/* — THE MONITOR — */}
          <h2 className="text-2xl font-bold text-[#1a365d] mt-16 mb-6 pb-3 border-b-2 border-[#c59d5f]">
            One More Thing: The Monitor
          </h2>

          <p className="text-zinc-700 leading-relaxed mb-5">
            Laws change. Filing fees change. Courts update their forms. A document preparation system that doesn&apos;t account for this is a time bomb.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-5">
            DivorceGPT runs an automated compliance monitor that checks official court websites and statute databases for every state the platform supports. It compares live data against the system&apos;s current baseline — residency requirements, grounds for divorce, waiting periods, filing fees, mandatory forms, e-filing rules. If something changes, it flags the discrepancy, categorizes the urgency, and sends an alert.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-10">
            The system doesn&apos;t auto-update. It alerts a human — me — to review and verify before anything changes in production. Because automated compliance without human oversight is just automated risk.
          </p>

          {/* — WHO BUILT THIS — */}
          <h2 className="text-2xl font-bold text-[#1a365d] mt-16 mb-6 pb-3 border-b-2 border-[#c59d5f]">
            Who Built This, and Why It Matters
          </h2>

          <p className="text-zinc-700 leading-relaxed mb-5">
            My name is Jake Kim. I&apos;m a licensed attorney in New York and New Jersey. I&apos;ve tried cases in both states. I&apos;ve stood in front of Family Court judges and argued motions. I&apos;ve filed more paperwork with county clerks than I want to remember.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-5">
            I taught myself to code because I couldn&apos;t afford to hire a developer, and because I realized the problem I was trying to solve — making a simple divorce actually simple — required someone who understood both the law and the technology. Not a lawyer who hired a dev shop. Not a developer who read a legal blog. Someone who lived in both worlds.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-5">
            That combination — the courtroom experience and the engineering — is why these guardrails exist the way they do. I didn&apos;t build them from a compliance checklist. I built them from knowing what actually goes wrong in a divorce filing, what judges actually flag, and what bar counsel actually investigates. The architecture reflects lived experience, not theoretical risk modeling.
          </p>

          {/* — HACKERS — */}
          <h2 className="text-2xl font-bold text-[#1a365d] mt-16 mb-6 pb-3 border-b-2 border-[#c59d5f]">
            A Note to the Hackers
          </h2>

          <p className="text-zinc-700 leading-relaxed mb-5">
            I want to be honest about something. I am not a software engineer. I&apos;m a trial attorney who taught himself to code. I built this product with determination, a lot of documentation, and an unhealthy amount of caffeine.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-5">
            If you are a dedicated hacker, a security researcher, or someone who breaks systems for a living — you will probably find a way to break mine. I&apos;m not going to pretend otherwise. I have no illusions about where I sit on the engineering competence spectrum. I&apos;m a lawyer who writes code, not the other way around.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-5">
            So I&apos;m asking, respectfully:{" "}
            <span className="font-semibold text-[#1a365d]">stand down.</span>{" "}
            This product serves people who are going through one of the worst experiences of their lives, and it does so at a fraction of what the legal industry charges. If you find something, email{" "}
            <a
              href="mailto:admin@divorcegpt.com"
              className="text-[#1a365d] underline decoration-[#c59d5f] underline-offset-2 hover:text-[#c59d5f] transition-colors"
            >
              admin@divorcegpt.com
            </a>
            . I&apos;ll fix it. I&apos;ll thank you. And I&apos;ll probably ask you how you did it so I can learn.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-10">
            But this post is not a security challenge. It&apos;s a regulatory and legal disclosure. The invitation here is to regulators, bar associations, and legislators: look at what I built. Look at how seriously I took the compliance. Then decide whether this is the product you want to target.
          </p>

          {/* — BOTTOM LINE — */}
          <h2 className="text-2xl font-bold text-[#1a365d] mt-16 mb-6 pb-3 border-b-2 border-[#c59d5f]">
            The Bottom Line
          </h2>

          <p className="text-zinc-700 leading-relaxed mb-5">
            DivorceGPT doesn&apos;t give legal advice. It doesn&apos;t store your sensitive data. It terminates sessions that involve violence, fraud, or abuse. It disqualifies cases that fall outside its scope. It validates every data point before it hits a court form. And it monitors the law for changes so it doesn&apos;t go stale.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-5">
            Is it perfect? No. Nothing is. But it&apos;s transparent, and it&apos;s built by someone who understands the consequences of getting it wrong — not in the abstract, but in the way that only comes from having a judge look you in the eye and say &ldquo;counselor, explain yourself.&rdquo;
          </p>
          <p className="text-zinc-700 leading-relaxed mb-10">
            I&apos;ve been on the other side of that look. It changes how you build things.
          </p>

          {/* — SIGN-OFF — */}
          <div className="mt-16 pt-8 border-t-2 border-zinc-200">
            <p className="text-zinc-600 text-sm leading-relaxed mb-3">
              If you&apos;re a regulator, a bar counsel, or a state legislator — my door is open.{" "}
              <a
                href="mailto:admin@divorcegpt.com"
                className="text-[#1a365d] underline decoration-[#c59d5f] underline-offset-2 hover:text-[#c59d5f] transition-colors"
              >
                admin@divorcegpt.com
              </a>
            </p>
            <p className="text-zinc-600 text-sm leading-relaxed mb-6">
              If you&apos;re someone going through a divorce and this product can help you —{" "}
              <a
                href="https://divorcegpt.com"
                className="text-[#1a365d] underline decoration-[#c59d5f] underline-offset-2 hover:text-[#c59d5f] transition-colors"
              >
                divorcegpt.com
              </a>
            </p>
            <p className="text-xl font-semibold text-[#1a365d] font-serif">— Jake Kim</p>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Founder, June Guided Solutions, LLC<br />
              Licensed Attorney — New York &amp; New Jersey<br />
              B.S. Corporate Finance &amp; Accounting, Bentley University<br />
              J.D., Rutgers Law School
            </p>
          </div>

          {/* — DISCLAIMER — */}
          <div className="mt-12 bg-zinc-100 rounded-lg p-5 text-xs text-zinc-500 leading-relaxed">
            <strong className="text-zinc-600">Disclaimer:</strong>{" "}
            DivorceGPT is a document preparation service operated by June Guided Solutions, LLC. It is not a law firm. It does not provide legal advice, legal representation, or create attorney-client relationships. The author of this post, Jake Kim, is a licensed attorney in New York and New Jersey, but his role as founder of June Guided Solutions, LLC is separate from his law practice at Jake Kim Law Firm, LLC. Use of DivorceGPT does not constitute the retention of an attorney. If you need legal advice, consult a licensed attorney in your jurisdiction.
          </div>

        </article>

        {/* Footer */}
        <footer className="border-t border-zinc-200 bg-white py-8">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs text-zinc-400">
              © {new Date().getFullYear()} June Guided Solutions, LLC. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
