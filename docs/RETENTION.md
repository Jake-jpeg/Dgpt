# Retention & Legal Hold — DivorceGPT 2.0

Final retention periods and policy language are **[COUNSEL REVIEW REQUIRED]**.
The code implements STRUCTURE (what can purge, what must survive, what blocks
purge); the NUMBERS are configuration (`app_config` via
`PUT /api/admin/config`), never hard-coded.

## Matter lifecycles

PROSPECTIVE (pre-engagement) · ENGAGED · ABANDONED · DECLINED · CLOSED.
Lifecycle changes are ATTORNEY-only (`POST /api/matters/[id]/lifecycle`).

## What automated purge MAY remove (prospective/abandoned matters only)

- substantive intake answers + party identity (session purge)
- uploaded files and document drafts (rows + stored bytes)
- intake sessions themselves

## What ALWAYS survives purge

- `conflict_submission` — identity + aliases, opposing party, entities,
  screen result, disposition: the minimum reasonably necessary for future
  conflict review (no FK; never auto-purged)
- `disclosure_ack` — consent records
- `audit_event` — the hash-chained audit trail
- the `matter` row itself (disposition/lifecycle record)

## Hard rules (enforced in `src/lib/retention`, RETENTION_GUARD)

1. The prospective purge path NEVER applies to ENGAGED or CLOSED matters.
2. LEGAL HOLD blocks automated purge absolutely, regardless of lifecycle.
   Holds are set/released by an ATTORNEY only and are audited.
3. The sweep only considers PROSPECTIVE and ABANDONED matters past their
   configured inactivity thresholds.

## Configuration (admin-managed, allowlisted keys only)

| Key | Default (provisional) | Meaning |
|---|---|---|
| retention.prospective_days | 30 [COUNSEL REVIEW REQUIRED] | inactivity before a prospective matter's content may purge |
| retention.abandoned_days | 14 [COUNSEL REVIEW REQUIRED] | inactivity before an abandoned matter's content may purge |
| retention.sweep_enabled | true | master switch for the automated sweep |

Legacy: `RETENTION_ABANDONED_DAYS` (env) still drives the Stage-1
session-level sweep for matterless sessions.

## Operations

Cron → `POST /api/admin/purge` with `Authorization: Bearer $ADMIN_SECRET`.
Response reports counts only. Every purge writes a RETENTION_PURGE audit
event; every config change writes CONFIG_CHANGED.
