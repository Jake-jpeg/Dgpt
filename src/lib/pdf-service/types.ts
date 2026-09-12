/**
 * Deterministic court-form rendering — types + explicit allowlist (Part 3).
 * The allowlist is the ONLY set of state/form pairs the application will
 * ever render. Since 2026-09-12 the renderer is the in-app Word engine
 * (src/lib/word); the ReportLab PDF service is retired. The module keeps
 * its historical name so the audit vocabulary and imports stay stable. The
 * AI layer has no input here: not the state, not the form, not the filename.
 */
export const ALLOWED_RENDERS = [
  // Phase 1 — commencement
  { state: "ny", form: "ud1", label: "NY UD-1 Summons with Notice" },
  { state: "ny", form: "complaint", label: "NY Verified Complaint (Action for Divorce)" },
  // Phase 2 — the uncontested packet + the parties' agreement
  { state: "ny", form: "stipulation", label: "NY Stipulation of Settlement" },
  { state: "ny", form: "ud5", label: "NY UD-5 Affirmation of Regularity" },
  { state: "ny", form: "ud6", label: "NY UD-6 Plaintiff's Affidavit" },
  { state: "ny", form: "ud7", label: "NY UD-7 Defendant's Affidavit" },
  { state: "ny", form: "ud9", label: "NY UD-9 Note of Issue" },
  { state: "ny", form: "ud10", label: "NY UD-10 Findings of Fact / Conclusions of Law" },
  { state: "ny", form: "ud11", label: "NY UD-11 Judgment of Divorce" },
  { state: "ny", form: "ud12", label: "NY UD-12 Part 130 Certification" },
  { state: "ny", form: "ud4", label: "NY UD-4 Barriers to Remarriage (religious ceremony only)" },
  // Phase 3 — finalization (post-judgment; firm-side service of the JOD)
  { state: "ny", form: "ud14", label: "NY UD-14 Notice of Entry" },
  { state: "ny", form: "ud15", label: "NY UD-15 Affirmation of Service by Mail" },
  // ── New Jersey — Superior Court, Chancery Division, Family Part ─────
  // Form names are the EXACT route keys RL's app.py registers for 'nj'
  // (verified against STATE_CONFIGS 2026-08-23). Phase 1 — commencement
  { state: "nj", form: "complaint", label: "NJ Complaint for Divorce (Irreconcilable Differences)" },
  { state: "nj", form: "summons", label: "NJ Summons" },
  { state: "nj", form: "verification", label: "NJ Verification and Non-Collusion Certification" },
  // Phase 2 — the uncontested packet
  { state: "nj", form: "acknowledgment", label: "NJ Acknowledgment of Service" },
  { state: "nj", form: "cdr_plaintiff", label: "NJ Certification of Dispute Resolution (Plaintiff)" },
  { state: "nj", form: "cdr_defendant", label: "NJ Certification of Dispute Resolution (Defendant)" },
  { state: "nj", form: "insurance", label: "NJ Certification of Insurance Coverage" },
  // Phase 3 — judgment
  { state: "nj", form: "jod", label: "NJ Judgment of Divorce" },
  { state: "nj", form: "jod_cert_plaintiff", label: "NJ JOD Certification (Plaintiff)" },
  { state: "nj", form: "jod_cert_defendant", label: "NJ JOD Certification (Defendant)" },
] as const;

export type AllowedRender = (typeof ALLOWED_RENDERS)[number];

export function isAllowedRender(state: string, form: string): boolean {
  return ALLOWED_RENDERS.some((r) => r.state === state && r.form === form);
}

/** Every allowlisted form is a Word document (operator, 2026-09-12: Word only). */
export type RenderFormat = "docx";

export function docxAvailable(state: string, form: string): boolean {
  return isAllowedRender(state, form);
}

export function renderLabel(state: string, form: string): string {
  return ALLOWED_RENDERS.find((r) => r.state === state && r.form === form)?.label ?? `${state}/${form}`;
}

/** Flat, string-valued payload the RL generators consume. */
export type RenderPayload = Record<string, string>;

export interface PdfRenderResult {
  bytes: Uint8Array;
  filename: string;
  sha256: string;
  latencyMs: number;
  retried: boolean;
}
