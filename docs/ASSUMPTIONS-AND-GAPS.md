# Assumptions & Gaps — DivorceGPT 2.0 Attorney Workflow

## Assumptions made during implementation

1. **Pre-existing local changes preserved.** The working tree had
   uncommitted modifications (stale 1.0 files in `_to_delete/`, deleted
   `src.zip`). They were committed unchanged in the branch's checkpoint
   commit; nothing was discarded. `_to_delete/snapshot-pre2.0.tar.gz` is a
   session file-transfer artifact, safe to delete.
2. **Matter ↔ client is 1:1.** A matter binds to exactly one client
   account; an invitation cannot rebind a matter owned by another client.
   Multi-party portals would need a matter_participant model.
3. **Re-screening resets clearance.** Submitting a new identity/conflict
   screen on a matter returns it to a pending status even if previously
   CLEARED (new information ⇒ new attorney review). Deliberate.
4. **DECLINED purge scope.** On attorney DECLINE, intake sessions purge
   immediately; the matter row, conflict history, consent records, and audit
   survive. Uploaded documents on a declined matter persist until the
   retention sweep — attorney can purge sooner by marking ABANDONED.
5. **ADMIN has no blanket matter access.** Least privilege: an admin doing
   matter work needs an explicit grant like staff. The directive was
   silent; this is the conservative reading.
6. **Legal hold is attorney-set.** Treated as a legal determination
   (ADMIN "manages retention configuration" but cannot weaken preservation).
7. **Stage-1 intake machine retained.** The scope gates/tiers still purge
   out-of-scope sessions with verbatim cards — unchanged behavior behind the
   new conflict wall.
8. **Attorney matter grants**: the matter creator self-grants; colleagues
   are added via /api/matters/[id]/access. The conflict-review queue is
   per-grant, matching a solo/small-firm model.
9. **OpenAI calls use fetch** (no SDK dependency) against
   /v1/chat/completions with temperature 0.2. Model default gpt-4o-mini
   until OPENAI_MODEL is set.
10. **No emails are sent** (invitations are conveyed out of band). Email
    delivery is [NOT CONFIGURED] and prohibited by the build directive.

## Gaps / [INCOMPLETE]

- ~~UI for 2.0 surfaces~~ — RESOLVED (MVP UI batch): /portal, /invite,
  /portal/matter, /intake (2.0 states), /firm, /firm/conflicts,
  /firm/matters/[id], /admin. See docs/MVP-UI-CHECKLIST.md and
  docs/MVP-DEMO-GUIDE.md.
- ~~Attorney conflict queue~~ — RESOLVED: GET /api/attorney/conflicts +
  /firm/conflicts (grant-scoped).
- **UI polish is minimal by design** (restrained MVP): no optimistic
  updates, tables over dashboards, minimal empty states. The demo guide
  covers the full flow.
- **dev-login now accepts all four roles** for LOCAL testing only; the
  session role remains a hint — STAFF/ADMIN must exist as DB rows (seeded
  via the admin API) and authorization re-reads the DB role per request.
- **Legacy attorney session views** (`/api/attorney/sessions*`) remain
  session-scoped, not matter-scoped (they still work and are tested).
- **Rate limiting** is in-memory (single instance).
- **Migrations** are additive try/catch ALTERs — fine for the disposable
  dev/beta SQLite DB; a real migration tool should come with Postgres.

## [NOT CONFIGURED] (infrastructure/vendor)

Production file storage + malware scanning · managed Postgres · real
ConflictCheckProvider · Google/Entra production app registrations ·
Turnstile keys · NEXT_PUBLIC_INQUIRY_EMAIL mailbox · OpenAI production
key/org/project + data-processing terms review.

## [COUNSEL REVIEW REQUIRED] (legal text)

Relationship disclosure (src/config/disclosure.ts) · client-facing status
strings (src/lib/matters/client-view.ts, service pending message) · every
[ATTORNEY TO SUPPLY] placeholder in src/config (DV card is the
ship-blocker) · retention periods and policy · PRIVACY-NOTICE-DRAFT.md ·
AI-vendor disclosure language.
