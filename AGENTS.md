# DivorceGPT 2.0 — Agent Context Brief

Machine-oriented handoff for coding agents (Codex, Claude Code, etc.). Dense
and factual. Read this whole file before editing anything. Last updated:
2026-07-10, end of Stage 1.

> ⚠ This repo is PUBLIC. Never commit secrets, real env values, real client
> data, or the beta access code. All live values exist only in the
> DigitalOcean dashboard and Jake's local `.env` (gitignored).

> **2.0 ATTORNEY-WORKFLOW UPDATE (2026-07-12, branch
> `divorcegpt-2-attorney-workflow`):** this brief describes Stage 1. The
> attorney-workflow conversion supersedes parts of it: DB-stored 4-role RBAC
> (CLIENT/STAFF/ATTORNEY/ADMIN), matter-centered model, invitation-only
> client access, disclosure consent, conflict screening that ONLY an
> attorney can clear/decline, version-exact hash-bound document
> approval/release, server-only OpenAI internal layer (kill-switched),
> retention + legal hold, hash-chained audit. Read `docs/ARCHITECTURE.md`,
> `docs/ROLE-PERMISSIONS.md`, `docs/APPROVAL-FLOW.md`, and
> `docs/HANDOFF-FOR-OPENAI-AUDIT.md` before editing. Invariants below still
> hold except: the conflict check no longer auto-clears (sessions pend
> attorney review), and roles are no longer two.

## 1. What this is

A dual-login intake web app for a solo New York matrimonial practice
(Jake Kim, attorney, NY). It runs a structured intake for **uncontested NY
divorces** and hands a completed, conflict-cleared intake package to the
attorney for review. It is **not a chatbot and not a legal-advice tool** —
the "bot" is a deterministic state machine plus retrieval over
attorney-approved copy.

Stage 1 (DONE, live in closed beta at divorcegpt.com): auth, conflict wall,
scope gate, two-tier intake, ready-for-review handoff, attorney review view,
security, beta access gate, synthetic-data test suite.

Explicitly OUT of Stage 1 (do not build unless instructed): Stage-2 MSA
document drafting (the attorney view has a **disabled** "Generate MSA draft"
button wired to nothing — keep it that way); payment handling (never
in-app, any stage); custody tier (children ⇒ out); in-app scheduling.

## 2. Non-negotiable invariants (tests enforce all of these — do not break)

1. **Conflict wall**: nobody (client OR attorney) reaches substantive intake
   until the conflict check returns CLEAR for both parties. Enforced
   server-side at three layers: state machine, API guards, and the
   persistence layer itself (`insertAnswer` in `src/lib/db/repo.ts` throws
   without `conflict_clear=1` + writable state). Pre-gate collects ONLY both
   parties' names (+ prior/maiden names).
2. **No substantive persistence for conflicted / out-of-scope / abandoned
   sessions** — verified at the DB level. Gate trips evaluate BEFORE any
   write, then purge the entire session. Only survivors: `audit_event`
   (event codes; names only as salted HMAC hashes) and `bot_interaction_log`
   (content IDs only, never free text, never PII).
3. **UPL firewall**: the bot's entire response surface is the closed union
   `BotResponse` in `src/lib/bot/responder.ts` — exactly four kinds
   (PROCESS_COPY, GLOSSARY_CARD, CLARIFICATION, STATIC_CARD), every `text` a
   VERBATIM lookup from `src/config/*`. No template interpolation with user
   input, no generative path. Advice-seeking / applied-to-my-facts phrasing
   always deflects (DEFLECT_CONSULT), even when a glossary term matches.
   If an LLM is ever added, it may ONLY classify intent (see
   `IntentClassifier` in `src/lib/bot/classifier.ts`); its output must be
   validated against known IDs; unvalidated ⇒ UNRECOGNIZED.
4. **Hard RBAC**: CLIENT (Google OAuth) and ATTORNEY (Microsoft Entra ID)
   are distinct auth paths and roles. Attorney requests re-check the
   `ATTORNEY_EMAILS` allowlist on EVERY request, not just login. Clients can
   never reach attorney data (403) or other clients' sessions (404).
