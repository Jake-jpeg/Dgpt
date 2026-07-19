/**
 * Bounded local text extraction (B9) — synthetic-proof adapter.
 *
 * Supported: text/plain and markdown natively; PDF via a minimal extractor
 * for UNCOMPRESSED text streams (sufficient for the synthetic PDFs this
 * repo generates — page markers are preserved as locators). DOCX and other
 * formats are honestly reported UNSUPPORTED ([INCOMPLETE]) — analysis is
 * never faked. No OCR loops. Extraction runs only on an explicit STAFF/
 * ATTORNEY action.
 *
 * Provider file inputs (remote file upload) are NOT used in this build:
 * documented in docs/AI-DOCUMENT-INPUTS.md as [NOT CONFIGURED], including
 * lifecycle/retention questions to resolve before enabling.
 */
import { getDb, nowIso } from "@/lib/db/index";
import { getFileStorage } from "@/lib/storage";
import { getVersion } from "@/lib/db/documents";

const MAX_EXTRACT_CHARS = 20_000;

export interface ExtractionRow {
  documentVersionId: string;
  status: "EXTRACTED" | "UNSUPPORTED" | "FAILED";
  text: string | null;
  locatorNote: string | null;
  createdAt: string;
}

export function getExtraction(versionId: string): ExtractionRow | null {
  const r = getDb()
    .prepare(`SELECT * FROM document_extraction WHERE document_version_id = ?`)
    .get(versionId) as Record<string, unknown> | undefined;
  if (!r) return null;
  return {
    documentVersionId: r.document_version_id as string,
    status: r.status as ExtractionRow["status"],
    text: (r.text as string | null) ?? null,
    locatorNote: (r.locator_note as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}

function saveExtraction(versionId: string, status: ExtractionRow["status"], text: string | null, note: string | null): ExtractionRow {
  getDb()
    .prepare(
      `INSERT INTO document_extraction (document_version_id, status, text, locator_note, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(document_version_id) DO UPDATE SET status=excluded.status, text=excluded.text, locator_note=excluded.locator_note, created_at=excluded.created_at`
    )
    .run(versionId, status, text, note, nowIso());
  return getExtraction(versionId)!;
}

/** Minimal PDF text extraction for uncompressed streams (synthetic PDFs). */
function extractPdfText(bytes: Uint8Array): { text: string; note: string } | null {
  const raw = Buffer.from(bytes).toString("latin1");
  if (!raw.startsWith("%PDF")) return null;
  if (/\/Filter\s*\/FlateDecode/.test(raw)) {
    return null; // compressed streams unsupported in this bounded adapter
  }
  const pieces: string[] = [];
  let page = 0;
  for (const stream of raw.split("stream")) {
    const bt = stream.indexOf("BT");
    if (bt === -1) continue;
    page++;
    const chunk = stream.slice(bt);
    const texts = [...chunk.matchAll(/\((?:\\.|[^()\\])*\)\s*Tj/g)].map((m) =>
      m[0]
        .replace(/\)\s*Tj$/, "")
        .replace(/^\(/, "")
        .replace(/\\([()\\])/g, "$1")
    );
    if (texts.length > 0) pieces.push(`[page ${page}] ` + texts.join("\n"));
  }
  if (pieces.length === 0) return null;
  return { text: pieces.join("\n\n"), note: "page locators from uncompressed PDF text streams" };
}

/** Explicit extraction action (staff/attorney routes call this). */
export async function extractDocumentText(versionId: string): Promise<ExtractionRow> {
  const version = getVersion(versionId);
  if (!version) throw new Error("VALIDATION: version not found");
  try {
    const bytes = await getFileStorage().get(version.storageKey);
    if (version.mime === "text/plain" || version.mime === "text/markdown") {
      const text = Buffer.from(bytes).toString("utf8").slice(0, MAX_EXTRACT_CHARS);
      return saveExtraction(versionId, "EXTRACTED", text, "plain text");
    }
    if (version.mime === "application/pdf") {
      const pdf = extractPdfText(bytes);
      if (pdf) {
        return saveExtraction(versionId, "EXTRACTED", pdf.text.slice(0, MAX_EXTRACT_CHARS), pdf.note);
      }
      return saveExtraction(versionId, "UNSUPPORTED", null, "[INCOMPLETE] compressed/image PDF extraction not implemented — do not fake analysis");
    }
    return saveExtraction(versionId, "UNSUPPORTED", null, `[INCOMPLETE] ${version.mime} extraction not implemented (DOCX pending)`);
  } catch {
    return saveExtraction(versionId, "FAILED", null, "extraction failed");
  }
}
