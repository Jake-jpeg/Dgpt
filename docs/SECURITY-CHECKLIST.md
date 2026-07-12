# Security Checklist — DivorceGPT 2.0

## Authentication & sessions
- [x] OIDC (code + PKCE) via Google (clients) and Entra (firm); no password storage
- [x] HS256 JWT in httpOnly SameSite=Lax cookie, 8h TTL, Secure in production
- [x] Roles stored in DB; re-read on EVERY protected action; cookie role never sufficient
- [x] ATTORNEY_EMAILS allowlist re-checked per request; ADMIN_EMAILS bootstrap-only
- [x] Dev auth stub structurally dead in production; beta test login triple-locked and legacy
- [x] Deactivated accounts refused (`active=0`)

## Authorization
- [x] Matter-level authorization everywhere; client → own matter only; 404 on denial (no existence leak)
- [x] Structural attorney-only guards at the persistence layer (conflicts, approvals, releases, lifecycle statuses) — not configurable
- [x] ADMIN cannot clear conflicts, approve, release, or reach matter content without a grant
- [x] Access denials audited (ACCESS_DENIED)

## Input handling
- [x] zod validation at every API boundary; unknown fields ignored, never stored
- [x] CSRF: custom header requirement + Origin check on all state-changing routes
- [x] Rate limiting on login, intake, bot, invitation acceptance (strict), beta unlock
- [x] Sanitized error responses (guard prefixes → 409; unexpected → generic 500)

## Files
- [x] Server-side storage only, outside `public/`; UUID names; original filename metadata-only
- [x] Storage-key validation + root confinement (traversal-proof)
- [x] MIME allowlist + size cap; malware-scan hook interface (no-op in dev — [NOT CONFIGURED] for production)
- [x] Matter-level upload/download authorization; client fetch limited to released versions/own uploads
- [x] Local storage refuses NODE_ENV=production without FILE_STORAGE_ALLOW_LOCAL_TEST=true

## Secrets & AI
- [x] No secret in source; `.env` gitignored; no NEXT_PUBLIC secret (test-enforced)
- [x] OpenAI key server-only; org/project headers optional
- [x] No prompts, document contents, model responses, keys, tokens, cookies, or PII in logs/audit (sentinel-tested; ai_invocation schema is metadata-only)
- [x] AI kill switch (AI_FEATURES_ENABLED) checked before any network call

## Audit & retention
- [x] Hash-chained audit trail (`verifyAuditChain`); PII only as salted HMAC hashes
- [x] Full event coverage: invitations (create/revoke/accept), auth, consent, conflict status, role changes, accommodations, assistance, uploads, downloads, doc generation/revision/approval/release, AI metadata, denials, retention actions, config changes
- [x] Legal hold blocks purge; engaged matters exempt from prospective purge; conflict history survives purge

## Headers & transport
- [x] CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy on every response; HSTS in production

## Known gaps ([NOT CONFIGURED] / deferred)
- [ ] Production object storage + real malware scanner
- [ ] Managed Postgres before any real client data (SQLite file is dev/beta only)
- [ ] Real ConflictCheckProvider against the firm's conflict system (stub matchlist today)
- [ ] Multi-instance rate limiting (in-memory store is single-instance)
- [ ] Secret rotation + production OAuth registrations at launch (see AGENTS.md §9)
