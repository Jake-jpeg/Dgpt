# Online Staging — Operator Runbook (Windows)

Claude's cloud sandbox cannot reach api.digitalocean.com or the staging
domains (egress allowlist), so these commands run on YOUR machine in
`C:\Users\kim_j\Desktop\Dgpt`. Every secret stays in local files/DO
encrypted fields — nothing is ever printed.

## 0. One-time prerequisites

- `DIGITALOCEAN_ACCESS_TOKEN=<token>` line present in `.env.local`
  (DigitalOcean → API → Generate New Token → Full Access).
- Both staging branches on GitHub (Claude pushes them if you added
  `GH_PUSH_TOKEN=`; otherwise push from your machine):

```bat
cd %USERPROFILE%\Desktop\Dgpt
git push origin divorcegpt-2-online-staging

cd %USERPROFILE%\Desktop\ReportLab
git fetch %USERPROFILE%\Desktop\Dgpt\_to_delete\rl-staging.bundle divorcegpt-2-pdf-staging-auth:divorcegpt-2-pdf-staging-auth
git push origin divorcegpt-2-pdf-staging-auth
```

## 1. Deploy both staging apps (one command)

```bat
cd %USERPROFILE%\Desktop\Dgpt
git checkout divorcegpt-2-online-staging
node scripts/do-deploy.mjs all --dry-run   REM no network — review the plan
node scripts/do-deploy.mjs all
```

The token can also be supplied per-session instead of .env.local:
`set DIGITALOCEAN_ACCESS_TOKEN=<token>` before the command. Minimum
custom-token scopes: app:read, app:create, app:update.

What it does: paginated read-only inspection of your existing apps
(touches nothing), creates `dgpt-pdf-staging` + `dgpt-staging` (deploy-on-
push OFF, DO-generated domains, management marker, encrypted secrets incl.
a fresh service token / session secrets / staging access key saved OUTSIDE
the repo to `%LOCALAPPDATA%\JakeKimLawFirm\DivorceGPT\stage-secrets.json`
— NTFS permissions on that folder are yours to manage), waits for URLs,
ownership-verifies both apps, stamps APP_URL + redirect URIs +
PDF_SERVICE_URL, waits until both deployments are ACTIVE, prints the two
staging URLs and the two OAuth redirect URIs. Any same-name app that fails
ownership verification aborts the run untouched. (~10–20 minutes, mostly
DO build time.)

## 2. Register the OAuth redirect URIs (printed by step 1)

- Azure Entra → your app registration → Authentication → add
  `https://<dgpt-staging-url>/api/auth/callback/microsoft`
- Google Cloud console → OAuth client → Authorized redirect URIs → add
  `https://<dgpt-staging-url>/api/auth/callback/google`

Scopes stay openid/profile/email; provider login never assigns roles.

## 3. Run the online acceptance (≤5 live OpenAI calls)

```bat
set STAGING_URL=https://<dgpt-staging-url>
node scripts/staging-acceptance.mjs
```

(The ADMIN_SECRET is read automatically from the out-of-repo secrets
store; set `STAGING_SECRETS_PATH` to relocate it.)
Writes `docs\evidence\online-staging\acceptance.json` — synthetic
metadata only. Then tell Claude "acceptance done" — the results file gets
pulled back, verified, and written into the acceptance report.

## 4. Interactive login proofs (you, in a browser)

Open the staging URL → `/beta` → enter the access key (FREE_ACCESS_KEY in
the out-of-repo secrets store) → then:
- Microsoft sign-in with your firm account (lands on the firm side);
- create an invitation for a synthetic client from a matter you open;
- in a private window: accept it with a throwaway/test Google account.
Never use real client information.

## 5. Cleanup (later, when staging is no longer needed)

Delete both apps in the DO dashboard (they are fully separate from the
live apps) and remove the two tokens from `.env.local`.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
