# AI Document Inputs — extraction, bounds, and honesty

## Explicit action, explicit audience

Document text never flows to the AI layer implicitly. A STAFF or ATTORNEY
user runs the extraction action (`POST
/api/document-versions/{id}/extract`); its GET presents a pre-call summary
first (title, version, type, size, matter, and the warning that extracted
text becomes available to internal AI actions as untrusted data). Clients
have no access to this route.

## Local and bounded

Extraction (`src/lib/ai/extract.ts`) is **local** — nothing is sent to any
external service by extracting:

| Input | Behavior |
|---|---|
| `text/plain`, `text/markdown` | decoded natively |
| PDF with uncompressed text streams | minimal local text pull, location notes per page where possible |
| Compressed/image PDF | `UNSUPPORTED` + `[INCOMPLETE] compressed/image PDF extraction not implemented — do not fake analysis` |
| DOCX and everything else | `UNSUPPORTED` + `[INCOMPLETE] <mime> extraction not implemented (DOCX pending)` |

Extracted text is stored per version (`document_extraction`), capped in
length, and truncated again (≤6000 chars per document) when it enters the
model context — large exhibits never blow up a request.

## Honesty over coverage

An unsupported format is reported `UNSUPPORTED`/`[INCOMPLETE]` to both the
UI and the model context. The system never OCRs by pretending, never
summarizes what it could not read, and the document-gap action is
explicitly instructed that the deterministic checklist — not its own
reading — is authoritative.

## Untrusted-data posture

Extraction text rides into the model inside the quoted MATTER MATERIALS
block. The system prompt requires embedded instructions (the classic
"IGNORE ALL PREVIOUS INSTRUCTIONS…") to be treated as quoted content and
flagged, never followed; the provenance validator then rejects any output
citing an authority the injection tried to smuggle in. Both halves are
regression-tested with a seeded injection fixture (seed matter NJNY-17 and
eval E4/E5).

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
