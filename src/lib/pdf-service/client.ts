/**
 * Server-only ReportLab service client (Part 3).
 *
 * - PDF_SERVICE_TOKEN rides ONLY in the server-to-server Authorization
 *   header; there is no NEXT_PUBLIC_* variant and the browser never calls
 *   the RL service.
 * - Bounded timeout (PDF_SERVICE_TIMEOUT_MS) and at most ONE retry, only
 *   for transport/5xx failures — never 4xx.
 * - The response must actually be a PDF (content sniff, %PDF- magic); the
 *   SHA-256 is computed here so the caller stores exactly what it hashes.
 * - Errors are sanitized: status codes only, never the token, never the
 *   payload.
 */
import { createHash } from "node:crypto";
import { envOptional } from "@/lib/env";
import { PdfServiceError, type PdfRenderResult, type RenderPayload } from "./types";

export function pdfServiceEnabled(): boolean {
  return (
    process.env.PDF_SERVICE_ENABLED === "true" &&
    Boolean(envOptional("PDF_SERVICE_URL")) &&
    Boolean(envOptional("PDF_SERVICE_TOKEN"))
  );
}

export function pdfServiceUrl(): string {
  const url = envOptional("PDF_SERVICE_URL") ?? "";
  return url.replace(/\/+$/, "");
}

export function pdfServiceTimeoutMs(): number {
  const n = Number(process.env.PDF_SERVICE_TIMEOUT_MS ?? "60000");
  return Number.isFinite(n) && n > 1000 ? n : 60000;
}

function sanitizeFilename(raw: string, fallback: string, ext: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned && cleaned.endsWith(ext) ? cleaned : fallback;
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function renderPdf(opts: {
  state: string;
  form: string;
  payload: RenderPayload;
  /** "pdf" (default) or "docx" — the RL service refuses docx for forms without a Word build. */
  format?: "pdf" | "docx";
}): Promise<PdfRenderResult> {
  if (!pdfServiceEnabled()) {
    throw new PdfServiceError("PDF_GUARD: PDF service is not configured/enabled");
  }
  const format = opts.format === "docx" ? "docx" : "pdf";
  const endpoint =
    `${pdfServiceUrl()}/generate/${encodeURIComponent(opts.state)}/${encodeURIComponent(opts.form)}` +
    (format === "docx" ? "?format=docx" : "");
  const token = envOptional("PDF_SERVICE_TOKEN")!;
  const body = JSON.stringify(opts.payload);

  let lastError: PdfServiceError | null = null;
  let retried = false;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) retried = true;
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), pdfServiceTimeoutMs());
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status === 401 || res.status === 403) {
        throw new PdfServiceError("PDF_GUARD: PDF service rejected credentials", res.status);
      }
      if (res.status >= 400 && res.status < 500) {
        throw new PdfServiceError(`PDF_GUARD: PDF service rejected the request (HTTP ${res.status})`, res.status);
      }
      if (!res.ok) {
        lastError = new PdfServiceError(`PDF_GUARD: PDF service error (HTTP ${res.status})`, res.status);
        continue; // one bounded retry on 5xx
      }
      const buf = new Uint8Array(await res.arrayBuffer());
      const ct = res.headers.get("content-type") ?? "";
      // Content sniff: %PDF- for pdf, PK\x03\x04 (zip) for docx. A wrong
      // magic or content-type is refused — never store mystery bytes.
      const looksRight =
        format === "docx"
          ? buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04 && ct.includes(DOCX_MIME)
          : buf.length > 5 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d && ct.includes("application/pdf");
      if (!looksRight) {
        throw new PdfServiceError(`PDF_GUARD: PDF service returned a non-${format.toUpperCase()} response`);
      }
      const ext = format === "docx" ? ".docx" : ".pdf";
      const disposition = res.headers.get("content-disposition") ?? "";
      const m = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      const filename = sanitizeFilename(m?.[1] ?? "", `${opts.state.toUpperCase()}_${opts.form.toUpperCase()}${ext}`, ext);
      return {
        bytes: buf,
        filename,
        sha256: createHash("sha256").update(buf).digest("hex"),
        latencyMs: Date.now() - started,
        retried,
      };
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof PdfServiceError && e.status !== null && e.status < 500) throw e;
      if (e instanceof PdfServiceError) {
        lastError = e;
      } else if (e instanceof Error && e.name === "AbortError") {
        lastError = new PdfServiceError("PDF_GUARD: PDF service request timed out");
      } else {
        lastError = new PdfServiceError("PDF_GUARD: PDF service request failed");
      }
    }
  }
  throw lastError ?? new PdfServiceError("PDF_GUARD: PDF service request failed");
}

/** Reachability probe for health checks — no secrets in, booleans out. */
export async function pdfServiceHealthy(timeoutMs = 4000): Promise<"disabled" | "ok" | "unreachable"> {
  if (!pdfServiceEnabled()) return "disabled";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${pdfServiceUrl()}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok ? "ok" : "unreachable";
  } catch {
    clearTimeout(timer);
    return "unreachable";
  }
}
