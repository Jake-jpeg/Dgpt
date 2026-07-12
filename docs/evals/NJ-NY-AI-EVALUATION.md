# NJ/NY AI Workflow — Offline Evaluation & Regression Method

Status: local proof, synthetic data only. The evaluation suite is
`tests/njny-evals.test.ts` (39 checks) plus the live seed validation in
`scripts/seed-nj-ny-matters.mjs` (145 checks against a running local
server). **No evaluation makes a live OpenAI call** — every provider
interaction is a mocked Responses-API `fetch`. The only live-call artifact
in the repository is the opt-in smoke test (`scripts/openai-smoke.mjs`,
gated by `RUN_OPENAI_SMOKE=true`).

## Why offline

The system's legal-safety properties are structural, not statistical: they
must hold for EVERY model output, including adversarial ones. So the evals
inject controlled model outputs (valid, malformed, and malicious) beneath
the real orchestration code and assert what the system does with them. A
better model cannot make the system safer than these checks; a worse model
cannot make it less safe.

## Dimensions and what "pass" means

### E1 — Legal-content governance
Every shipped authority record is complete (stable ID, jurisdiction,
proposition, official source name, dated retrieval) and none ships
`APPROVED` — approval is a human counsel decision under
`docs/legal-authority/LEGAL-CONTENT-CHANGE-CONTROL.md`. Open research items
(`[needs cite check]` / `[not found]`) must survive into the runtime
snapshot rather than being silently dropped. Missing snapshot version/review
metadata and stale review ages produce loud warnings; the
`ALLOW_UNAPPROVED_LEGAL_CONTENT` override is refused at startup outside
`APP_STAGE=local`. The shipped intake config validates clean, and a
deliberately dangling authority reference is caught by the startup guard.

### E2 — Deterministic branching
All 15 matter categories compose versioned schemas (shared core + exactly
one state's modules). Conditional display is evaluated by the pure engine —
children/enforcement/military branches flip on facts, not on model output —
and the engine runs with network access hard-disabled (a fetch stub that
throws proves no model sits in the question path). Jurisdiction signals
derive from residence-history facts, flag both-state records as
multi-jurisdiction, and never auto-select from an address. The document
checklist derives deterministically from answers, with the attorney-only
waive override honored.

### E3 — Client-language surface
Pre-clearance, the client questionnaire is unavailable with neutral copy
(no conflict vocabulary). Post-clearance, the client payload contains no
statute citations (N.J.S.A./DRL/FCA/§), no `authorityIds`, no review
statuses, and no attorney determinations — while the firm view (contrast
check) does carry the internal metadata. Jurisdiction, form-readiness,
legal-authority, and extraction routes answer 403 to client accounts. The
client checklist shows plain-language requests only. Save-and-resume works
through the real PUT/GET routes, and conditional questions appear after the
facts that trigger them.

### E4 — AI security
With AI disabled, no network call is attempted and the endpoint answers 503
(the rest of the portal is untouched). Roles are re-read from the database
at invocation (a client account is DENIED before any call). The request
contract is verified byte-level from the captured mock: `store:false`,
strict `json_schema`, bounded `max_output_tokens`, salted safety identifier
that never embeds the matter ID, no tools, no reasoning/chain-of-thought
request. The system prompt hardens against injection (matter materials are
untrusted data, never instructions) and injected document text reaches the
model context only inside the quoted data block. Provider 401/400/404
surface as internal configuration errors on the first attempt with no
retry and no fallback model. Invocation logging is metadata-only — a
sentinel client answer never appears in `ai_invocation` or audit rows.

### E5 — Provenance validation
`validateAiReport` accepts a well-formed report citing known references and
rejects: unknown legal authority IDs (the seeded injection fixture's
`NJ-FAKE-STATUTE-999`), retired/superseded citations, unknown intake-answer
references, unknown document-version references, and kind mismatches.
End-to-end, a mocked model output carrying a fake citation is REJECTED —
recorded as `REJECTED_OUTPUT` with an `AI_OUTPUT_REJECTED` audit event and
**no document version is created**. Malformed shapes are likewise never
saved.

### E6 — Approval & materialization
Every accepted output materializes as an `AI_DRAFT` document version in
`ATTORNEY_REVIEW_REQUIRED`; release without a live exact-version approval
is refused by the server; staff may invoke actions but the artifact still
requires attorney review. The structured actions return
`ATTORNEY_REVIEW_REQUIRED` artifacts through the real endpoint.

### E7 — State scenarios & form readiness
The readiness vocabulary contains exactly one READY state —
`READY_FOR_ATTORNEY_FORM_PREPARATION` — and no "ready to file" state
exists anywhere in the system. Status precedence is verified
(jurisdiction review → missing facts → …), NY matters flag the
superseded-risk official form (NY-SNW) for version review, the attorney
jurisdiction API separates FACTS COLLECTED from the determination and
flags multi-state records, STAFF cannot set jurisdiction/category, and
unsupported document formats (DOCX) are honestly `UNSUPPORTED` /
`[INCOMPLETE]` — never fabricated.

## Scenario seed (live, local)

`scripts/seed-nj-ny-matters.mjs` exercises the same properties through the
real HTTP surface with 20 synthetic matters (NJ FM/FD/post-judgment/DV,
NY Supreme/Family Court/family offense, UCCJEA, multi-jurisdiction,
contradiction, missing tax return, prompt-injection document,
re-versioned approval, AI-off, conflict-pending). Last local run:
20/20 seeded, 145/145 checks passed.

## Running

```bash
npm test                                   # full suite (incl. the 39 evals)
npx vitest run tests/njny-evals.test.ts    # evals only
node scripts/seed-nj-ny-matters.mjs        # live seed vs. running dev server
RUN_OPENAI_SMOKE=true node scripts/openai-smoke.mjs   # opt-in live smoke
```

## Known limitations

Offline evals prove structural behavior, not model quality: they cannot
measure how *useful* a real model's memo is, only that unsafe outputs are
rejected and safe ones are quarantined for attorney review. Model-quality
review remains a human attorney task during the local pilot, using the
workbench's review-required artifacts. County/part-level practice
variations are explicitly out of scope and flagged as such in every
readiness report.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
