# Handoff for OpenAI-Usage Audit — DivorceGPT 2.0

Requirement-by-requirement map: implementation file(s), route(s), database
table/model, server-side authorization check, and test/validation method.
Markers: [INCOMPLETE] unfinished · [NOT CONFIGURED] missing infrastructure ·
[COUNSEL REVIEW REQUIRED] legal text pending attorney approval.

## 1. Roles & matters

| Item | File(s) | Route(s) | DB | Server authz | Tests |
|---|---|---|---|---|---|
| 4 DB-stored roles | src/lib/db/users.ts | — | app_user (CHECK role) | requireUser re-reads role per request (src/lib/auth/authz.ts) | tests/matters-roles.test.ts |
| Role not trusted from browser/cookie | src/lib/auth/authz.ts, rbac.ts | all protected routes | app_user | DB role wins over JWT role | "DATABASE role wins" test |
| ADMIN_EMAILS bootstrap only | src/lib/env.ts (adminBootstrapEmails), users.ts (resolveAccount) | — | app_user | provisioning path only | "bootstrap-only" + "never self-provisioned" tests |
| Matter model + matter-level authz | src/lib/db/matters.ts | /api/matters, /api/matters/[id] | matter, matter_access | requireMatterAccess (404 denials) | matters-roles: "own matter", "explicit grant" |
| Admin user management | src/app/api/admin/users/** | GET/POST /api/admin/users, PATCH /api/admin/users/[id] | app_user | requireAdmin | matters-roles admin suite |
| ADMIN cannot clear/approve/release | src/lib/db/matters.ts, documents.ts | (structurally everywhere) | — | role re-read inside attorneySetConflictDisposition / approveVersion / releaseVersion | matters-roles, documents, conflict-wall tests |

## 2. Invitations, disclosure, consent

| Item | File(s) | Route(s) | DB | Server authz | Tests |
|---|---|---|---|---|---|
| Public registration disabled | src/app/api/intake/start/route.ts | POST /api/intake/start | matter.client_user_id | client must hold an invitation-bound matter | invitations: "no invitation cannot start", "no registration route" |
| Hashed, expiring, revocable, single-use, client-bound invitations | src/lib/db/invitations.ts | POST/GET /api/matters/[id]/invitations, POST /api/invitations/[id]/revoke, POST /api/invitations/accept | invitation (token_hash UNIQUE) | staff/attorney + grant to mint/revoke; client to accept | invitations.test.ts (full lifecycle) |
| One neutral failure response | src/app/api/invitations/accept/route.ts | POST /api/invitations/accept | — | — | "identical neutral responses" test |
| No matter data in URL | accept route (token in body) | — | — | — | code review: token travels in body |
| Beta gate legacy (BETA_GATE_ENABLED=false) | src/lib/beta.ts | middleware | — | — | beta-gate.test.ts |
| Versioned disclosure + affirmative ack | src/config/disclosure.ts [COUNSEL REVIEW REQUIRED], src/lib/db/disclosure.ts | GET /api/disclosure, GET/POST /api/matters/[id]/consent | disclosure_ack | client + own matter; z.literal(true); version must be current | invitations "disclosure before intake"; branding tests |
| IP/UA optional, off by default | src/lib/db/disclosure.ts (CONSENT_CAPTURE_IP_UA) | consent route | disclosure_ack.ip/user_agent | — | "IP/UA are NOT captured by default" |

## 3. Conflict screening

| Item | File(s) | Route(s) | DB | Server authz | Tests |
|---|---|---|---|---|---|
| Screening before substantive intake | src/lib/intake/machine.ts (CONFLICT_REVIEW_PENDING), service.ts | POST /api/intake/[id]/identity | intake_session.state, matter.conflict_status | state machine + persistence guard | conflict-wall.test.ts |
| Automated screen limited to 4 statuses | src/lib/db/matters.ts (recordScreenStatus, SCREEN_STATUSES) | — | matter.conflict_status CHECK | runtime + type guard | "only the four screen statuses" |
| CLEARED/DECLINED attorney-only | src/lib/db/matters.ts (attorneySetConflictDisposition), conflicts.ts (resolveLatestSubmission) | GET/POST /api/matters/[id]/conflict | matter, conflict_submission | requireUser(["ATTORNEY"]) + structural role re-read | conflict-wall + matters-roles suites |
| Intake blocked until CLEARED | src/lib/db/repo.ts (insertAnswer guard), machine transitions | gates/branch/answers routes | matter.conflict_status | persistence-level check | "persistence layer refuses", "blocked before clearance" |
| Neutral pending message; no reasoning exposed | src/lib/intake/service.ts (CONFLICT_PENDING_MESSAGE), src/lib/matters/client-view.ts | identity route, matter view | — | role-shaped responses | "SAME neutral client message", branding neutrality tests |
| Conflict history retained | src/lib/db/conflicts.ts (no FK) | — | conflict_submission | never auto-purged | retention "what survives" |

## 4. Accommodations & client workflow

| Item | File(s) | Route(s) | DB | Server authz | Tests |
|---|---|---|---|---|---|
| Help request, no reason disclosable | src/lib/db/matter-workflow.ts (no reason column) | POST /api/matters/[id]/assistance | assistance_request | client + own matter | accommodations.test.ts |
| Alternate intake methods | matter-workflow.ts (ACCOMMODATION_METHODS) | POST/GET /api/matters/[id]/accommodations | accommodation (CHECK method) | staff/attorney + grant | accommodations tests |
| Missing-info requests (labels only to client) | matter-workflow.ts | GET/POST/PATCH /api/matters/[id]/info-requests | info_request | role-shaped GET | "labels only — never the internal note" |
| Plain-language status; save progress; released-docs-only visibility | client-view.ts, matters/[id]/route.ts, documents routes | GET /api/matters/[id], /documents | — | role-shaped responses | accommodations, documents, branding tests |

## 5. Documents & storage

| Item | File(s) | Route(s) | DB | Server authz | Tests |
|---|---|---|---|---|---|
| FileStorage abstraction + local impl | src/lib/storage/index.ts | — | — | — | documents "storage hardening" |
| Production storage refused | getFileStorage() ([NOT CONFIGURED]) | — | — | FILE_STORAGE_ALLOW_LOCAL_TEST override only | "refuses production" test |
| Upload policy (MIME/size), traversal-proof, malware hook | storage/index.ts, upload-policy.ts | POST /api/matters/[id]/documents, /api/documents/[id]/versions | document, document_version | matter authz + role rules | documents "uploads", "path traversal" |
| document/version/approval/release + 9 states | src/lib/db/documents.ts | approve/release/status/download routes | 4 tables, CHECK constraints | structural ATTORNEY re-read | documents.test.ts (12 tests) |
| Version-exact hash-bound approval; no transfer; fresh-hash release; no bulk/auto | documents.ts | /api/document-versions/[id]/approve, /release | document_approval, document_release | see APPROVAL-FLOW.md | "revised version…does not transfer", "verifies hash against ACTUAL stored bytes" |

## 6. OpenAI layer

| Item | File(s) | Route(s) | DB | Server authz | Tests |
|---|---|---|---|---|---|
| Single server-only provider funnel | src/lib/ai/openai.ts | POST /api/matters/[id]/ai | ai_invocation | STAFF/ATTORNEY role re-read inside invokeInternalAi | ai-layer.test.ts |
| Env vars; no NEXT_PUBLIC secret | env usage in openai.ts | — | — | — | "no OPENAI secret rides a NEXT_PUBLIC variable" |
| No confidential logging | audit.ts (metadata-only schema), openai.ts | — | ai_invocation | — | sentinel test |
| Client routes cannot invoke AI | route + static import check | — | — | requireUser(["STAFF","ATTORNEY"]) | "client role cannot invoke", "single importer" static test |
| Artifacts start review-required | ai route → addDocumentVersion | — | document_version | initialStatus restriction | "lands as ATTORNEY_REVIEW_REQUIRED and is invisible" |
| Kill switch preserves portal | AiDisabledError before network | — | — | — | "503…zero network calls", "portal keeps working" |
| Markers [not found]/[inferred]/[needs cite check]/[TREATMENT?] | src/lib/ai/prompts/*.ts | — | — | — | prompt source review |

## 7. Retention, hold, audit

| Item | File(s) | Route(s) | DB | Server authz | Tests |
|---|---|---|---|---|---|
| Lifecycles + legal hold | src/lib/db/matters.ts | POST /api/matters/[id]/lifecycle (ATTORNEY) | matter.lifecycle, legal_hold | attorney-only route | retention.test.ts |
| Configurable purge; engaged exempt; hold blocks | src/lib/retention/index.ts | POST /api/admin/purge (bearer) | app_config, all content tables | RETENTION_GUARD | retention suite (7 tests) |
| Config allowlist (attorney rules not settable) | src/lib/db/config.ts | GET/PUT /api/admin/config (ADMIN) | app_config | requireAdmin + key allowlist | "attorney-only rules are NOT admin-configurable" |
| Hash-chained audit, full event list, no raw content | src/lib/db/repo.ts (recordAudit/verifyAuditChain) | throughout | audit_event | — | "tamper evidence", sentinel tests, persistence detail-regex test |

## 8. Branding

| Item | File(s) | Tests |
|---|---|---|
| NEXT_PUBLIC_OPERATING_FIRM_NAME / NEXT_PUBLIC_INQUIRY_EMAIL; no hard-coded mailbox | src/config/branding.ts, src/app/page.tsx, src/app/beta/page.tsx | branding.test.ts |
| OpenAI non-affiliation retained | src/app/page.tsx footer | branding test |
| Neutral client language; markers never rendered | client-view.ts, disclosure.ts | branding neutrality tests |

## 9. MVP UI (second pass)

| Item | File(s) | Backing APIs | Validation |
|---|---|---|---|
| Entry, 4 roles, no self-registration | src/app/portal/page.tsx | /api/auth/me (DB role), dev-login, OAuth login routes | e2e page smoke + logins |
| Invitation mgmt (create/copy URL/revoke, one-time token) | src/app/firm/matters/[id]/page.tsx | /api/matters/[id]/invitations, /api/invitations/[id]/revoke | e2e steps 2, guide §3 |
| Client acceptance (neutral failures) | src/app/invite/page.tsx | /api/invitations/accept | e2e 3/3b |
| Disclosure (affirmative, unchecked; no source markers rendered) | src/app/portal/matter/page.tsx | /api/disclosure, /api/matters/[id]/consent | e2e 4a/4b; branding tests |
| Conflict prescreen + neutral pending | src/app/intake/page.tsx | /api/intake/[id]/identity | e2e 5b/6 |
| Attorney conflict queue (attorney-only controls) | src/app/firm/conflicts/page.tsx | /api/attorney/conflicts, /api/matters/[id]/conflict | e2e 7a/7b, N1/N2 |
| Client intake + save progress + missing items + help + uploads + status | src/app/portal/matter/page.tsx, intake page | matter view, info-requests, assistance, documents, intake routes | e2e 8–9, guide §3 |
| Accommodations | firm matter page | /api/matters/[id]/accommodations | e2e/guide |
| Document review (states, hashes, AI-unreviewed flag) | firm matter page | /api/matters/[id]/documents (enriched) | e2e 10a/11 |
| Attorney approval (exact version; no bulk) | firm matter page | /api/document-versions/[id]/approve, /status | e2e 12, N4/N5 |
| Controlled release (title/version/type/attorney/timestamp/destination) | ReleaseConfirm in firm matter page | /api/document-versions/[id]/release | e2e 13, N6–N10 |
| Client released-only view | src/app/portal/matter/page.tsx | client-shaped documents + download | e2e 14, N3 |
| Admin views (users, disclosure version, retention, audit) | src/app/admin/page.tsx | /api/admin/users, /api/admin/config, /api/admin/audit | e2e 15b, guide §3 |
| End-to-end validation | scripts/e2e-demo.mjs | all of the above | 64/64 PASS (happy + negative paths + page smoke) |

## 10. Pilot hardening (branch divorcegpt-2-pilot-hardening)

| Item | File(s) | Validation |
|---|---|---|
| Exact branding (Jake Kim Law Firm; old name absent; no location language) | src/config/branding.ts, src/components/shell.tsx, .env.example | tests/pilot-hardening.test.ts "exact branding" |
| Operator/IP fields; ownership never invented | src/config/branding.ts (legalServicesProvider/portalOperator/softwareOwner/copyrightOwner), docs/OPERATOR-AND-IP-OWNERSHIP.md | "ownership facts are never invented" test |
| Stage-aware copy + footer language + CTA changes | src/config/stage.ts, src/app/page.tsx | "stage-aware status copy" tests |
| No-payments architecture | tests/no-payments.test.ts, docs/NO-PAYMENTS-POSTURE.md | 5 guard tests |
| Entra single-tenant + nonce + tid/oid binding + MICROSOFT_* envs | src/lib/auth/oauth.ts | "multi-tenant refused", "wrong-tenant id_token", scope tests |
| Google invitation-first (sign-in creates NOTHING) | src/lib/db/users.ts (findAccountForSession/provisionClientAccount), src/app/api/invitations/accept/route.ts, callback route | "creates nothing", "invalid invitation creates NO account", e2e N11 |
| Provider ≠ role; DB authorizes; active account required | src/lib/auth/authz.ts, callback route | "does NOT confer ATTORNEY", "deactivating blocks next request" |
| No silent email relink + manual recovery | users.ts (clearUserSubject), admin users PATCH, docs/ACCOUNT-RECOVERY.md | "never silently relinked", "admin-authorized relink" |
| Dev login local-only | src/lib/auth/test-login.ts, src/instrumentation.ts | "development login shutdown" suite |
| Build hardening (proxy migration, tracing fix, audit deferral, install scripts) | src/proxy.ts, src/lib/db/index.ts, docs in IMPLEMENTATION-STATUS | build log 0 warnings; live gating smoke |
| Pilot readiness matrix | docs/PILOT-READINESS.md | manual review — NOT production-ready |

## Outstanding

- [NOT CONFIGURED]: production file storage/scanner, managed Postgres, real
  conflict provider, production OAuth registrations, inquiry mailbox, email
  delivery of invitations.
- [COUNSEL REVIEW REQUIRED]: disclosure text, client-facing status strings,
  DV card + all [ATTORNEY TO SUPPLY] config copy, retention periods,
  privacy notice, AI-vendor data terms.
- UI for the 2.0 surfaces is now implemented (see §9); remaining
  [INCOMPLETE] is cosmetic polish only.
