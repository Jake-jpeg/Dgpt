# Implementation Status — DivorceGPT 2.0 Attorney Workflow

Branch: `divorcegpt-2-attorney-workflow` · Baseline: `158bc60` (main) +
checkpoint commit preserving pre-existing uncommitted local changes.

## Final check results (end of Batch 10)

- `npm test` — **167/167 passing** (14 files; was 98/100 at baseline — the 2
  pre-existing beta-gate failures were fixed in Batch 2)
- `npx tsc --noEmit` — clean
- `npx eslint src tests` — clean (0 errors, 0 warnings)
- `npm run build` — production build succeeds
- Production smoke (`next start`): landing 200 · /api/beta/config 200 ·
  anonymous /api/intake/start 401 · anonymous /api/matters 401

## Batches — all complete ✔

| Batch | Commit | Summary |
|---|---|---|
| checkpoint | 291fc33 | preserved pre-existing local working-tree state |
| checklist | c6d3c4b | docs/IMPLEMENTATION-CHECKLIST.md |
| B1 roles+matters | 847a7a8 | app_user/matter/matter_access, DB-role authz, structural attorney-only dispositions, hash-chained audit |
| B2 invitations+consent | acf73f2 | hashed single-use invitations, neutral failures, disclosure consent, legacy beta gate |
| B3 conflict screening | ec3aa97 | CONFLICT_REVIEW_PENDING, 4-status automated screen, attorney-only CLEARED/DECLINED, retained conflict history |
| B4 accommodations | 90d2828 | help requests (no reason storable), alternate intake methods, info requests |
| B5 firm workflows | c76aafd | internal notes/escalations, matter grants, attorney-only lifecycle + legal hold |
| B6 files+documents | 4b9985b | FileStorage, 9-state lifecycle, version-exact hash-bound approval/release |
| B7 OpenAI layer | 4534d73 | src/lib/ai/, staff/attorney-only, kill switch, review-required artifacts, no confidential logging |
| B8 retention+audit | 177bb96 | configurable purge, engaged exemption, legal-hold block, survival guarantees, auth/denial audit |
| B9 branding | a41c4b4 | firm-name/inquiry-email config, no hard-coded mailboxes, neutral client language |
| B10 tests+docs | 3501483 + final | invitation tests, full docs set, .env.example, README; final validation |

## Files changed (high level)

