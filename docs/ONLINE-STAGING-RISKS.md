# Online Staging — Risks (Part 13)

Synthetic staging only; every risk below is accepted FOR SYNTHETIC DATA
and unacceptable for real clients without the closed-pilot fixes.

1. EPHEMERAL STATE (accepted, loud). SQLite + local files live on the App
   Platform instance disk: any redeploy/restart/scale event may erase all
   matters, documents, and accounts. Banner on every screen; health
   reports `ephemeralStorage:true`; horizontal scaling unsupported (1
   instance only). Real pilot requires managed Postgres, object storage,
   tested backup/restore, malware scanning (unchanged requirement).
2. PUBLIC URL, synthetic-only data. Shields: DO-generated domain (not
   divorcegpt.com), beta gate + staging access key, invitation-only client
   entry, OAuth-only firm entry, dev login disabled by stage, acceptance
   endpoint neutral-404 unless staging+synthetic and bearer-authorized.
3. STAGING ACCEPTANCE ENDPOINT exists on this branch only; it can mint
   synthetic sessions. Mitigation: triple gate (stage, synthetic flag,
   ADMIN_SECRET constant-time bearer), @example.test identities only,
   metadata-only output. Do NOT merge this branch into main.
4. LIVE OPENAI KEY in staging. Mitigations: encrypted env var, server-only
   layer, kill switch, ≤5-call acceptance budget, metadata-only ledger.
   Prefer a dedicated staging key with its own budget alert.
5. RL SERVICE is internet-reachable. Mitigations: fail-closed bearer auth,
   constant-time compare, rate limit, size cap, allowlists, sanitized
   filenames, no state. Residual: RL sees synthetic form data in requests.
6. OAUTH REDIRECTS: staging URIs must be added to the SAME Entra/Google
   app registrations; a typo breaks only staging login, not production.
7. MODEL OUTPUT VARIANCE: live model may produce rejected outputs
   (REJECTED_OUTPUT) — by design; acceptance records them honestly.
8. PRODUCTION UNTOUCHED invariant: separate apps, separate branches, auto-
   deploy OFF, no domain attach. Deploy tooling enforces it structurally:
   ownership guard (marker + exact repo/branch + stage + no custom domain)
   before any update or idempotent continuation; fail-closed abort on any
   same-name collision; full pagination with exact-name matching; no
   DELETE request exists; minimum token scopes app:read/create/update.
9. STAGING SECRETS FILE lives outside the repository (default under the
   OS user-data dir). chmod 600 where supported; on Windows, NTFS ACLs
   are operator-controlled — treat the folder as sensitive and delete the
   file when staging is torn down.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
