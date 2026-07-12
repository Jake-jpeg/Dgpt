import { inquiryEmail as brandedInquiryEmail, operatingFirmName } from "@/config/branding";

// Branding is configuration (see src/config/branding.ts) — no hard-coded
// addresses. When NEXT_PUBLIC_INQUIRY_EMAIL is unset the page renders a
// neutral contact affordance instead of inventing an address.
const inquiryEmail = brandedInquiryEmail();
const firmName = operatingFirmName();
const inquiryHref = inquiryEmail ? `mailto:${inquiryEmail}` : "#contact";

const capabilities = [
  "Structured client intake",
  "Conflict and scope screening",
  "Document and missing-information tracking",
  "Paralegal-guided workflows",
  "Attorney review and approval controls",
  "New York and New Jersey workflow design",
];

export default function Landing() {
  return (
    <main>
      <section className="hero-shell">
        <nav className="nav-shell" aria-label="Primary navigation">
          <a className="brand" href="#top" aria-label="DivorceGPT home">
            DivorceGPT<span className="brand-dot">.com</span>
          </a>
          <a className="nav-link" href={inquiryHref}>
            Institutional inquiries
          </a>
        </nav>

        <div id="top" className="hero-grid">
          <div>
            <p className="eyebrow">Attorney-supervised legal workflow technology</p>
            <h1>Better intake. Cleaner files. More time for legal judgment.</h1>
            <p className="hero-copy">
              DivorceGPT.com is being developed as a structured family-law intake
              and case-preparation workflow for attorneys, legal staff, and
              legal-service organizations in New York and New Jersey.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href={inquiryHref}>
                Discuss a pilot or acquisition
              </a>
              <a className="button button-secondary" href="#platform">
                View the concept
              </a>
            </div>
            <p className="availability">
              The platform is not currently accepting public users or providing
              legal services.
            </p>
          </div>

          <aside className="workflow-card" aria-label="Illustrative workflow">
            <p className="card-label">Illustrative workflow</p>
            <ol>
              <li><span>01</span> Conflict and eligibility screening</li>
              <li><span>02</span> Guided factual and document intake</li>
              <li><span>03</span> Missing-item and escalation review</li>
              <li><span>04</span> Attorney-controlled approval and release</li>
            </ol>
          </aside>
        </div>
      </section>

      <section id="platform" className="section-shell">
        <div className="section-heading">
          <p className="eyebrow">What is being built</p>
          <h2>A workflow system—not an automated lawyer.</h2>
          <p>
            The product is designed to organize information and move matters
            efficiently toward human legal review. It does not independently
            determine strategy, provide individualized legal advice, or release
            substantive work without attorney oversight.
          </p>
        </div>

        <div className="capability-grid">
          {capabilities.map((capability) => (
            <div className="capability" key={capability}>
              <span aria-hidden="true">✓</span>
              <p>{capability}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="institutional-shell">
        <div>
          <p className="eyebrow">Current posture</p>
          <h2>Open to a limited institutional pilot, licensing discussion, or acquisition inquiry.</h2>
        </div>
        <a id="contact" className="button button-light" href={inquiryHref}>
          {inquiryEmail ? `Contact ${inquiryEmail}` : "Contact the firm"}
        </a>
      </section>

      <footer>
        <p>
          DivorceGPT.com is an independent project and is not affiliated with,
          sponsored by, or endorsed by OpenAI.
        </p>
        <p>
          No attorney-client relationship is formed through this website. This
          website does not provide legal advice.
        </p>
        <p>
          DivorceGPT is workflow software used by {firmName}. Legal services,
          when engaged, are provided by the firm and its attorneys — never by
          the software itself.
        </p>
        <p>© {new Date().getFullYear()} June Guided Solutions, LLC.</p>
      </footer>
    </main>
  );
}
