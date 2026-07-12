# DivorceGPT 2.0 — Attorney-Workflow Conversion Checklist

Branch: `divorcegpt-2-attorney-workflow`. Baseline: commit `158bc60` (main) +
checkpoint commit preserving pre-existing local changes. Baseline tests:
98/100 green (2 pre-existing beta-gate middleware failures, reconciled in B2).

Working rules: preserve Next.js/TS architecture, deterministic client bot,
intake state machine, server-side authz, CSRF, rate limits, audit hashing,
config guards, security headers, OpenAI non-affiliation note. No client-facing
generative AI. No deploys, no real data, no production credentials.

## B1 — Roles + matters
- [ ] `app_user` table (CLIENT | STAFF | ATTORNEY | ADMIN), DB-stored roles
- [ ] `matter` table (lifecycle, conflict status, legal hold, client binding)
- [ ] `matter_access` grants for STAFF/ATTORNEY
- [ ] `requireUser` re-checks DB role server-side on every protected action
- [ ] Matter-level authorization (client → own matter only)
- [ ] Attorney-only actions structurally enforced (repo-layer guards, not config)
- [ ] `ADMIN_EMAILS` bootstrap only

## B2 — Invitations + disclosure
- [ ] Public client registration/intake-start disabled
- [ ] Matter-linked invitations: token hash only, expiring, revocable, single-use, neutral failure response
- [ ] Beta gate legacy: off unless `BETA_GATE_ENABLED=true` (+ keys)
- [ ] Versioned relationship disclosure + affirmative acknowledgment (no preselect), stored per matter/user/version/timestamp; IP/UA capture optional, off by default
- [ ] `[COUNSEL REVIEW REQUIRED]` markers in source docs only, never rendered

## B3 — Conflict screening
- [ ] Automated screen limited to NO_APPARENT_MATCH | POTENTIAL_MATCH | NEEDS_MORE_INFORMATION | PENDING_ATTORNEY_REVIEW
- [ ] CLEARED / DECLINED settable only by ATTORNEY (structural)
- [ ] Substantive intake blocked until matter CLEARED
- [ ] Neutral pending message; no internal reasoning exposed to client
- [ ] Conflict-history minimum retained (no auto-purge of identity data needed for future checks)

## B4 — Accommodations + client workflow
- [ ] "I need help completing this intake" (no reason required)
- [ ] STAFF/ATTORNEY record alternate intake methods
- [ ] Client: own matter only; save progress; uploads; missing-items view; plain-language status; released docs only
- [ ] Client cannot see internal notes, drafts, conflict reasoning, AI output, or approve/release anything

## B5 — Staff / attorney / admin workflows
- [ ] STAFF: invitations, info collection, doc organization, missing-info requests, accommodations, escalation, internal AI, internal drafts
- [ ] STAFF cannot clear conflicts, approve, release, or mark filing-ready
- [ ] ATTORNEY: full review + clear/decline + approve/release exact versions
- [ ] ADMIN: users/roles, disclosure versions, retention config, audit review — cannot clear conflicts or approve/release

## B6 — Files + document lifecycle
- [ ] FileStorage abstraction + local-dev impl (outside public/, random names, MIME + size limits, traversal-proof, matter authz, malware-scan hook)
- [ ] Production storage `[NOT CONFIGURED]`; local storage refused in production without explicit test override
- [ ] document / document_version / document_approval / document_release
- [ ] States: DRAFT, ATTORNEY_REVIEW_REQUIRED, CHANGES_REQUESTED, APPROVED_FOR_CLIENT, APPROVED_FOR_SIGNATURE, APPROVED_FOR_FILING, RELEASED, SUPERSEDED, WITHDRAWN
- [ ] Approval bound to exact version ID + SHA-256 + attorney + timestamp + type + destination; never transfers across versions
- [ ] Release verifies current ATTORNEY role, exact version, hash match, valid approval, destination
- [ ] No bulk/auto/presumed approval; no STAFF/ADMIN approval

## B7 — OpenAI layer
- [ ] `src/lib/ai/` (openai.ts, audit.ts, types.ts, prompts/*) — server-only
- [ ] Env: OPENAI_API_KEY, OPENAI_MODEL, OPENAI_ORG_ID, OPENAI_PROJECT_ID, AI_FEATURES_ENABLED; never NEXT_PUBLIC
- [ ] STAFF/ATTORNEY only; internal uses only; outputs start DRAFT / ATTORNEY_REVIEW_REQUIRED
- [ ] Markers: [not found] [inferred] [needs cite check] [TREATMENT?]
- [ ] No prompt/content/secret logging; AI off ⇒ portal fully functional

## B8 — Retention, legal hold, audit
- [ ] Matter lifecycle: prospective / engaged / abandoned / legal hold
- [ ] Configurable purge for prospective+abandoned only; engaged exempt; hold blocks purge
- [ ] Conflict history + disclosure acks + audit survive purge
- [ ] Hash-chained audit events for the full required event list; no raw confidential content in audit rows

## B9 — Branding
- [ ] NEXT_PUBLIC_OPERATING_FIRM_NAME / NEXT_PUBLIC_INQUIRY_EMAIL (default: J. Kim Law Firm)
- [ ] No hard-coded @divorcegpt.com; OpenAI non-affiliation retained
- [ ] Plain, neutral, non-advisory client copy; no internal reasoning/scores exposed

## B10 — Tests, build, docs
- [ ] Required test matrix (see directive) green; typecheck, lint, build green
- [ ] docs/: ARCHITECTURE, DATA-FLOW, ROLE-PERMISSIONS, APPROVAL-FLOW, SECURITY-CHECKLIST, RISK-REGISTER, RETENTION, PRIVACY-NOTICE-DRAFT, HANDOFF-FOR-OPENAI-AUDIT, ASSUMPTIONS-AND-GAPS, IMPLEMENTATION-STATUS
- [ ] .env.example + README updated

Markers: `[INCOMPLETE]` unfinished · `[NOT CONFIGURED]` missing infra ·
`[COUNSEL REVIEW REQUIRED]` legal text pending attorney approval.
