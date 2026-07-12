# Implementation Status — DivorceGPT 2.0 Attorney Workflow

Branch: `divorcegpt-2-attorney-workflow`

## Completed

### Batch 1 — Baseline, users, roles, matters ✔
- DB-stored roles CLIENT | STAFF | ATTORNEY | ADMIN (`app_user`), matter-centered
  model (`matter`, `matter_access`), plus forward DDL for later batches.
- `requireUser` (src/lib/auth/authz.ts) re-reads the CURRENT role from the DB on
  every protected action; the cookie only proves identity. Old
  `requireRole`/`requireAnyRole` delegate to it (all Stage-1 routes now DB-backed).
- Matter-level authorization: client → own matter only; STAFF/ATTORNEY need
  explicit grants; denials are 404 (no existence leak).
- Structural attorney-only conflict dispositions: `attorneySetConflictDisposition`
  re-reads the actor's role at write time; `recordScreenStatus` cannot write
  CLEARED/DECLINED. Not configurable by ADMIN or anyone else.
- `ADMIN_EMAILS` bootstrap-only provisioning; STAFF/ADMIN never self-provision
  from a session token.
- Hash-chained audit events (`recordAudit` + `verifyAuditChain`).
- `insertAnswer` persistence guard extended: matter-linked sessions also require
  an attorney-set CLEARED matter.
- APIs: `GET/POST /api/matters`, `GET /api/matters/[id]`,
  `GET/POST /api/admin/users`, `PATCH /api/admin/users/[id]`.

Files changed: src/lib/db/{index,repo,users,matters}.ts,
src/lib/auth/{session,rbac,authz}.ts, src/lib/env.ts,
src/lib/matters/client-view.ts, src/lib/intake/service.ts,
src/app/api/{matters,admin/users}/**, tests/matters-roles.test.ts.

Checks: `tsc --noEmit` clean · vitest 111/113 (13 new tests green; the 2
failures are PRE-EXISTING beta-gate middleware tests from main, reconciled in
Batch 2) · lint/build deferred to batch cadence.

## Next batch

Batch 2 — invitations (hashed, single-use, expiring, revocable), disclosure +
consent, public registration disabled, beta gate legacy (`BETA_GATE_ENABLED`).

## Failures / risks being tracked
- 2 pre-existing beta-gate middleware test failures (main is red on these; the
  landing page was exempted from the gate in commit 158bc60 without updating
  tests). Fix lands with Batch 2's gate rework.
