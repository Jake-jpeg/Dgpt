# Online Synthetic Staging — Execution Checklist

Dgpt branch `divorcegpt-2-online-staging` from `623531d`
(tag `checkpoint-pre-online-staging`).
RL branch `divorcegpt-2-pdf-staging-auth` from `7026643`
(tag `checkpoint-pre-staging-auth`).

SYNTHETIC DATA ONLY. Separate staging apps on DigitalOcean-generated
domains. The live DivorceGPT app, the live RL/Goldfish app, and
divorcegpt.com are NOT touched. No merge to main. Not production-ready.

| # | Item | Status |
|---|---|---|
| P1 | Repos confirmed (Dgpt `623531d` clean · RL `7026643`); branches + checkpoints created | DONE |
| P1 | Baseline: 234/234 tests · tsc · eslint · build · e2e 66/66 (pre-change) | DONE |
| P2 | RL bearer auth (constant-time), 401 paths, size limit, JSON/state/form validation, filename sanitization, rate limit, tests | PENDING |
| P3 | Dgpt server-only pdf-service client/types/mappings/audit + ATTORNEY-only render route; PDF magic + SHA-256; version ATTORNEY_REVIEW_REQUIRED | PENDING |
| P4 | Lifecycle separation AI draft → attorney confirm → RL render → separate exact-version approval → release | PENDING |
| P5 | NJ PDF proof (form: verification or complaint) through the full workflow | PENDING (post-deploy) |
| P6 | NY PDF proof (form: UD-1) through the full workflow | PENDING (post-deploy) |
| P7 | Two DO staging apps (`dgpt-staging`, `dgpt-pdf-staging`) from the two branches; auto-deploy off; DO domains; health checks | PENDING |
| P8 | Ephemeral-storage synthetic override (`SYNTHETIC_STAGING_EPHEMERAL_STORAGE` + `SYNTHETIC_DEMO_ONLY`, staging-only, loud banner, refused elsewhere) | PENDING |
| P9 | Staging env-var checklist (no values) + encrypted entry in DO | PENDING |
| P10 | OAuth staging redirect URIs delivered (openid/profile/email only; DB stays the authorization source) | PENDING (needs DO URL) |
| P11 | Online OpenAI acceptance from the deployed service (≤5 live calls) | PENDING |
| P12 | Online E2E scenarios A (NJ), B (NY), C (negative) | PENDING |
| P13 | Docs + evidence under docs/evidence/online-staging/ | PENDING |
| P14 | Final validation + report | PENDING |

Execution notes:
- Claude's sandbox cannot reach api.openai.com; ALL live OpenAI calls run
  from the deployed staging service (Part 11 requirement) via the
  staging-gated, bearer-protected acceptance endpoint.
- Deploying from GitHub requires pushing the two staging branches (never
  main) — treated as expressly instructed by the deployment spec in Part 7.
- Microsoft/Google staging redirect URIs must be added by the operator in
  the Azure/Google consoles once DO assigns URLs; the interactive login
  proofs happen then.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
