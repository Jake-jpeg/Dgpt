# Online Staging Deployment (Part 7)

Two SEPARATE App Platform apps on DigitalOcean-generated domains. The live
DivorceGPT app, the live RL/Goldfish app, production environment variables,
and divorcegpt.com are NOT touched. Auto-deploy-on-push is DISABLED on
both staging apps.

| App | Source | Runtime | Health check |
|---|---|---|---|
| `dgpt-staging` | Jake-jpeg/Dgpt @ `divorcegpt-2-online-staging` | Node buildpack, `npm run build` / `npm start`, 1× apps-s-1vcpu-1gb | `/api/health` (app + db + AI-config booleans + PDF-service reachability + stage) |
| `dgpt-pdf-staging` | Jake-jpeg/RL @ `divorcegpt-2-pdf-staging-auth` | Dockerfile (gunicorn :8080), 1× apps-s-1vcpu-1gb | `/health` (service + state modules + auth_required; no secrets, no client data) |

Procedure (scripts/do-deploy.mjs; token read from env files, never printed):

1. `node scripts/do-deploy.mjs inspect` — READ-ONLY listing of existing
   apps (names/ids/urls only) to confirm the production apps stay
   untouched and no staging-name collision exists.
2. `node scripts/do-deploy.mjs create` — creates BOTH staging apps with
   encrypted SECRET-type env vars (OpenAI key from the operator's local
   env file; fresh staging-only SESSION/AUDIT/ADMIN secrets + PDF service
   token + beta access key generated to a 0600 tmp file, never stdout).
3. Wait for DO to assign default ingress URLs (`status`).
4. `node scripts/do-deploy.mjs finalize` — writes APP_URL, the OAuth
   redirect URIs, and PDF_SERVICE_URL into the dgpt-staging spec
   (triggers one redeploy) and prints the redirect URIs the operator must
   add in the Entra/Google consoles.
5. Operator adds the two redirect URIs (openid/profile/email scopes only;
   provider login NEVER assigns roles — the DATABASE stays authoritative).
6. `STAGING_URL=… STAGING_ADMIN_SECRET=… node scripts/staging-acceptance.mjs`
   — runs Parts 11–12 (≤5 live OpenAI calls) and writes the metadata-only
   results JSON under docs/evidence/online-staging/.

Hardening (audited + implemented before any execution):

- **Ownership guard.** A name is never authority. Before ANY update (and
  before "continuing" an existing app), the target must match ALL of:
  exact authorized name, exact authorized repo/branch on every component,
  `deploy_on_push=false`, `APP_STAGE=staging`, the management marker
  `DGPT_STAGING_MANAGED_BY=divorcegpt-do-deploy-v1`, and no custom domain.
  Both created apps carry the marker.
- **Fail-closed collisions.** Absent → create; present + verified →
  idempotent continuation; present + ANY failed check → abort with a
  sanitized error (name + check codes only) — nothing updated, no
  duplicate created.
- **Full pagination, exact-name matching only** (no prefixes/substrings).
- **Secrets** are generated to an OUT-OF-REPO store (`STAGING_SECRETS_PATH`
  or the OS user-data default) with an atomic write; contents never
  printed. `ATTORNEY_EMAILS`/`ADMIN_EMAILS` are SECRET-typed at DO.
- **Dry-run:** `node scripts/do-deploy.mjs all --dry-run` — zero network,
  zero token, zero env-file reads, zero secret writes; prints the redacted
  plan and every intended method/endpoint family.
- Minimum DO custom-token scopes: `app:read`, `app:create`, `app:update`.
  No DELETE request exists in the script.

Deployment record (filled after the run): see
docs/ONLINE-STAGING-ACCEPTANCE.md and docs/evidence/online-staging/.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
