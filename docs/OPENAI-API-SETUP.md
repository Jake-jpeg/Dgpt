# OpenAI API Setup — DivorceGPT 2.0

> No real key is inserted by this document or this repository. The
> server-only OpenAI layer (`src/lib/ai/`) is preserved unchanged: STAFF/
> ATTORNEY-only, internal work product only, metadata-only logging,
> `AI_FEATURES_ENABLED` kill switch.

## ChatGPT is not the API

**ChatGPT workspace access (including ChatGPT Enterprise/Team subscriptions)
and OpenAI API Platform access are separate products with separate billing,
separate terms, and separate data-handling settings.** Nothing in this
application is covered by a ChatGPT subscription; do not represent the API
as covered by the ChatGPT Enterprise subscription. The application uses the
API Platform (`api.openai.com`) exclusively.

## Setup steps (owner/admin, at platform.openai.com)

1. **Create a dedicated API project** for DivorceGPT (e.g. `divorcegpt`)
   inside the firm's OpenAI organization. Do not share a project with other
   tools — per-project isolation is what makes usage monitoring and blast
   radius meaningful.
2. **Use a project service account** to mint keys for staging and
   production — not an individual developer's personal key. Personal keys
   leave with the person and entangle personal usage.
3. **Create separate keys per stage**: one staging key, one production key.
   Never reuse across stages; local development should use its own
   throwaway key or none (`AI_FEATURES_ENABLED=false` keeps the portal fully
   functional without any key).
4. **Store keys only in the deployment secret store** (e.g. the hosting
   platform's encrypted env settings). Never in git, `.env.example`, docs,
   logs, tickets, or chat. The repo's tests enforce that no `NEXT_PUBLIC_*`
   variable ever carries a key.
5. **Configure the model via `OPENAI_MODEL`** (env), not code edits. Set
   `OPENAI_ORG_ID` / `OPENAI_PROJECT_ID` so requests bill and log to the
   dedicated project.
6. **Set conservative spend limits and alerts** on the project before first
   use (monthly budget + email alerts well below it). Start small; raise
   deliberately.
7. **Monitor usage by project** on the platform dashboard; anomalies in a
   single-purpose project are easy to spot.
8. **Do not opt in to model-training data sharing.** Leave "improve the
   model for everyone" style sharing OFF for the organization/project.
9. **Review the API data-retention configuration** and applicable OpenAI
   business terms with counsel before the closed pilot ([COUNSEL REVIEW
   REQUIRED] — confidential client material is involved even for internal
   drafts).
10. **Rotate keys** immediately on suspected exposure (revoke at the
    platform, issue a fresh service-account key, update the secret store,
    redeploy). Also rotate on personnel changes with secret-store access.
11. **Never log raw client documents, prompts, or full responses.** The
    application already enforces this (metadata-only `ai_invocation` schema,
    sentinel-tested logging); keep any future logging changes behind that
    same review.
12. **Keep `AI_FEATURES_ENABLED` as the emergency kill switch** — set it to
    `false` to stop all OpenAI calls instantly; the portal, intake, uploads,
    document review, and manual workflows continue unaffected
    (test-enforced).

## Environment variables (names only — values live in the secret store)

```
AI_FEATURES_ENABLED=false   # flip to true only after steps 1–9
OPENAI_API_KEY=             # project service-account key, per stage
OPENAI_MODEL=gpt-4o-mini    # or the model the firm standardizes on
OPENAI_ORG_ID=
OPENAI_PROJECT_ID=
```