5. **Both intake modes** (client-initiated; attorney-initiated for an
   existing client) pass through the same wall and gate. No privileged path.
6. **All user-facing copy is attorney-controlled config** under
   `src/config/`. `[ATTORNEY TO SUPPLY]` marks placeholders. Never invent
   legal definitions in code or config — placeholders describe what the
   attorney should write.
7. **DV screen**: broad question ("Is there now, or has there ever been,
   domestic violence or a restraining order between you and your spouse?").
   ANY yes ⇒ hard out, DV_RESOURCES card (human handoff: firm contact +
   county courthouse DV/Victim's unit), retention identical to a conflict
   hit. The firm contact in that card is a SHIP-BLOCKER placeholder:
   `src/lib/config-guard.ts` (invoked from `src/instrumentation.ts`) makes a
   PUBLIC production server refuse to serve until filled; beta-gated
   production boots with a loud warning; dev warns only.
8. **Beta gate**: whole site behind `/beta` whenever `FREE_ACCESS_KEYS`
   (comma-separated) is non-empty. The httpOnly cookie stores the KEY ITSELF
   and middleware re-validates it against the env var on EVERY request ⇒
   removing a key locks holders out instantly. Exempt paths: `/beta`,
   `/api/beta/*`, `/api/admin/purge`. Optional Cloudflare Turnstile CAPTCHA
   (auto-skips when `TURNSTILE_*` unset); unlock endpoint rate-limited
   5/min/IP.
9. **Test sign-in** (`/api/auth/dev-login`): two paths in
   `src/lib/auth/test-login.ts`. (a) `DEV_AUTH_STUB=true`, structurally dead
   when NODE_ENV=production. (b) `BETA_TEST_LOGIN=true` — works in
   production ONLY when the beta gate is up AND the request already carries
   a valid beta-key cookie. Identity is unverified on path (b): synthetic
   data only, remove flag before public launch. Attorney test logins still
   pass the allowlist.
10. **Never use real client data as test fixtures.** All fixtures and the
    conflict match-list (`src/config/synthetic/conflict-matchlist.json`) are
    synthetic. "Harold Fictionberg" is a conflict-HIT test name.

## 3. Stack + why

- **Next.js 16 (App Router) + TypeScript + Tailwind 4**, deployed on
  DigitalOcean App Platform (auto-deploy from `main` of the public GitHub
  repo `Jake-jpeg/Dgpt`; DO app name "squid-app", NYC1).
- **DB: `node:sqlite`** (built into Node ≥22; emits an ExperimentalWarning —
  harmless). NOT Prisma, NOT better-sqlite3 (both need binary
  downloads/compiles that failed in the build sandbox). ALL SQL lives in
  `src/lib/db/` (index.ts = DDL + connection; repo.ts = every query).
  Postgres migration later = driver swap confined to that directory
  (string-encoded enums, JSON-in-TEXT, `?` placeholders by design).
- **Auth: hand-rolled OIDC** (authorization code + PKCE, `jose` for
  JWT/JWKS) in `src/lib/auth/oauth.ts`. No NextAuth/Auth.js. No password
  storage. Sessions = HS256 JWT in httpOnly `dgpt_session` cookie
  (8h TTL, SameSite=Lax, Secure in prod).
- **Validation: zod** everywhere at the API boundary.
- **Tests: Vitest**, 100 tests in `tests/` (serial via
  `fileParallelism:false`, in-memory SQLite, real route handlers called with
  `Request` objects).

## 4. Repo map

```
src/
  middleware.ts                    beta gate + coarse /attorney page gate + security headers/CSP
  instrumentation.ts               boot-time guards (DV ship-blocker; BETA_TEST_LOGIN warning)
  config/                          ← ATTORNEY-CONTROLLED; edits here, not engine changes
    cards.ts                       static referral/rejection/deflection cards (incl. DV card)
    glossary.ts                    approved definitions, served verbatim
    process-copy.ts                scripted process + "why we ask" copy
    clarifications.ts              fixed clarification questions
    gate-questions.ts              the 5 scope-gate questions, fixed order
    intake-fields.ts               Tier1/Tier2 sections+fields (NY counties, retirement tree)
    synthetic/conflict-matchlist.json  synthetic conflict names (stub data source)
  lib/
    env.ts                         env accessors (read at call time)
    beta.ts                        beta-gate logic (edge-safe)
    config-guard.ts                DV-card ship-blocker
    db/index.ts, db/repo.ts        THE persistence surface (see invariant 1–2)
    auth/{session,oauth,rbac,test-login}.ts
    conflict/provider.ts           ConflictCheckProvider interface + stub (swap point for firm system)
    intake/machine.ts              state machine (states, transitions, writable/bot-active states)
    intake/scope-gate.ts           pure gate evaluators
    intake/tiers.ts                tier branch + routing rules (QDRO flag vs OUT)
    intake/validation.ts           zod-from-config field validation, completeness
    intake/service.ts              orchestration; the only place wall+gate+persistence meet
    bot/{classifier,responder}.ts  UPL firewall
    security/{csrf,rate-limit,audit-hash}.ts
  app/
    page.tsx                       landing (role sign-in cards + test sign-in panel)
    beta/page.tsx                  beta gate UI (Turnstile + code)
    intake/page.tsx                whole intake flow UI (server-driven wizard)
    attorney/page.tsx              dashboard; attorney/session/[id]/page.tsx = review view
    api/auth/*                     login/[provider], callback/[provider], dev-login, logout, me
    api/beta/{config,unlock}       gate endpoints
    api/intake/start, api/intake/[id]/{identity,gate,branch,answers,complete,bot}
    api/attorney/sessions[/id]     ATTORNEY-only
    api/admin/purge                bearer ADMIN_SECRET; retention sweep (cron)
tests/                             1:1 with acceptance criteria; see §7
```

## 5. State machine (server-owned; client can never skip)

```
PRE_GATE (names only) → conflict check → HIT ⇒ CONFLICT_REFERRAL card + purge
  CLEAR → GATE_RESIDENCY (no ⇒ out) → GATE_VENUE (county; never disqualifies)
  → GATE_DV (yes ⇒ out) → GATE_CHILDREN (yes ⇒ out, custody deferred)
  → GATE_COMPLEXITY (anything but FULLY_AGREE ⇒ out)
  → TIER_BRANCH (assets NONE+alimony NONE ⇒ TIER1; settled/agreed ⇒ TIER2; UNSURE ⇒ out)
  → INTAKE (config-driven fields; routing: business/valuation/retirement-UNSURE ⇒ out;
            401k/pension/military split ⇒ QDRO flag + CONTINUE)
  → READY_FOR_REVIEW (attorney handoff)
```

Every "out" serves a static card and purges. Tier 1 = no kids/assets/alimony
(+ explicit confirmations). Tier 2 = settled ED + agreed maintenance
(retirement clarification tree: 401K / IRA trad / IRA Roth / PENSION /
MILITARY / DEFERRED_COMP; IRA split needs no QDRO).

## 6. Environment variables (names only — values live in DO / local .env)

| Var | Purpose | Notes |
|---|---|---|
| DATABASE_PATH | SQLite file path | DO filesystem is EPHEMERAL — wiped every redeploy (OK for beta) |
| SESSION_SECRET | cookie JWT signing | ≥32 chars, required |
| AUDIT_HASH_SECRET | audit name-hash salt | optional; falls back to a SESSION_SECRET-derived salt; set explicitly for prod |
| ADMIN_SECRET | bearer for /api/admin/purge | unset ⇒ endpoint 503s (fail closed) |
| APP_URL | canonical origin | **CSRF compares Origin to this; wrong/missing ⇒ every POST 403s.** No trailing slash, apex domain only (www origin would be rejected) |
| GOOGLE_CLIENT_ID/SECRET | client login | unset ⇒ button disabled |
| ENTRA_TENANT_ID / ENTRA_CLIENT_ID/SECRET | attorney login | unset ⇒ button disabled |
| ATTORNEY_EMAILS | attorney allowlist (comma-sep) | currently a decoy address as extra protection during test-login era; MUST become the real Microsoft account email when Entra OAuth goes live |
| DEV_AUTH_STUB | local test sign-in | dead in production regardless |
| BETA_TEST_LOGIN | prod test sign-in | see invariant 9; REMOVE BEFORE PUBLIC LAUNCH |
| FREE_ACCESS_KEYS | beta gate keys | comma-sep; empty ⇒ gate off/site open |
| TURNSTILE_SITE_KEY/SECRET_KEY | gate CAPTCHA | unset ⇒ captcha skipped |
| RETENTION_ABANDONED_DAYS | purge threshold | default 14 |

Stale 1.0 vars still on DO (ignored by 2.0, safe to delete): ANTHROPIC_API_KEY,
STRIPE_SECRET_KEY, RESEND_*, NEXT_PUBLIC_PDF_SERVICE_URL, NEXT_PUBLIC_MAINTENANCE_MODE.

## 7. Commands + tests

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # vitest, 100 tests — MUST stay green
npm run build        # must pass before any push
npx eslint src tests
```

Test files map to Stage-1 acceptance criteria: `conflict-wall` (wall
unbypassable), `persistence` (DB-level no-retention incl. DV parity +
abandoned sweep), `bot-guardrails` (adversarial prompts ⇒ only the 4
surfaces, text verbatim-in-corpus check), `rbac` (role separation, CSRF,
rate limits), `intake-modes` (both modes E2E; Stage-2 affordance
disabled + no draft endpoint exists), `beta-gate` (gate, instant
revocation, test-login triple-lock), `config-and-units` (config integrity,
gate/routing/classifier units, prod locks). When adding features, add tests
in the same style: real route handlers, synthetic identities from
`tests/helpers.ts`, DB assertions via `countRows`.

## 8. Deployment + current live state (as of 2026-07-10)

- Push to `main` ⇒ DO auto-deploys divorcegpt.com. Local repo:
  `C:\Users\kim_j\Desktop\Dgpt`. HTTPS + HSTS in prod.
- Live now: beta gate working (APP_URL fix resolved an all-POSTs-403 bug);
  BETA_TEST_LOGIN + ATTORNEY_EMAILS env vars set; awaiting Jake's latest
  push for test sign-in code to be live.
- DO health checks: if HTTP check on `/` misbehaves (gate redirect), point
  it at `/api/beta/config` (200, exempt).
- `_to_delete/` in the working tree holds stale 1.0 files (old root
  middleware.ts, monitor.yml GitHub cron that targeted a 1.0-only
  endpoint). Safe to delete.
- Known cosmetic: Next 16 warns "middleware" convention is deprecated in
  favor of "proxy" — migration is a rename task, not urgent. node:sqlite
  ExperimentalWarning in logs — harmless.

## 9. Backlog (in rough order)

1. Reconcile `src/config/intake-fields.ts` against the companion spec
   `dgpt_intake_spec_v2` when Jake provides it (fields were drafted from the
   Stage-1 build prompt; reconciling = config edit, not engine change).
2. Replace all `[ATTORNEY TO SUPPLY]` copy (glossary/process/cards). The DV
   card firm contact is the ship-blocking one.
3. Google + Entra app registrations; redirect URIs
   `{APP_URL}/api/auth/callback/{google,entra}`; then set ATTORNEY_EMAILS to
   the real Microsoft email.
4. Turnstile keys for the gate CAPTCHA.
5. Real `ConflictCheckProvider` against the firm's conflict system
   (implement the interface in `src/lib/conflict/provider.ts`; the gate
   behavior is already real).
6. Managed Postgres before any real client data (swap confined to
   `src/lib/db/`).
7. Public-launch teardown checklist: remove BETA_TEST_LOGIN, fill DV firm
   contact (hard-enforced), real OAuth only, Postgres, rotate all secrets.
8. Stage 2: MSA drafting layer. Input contract =
   `GET /api/attorney/sessions/{id}` (sections, flags, identity, audit).
   Document generation planned via a separate ReportLab service. The
   drafting affordance must stay disabled until Stage 2 is properly built,
   reviewed by the attorney, and gated.
