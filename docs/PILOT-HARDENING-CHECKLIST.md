# Pilot-Hardening Checklist

Branch `divorcegpt-2-pilot-hardening` from `144b756`. Corrections applied:
firm name is exactly **Jake Kim Law Firm**; NO public office-location
language and NO `NEXT_PUBLIC_OPERATING_FIRM_LOCATION` (rescinded by
correction #2); ownership facts never invented — unresolved items carry
`[OWNER CONFIRMATION REQUIRED]` internally, never rendered.

## P1 Branding
- [x] "J. Kim Law Firm" → "Jake Kim Law Firm" in active source, rendered copy, env defaults, tests, seeds, disclosure, current docs (git history / historical records untouched)
- [x] Tests: exact name renders; old name absent from src/; no location copy added

## P2 Operator/IP clarity
- [x] Configurable branding fields: legal-services provider (always the firm), portal operator, software owner, copyright owner
- [x] docs/OPERATOR-AND-IP-OWNERSHIP.md cataloging every ownership/operation statement; unresolved → [OWNER CONFIRMATION REQUIRED]

## P3 Landing copy
- [x] Keep headline; CTAs → "Discuss an institutional pilot" / "View the workflow"; de-emphasize acquisition
- [x] APP_STAGE=local|staging|closed_pilot status copy (exact strings)
- [x] Footer: no-attorney-client-relationship + engagement-agreement language; keep OpenAI non-affiliation; no prohibited claims
- [x] Stage-copy tests

## P4 No-payments architecture
- [x] Verify zero payment surface; architecture test failing on stripe dep / payment route / fee field
- [x] docs/NO-PAYMENTS-POSTURE.md

## P5 Microsoft Entra (firm)
- [x] MICROSOFT_* env names (ENTRA_* still honored); tenant-specific authority; refuse common/consumers/organizations
- [x] nonce + state + issuer + audience + signature + expiry + tenant-id validation; exact redirect URI config
- [x] identity bound to tid+oid; email stored as snapshot only
- [x] Microsoft success ≠ ATTORNEY: pre-existing ACTIVE app account required; role reloaded from DB per request
- [x] scopes limited to openid profile email (no Graph)

## P6 Google (invited clients)
- [x] Generic Google sign-in creates NOTHING; account row exists only after a valid invitation binds it
- [x] invitation → Google → validate (incl. nonce, email_verified) → confirm shown account → bind stable google|sub
- [x] no silent email-based relink; uniform invalid-invitation response preserved; scopes openid profile email only
- [x] documented manual recovery/relink (firm-side verification + audit event)

## P7 Provider ≠ role — tests
- [x] MS login no auto-ATTORNEY; MS w/o DB account denied; Google w/o invitation denied; cross-matter denied; STAFF/ADMIN cannot clear or approve/release; deactivation blocks next request

## P8 Dev login local-only
- [x] Unavailable (neutral 404) when NODE_ENV=production OR APP_STAGE staging/closed_pilot; UI hides test accounts; startup warning if flags set outside local; tests

## P9 OpenAI readiness
- [x] docs/OPENAI-API-SETUP.md (project, service-account keys per stage, secret store, spend limits, no training opt-in, rotation, no raw logging, kill switch; API ≠ ChatGPT workspace)

## P10 Build/dependency hardening
- [x] middleware → proxy migration (or documented blocker)
- [x] NFT whole-project tracing narrowed (DATABASE_PATH resolve in src/lib/db/index.ts)
- [x] npm audit: 2 moderate (postcss transitive via next) — nonbreaking fix or documented deferral
- [x] install-scripts review (esbuild/sharp/unrs-resolver) documented

## P11 Pilot-readiness matrix
- [x] docs/PILOT-READINESS.md (local / synthetic staging / closed firm pilot / institutional pilot) — NOT production-ready

## P12 Final testing + docs
- [x] npm test · tsc · eslint · build · e2e-demo 64+ green, plus new brand/stage/no-payment/OAuth/dev-login tests
- [x] Update IMPLEMENTATION-STATUS, HANDOFF, ASSUMPTIONS-AND-GAPS, RISK-REGISTER, README

Status: ALL items complete (location language rescinded by correction #2;
audit deferral documented). Validation: vitest 195/195, tsc, eslint, build
(0 warnings), e2e 66/66, live proxy gating smoke.
