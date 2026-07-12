# NJ/NY Intake + AI Workbench — Local Demo Guide

Everything below is LOCAL, SYNTHETIC-DATA-ONLY. Do not use real client
data. Do not deploy. Not approved for live client use.

## 1. Start the server

```bash
cp .env.example .env.local   # first time only
```

Set in `.env.local`:

```
APP_STAGE=local
DEV_AUTH_STUB=true
ADMIN_EMAILS=admin@example.test
ATTORNEY_EMAILS=attorney@example.test
DATABASE_PATH=./data/demo.db          # fresh file recommended per demo
SESSION_SECRET=<any 32+ char local string>
# Optional, for the AI workbench actions:
AI_FEATURES_ENABLED=true
OPENAI_API_KEY=<your key — never commit>
OPENAI_MODEL=gpt-4o-mini
```

```bash
npm run dev
```

Startup prints the legal-content warnings by design (unversioned snapshot,
31/31 records pending counsel review, NY-SNW superseded-form risk) — that
is the governance system working, not an error.

## 2. Seed the 20 synthetic matters

```bash
node scripts/seed-nj-ny-matters.mjs      # BASE_URL=... to override port
```

Expected: `Seeded 20/20 synthetic matters. Checks: 145 passed, 0 failed.`
Scenario index (see the script header for details): NJNY-01…-07 New Jersey
(uncontested/complete, missing tax returns, contradiction, FD custody, FD
support, post-judgment, DV escalation), NJNY-08 multi-jurisdiction,
NJNY-09…-16 New York (joint, uncontested, contested, post-judgment, Family
Court ×2, UCCJEA, family offense), NJNY-17 prompt-injection document,
NJNY-18 re-versioned approval, NJNY-19 AI-off demo, NJNY-20
conflict-pending.

## 3. Sign in (dev stub, local only)

Open `http://localhost:3000/login`. Dev login buttons appear only in local
stage. Use `attorney@example.test` (ATTORNEY), `staff@example.test`
(STAFF), or any seeded client (`njny-client01@example.test` …
`njny-client20@example.test`).

## 4. Attorney workbench tour (`/firm` → a seeded matter)

1. **Jurisdiction & scope** — open NJNY-08: FACTS COLLECTED show NY→NJ
   residence rows, the banner reads MULTI-JURISDICTION REVIEW REQUIRED,
   and nothing was auto-selected. Record a determination and watch the
   schema version pin.
2. **Intake review** — sections with progress; internal authority badges
   and attorney-determination items that clients never see.
3. **Document checklist** — NJNY-02 shows tax returns REQUIRED_NOW with
   nothing uploaded; try staff overrides; note waive is attorney-only.
4. **Form readiness** — NJNY-01 vs NJNY-02: statuses move through
   NOT_READY_* reasons; the one READY state is about attorney form
   PREPARATION, and the disclaimer says it is not filing readiness.
5. **Legal source status** — snapshot version/review age warnings, 31
   records with statuses and open research items; runtime never browses.
6. **AI actions** (needs `AI_FEATURES_ENABLED=true` + a key) — run
   "Attorney intake memo" on NJNY-01: the result lands as an AI_DRAFT
   version in ATTORNEY_REVIEW_REQUIRED with support-status badges and
   provenance chips. Run "Inconsistency report" on NJNY-03: the
   marriage-date contradiction should surface. Run any action on NJNY-17:
   the injection letter is quoted data; if the model parrots the fake
   statute, the output is rejected and nothing is saved.
7. **Re-versioned approval** — NJNY-18: v1 carries the approval, v2 is
   unapproved; release of v2 is refused.
8. **AI off** — flip `AI_FEATURES_ENABLED=false`, restart, use NJNY-19:
   everything works; the AI panel answers 503.

## 5. Client experience (`/portal` as a seeded client)

`njny-client20@example.test` (pending): neutral "submitted for review"
status, no questionnaire. Any cleared client: `Continue my questionnaire` →
schema-driven sections, save & resume, plain language, requested documents
listed, no statutes anywhere.

## 6. Validation commands

```bash
npm test                                  # 234 tests incl. 39 NJ/NY evals
npx tsc --noEmit && npm run lint
node scripts/e2e-demo.mjs                 # original MVP e2e (running server)
RUN_OPENAI_SMOKE=true node scripts/openai-smoke.mjs   # opt-in live smoke
npx vite-node -c vitest.config.ts scripts/generate-intake-docs.ts  # regen intake docs
```

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
