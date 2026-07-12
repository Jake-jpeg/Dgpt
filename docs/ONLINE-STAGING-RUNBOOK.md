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
node scripts/do-deploy.mjs all
```

What it does: read-only inspection of your existing apps (touches
nothing), creates `dgpt-pdf-staging` + `dgpt-staging` (deploy-on-push OFF,
DO-generated domains, encrypted secrets incl. a fresh service token /
session secrets / staging access key saved to `data\stage-secrets.json`),
waits for URLs, stamps APP_URL + redirect URIs + PDF_SERVICE_URL, waits
until both deployments are ACTIVE, prints the two staging URLs and the two
OAuth redirect URIs. (~10–20 minutes, mostly DO build time.)

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

(The ADMIN_SECRET is read automatically from `data\stage-secrets.json`.)
Writes `docs\evidence\online-staging\acceptance.json` — synthetic
metadata only. Then tell Claude "acceptance done" — the results file gets
pulled back, verified, and written into the acceptance report.

## 4. Interactive login proofs (you, in a browser)

Open the staging URL → `/beta` → enter the access key from
`data\stage-secrets.json` (FREE_ACCESS_KEY) → then:
- Microsoft sign-in with your firm account (lands on the firm side);
- create an invitation for a synthetic client from a matter you open;
- in a private window: accept it with a throwaway/test Google account.
Never use real client information.

## 5. Cleanup (later, when staging is no longer needed)

Delete both apps in the DO dashboard (they are fully separate from the
live apps) and remove the two tokens from `.env.local`.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
