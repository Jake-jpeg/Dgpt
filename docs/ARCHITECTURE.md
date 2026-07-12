# Architecture — DivorceGPT 2.0 (Attorney Workflow)

DivorceGPT is private workflow software operated by a law firm (default
branding: Jake Kim Law Firm via `NEXT_PUBLIC_OPERATING_FIRM_NAME`). It is not a
law firm, not an attorney, not a public chatbot, not an autonomous drafting
service, and not a payment platform.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind 4 (unchanged from Stage 1).
- DB: `node:sqlite` — ALL SQL lives in `src/lib/db/` (index.ts = DDL,
  one repo module per domain). Postgres migration = driver swap confined to
  that directory.
- Auth: hand-rolled OIDC (Google for clients, Microsoft Entra for firm side),
  HS256 JWT session cookies. The cookie proves identity only; roles are
  DB-stored.
- Validation: zod at every API boundary. Tests: Vitest (real route handlers,
  in-memory SQLite, synthetic data only).
- AI: OpenAI only, server-only, internal-only (`src/lib/ai/`).

## Operating relationship

Client → retains the firm → invitation → portal → provides facts/documents →
software organizes + flags gaps → attorney reviews everything substantive →
attorney affirmatively approves any external release.

## Layers

1. **HTTP routes** (`src/app/api/**`) — thin: rate limit → CSRF → authz →
   zod → service/repo call → shaped response. Client-facing responses are
   plain-language and never expose internal machinery.
2. **Authorization** (`src/lib/auth/`) — `requireUser` re-reads the CURRENT
   role from `app_user` on every protected action; ATTORNEY additionally
   re-checks the `ATTORNEY_EMAILS` allowlist per request;
   `requireMatterAccess` enforces matter-level access (client → own matter;
   staff/attorney → explicit grants; denials are 404).
3. **Domain services** (`src/lib/intake/service.ts`, `src/lib/retention/`,
   `src/lib/ai/openai.ts`) — orchestration.
4. **Persistence + structural guards** (`src/lib/db/`) — the belt-and-
   suspenders layer. Even a buggy or malicious route cannot:
   - write substantive intake without an attorney-CLEARED matter
     (`insertAnswer`);
   - set CLEARED/DECLINED from automated code (`recordScreenStatus` accepts
     only the four screen statuses; `attorneySetConflictDisposition`
     re-reads the actor's role at write time);
   - approve/release a document as non-ATTORNEY (`approveVersion` /
     `releaseVersion` re-read the role and verify version id + SHA-256 +
     destination);
   - purge under legal hold or purge engaged matters (`purgeMatterContent`).
5. **File storage** (`src/lib/storage/`) — `FileStorage` interface;
   local-dev implementation stores UUID-named files outside `public/`;
   production storage is [NOT CONFIGURED] and local disk refuses
   `NODE_ENV=production` without an explicit override.

## Key data model (matter-centered)

```
app_user (role: CLIENT|STAFF|ATTORNEY|ADMIN)
matter (lifecycle, conflict_status, legal_hold, client_user_id)
 ├─ matter_access        (staff/attorney grants)
 ├─ invitation           (token HASH only; expiring/revocable/single-use)
 ├─ intake_session       (state machine; PRE_GATE → CONFLICT_REVIEW_PENDING → gates → INTAKE → READY_FOR_REVIEW)
 │    ├─ party_identity / intake_answer (purgeable substantive content)
 ├─ document → document_version → document_approval → document_release
 ├─ accommodation / assistance_request / info_request / internal_note
 └─ (no FK — survive purges): conflict_submission, disclosure_ack,
    audit_event (hash-chained), ai_invocation (metadata only)
```

## Deterministic client bot (preserved)

The client-facing "bot" remains the Stage-1 deterministic state machine +
verbatim attorney-approved copy (`src/lib/bot/`, `src/config/`). No
generative AI touches the client-facing intake; the OpenAI layer is a
separate, staff/attorney-only internal surface whose outputs always enter
the document lifecycle as ATTORNEY_REVIEW_REQUIRED.

## NJ/NY intake + lawyer workbench layer (branch divorcegpt-2-nj-ny-intake-ai)

Additions, all preserving the structures above:

- **Legal-authority snapshot** (`src/config/legal-authority/{nj,ny}/records.json`
  + `src/lib/legal/authority.ts`): dated, machine-readable authority records
  with review statuses; the runtime never browses the web; nothing ships
  APPROVED; `ALLOW_UNAPPROVED_LEGAL_CONTENT` is local-only and refused at
  startup elsewhere (`src/instrumentation.ts`).
- **Versioned intake schemas** (`src/config/intake/*` +
  `src/lib/intake2/`): shared factual core + per-state modules composed
  per matter category (15 categories, `INTAKE_SCHEMA_VERSION`), evaluated
  by a pure deterministic engine (conditions, progress, checklist,
  jurisdiction signals). Startup validation refuses dangling references.
  New tables: `matter_intake_answer` (+ full history table), plus matter
  columns for the attorney's jurisdiction/category/scope determination and
  the pinned schema version.
- **AI workbench** (`src/lib/ai/{responses,schemas2,actions,run-action,extract}.ts`):
  OpenAI Responses API, strict structured outputs, `store:false`, salted
  safety identifier, no fallback models; ten actions; three-layer output
  validation (schema → citation allowlist → provenance refs); rejected
  outputs are never saved; accepted outputs become AI_DRAFT versions in
  ATTORNEY_REVIEW_REQUIRED. Bounded local document extraction
  (`document_extraction` table) feeds the context as untrusted data.
- **Surfaces**: schema-driven client questionnaire (`/portal/intake`),
  attorney/staff workbench panels on the firm matter view (jurisdiction,
  intake review, checklist, form readiness, legal sources, AI actions),
  and internal APIs (`/api/matters/[id]/{intake2,jurisdiction,checklist,form-readiness}`,
  `/api/legal-authorities`, `/api/document-versions/[id]/extract`).
