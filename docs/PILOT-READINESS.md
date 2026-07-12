# Pilot-Readiness Matrix — DivorceGPT 2.0

Legend: **C** complete · **I** incomplete · **NC** [NOT CONFIGURED] ·
**CR** [COUNSEL REVIEW REQUIRED] · **OC** [OWNER CONFIRMATION REQUIRED]

> **This application is NOT production-ready.** The closed-pilot and
> institutional columns list what must change before anyone relies on it
> with real client information.

| Item | Local dev | Synthetic staging | Closed Jake Kim Law Firm pilot | Institutional / LAS pilot |
|---|---|---|---|---|
| Branding (exact firm name, stage copy) | C | C (set APP_STAGE=staging) | C (set APP_STAGE=closed_pilot) + OC (software-owner line) | OC (per-institution operator/branding) |
| OAuth — Microsoft (firm) | C (dev stub instead) | NC (tenant app registration, redirect URIs, secrets) | NC (single-tenant registration + firm account provisioning) | NC (institution tenant policy) |
| OAuth — Google (clients) | C (dev stub instead) | NC (OAuth consent screen + credentials) | NC (production credentials, verified app) | NC |
| Database | C (SQLite file) | NC (managed Postgres; driver swap confined to src/lib/db/) | NC (managed Postgres + migrations) | NC |
| Object storage (documents) | C (local disk impl) | NC (S3/GCS behind FileStorage) | NC | NC |
| Malware scanning | C (no-op hook, local only) | NC (real scanner on the hook) | NC | NC |
| Email delivery (invitations etc.) | C (out-of-band by design) | NC | NC (decide channel; app sends nothing today) | NC |
| OpenAI API project | C (disabled by default) | NC (staging project key; docs/OPENAI-API-SETUP.md) | NC + CR (data terms) | NC + CR |
| Data retention (structure + config) | C | C (synthetic) | CR (final periods + policy sign-off) | CR |
| Privacy notice | I (draft only) | I | CR (docs/PRIVACY-NOTICE-DRAFT.md) | CR |
| Portal disclosure text | C (structure) | C | CR (src/config/disclosure.ts wording) | CR |
| Engagement-language addendum (portal use) | — | — | CR (retainer addendum referencing portal terms) | CR |
| Backups | I (copy the SQLite file manually) | NC | NC (automated backups) | NC |
| Restore testing | I | NC | NC (documented, rehearsed restore) | NC |
| Incident response | I | I | CR/I (written IR plan, contacts, notification duties) | CR/I |
| Logging | C (audit chain; app logs minimal) | I (centralize) | I (retention + access controls for logs) | I |
| Monitoring / alerting | I | NC | NC (uptime, error, spend alerts) | NC |
| Accessibility | I (semantic HTML, labels; no audit) | I | I (WCAG pass + accommodations tested) | I |
| Malpractice-carrier review | — | — | CR/OC (carrier notice/approval NOT claimed or obtained) | CR/OC |
| Security review (external) | — | I | I (independent review before real data) | I |
| Real conflict provider | C (synthetic stub) | C (stub) | NC (firm conflict-system integration) | NC |
| Client-support process | — | I | I (who answers portal help requests, SLA) | I |
| Account recovery | C (docs/ACCOUNT-RECOVERY.md + admin relink) | C | I (staff the process; verify script) | I |
| Deletion process (client requests) | I (purge exists; request handling undefined) | I | CR (policy + workflow) | CR |
| Legal hold | C | C | C (attorney procedure documented) | C |
| Audit export | I (API + admin view; no export file) | I | I (exportable audit package) | I |
| No-payment architecture | C (test-enforced) | C | C | C (institutional agreements handled off-platform) |

## Blockers before ANY real client data (closed pilot)

1. Managed Postgres + object storage + malware scanning (all NC).
2. Production OAuth registrations (Microsoft single-tenant; Google verified).
3. Counsel sign-off: disclosure text, retention periods, privacy notice,
   engagement addendum, OpenAI data terms (all CR).
4. Owner confirmation: software-ownership statements (OC).
5. Backups + rehearsed restore, monitoring, incident-response plan.
6. Independent security review; carrier conversation (no approval claimed).
