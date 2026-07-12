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

Deployment record (filled after the run): see
docs/ONLINE-STAGING-ACCEPTANCE.md and docs/evidence/online-staging/.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
