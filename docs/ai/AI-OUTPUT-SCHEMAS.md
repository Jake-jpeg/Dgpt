# AI Output Schemas (strict structured outputs)

Source of truth: `src/lib/ai/schemas2.ts`. Every workbench action requests
OpenAI **strict structured outputs** (`text.format = { type: "json_schema",
strict: true }`), and the same schema is re-validated server-side with zod
after the response arrives — the provider's conformance is never trusted on
its own.

## The report envelope (all ten kinds)

```jsonc
{
  "kind": "<one of the ten kind literals — must echo the requested kind>",
  "title": "string ≤300",
  "summary": "string ≤8000",
  "factualAssertions": [ /* ≤200 */ ],
  "legalPropositions": [ /* ≤60 */ ],
  "items":              [ /* ≤200 */ ],
  "followUpQuestions":  [ /* ≤60 */ ]
}
```

### factualAssertion

```jsonc
{
  "assertion": "string ≤2000",
  "supportStatus": "SUPPORTED | INFERRED | NOT_FOUND | CONFLICTING | ATTORNEY_CONFIRMATION_REQUIRED",
  "intakeAnswerIds":    ["question IDs the assertion rests on", /* ≤40 */],
  "documentVersionIds": ["document version IDs", /* ≤40 */],
  "documentLocations":  ["e.g. 'page 2' — parallel to documentVersionIds"],
  "sourceQuoteOrSummary": "string ≤2000",
  "notes": "string ≤2000"
}
```

### legalProposition

```jsonc
{
  "proposition": "string ≤2000",
  "legalAuthorityIds": ["snapshot IDs only — min 1, ≤20"],
  "jurisdiction": "NJ | NY | GENERAL",
  "authorityReviewStatus": "echo of the snapshot record's status",
  "attorneyReviewRequired": true
}
```

### item (generic labeled findings)

```jsonc
{ "label": "≤300", "detail": "≤4000",
  "flag": "\"\" | [not found] | [inferred] | [needs cite check] | [TREATMENT?]" }
```

### followUpQuestion

```jsonc
{ "question": "≤1000", "reason": "≤1000", "audience": "ATTORNEY | CLIENT_DRAFT" }
```

## Three validation layers (order matters)

1. **Schema** — zod parse of the exact kind requested. A kind mismatch or
   any shape violation ⇒ `SCHEMA` problem.
2. **Citation allowlist** — every `legalAuthorityIds` entry must be a known
   snapshot ID and not RETIRED/SUPERSEDED ⇒ otherwise `UNKNOWN_CITATION`.
3. **Provenance references** — every `intakeAnswerIds` entry must be an
   actually-saved answer for this matter; every `documentVersionIds` entry
   must be a real version of this matter ⇒ otherwise `UNKNOWN_ANSWER_REF` /
   `UNKNOWN_DOCUMENT_REF`.

Any problem ⇒ the output is **REJECTED_OUTPUT**: logged (metadata only),
audited as `AI_OUTPUT_REJECTED`, and **never** materialized as a document
version. There is no partial acceptance and no auto-retry-with-edits.

## Where accepted output goes

Accepted reports are serialized as JSON and stored as an `AI_DRAFT`
document version in `ATTORNEY_REVIEW_REQUIRED` — the same review/approval/
release pipeline as every other document. The workbench UI renders the
report read-only with support-status badges and provenance chips.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
