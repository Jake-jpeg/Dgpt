/**
 * Deterministic PDF rendering — types + explicit allowlist (Part 3).
 * The allowlist is the ONLY set of state/form pairs the application will
 * ever ask the ReportLab service to render. OpenAI has no input here: not
 * the endpoint, not the state, not the form, not the filename.
 */
export const ALLOWED_RENDERS = [
  { state: "nj", form: "verification", label: "NJ Certification of Verification and Non-Collusion" },
  { state: "nj", form: "complaint", label: "NJ Complaint for Divorce" },
  { state: "ny", form: "ud1", label: "NY UD-1 Summons with Notice" },
] as const;

export type AllowedRender = (typeof ALLOWED_RENDERS)[number];
export type RenderState = AllowedRender["state"];

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
