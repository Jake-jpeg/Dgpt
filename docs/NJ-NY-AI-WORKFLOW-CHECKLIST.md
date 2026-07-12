# NJ/NY Intake + AI Workbench — Execution Checklist

Branch `divorcegpt-2-nj-ny-intake-ai` from `32b1053` (tag
`checkpoint-pre-nj-ny`). Synthetic data only; local proof only; nothing here
is production-ready, ethics-approved, carrier-approved, or court-approved.

## B1 Legal research + source governance
- [x] Official-source research (NJ Judiciary/Legislature/Rules; NY UCS/Senate OpenLeg/22 NYCRR) — no blogs, no memory, no invented citations
- [x] docs/legal-authority/{NJ,NY}-SOURCE-MANIFEST.md + METHOD + LIMITATIONS + CHANGE-CONTROL
- [x] Machine-readable records src/config/legal-authority/{nj,ny}/ (stable IDs, COUNSEL_REVIEW_REQUIRED, never auto-APPROVED)
- [x] Law snapshot: LEGAL_CONTENT_VERSION/REVIEWED_AT/MAX_AGE_DAYS; stale/unapproved warnings; ALLOW_UNAPPROVED_LEGAL_CONTENT local-only (startup-rejected elsewhere); runtime never browses the web

## B2 Versioned intake-schema engine
- [x] Data-driven schema (src/config/intake/*, src/lib/intake2/*) — IDs, jurisdictions, categories, sections, help text, types (incl. repeating records), conditions, sensitive/internal flags, authority IDs, doc + output mappings, versions, review status
- [x] Deterministic condition evaluation (OpenAI never picks the next question)
- [x] Startup schema validation (dup IDs, dangling conditions/authorities, retired authorities, missing versions, client/attorney-only conflicts)

## B3 Shared factual core (21 areas)
- [x] Safe-use/communication (no forced sensitive reasons; static emergency text) · identity · relationship · residence FACTS (no jurisdiction advice) · prior/pending matters · children/parentage · custody FACTS · safety indicators · income · expenses · assets · debts · property history (no classification) · insurance · taxes · retirement · business · special flags · document inventory · goals (preferences) · client review + certification [COUNSEL REVIEW REQUIRED]

## B4 New Jersey modules
- [x] Categories NJ_FM_DIVORCE_{UNCONTESTED,CONTESTED}, NJ_FM_POST_JUDGMENT, NJ_FD_{CUSTODY_PARENTING,SUPPORT_PARENTAGE}, NJ_UCCJEA_INTERSTATE, NJ_EMERGENCY_OR_DV_ESCALATION
- [x] NJ questions mapped to researched authorities (residence/grounds/CIS/DV/UCCJEA/UIFSA/post-judgment); no outcome calculators; no client legal conclusions
- [x] docs/intake/NJ-{INTAKE-MAP,FORM-MAPPING,DOCUMENT-CHECKLIST,LEGAL-REVIEW-QUEUE}.md

## B5 New York modules
- [x] Categories NY_SUPREME_{UNCONTESTED_JOINT,UNCONTESTED,CONTESTED,POST_JUDGMENT}, NY_FAMILY_COURT_{CUSTODY_VISITATION,SUPPORT_PARENTAGE}, NY_UCCJEA_INTERSTATE, NY_FAMILY_OFFENSE_OR_EMERGENCY_ESCALATION
- [x] NY questions mapped to researched authorities (DRL residence/grounds/maintenance/ED; SNW; CSSA; FCA; UCCJEA/UIFSA; 22 NYCRR); previews omitted by design
- [x] docs/intake/NY-{INTAKE-MAP,FORM-MAPPING,DOCUMENT-CHECKLIST,LEGAL-REVIEW-QUEUE}.md

## B6 Attorney jurisdiction & scope review
- [x] Matter fields (jurisdictionCandidate/Confirmed/By/At, matterCategory+ConfirmedBy, scopeStatus/Notes, intakeSchemaVersion); ATTORNEY-only route + structural guard; MULTI-JURISDICTION REVIEW REQUIRED; FACTS vs DETERMINATION UI split; no auto-state from mailing address

## B7 OpenAI Responses API
- [x] Server-only Responses client (structured outputs, store:false, safety identifier, timeout/retries/max-tokens env, usage metadata w/o content, response ID); model unavailable ⇒ internal config error, no vendor/model fallback
- [x] 10 internal actions (memo, chronology, issues, missing-facts, inconsistencies, doc-gaps, jurisdiction-facts, attorney follow-ups, client follow-up DRAFT, form-readiness)

## B8 Structured output + provenance
- [x] Strict schemas for all 10 outputs; provenance (supportStatus SUPPORTED/INFERRED/NOT_FOUND/CONFLICTING/ATTORNEY_CONFIRMATION_REQUIRED; intakeAnswerIds/documentVersionIds/locations)
- [x] Legal propositions must cite snapshot authority IDs; unknown citations ⇒ reject + audit; malformed output never saved; no chain-of-thought; injection-hardened prompts (matter material = data)

## B9 Document analysis (synthetic proof)
- [x] Explicit staff/attorney action w/ pre-call summary; bounded local text extraction (txt; minimal uncompressed PDF; DOCX honestly [INCOMPLETE]); synthetic inconsistent/injection docs seeded as text fixtures (see seed script); OpenAI file-input upload path remains [NOT CONFIGURED] by design — extraction is local-only in this build

## B10 Lawyer workbench UI
- [x] Panels: snapshot, intake review, document review, legal-source status (stale warnings), AI actions (confirm w/ model+sources), AI results (structured views + source map + flags), attorney review (notes/rerun/edit/resolve/follow-up/approve exact version); no approve-all; STAFF/ADMIN cannot approve/release

## B11 Client intake experience
- [x] Schema-driven sections, progress, save/resume, static explanations, doc requests, missing items, help, review page, submission confirmation; assigned-workflow language (never client-chooses-law); a11y + responsive; nothing internal leaks

## B12 Deterministic document checklist
- [x] Statuses required/requested/received/incomplete/not-applicable/attorney-waived/attorney-review; AI only summarizes/flags; internal-tool disclaimer

## B13 Form-readiness mapping
- [x] Field→official-form-family maps (CIS; NY UD packet; SNW; FC petitions; worksheets); attorney-only readiness report with the 6 NOT-READY/READY statuses; never "ready to file" without separate exact-version approval

## B14 Synthetic matters (20)
- [x] Fixtures for all 20 listed scenarios incl. contradiction, missing tax return, prompt-injection doc, re-versioned approval, AI-off

## B15 Live smoke test (opt-in)
- [x] scripts/openai-smoke.mjs gated on RUN_OPENAI_SMOKE=true; minimum calls; metadata-only logging

## B16 Evaluation + regression
- [x] Offline suites A–G (governance, branching, client language, AI security, provenance, approval, 20 scenarios) + docs/evals/NJ-NY-AI-EVALUATION.md

## B17 Documentation (full list in directive)
- [x] docs/ai/{AI-PROMPT-TEMPLATES,AI-OUTPUT-SCHEMAS,AI-PROVENANCE,AI-DOCUMENT-INPUTS,AI-COST-AND-USAGE}.md
- [x] docs/intake/ generated from config (NJ/NY intake maps, form mappings, document checklists, legal review queue) via scripts/generate-intake-docs.ts
- [x] docs/NJ-NY-LOCAL-DEMO-GUIDE.md; ARCHITECTURE/DATA-FLOW/ROLE-PERMISSIONS updated; .env.example extended (OPENAI_*, RUN_OPENAI_SMOKE, LEGAL_CONTENT_*)
## B18 Final validation (all commands actually run; honest reporting)
- [ ] npm test · tsc · eslint · build · e2e-demo · seed script · final report
