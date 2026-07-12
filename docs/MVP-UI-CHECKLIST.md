# MVP UI Checklist — routes → screens → APIs

Rule: pages render what the server says; every control calls an existing
protected API. Hidden UI is convenience only — the server stays authoritative.

| # | Screen | Route | Backing APIs |
|---|---|---|---|
| A | Entry / sign-in (all 4 roles; no self-registration) | `/portal` | /api/auth/me, /api/auth/login/{google,entra}, /api/auth/dev-login (local stub), /api/auth/logout |
| B | Firm matter list + create | `/firm` | GET/POST /api/matters (enriched firm view) |
| C | Invitation management | `/firm/matters/[id]` (Invitations panel) | GET/POST /api/matters/[id]/invitations, POST /api/invitations/[id]/revoke |
| D | Client invitation acceptance (neutral failures) | `/invite` | POST /api/invitations/accept |
| E | Relationship disclosure (affirmative, unchecked) | `/portal/matter` (step) | GET /api/disclosure, GET/POST /api/matters/[id]/consent |
| F | Conflict prescreen + neutral pending | `/portal/matter` (step) + `/intake` | POST /api/intake/start, POST /api/intake/[id]/identity, GET /api/intake/[id] |
| G | Attorney conflict queue | `/firm/conflicts` | GET /api/attorney/conflicts (new), GET/POST /api/matters/[id]/conflict |
| H | Client intake (save progress, missing items, help, uploads, status) | `/portal/matter` + `/intake` | GET /api/matters/[id], /info-requests, /documents, /assistance; intake routes |
| I | Accommodations | `/portal/matter` (help) + `/firm/matters/[id]` (record) | POST /api/matters/[id]/assistance, GET/PATCH same, GET/POST /api/matters/[id]/accommodations |
| J | Document review (versions, states, hashes, AI-unreviewed) | `/firm/matters/[id]` (Documents panel) | GET /api/matters/[id]/documents (enriched with approvals/releases), POST /api/documents/[id]/versions |
| K | Attorney approval (exact version; no bulk) | `/firm/matters/[id]` | POST /api/document-versions/[id]/approve, /status |
| L | Controlled release (shows title/version/type/attorney/timestamp/destination) | `/firm/matters/[id]` | POST /api/document-versions/[id]/release |
| M | Client released-document view | `/portal/matter` (Documents) | GET /api/matters/[id]/documents (client shape), GET /api/document-versions/[id]/download |
| N | Admin (users/roles, disclosure version, retention, audit) | `/admin` | /api/admin/users[/id], /api/admin/config, /api/disclosure, GET /api/admin/audit (new) |
| — | Landing keeps design; adds "Portal sign in" nav link | `/` | — |

New/updated supporting endpoints (thin, same guard stack):
- GET /api/auth/me → adds authoritative DB role + client matter hint
- POST /api/auth/dev-login → accepts all four roles (DB role still governs;
  STAFF/ADMIN never self-provision — seeded rows bind by email)
- GET /api/attorney/conflicts → granted matters pending conflict review
- GET /api/matters/[id]/audit → ATTORNEY (grant) matter audit trail
- GET /api/admin/audit → ADMIN audit review + chain verification
- GET /api/matters (STAFF/ATTORNEY) → adds client display, intake/doc status
- GET /api/matters/[id]/documents (firm shape) → adds approvals + releases

Demo: scripts/e2e-demo.mjs (seeds synthetic firm users via the real admin
API, then validates the happy path + negative paths over HTTP; --seed-only
to just seed) · docs/MVP-DEMO-GUIDE.md.

Status: ALL screens implemented and validated — vitest 167/167, tsc, eslint,
build green; scripts/e2e-demo.mjs 64/64 (happy path, negative paths, page
smoke). See docs/MVP-DEMO-GUIDE.md for the exact demonstration steps.