src/lib/db/{index,repo,users,matters,invitations,disclosure,conflicts,
matter-workflow,notes,documents,config}.ts · src/lib/auth/{authz,rbac,
session}.ts · src/lib/{env,beta}.ts · src/lib/intake/{machine,service}.ts ·
src/lib/storage/{index,upload-policy}.ts · src/lib/retention/index.ts ·
src/lib/ai/** · src/lib/matters/client-view.ts · src/config/{branding,
disclosure}.ts · src/app/page.tsx, src/app/beta/page.tsx ·
src/app/api/{matters/**,admin/**,invitations/**,disclosure,documents/**,
document-versions/**,intake/start,intake/[id]/identity,auth/**} ·
tests/** (7 new suites, 3 reworked) · docs/** (12 files) · .env.example ·
README.md · AGENTS.md (2.0 banner) · .gitignore

## Failures remaining

None in code checks. Open items are inventory, not failures:
- [NOT CONFIGURED] production storage/scanner, Postgres, real conflict
  provider, OAuth registrations, inquiry mailbox, email delivery
- [COUNSEL REVIEW REQUIRED] disclosure text, client status strings,
  [ATTORNEY TO SUPPLY] config copy, retention periods, privacy notice

## MVP UI batch (2026-07-12, second pass) ✔

All user-facing screens implemented and wired to the existing APIs:
`/portal` (4-role entry, no self-registration) · `/invite` (neutral
failures) · `/portal/matter` (status, disclosure consent, requested items,
uploads, released docs, help) · `/intake` (2.0 pending state) · `/firm`
(matter list + create) · `/firm/conflicts` (attorney disposition queue) ·
`/firm/matters/[id]` (invitations, documents, version-exact approve/release
with full confirmation, requests/accommodations/notes, audit) · `/admin`
(users/roles, disclosure version, retention config, chain-verified audit).
Supporting APIs: authoritative /api/auth/me, 4-role dev-login,
/api/attorney/conflicts, matter + admin audit endpoints, enriched firm
lists/documents.

Validation of this pass:
- vitest 167/167 · tsc clean · eslint clean · next build OK
- scripts/e2e-demo.mjs against a running dev server: **64/64** —
  full happy path (matter → invitation → acceptance → disclosure →
  screening → attorney clearance → intake → upload → review → internal
  version → exact-version approval → controlled release → client download →
  audit) plus every required negative path and a 10-page smoke test.
- Demo instructions: docs/MVP-DEMO-GUIDE.md

## Pilot-hardening pass (2026-07-12, branch divorcegpt-2-pilot-hardening) ✔

- Exact branding: default firm name is **Jake Kim Law Firm** everywhere it
  renders (test-enforced; old name absent from src/); NO public
  office-location language (correction #2); ownership facts never invented —
  configurable operator/IP fields + docs/OPERATOR-AND-IP-OWNERSHIP.md with
  [OWNER CONFIRMATION REQUIRED] items.
- Landing: CTAs → "Discuss an institutional pilot" / "View the workflow";
  acquisition de-emphasized; APP_STAGE-aware status copy
  (local/staging/closed_pilot, exact strings test-enforced); footer
  no-attorney-client-relationship + engagement-agreement language; OpenAI
  non-affiliation retained; page rendered dynamically for runtime stage.
- No-payments architecture verified + guard tests
  (tests/no-payments.test.ts) + docs/NO-PAYMENTS-POSTURE.md.
- OAuth hardening: MICROSOFT_* env names (ENTRA_* honored); single-tenant
  enforcement (common/consumers/organizations refused); nonce added to both
  providers; Entra tid validation + tid:oid stable subjects; Google
  email_verified enforcement; exact redirect-URI config; identity scopes
  only. PROVIDERS AUTHENTICATE, THE DATABASE AUTHORIZES: no account is ever
  self-provisioned from authentication — firm accounts must be admin-created
  (Entra callback refuses otherwise), client accounts are created ONLY by
  invitation acceptance (validated before provisioning), email matches with
  a different stable subject are refused (manual relink:
  docs/ACCOUNT-RECOVERY.md, USER_RELINK_AUTHORIZED audit).
- Development login is LOCAL-ONLY (APP_STAGE=local + non-production +
  DEV_AUTH_STUB); neutral 404 otherwise; UI signal off; startup warning if
  flags are set outside local; production beta test login fully retired.
- Build hardening: middleware→proxy migration DONE (deprecation warning
  gone; gating behavior verified live: redirect/pass/403/headers);
  Turbopack whole-project tracing FIXED (turbopackIgnore on the env-driven
  DATABASE_PATH resolve); npm audit's 2 moderates are one transitive
  advisory (postcss 8.4.31 pinned INSIDE next@16.2.10; GHSA-qx2v-qp2m-jg93)
  — no nonbreaking fix exists (npm proposes next@9 downgrade; even latest
  next 16.2.10 pins 8.4.31); DEFERRED with rationale (build-time CSS
  stringify XSS; no untrusted CSS in this app). Install scripts
  (esbuild/sharp/unrs-resolver) documented — platform binaries arrive via
  optionalDependencies; sharp is next's optional image dep (unused: no
  next/image); unrs-resolver is lint-only; no approval granted, no security
  claim made.
- docs: PILOT-HARDENING-CHECKLIST, OPERATOR-AND-IP-OWNERSHIP,
  NO-PAYMENTS-POSTURE, OPENAI-API-SETUP, ACCOUNT-RECOVERY, PILOT-READINESS.

Checks this pass: vitest **195/195** (28 new tests) · tsc clean · eslint
clean · build clean (0 warnings) · e2e-demo 66/66 · live proxy smoke.

## Exact next batch (future work)

Cosmetic/UX polish, cross-matter attorney dashboard, admin email-edit for
account recovery, audit export, and the [NOT CONFIGURED] infrastructure in
docs/PILOT-READINESS.md.
