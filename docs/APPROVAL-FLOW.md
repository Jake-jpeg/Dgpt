# Document Approval Flow — DivorceGPT 2.0

## States

DRAFT → ATTORNEY_REVIEW_REQUIRED → (CHANGES_REQUESTED ↔ review) →
APPROVED_FOR_CLIENT | APPROVED_FOR_SIGNATURE | APPROVED_FOR_FILING →
RELEASED. Any non-terminal version becomes SUPERSEDED when a new version is
added. WITHDRAWN removes a version from play. (Enforced by CHECK constraint
+ `src/lib/db/documents.ts`.)

## Invariants (all test-enforced)

1. **Every new or revised version begins unapproved** — `addDocumentVersion`
   accepts only DRAFT / ATTORNEY_REVIEW_REQUIRED as the initial status and
   supersedes prior non-terminal versions.
2. **Approval is version-exact and hash-bound.** `document_approval` records
   the exact `document_version_id`, the version's SHA-256 at approval time,
   the approving attorney (role re-read from the DB at write time), a
   timestamp, the approval type, the authorized destination, and an optional
   note. Approval of one version never transfers to another.
3. **Only an ATTORNEY approves or releases.** The API layer requires the
   ATTORNEY role AND a matter grant; the persistence layer re-reads the
   CURRENT role again inside `approveVersion`/`releaseVersion`. STAFF and
   ADMIN attempts fail at both layers.
4. **Release re-verifies everything**: current ATTORNEY role; the exact
   version; a live (unrevoked) approval whose hash equals the version's
   hash; the destination matches the approval; and a FRESH SHA-256 of the
   actual stored bytes equals the approved hash (tamper check).
5. **No bulk approval, no automatic approval, no presumed approval.** The
   only approval code path takes a single version id; nothing approves on a
   timer, on upload, or by default.
6. **AI output** always enters as an AI_DRAFT version in
   ATTORNEY_REVIEW_REQUIRED and follows this same flow; there is no shortcut.
7. **Clients see only releases.** The client document list/download path
   404s for anything not released to CLIENT_PORTAL (own uploads excepted).

## Sequence

```
staff/attorney adds version (vN, sha256=H)     → status: review required
attorney requests changes                      → CHANGES_REQUESTED
staff adds vN+1 (sha256=H')                    → vN SUPERSEDED; vN+1 unapproved
attorney approves vN+1 {type, destination}     → APPROVED_FOR_*  (approval binds id+H')
attorney releases vN+1 {destination}           → verify role + approval + H' vs fresh hash → RELEASED
client (CLIENT_PORTAL releases only)           → can now view/download vN+1
```
