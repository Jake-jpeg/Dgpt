# DivorceGPT 2.0 — Stage 1: Gated Intake

A gated, dual-login web app for a solo NJ family-law practice. It runs a
structured divorce intake for uncontested NJ cases and hands a completed,
conflict-cleared intake to the attorney for review.

**It is not a chatbot and not a legal-advice tool.** The intake "bot" is a
constrained state machine with retrieval — see [Guardrails](#guardrails).

Stage 1 scope: auth, the conflict wall, the scope gate, the two-tier intake,
the ready-for-attorney-review handoff, the attorney review view, security, and
synthetic-data testing. **Not** in Stage 1: document drafting (Stage 2 — the
attorney view shows a disabled affordance wired to nothing), payments (never
in-app, any stage), the custody tier (deferred), in-app scheduling.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind 4
- SQLite via `node:sqlite` (built into Node ≥ 22 — zero native deps). All SQL
  lives in `src/lib/db/`; migrating to managed Postgres later is a driver swap
  confined to that directory.
- Hand-rolled OIDC (authorization code + PKCE, `jose` for JWT/JWKS) — no
  password storage, no beta auth frameworks.
- Vitest for the guardrail test suite (77 tests, synthetic data only).

## Quick start

```bash
npm install
cp .env.example .env       # fill in SESSION_SECRET etc.; set DEV_AUTH_STUB=true for local testing
npm run dev                # http://localhost:3000
npm test                   # the guardrail suite
```

With `DEV_AUTH_STUB=true` (non-production only — it is structurally disabled
when `NODE_ENV=production`), the landing page shows a dev sign-in that mints
CLIENT or ATTORNEY sessions without real OAuth. Attorney dev sign-ins must
still be on the `ATTORNEY_EMAILS` allowlist, so the same RBAC path runs in dev
and prod.

Real logins: Google OAuth for clients, Microsoft Entra ID for the attorney
side. Create the app registrations, set redirect URIs to
`{APP_URL}/api/auth/callback/google` and `{APP_URL}/api/auth/callback/entra`,
and fill the env vars. An Entra login whose email is not in `ATTORNEY_EMAILS`
is rejected at login **and** re-checked on every request.

## Beta access gate

Set `FREE_ACCESS_KEYS` (comma-separated) and the ENTIRE site goes behind
`/beta`: visitors clear a Cloudflare Turnstile CAPTCHA (if
`TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY` are set — otherwise that step is
skipped), then enter an access code. The code is stored in an httpOnly cookie
and **re-validated against `FREE_ACCESS_KEYS` on every request** — remove a
code from the env var and everyone who used it is locked out on their next
request, no cookie expiry involved. Leave `FREE_ACCESS_KEYS` empty to open
the site. The gate is a door, not a login — Google/Microsoft sign-in still
governs identity behind it. Exempt paths: `/beta`, `/api/beta/*`, and the
bearer-authed `/api/admin/purge` cron.

For closed testing without OAuth credentials, `BETA_TEST_LOGIN=true` exposes
the test sign-in **in production** — but only while the gate is up, and only
to requests already carrying a valid beta-key cookie. Identity is not
verified on that path; synthetic data only, and remove the flag before
public launch (the server logs a warning at boot while it's on). While the gate is on, a production
deploy with the unfilled DV-card placeholder boots with a loud warning
(closed testing); with the gate off, production still refuses to boot until
the DV card is filled.

## The flow

```
login → PRE_GATE (names only) → conflict check ──HIT──► referral card, purge
                                     │CLEAR
                              scope gate (fixed order, server-owned):
                                residency → venue → DV → children → complexity
                                     │ any trip → static card, purge
                              tier branch (assets / alimony)
                                     │
                        TIER1 (no kids/assets/alimony)  or  TIER2 (settled ED + agreed maintenance)
                                     │
                              READY_FOR_REVIEW → attorney dashboard
```

- The server decides which step is current from the session's machine state
  (`src/lib/intake/machine.ts`). URL/API manipulation cannot skip a step.
- On any trip, the session is **purged** — for conflicted, out-of-scope, and
  abandoned sessions the DB retains only a minimal audit trail (event codes;
  names appear only as salted HMAC hashes) and the PII-free bot log.
- **DV screen**: deliberately broad ("Is there now, or has there ever been,
  domestic violence or a restraining order between you and your spouse?").
  Any yes — past or present — exits to a human handoff card pointing at the
  firm directly and the county courthouse Domestic Violence / Victim's unit.
  The exit retains exactly what a conflict hit retains: bare audit event
  codes, nothing about the person or the situation (tested at the DB level).
  The firm contact on that card is a **ship-blocker placeholder**: a
  production server refuses to boot until it's filled in
  (`src/lib/config-guard.ts`, enforced via `src/instrumentation.ts`).
- QDRO-needed retirement divisions are **in scope**: flagged for the attorney
  and the intake continues. Business interests, valuation needs, and any
  disagreement route **out** to the Bergen Bar referral card.

## Guardrails

The bot's entire response surface is the closed union in
`src/lib/bot/responder.ts`:

1. scripted process explanations (`src/config/process-copy.ts`)
2. approved glossary cards served verbatim by retrieval (`src/config/glossary.ts`)
3. scripted clarification questions (`src/config/clarifications.ts`)
4. static referral/rejection/deflection cards (`src/config/cards.ts`)

There is no generative path. Free text is interpreted only by the keyword
classifier (`src/lib/bot/classifier.ts`), whose output is a closed enum;
"applied to my facts" phrasing always wins over a term match ("what does
waiver mean?" → the card; "so do I waive X?" → the consult deflection). If an
LLM is ever slotted into the classifier seat, it classifies only — its output
is validated against known IDs and anything else is treated as UNRECOGNIZED.

Everything the user can ever read is **attorney-controlled config** under
`src/config/`. All copy is currently `[ATTORNEY TO SUPPLY]` placeholders —
replace before real use; the engine renders whatever the config defines.

## Data classes (design standard: "okay even if we get hacked")

| Table | Contents | Survives purge? |
|---|---|---|
| `intake_session` | state machine skeleton | no |
| `party_identity` | pre-gate names only | no |
| `intake_answer` | substantive intake (post-CLEAR only — enforced at the persistence layer) | no |
| `bot_interaction_log` | content IDs only, never free text/PII | yes |
| `audit_event` | event codes + salted name hashes | yes |

Retention: sessions idle past `RETENTION_ABANDONED_DAYS` (default 14) are
purged by `POST /api/admin/purge` (Bearer `ADMIN_SECRET`) — run it from cron.
HTTPS everywhere in production (HSTS is set), secrets via env only, CSRF
double-defense (custom header + origin check) on all state-changing routes,
per-IP rate limits on login/intake/bot endpoints, security headers in
middleware.

## Tests map to the acceptance criteria

| Criterion | Test file |
|---|---|
| 1. Conflict wall unbypassable | `tests/conflict-wall.test.ts` |
| 2. No substantive persistence for conflicted/out/abandoned (DB level) | `tests/persistence.test.ts` |
| 3. Bot never emits non-scripted content (adversarial prompts) | `tests/bot-guardrails.test.ts` |
| 4. Hard role separation server-side | `tests/rbac.test.ts` |
| 5. Both intake modes through the same wall/gate | `tests/intake-modes.test.ts` |
| 6. All copy from attorney config | `tests/config-and-units.test.ts` + corpus check in bot tests |
| 7. Stage-2 affordance disabled and wired to nothing | `tests/intake-modes.test.ts` |

All test identities and the conflict match-list
(`src/config/synthetic/conflict-matchlist.json`) are synthetic. Never use real
client data as fixtures.

## Swapping in the real conflict system

Implement `ConflictCheckProvider` (`src/lib/conflict/provider.ts`) against the
firm system and return it from `getConflictProvider()`. The wall's behavior is
already real and enforced; only the data source is stubbed.

## Stage 2 notes

The attorney review view renders a disabled "Generate MSA draft (Stage 2)"
button. There is deliberately **no** drafting endpoint anywhere in the app
(tested). The intake package (`GET /api/attorney/sessions/{id}`) is the input
contract Stage 2 will consume.

---

DivorceGPT by June Guided Solutions, LLC. Stage 1 collects information for
attorney review only; nothing in this application constitutes legal advice.
