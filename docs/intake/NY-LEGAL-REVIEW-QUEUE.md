# NY Legal Review Queue (counsel action list)

Generated from the shipped intake configuration (schema version
`2026.07.1`) by `scripts/generate-intake-docs.ts` — do not
hand-edit; regenerate after config changes. Facts are collected from
clients in plain language; legal conclusions are attorney determinations.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.

Everything below awaits a HUMAN counsel decision. Nothing in the runtime
snapshot ships APPROVED; approving, retiring, or superseding a record goes
through docs/legal-authority/LEGAL-CONTENT-CHANGE-CONTROL.md.

## Authority records pending counsel review

| ID | Jurisdiction | Section | Status | Open notes |
|---|---|---|---|---|
| NY-DIVORCE-GROUNDS-001 | NY | DRL § 170 | COUNSEL_REVIEW_REQUIRED | Open Legislation page indicated a 2026-02-27 revision view; durations for subdivisions (5)/(6) rendered as 'six months' in one fetched summary and 'one year' in the statute as generally published — [needs cite check] to confirm exact current durational text before any reliance. |
| NY-DIVORCE-RESIDENCE-001 | NY | DRL § 230 | COUNSEL_REVIEW_REQUIRED | — |
| NY-ED-MAINTENANCE-001 | NY | DRL § 236(B), incl. B(5), B(5-a), B(6) | COUNSEL_REVIEW_REQUIRED | — |
| NY-UCCJEA-001 | NY | DRL §§ 75, 76, 77-g (Art. 5-A) | COUNSEL_REVIEW_REQUIRED | — |
| NY-UIFSA-001 | NY | FCA Art. 5-B; § 580-201 | COUNSEL_REVIEW_REQUIRED | — |
| NY-CSSA-001 | NY | FCA § 413 (see also 413-a, 413-b; DRL § 240 [needs cite check]) | COUNSEL_REVIEW_REQUIRED | [needs cite check] — DRL § 240 caption/text not fetched. |
| NY-FC-JURISDICTION-001 | NY | FCA § 115; Art. 6 (§ 651 [needs cite check]); Art. 8, § 812 | COUNSEL_REVIEW_REQUIRED | [needs cite check] — FCA § 651 caption not independently fetched. |
| NY-UNCONTESTED-FORMS-001 | NY | UD-1 … UD-15 | RESEARCHED | An uncontested JOINT divorce program is referenced on official pages — exact statewide joint-program form list [needs cite check]. |
| NY-SNW-FORM-001 | NY | UCS matrimonial form (Rev. 1/1/24) | RESEARCHED | SUPERSEDED-RISK: Rev. 6/2016 copy still published at a second official URL. |
| NY-MAINT-CS-TOOLS-001 | NY | n/a | RESEARCHED | — |
| NY-MATRIMONIAL-RULES-001 | NY | 22 NYCRR 202.16 family | COUNSEL_REVIEW_REQUIRED | Exact current rule text (202.16, 202.16-b, 202.50) [needs cite check] before drafting reliance. |
| NY-FC-FORMS-001 | NY | n/a (per-form numbers [not found] this pass) | RESEARCHED | Specific petition form numbers (e.g., custody GF/6-series, support 4-series) [not found] in this pass — form-level mapping deferred to counsel-supervised pass. |
| NY-CONTESTED-PROCESS-001 | NY | n/a | RESEARCHED | — |
| NY-CS-INFO-001 | NY | n/a | RESEARCHED | — |

## Client-facing copy pending counsel review

Every intake item ships `reviewStatus: COUNSEL_REVIEW_REQUIRED` — counsel
review of the client-facing wording is a prerequisite to any use beyond the
local proof. Items marked [COUNSEL REVIEW REQUIRED] in prompts/help text
(e.g. the client certification language) are the highest-priority subset.

## Structural review items

- Retention policy final values — [COUNSEL REVIEW REQUIRED]
- Client certification wording (shared.review.certification) — [COUNSEL REVIEW REQUIRED]
- County/part practice variations are explicitly OUT OF SCOPE of this build
  and must be handled by the attorney per matter.
