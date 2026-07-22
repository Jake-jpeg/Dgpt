/**
 * Deterministic PDF rendering — types + explicit allowlist (Part 3).
 * The allowlist is the ONLY set of state/form pairs the application will
 * ever ask the ReportLab service to render. The AI layer has no input here: not
 * the endpoint, not the state, not the form, not the filename.
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
] as const;

export type AllowedRender = (typeof ALLOWED_RENDERS)[number];

export function isAllowedRender(state: string, form: string): boolean {
  return ALLOWED_RENDERS.some((r) => r.state === state && r.form === form);
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

export class PdfServiceError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null
  ) {
    super(message);
  }
}
