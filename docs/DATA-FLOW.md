# Data Flow — DivorceGPT 2.0

## 1. Onboarding (invitation-only)

1. STAFF/ATTORNEY creates a matter (`POST /api/matters`) and an invitation
   (`POST /api/matters/[id]/invitations`). The raw token is shown ONCE;
   only SHA-256(token) is stored.
2. The firm conveys the token to the client out of band. (The app sends no
   email — [NOT CONFIGURED] by design for this build.)
3. Client signs in (Google OIDC) → `app_user` row (role CLIENT).
4. Client submits the token (`POST /api/invitations/accept`, token in the
   BODY, never the URL). Every failure mode returns one neutral response.
   Success binds `matter.client_user_id` and single-uses the invitation.
5. Client reads the versioned relationship disclosure
   (`GET /api/disclosure`) and affirmatively acknowledges
   (`POST /api/matters/[id]/consent`, `acknowledge: true` required, checkbox
   never preselected). Stored: matter, user, version, timestamp; IP/UA only
   when `CONSENT_CAPTURE_IP_UA=true` (default off).

## 2. Conflict screening (before substantive intake)

1. `POST /api/intake/start` (client: own matter + current disclosure ack
   required; staff/attorney: granted matter) → session in PRE_GATE.
2. Identity capture (`POST /api/intake/[id]/identity`): names + prior names
   for both parties only. A retained `conflict_submission` row is written
   and the automated screen runs.
3. The screen can ONLY produce NO_APPARENT_MATCH / POTENTIAL_MATCH /
   NEEDS_MORE_INFORMATION / PENDING_ATTORNEY_REVIEW. The session parks in
   CONFLICT_REVIEW_PENDING. The client sees one neutral message regardless
   of outcome; internal results are never exposed.
4. ATTORNEY reviews (`GET /api/matters/[id]/conflict`) and disposes
   (`POST`, CLEARED | DECLINED | NEEDS_MORE_INFORMATION). CLEARED unblocks
   the session into the scope gates; DECLINED purges session content while
   retaining the conflict-history minimum + audit, and sets lifecycle
   DECLINED.

## 3. Intake (unchanged Stage-1 machine behind the new wall)

Gates (residency → venue → DV → children → complexity) → tier branch →
config-driven intake fields → READY_FOR_REVIEW. Gate trips serve verbatim
cards and purge. The persistence layer refuses substantive writes unless the
session is conflict-clear AND the matter is attorney-CLEARED.

## 4. Documents

- Uploads (client after clearance; staff/attorney anytime on granted
  matters): MIME allowlist, size cap, malware-scan hook, UUID names outside
  `public/`; version starts DRAFT.
- Internal/AI drafts: staff/attorney; AI artifacts always start
  ATTORNEY_REVIEW_REQUIRED.
- Approval (`POST /api/document-versions/[id]/approve`, ATTORNEY only) binds
  {exact version id, SHA-256, type, destination, attorney, timestamp}.
- Release (`POST /api/document-versions/[id]/release`, ATTORNEY only)
  re-verifies role + live approval + destination + a FRESH hash of stored
  bytes, then records `document_release`.
- Client sees/downloads ONLY versions released to CLIENT_PORTAL (plus their
  own uploads' metadata/content). Drafts and AI artifacts 404.

## 5. Internal AI (optional; kill-switched)

`POST /api/matters/[id]/ai` (STAFF/ATTORNEY) → context assembled
server-side → `invokeInternalAi` (role re-read; AI_FEATURES_ENABLED
checked BEFORE any network call) → OpenAI → output materialized as an
AI_DRAFT document version (ATTORNEY_REVIEW_REQUIRED). Only invocation
metadata is logged; prompts/contents/responses never are.

## 6. Retention

Cron hits `POST /api/admin/purge` (bearer `ADMIN_SECRET`): legacy session
sweep + matter sweep. Only PROSPECTIVE/ABANDONED matters past their
configurable thresholds purge; ENGAGED/CLOSED exempt; legal hold blocks
absolutely. Purge removes sessions/answers/identity/documents/files and
retains conflict submissions, disclosure acks, matter disposition, and the
hash-chained audit trail.
