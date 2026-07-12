# AI Provenance — how every AI statement stays traceable

## The rule

An AI output may only reference three vocabularies, all server-controlled:

1. **Intake answers** — question IDs that are actually saved for the matter
   (`matter_intake_answer`).
2. **Document versions** — version IDs that actually exist on the matter,
   optionally with a location note ("page 2").
3. **Legal authorities** — IDs from the dated local snapshot
   (`src/config/legal-authority/*/records.json`), carrying that record's
   review status.

Anything outside those vocabularies — a hallucinated statute, an injected
"authority" from a document, a citation to another matter — fails
validation and the whole output is rejected, unsaved.

## How the vocabularies reach the model

`buildMatterContext(matterId)` assembles the context JSON server-side:
matter posture (category, confirmed jurisdiction, scope, schema version),
deterministic jurisdiction signals, every saved answer with its question
text and ID, the deterministic missing-required list, the authoritative
checklist state, each document version (ID, title, kind, status, bounded
extraction text), and the **allow-listed authority snapshot** for the
confirmed jurisdiction (ID, section, proposition, status). The model is
told to cite only from these lists; validation then enforces it.

## What the reviewer sees

The workbench report viewer renders, per factual assertion: the support
status (`SUPPORTED / INFERRED / NOT_FOUND / CONFLICTING /
ATTORNEY_CONFIRMATION_REQUIRED`), chips for each cited answer ID and
document version, and the model's quoted source line. Per legal
proposition: the snapshot authority IDs, jurisdiction, and the snapshot's
review status (e.g. `COUNSEL_REVIEW_REQUIRED`) — so an attorney always
sees that a cited authority is itself pending counsel approval.

## What is logged (and what never is)

`ai_invocation` rows carry: matter ref, user ref, action, model, status
(`OK / ERROR / DISABLED / DENIED / REJECTED_OUTPUT`), provider response ID,
prompt version, latency, token counts. The audit chain carries the same
metadata. **Never logged:** prompt text, matter materials, document
content, or model responses. The accepted report itself lives only as the
AI_DRAFT document version, inside the matter's access-controlled storage.

## Rejection semantics

Rejected outputs are not edited, not partially salvaged, and not retried
with corrections — the invocation is recorded `REJECTED_OUTPUT`, an
`AI_OUTPUT_REJECTED` audit event is written (problem codes only), and the
acting staff/attorney sees an internal error naming the first problem
(e.g. `UNKNOWN_CITATION: legal citation 'NJ-FAKE-STATUTE-999' is not in
the approved local authority snapshot`). Verified end-to-end in
`tests/njny-evals.test.ts` (E5).

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
