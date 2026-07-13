# GO-LIVE RUNBOOK — squid ↔ dgpt-pdf-staging cutover, goldfish retirement

Branch: `divorcegpt-2-live-release` (= audited `divorcegpt-2-online-staging`
@ b526e34 + stage-aware document labels @ 86d4dc5). 274/274 tests,
production build verified. Every step below is reversible until step 7.

ORDER MATTERS. Do not delete goldfish before step 6 passes.

## 0. Preflight (2 min)

- DO dashboard → `dgpt-pdf-staging` → deployment ACTIVE and `/health`
  returns `{"status":"ok","auth_required":true,...}` (open
  `https://<dgpt-pdf-staging-url>/health` in a browser tab).
- Settings → `pdf` component → Environment variables →
  `PDF_SERVICE_TOKEN` must show an encrypted value. If it is blank, set it
  now (Encrypt ✓). This exact value is needed again in step 3.
- `auth_required:false` in /health means the token is missing — fix
  before continuing. The service 503s its generate routes until set
  (fail-closed by design).

## 1. Push the release branch (your machine)

```bat
cd %USERPROFILE%\Desktop\Dgpt
git fetch _to_delete\live-release.bundle divorcegpt-2-live-release:divorcegpt-2-live-release
git push origin divorcegpt-2-live-release
```

(Bundle is delivered to your Dgpt folder / chat. Nothing merges to main
today; squid deploys the release branch directly, so rollback stays one
click.)

## 2. Point squid at the release branch

DO dashboard → `squid-app` → Settings → `web`/service component →
Source → Edit: branch `main` → `divorcegpt-2-live-release`.
Leave Autodeploy OFF (deploys stay deliberate).

## 3. Add squid's new environment variables (component-level, Encrypt where marked)

| Key | Value |
|---|---|
| AI_FEATURES_ENABLED | `true` |
| OPENAI_API_KEY | your key — **Encrypt** |
| OPENAI_MODEL | your model id (e.g. `gpt-4o-mini`) |
| OPENAI_REQUEST_TIMEOUT_MS | `120000` |
| OPENAI_MAX_OUTPUT_TOKENS | `3000` |
| OPENAI_MAX_RETRIES | `1` |
| PDF_SERVICE_ENABLED | `true` |
| PDF_SERVICE_URL | `https://<dgpt-pdf-staging-url>` (no trailing slash) |
| PDF_SERVICE_TOKEN | SAME value as step 0 — **Encrypt** |
| PDF_SERVICE_TIMEOUT_MS | `60000` |

Do NOT set: `APP_STAGE=staging`, `SYNTHETIC_DEMO_ONLY`,
`SYNTHETIC_STAGING_EPHEMERAL_STORAGE`, `DEV_AUTH_STUB`,
`ALLOW_UNAPPROVED_LEGAL_CONTENT` — production refuses/ignores these by
design; leaving them unset keeps the staging banner off, storage
persistent, and rendered documents cleanly labeled
"— attorney review required".

Keep every existing squid variable (sessions, OAuth, storage paths,
beta gate) exactly as it is.

## 4. Deploy squid

Actions → Deploy (or Create Deployment). Wait ACTIVE (~5–10 min).
Check `https://<squid-url>/api/health` → `db:ok`, `aiConfigured:true`,
`pdfService:ok`, and NO `stage:"staging"`.

## 5. Attorney onboarding (one-time, required)

The legal-authority snapshot auto-approves nothing. Sign in with your
firm Microsoft account (ATTORNEY) → Intake review → approve the NJ and
NY questionnaire versions. Until then, client intake correctly refuses
to serve questions — that is the compliance gate working.

## 6. End-to-end verification (synthetic client, ~10 min)

1. Create a matter → run conflict check → CLEAR it → confirm
   jurisdiction (NJ).
2. Invite a synthetic client (throwaway Google account) → accept in a
   private window → Google sign-in → disclosure → complete a few intake
   sections. Confirm the AI never addresses the client anywhere.
3. As attorney: workbench → render `nj/verification` →
   title ends "— attorney review required", status
   ATTORNEY_REVIEW_REQUIRED.
4. Approve that exact version → release → download as the client.
5. Optional AI check (attorney-side only): generate an intake memo;
   confirm it lands ATTORNEY_REVIEW_REQUIRED.

Any failure → step 8 rollback; nothing has been deleted.

## 7. Retire goldfish (YOUR click, only after step 6 passes)

DO dashboard → `goldfish-app` → Settings → Danger Zone → Destroy app.
The `Jake-jpeg/RL` GitHub repo is untouched by app deletion — your
"keep the repo" backup is automatic. Billing for goldfish stops at
deletion.

## 8. Rollback (any time, ~5 min)

squid → Settings → Source → branch back to `main` → Deploy. The added
env vars are inert under main (no code reads them there); remove at
leisure. dgpt-pdf-staging and goldfish are independent apps and are
unaffected.

## Post-cutover notes

- `dgpt-pdf-staging` currently reports `app_stage:"staging"` in /health —
  cosmetic only; auth does not depend on it. Optionally change
  `APP_STAGE` to `production` on it later. Do NOT rename the app
  casually: renaming changes its URL and breaks squid's
  `PDF_SERVICE_URL` until updated.
- The online staging acceptance (`dgpt-staging` + ≤5 OpenAI calls) was
  NOT run before this cutover if you skipped it — the offline suite
  (274 tests) and the RL Docker/live validation are the evidence base.
- Next build item (agreed): client↔lawyer messaging thread per matter —
  clients talk to the lawyer only, never the AI.
