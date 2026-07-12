# ReportLab Integration (Parts 2–4)

## Two services, one boundary

DivorceGPT (Next.js) is the system of record: identities, matters,
authorization, documents, audit. The RL service (Flask + ReportLab) is a
stateless renderer: structured JSON in, deterministic PDF out. RL holds no
client database, calls no AI, changes no matter state, and releases
nothing. The browser NEVER calls RL — every render is a server-to-server
call from the Dgpt backend carrying `Authorization: Bearer
PDF_SERVICE_TOKEN` (constant-time verified on the RL side; CORS is
explicitly not authentication).

## Separation of duties

| Actor | Does | Never does |
|---|---|---|
| OpenAI | internal summaries/chronologies/issues, drafts narrative language as strict structured data, maps assertions to provenance, flags gaps | approve, release, file, pick endpoint/state/form/filename/permissions |
| ReportLab | renders explicit attorney-controlled structured form data into deterministic PDFs | legal judgments, OpenAI calls, matter-state changes, releases |
| ATTORNEY | confirms jurisdiction + category, selects the form, reviews AI language, corrects data, authorizes render, reviews the PDF, approves the exact version, controls release | — |

## Document lifecycle (implemented)

```
AI_GENERATED_DRAFT (docKind AI_DRAFT, version status ATTORNEY_REVIEW_REQUIRED)
   → attorney reviews / corrects structured source data
   → ATTORNEY_CONFIRMED_FORM_DATA (render request; audited FORM_DATA_CONFIRMED
     with a deterministic payload fingerprint — approving source data never
     approves any PDF)
   → REPORTLAB_RENDERED_PDF (docKind RENDERED_FORM, new version, status
     ATTORNEY_REVIEW_REQUIRED; title carries "SYNTHETIC STAGING DOCUMENT —
     attorney review required")
   → attorney exact-version approval (binds to the version's SHA-256)
   → APPROVED_FOR_CLIENT / SIGNATURE / FILING
   → RELEASED (attorney-controlled; hash must match the live approval)
```

A revision (new version) never inherits approval; release of an
unapproved or re-versioned PDF is refused by the server (regression-tested
offline and exercised live by the staging acceptance).

## Where things live

| Concern | Location |
|---|---|
| Allowlist (state/form) | `src/lib/pdf-service/types.ts` (`ALLOWED_RENDERS`: nj/verification, nj/complaint, ny/ud1) |
| Deterministic mappings | `src/lib/pdf-service/mappings.ts` |
| Server-only HTTP client (timeout, 1 retry on 5xx, %PDF sniff, SHA-256) | `src/lib/pdf-service/client.ts` |
| Metadata-only audits | `src/lib/pdf-service/audit.ts` |
| ATTORNEY-only render route | `src/app/api/matters/[id]/render-pdf/route.ts` |
| RL bearer auth + input hardening | RL repo `app.py` (branch divorcegpt-2-pdf-staging-auth) |
| RL tests (13) | RL repo `tests/test_auth.py` |
| Dgpt tests (14) | `tests/pdf-and-staging.test.ts` |

Nothing in this integration makes any generated form "court-ready";
county/part variations and final legal sufficiency remain attorney work.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
