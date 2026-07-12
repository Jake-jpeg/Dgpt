# Legal-Content Change Control

Legal content is configuration under version control — never edited live.

## Records

Machine-readable records live in `src/config/legal-authority/{nj,ny}/records.json`.
Statuses: RESEARCHED → COUNSEL_REVIEW_REQUIRED → APPROVED, with RETIRED and
SUPERSEDED as terminal states. **Only counsel moves a record to APPROVED**;
the repository never auto-approves. Retiring/superseding a record requires
removing or re-pointing every intake item and prompt that references it
(startup validation refuses active schemas that reference RETIRED records).

## Snapshot versioning (environment)

```
LEGAL_CONTENT_VERSION=        # e.g. 2026.07-nj-ny-1 — set when counsel signs off
LEGAL_CONTENT_REVIEWED_AT=    # YYYY-MM-DD of the last counsel review
LEGAL_CONTENT_MAX_AGE_DAYS=180
```

Missing version/review date, review age past the max, or superseded-form
risk produce attorney/admin warnings (portal Legal Source Status panel +
startup log). The runtime never browses the web for legal analysis.

## Local development override

`ALLOW_UNAPPROVED_LEGAL_CONTENT=true` lets INTERNAL (staff/attorney)
development surfaces run against unapproved records. It works only when
`APP_STAGE=local`, always emits a prominent warning, never enables
client-facing legal conclusions, and the process REFUSES TO START with the
flag set in staging or closed_pilot.

## Change procedure

1. Research update on official sources; record retrieval dates.
2. Update records.json (new IDs for new propositions; never reuse an ID;
   supersede rather than mutate approved propositions).
3. Counsel review → status changes → set LEGAL_CONTENT_VERSION/REVIEWED_AT.
4. Run the governance test suite (tests/legal-governance.test.ts) — it
   fails on dangling references, retired-authority use, and missing
   metadata.
5. Commit with a message naming the snapshot version. The git history is
   the change log.
