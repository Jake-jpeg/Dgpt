# Legal Research Method — NJ/NY Snapshot (2026-07-12)

## Method

1. **Official-source priority.** Statutes: NJ Legislature statute database
   (lis.njleg.state.nj.us) and NY State Senate Open Legislation
   (nysenate.gov/legislation/laws). Rules, forms, directives, tools: NJ
   Courts (njcourts.gov) and the NY State Unified Court System
   (nycourts.gov / ww2.nycourts.gov / webfiles.nycourts.gov).
2. **Locator use of secondary sources.** Justia's statute mirror was used
   ONLY to locate and read the NJ Revised Statutes text where the official
   NJ Legislature gateway produced session-bound deep links that could not
   be fetched deterministically. Every such record says so in its
   `officialSource`/`notes`, names the official database as the authority,
   and remains COUNSEL_REVIEW_REQUIRED. No law-firm blogs or marketing
   pages were used for any purpose.
3. **No memory-derived propositions.** Every proposition in the snapshot
   traces to a page actually retrieved on 2026-07-12 (searches and fetches
   recorded in the manifests). Where a caption or figure could not be
   fetched, the record carries `[needs cite check]` or `[not found]` rather
   than a guess.
4. **No citator claims.** Web research is not a citator. No record asserts
   good-law status. No case law was used, and no caselaw-dependent decision
   rules exist in the application.
5. **No auto-approval.** Every record enters as RESEARCHED (inventory-type
   records: forms/pages) or COUNSEL_REVIEW_REQUIRED (propositions of law).
   Only counsel may move a record to APPROVED, via the change-control
   process.
6. **Concise propositions only.** Records store short propositions and
   source metadata — never long copyrighted reproductions of statutes,
   rules, or forms.

## What the runtime does with this

The application uses ONLY the local snapshot
(`src/config/legal-authority/{nj,ny}/records.json`) — it never browses the
web for client legal analysis. AI-generated legal propositions must cite
snapshot IDs; unknown citations are rejected (see docs/AI-PROVENANCE.md).
Client-facing legal conclusions are refused entirely while records are
unapproved (`assertClientLegalContentAllowed`), and this build presents no
legal conclusions to clients anywhere.
