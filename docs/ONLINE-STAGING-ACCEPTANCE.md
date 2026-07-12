# Online Staging Acceptance — Results (Part 14)

STATUS: **AWAITING OPERATOR DEPLOYMENT RUN** (see
docs/ONLINE-STAGING-RUNBOOK.md). This file is finalized from
docs/evidence/online-staging/acceptance.json after the run.

## To be recorded

| Item | Value |
|---|---|
| dgpt-staging URL | _pending_ |
| dgpt-pdf-staging URL | _pending_ |
| Dgpt branch/commit | divorcegpt-2-online-staging / f7b9978 |
| RL branch/commit | divorcegpt-2-pdf-staging-auth / 81577f3 |
| Deployment IDs | _pending_ |
| Health checks | _pending_ |
| Live OpenAI calls (≤5) + response IDs/tokens/latency | _pending_ |
| NJ scenario (setup → memo → inconsistency → verification render → approve → release → client download) | _pending_ |
| NY scenario (setup → form-readiness → jurisdiction summary → UD-1 render → approve → release → client download) | _pending_ |
| Negative battery (client/staff/admin refusals, RL 401s, no payment routes, AI-off continuity, revision loses approval) | _pending_ |
| Microsoft login proof (interactive) | _pending operator_ |
| Google invitation login proof (interactive) | _pending operator_ |

## Verified before deployment (cloud, offline)

- 251/251 repository tests · tsc · eslint · production build (Dgpt)
- 13/13 RL auth/hardening tests (pytest)
- Full pipeline dry-run against mock OpenAI + real local RL service:
  11/11 steps PASS (with and without the beta gate), 4/5 AI budget
- Ephemeral-storage override guard, health endpoints, staging acceptance
  endpoint gating (404 outside synthetic staging; constant-time bearer)

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
