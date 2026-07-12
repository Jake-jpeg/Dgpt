# Online Staging — Environment Variable Checklist (Part 9)

NO VALUES in this document. Secrets are entered ONLY through
DigitalOcean's encrypted environment-variable fields (type SECRET) — never
in Git, never in app-spec plaintext, never in NEXT_PUBLIC_*.

## dgpt-staging (repo Jake-jpeg/Dgpt, branch divorcegpt-2-online-staging)

| Variable | Kind | Notes |
|---|---|---|
| APP_STAGE | plain = `staging` | drives stage gating + banner |
| APP_URL | plain = DO staging URL | self-fetch origin for acceptance |
| SYNTHETIC_DEMO_ONLY | plain = `true` | required by the ephemeral override + acceptance endpoint |
| SYNTHETIC_STAGING_EPHEMERAL_STORAGE | plain = `true` | staging-only; startup refuses elsewhere |
| NODE_ENV | (platform default `production`) | do not override |
| SESSION_SECRET | SECRET | fresh value for staging; never reuse production |
| AUDIT_HASH_SECRET | SECRET | fresh value for staging |
| ADMIN_SECRET | SECRET | bearer for the staging acceptance endpoint + purge |
| AI_FEATURES_ENABLED | plain = `true` | |
| OPENAI_API_KEY | SECRET | staging/dev key preferred over production key |
| OPENAI_MODEL | plain | configured model id |
| OPENAI_REVIEW_MODEL | plain (optional) | |
| OPENAI_REQUEST_TIMEOUT_MS | plain = `120000` | |
| OPENAI_MAX_OUTPUT_TOKENS | plain = `3000` | |
| OPENAI_MAX_RETRIES | plain = `1` | acceptance requirement |
| PDF_SERVICE_ENABLED | plain = `true` | |
| PDF_SERVICE_URL | plain = RL staging URL | server-only; no NEXT_PUBLIC variant exists |
| PDF_SERVICE_TOKEN | SECRET | same value as RL staging |
| PDF_SERVICE_TIMEOUT_MS | plain = `60000` | |
| MICROSOFT_TENANT_ID | SECRET/protected | single tenant |
| MICROSOFT_CLIENT_ID | plain/protected | |
| MICROSOFT_CLIENT_SECRET | SECRET | |
| MICROSOFT_REDIRECT_URI | plain = `<staging-url>/api/auth/callback/microsoft` | |
| GOOGLE_CLIENT_ID | plain/protected | |
| GOOGLE_CLIENT_SECRET | SECRET | |
| GOOGLE_REDIRECT_URI | plain = `<staging-url>/api/auth/callback/google` | |
| ATTORNEY_EMAILS | plain | synthetic + real firm attorney for interactive proof (comma-separated) |
| ADMIN_EMAILS | plain | synthetic staging admin bootstrap |
| BETA_GATE_ENABLED | plain = `true` | public-discovery shield |
| FREE_ACCESS_KEYS | SECRET | staging access key |
| DATABASE_PATH | plain = `/tmp/staging.db` | EPHEMERAL by design (synthetic only) |
| FILE_STORAGE_DIR | plain = `/tmp/staging-files` | EPHEMERAL by design (synthetic only) |
| DEV_AUTH_STUB | plain = `false` (or unset) | dev login stays off in staging |
| ALLOW_UNAPPROVED_LEGAL_CONTENT | UNSET | startup refuses it outside local (verified) |
| RUN_OPENAI_SMOKE | unset/`false` | |

## dgpt-pdf-staging (repo Jake-jpeg/RL, branch divorcegpt-2-pdf-staging-auth)

| Variable | Kind | Notes |
|---|---|---|
| PDF_SERVICE_TOKEN | SECRET | SAME value as the Dgpt staging secret |
| APP_STAGE | plain = `staging` | reported by /health |
| RATE_LIMIT_MAX / RATE_LIMIT_WINDOW_S | plain (optional) | defaults 30/60s |
| MAX_REQUEST_BYTES | plain (optional) | default 262144 |
| ALLOWED_ORIGINS | n/a | CORS list is code-side; CORS is NOT auth |

Cross-checks after deploy: `/api/health` on Dgpt shows
`stage=staging, syntheticDemoOnly=true, ephemeralStorage=true, db=ok,
aiConfigured=true, pdfService=ok`; RL `/health` shows
`auth_required=true, app_stage=staging`.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
