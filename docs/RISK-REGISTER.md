# Risk Register — DivorceGPT 2.0

| # | Risk | Likelihood | Impact | Mitigation (implemented) | Residual / owner action |
|---|---|---|---|---|---|
| 1 | Unauthorized practice of law (software gives advice) | Low | Severe | Deterministic client bot (4 verbatim surfaces, deflects advice-seeking); no client-facing generative AI (test-enforced); disclosure states software ≠ legal advice; attorney review before any release | [COUNSEL REVIEW REQUIRED] on all client-facing legal text |
| 2 | Missed conflict of interest | Med | Severe | Screening before substantive intake; automated screen cannot clear; ATTORNEY-only dispositions (structural); conflict history retained across purges | Real conflict-system provider [NOT CONFIGURED]; stub matchlist is synthetic |
| 3 | Unapproved work product reaches a client/court | Low | Severe | Version-exact, hash-bound approval; release re-verifies role+approval+fresh content hash; clients 404 on unreleased versions | — |
| 4 | Staff/admin privilege escalation | Low | High | DB-stored roles re-read per request; structural persistence-layer guards with no config surface; role changes audited on a hash chain | Periodic audit review (admin) |
| 5 | Client data breach | Med | High | Data minimization + purge design; split data classes; files outside public/ with UUID names; headers/CSP; hashed PII in audit | Production storage/scanner/Postgres [NOT CONFIGURED]; rotate secrets at launch |
| 6 | Confidential data leaks into logs / AI vendor | Med | High | Metadata-only AI audit schema; no prompt/response logging (sentinel-tested); provider errors surfaced without payload echo | Review OpenAI data-processing terms before enabling in production [COUNSEL REVIEW REQUIRED] |
| 7 | Retention violates duty to preserve | Med | High | Legal hold blocks all automated purge; engaged matters exempt; conflict minimum + consent + audit survive; periods configurable, not hard-coded | Final retention periods [COUNSEL REVIEW REQUIRED] |
| 8 | Invitation token leakage | Low | Med | 256-bit opaque tokens, hash-at-rest, expiring, revocable, single-use, bound to authenticated account; neutral failure responses; strict rate limit | Convey tokens over appropriate channels (firm procedure) |
| 9 | Accessibility / accommodation failure | Med | Med | Help request with no reason field; recorded alternate intake methods (phone/video/in-person/paper/assisted) | Staff procedure for responding to help requests |
| 10 | Vendor lock/misuse of AI beyond scope | Low | Med | Single provider funnel; feature enum; kill switch; artifacts forced into attorney review | Do not add vendors without counsel + engineering review |
| 11 | DoS / brute force | Med | Low | Rate limits (strict on shared-secret doors); fail-closed admin endpoints | Multi-instance limiter store when scaling |
| 12 | Dev/test backdoors shipped to production | Low | High | DEV_AUTH_STUB structurally dead in prod; beta gate requires explicit flag AND keys; BETA_TEST_LOGIN triple-lock + boot warning; DV-card ship-blocker | Remove BETA_TEST_LOGIN before public launch (AGENTS.md §9) |
