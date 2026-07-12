# Role Permissions — DivorceGPT 2.0

Roles are DB-stored (`app_user.role`), re-read server-side on every
protected action (`src/lib/auth/authz.ts`). Exactly four roles exist:
CLIENT, STAFF, ATTORNEY, ADMIN. `ADMIN_EMAILS` is bootstrap/recovery only.
ATTORNEY requests additionally re-check `ATTORNEY_EMAILS` per request.

Matter access: CLIENT → only the matter bound to them by an accepted
invitation. STAFF/ATTORNEY (and any admin doing matter work) → explicit
`matter_access` grants. All denials are 404 (no existence leak).

| Capability | CLIENT | STAFF | ATTORNEY | ADMIN |
|---|---|---|---|---|
| Accept invitation / acknowledge disclosure | ✔ (own) | — | — | — |
| Structured intake (after CLEARED), save progress | ✔ (own) | ✔ record-assisted | ✔ | — |
| Upload requested documents | ✔ (own, after CLEARED) | ✔ | ✔ | — |
| View missing-information requests | ✔ labels only | ✔ full | ✔ full | — |
| Request assistance (no reason required) | ✔ | — | — | — |
| Plain-language matter status | ✔ | ✔ working view | ✔ working view | mgmt list |
| View released documents | ✔ (CLIENT_PORTAL releases only) | ✔ | ✔ | — |
| View internal notes / drafts / AI output / conflict reasoning | ✘ (structural) | ✔ | ✔ | ✘ |
| Create matters + invitations; revoke invitations | ✘ | ✔ | ✔ | ✘ |
| Collect/clarify info; organize documents; request missing info | ✘ | ✔ | ✔ | ✘ |
| Record accommodations (phone/video/in-person/paper/assisted/other) | ✘ | ✔ | ✔ | ✘ |
| Escalate issues / internal notes | ✘ | ✔ | ✔ | ✘ |
| Invoke internal AI tools | ✘ (structural) | ✔ | ✔ | ✘ |
| Prepare internal drafts / new versions | ✘ | ✔ | ✔ | ✘ |
| Review conflict submissions | ✘ | ✘ | ✔ | ✘ |
| **Clear / decline conflicts** | ✘ | ✘ **(structural)** | ✔ only | ✘ **(structural)** |
| Determine scope / lifecycle / legal hold | ✘ | ✘ | ✔ | ✘ |
| Request changes / withdraw a version | ✘ | ✘ | ✔ | ✘ |
| **Approve an exact document version** | ✘ | ✘ **(structural)** | ✔ only | ✘ **(structural)** |
| **Release an exact approved version** | ✘ | ✘ **(structural)** | ✔ only | ✘ **(structural)** |
| Mark work filing-ready (APPROVED_FOR_FILING) | ✘ | ✘ | ✔ | ✘ |
| Manage users and roles | ✘ | ✘ | ✘ | ✔ |
| Manage disclosure versions (config/source) | ✘ | ✘ | ✘ | ✔ (text is [COUNSEL REVIEW REQUIRED]) |
| Manage retention configuration | ✘ | ✘ | ✘ | ✔ (allowlisted keys only) |
| Audit review | ✘ | ✘ | ✔ (matter audit) | ✔ |
| Weaken attorney-only rules | ✘ | ✘ | ✘ | ✘ — no configuration surface exists |

**(structural)** = enforced inside the persistence layer by re-reading the
actor's CURRENT role at write time (`attorneySetConflictDisposition`,
`resolveLatestSubmission`, `approveVersion`, `releaseVersion`,
`setVersionWorkingStatus`, `invokeInternalAi`), in addition to the API-layer
role checks. There is no flag, setting, or admin action that bypasses them.

AI may never: communicate legal advice to clients, control permissions,
clear/decline conflicts, approve/release documents, determine legal
outcomes, or claim attorney review (`docs/APPROVAL-FLOW.md`, prompts in
`src/lib/ai/prompts/`).
