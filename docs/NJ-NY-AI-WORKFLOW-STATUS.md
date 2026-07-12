# NJ/NY Intake + AI Workflow — Batch Status

Branch: `divorcegpt-2-nj-ny-intake-ai` (from pilot-hardening HEAD `32b1053`).
Local proof only — synthetic data, no deployment, no push, no production data.

| Batch | Scope | Status |
| --- | --- | --- |
| B1 | Legal research + source governance (31 authority records, manifests, method/limitations/change-control, snapshot rule, startup flag guard) | DONE — commit `6f7acb9` |
| B2 | Versioned intake-schema engine (types, deterministic condition engine, startup schema validation) | DONE — commit `6f7acb9` |
| B3 | Shared factual core (20 sections, ~21 areas, shared document catalog, attorney determinations) | DONE |
| B4 | NJ intake modules (facts → NJ authority mappings; determinations; no calculators) | DONE |
| B5 | NY intake modules (facts → NY authority mappings; determinations; no calculators) | DONE |
| B6 | Attorney jurisdiction/category/scope review (DB columns, ATTORNEY-only API, audit) | DONE |
| B7 | OpenAI Responses API integration (store:false, salted safety identifier, no-fallback config errors, metadata-only logging) | DONE |
| B8 | Structured outputs + provenance validation (10 actions, strict JSON schema, citation allowlist, REJECTED_OUTPUT never saved) | DONE |
| B9 | Document analysis inputs (bounded local extraction; explicit STAFF/ATTORNEY action; UNSUPPORTED/[INCOMPLETE] honesty) | DONE |
| B10 | Lawyer workbench UI (jurisdiction, intake review, checklist, form readiness, legal sources, AI actions + report viewer) | DONE |
| B11 | Client intake experience UI (`/portal/intake`, schema-driven, save/resume, a11y) | DONE |
| B12 | Deterministic document checklist (+ attorney waive/override, disclaimer) | DONE |
| B13 | Form-readiness report (attorney-only; never "ready to file") | DONE |
| B14 | Synthetic test matters (20 scenarios; 145/145 live checks) | DONE |
| B15 | OpenAI live smoke test (opt-in `RUN_OPENAI_SMOKE=true`) | DONE |
| B16 | Offline evals (39 checks, 7 dimensions) + evaluation doc | DONE |
| B17 | Documentation set (AI docs, generated intake docs, demo guide, core-doc updates) + `.env.example` | DONE |
| B18 | Final validation + report | PENDING |

Test suite: 234/234 passing through B16 (static AI-import check updated for
the second STAFF/ATTORNEY-only importer, the extract route). `tsc --noEmit`
clean.

Open legal-content items are tracked in `docs/legal-authority/*` with
`[needs cite check]` / `[not found]` markers; nothing is auto-APPROVED.
