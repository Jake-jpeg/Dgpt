# Account Recovery / Relink — Manual Process

The application NEVER silently relinks an account based on a matching email
(a Google/Microsoft identity with the same email but a different stable
subject is refused). When a client genuinely loses access to their sign-in
account (lost Google account, changed provider), recovery is a manual,
firm-verified process:

1. **Client contacts the firm** through a channel outside the portal
   (phone/email on file from the engagement agreement).
2. **Firm-side identity verification** — a STAFF member or ATTORNEY
   verifies the person's identity against the engagement record (e.g.
   callback to the phone number on file plus matter details only the client
   would know). The verification method and outcome are noted in the
   matter's internal notes.
3. **Admin authorizes the relink**: in Administration → Users, the ADMIN
   uses the relink action (API: `PATCH /api/admin/users/{id}` with
   `{"clearSubject": true}`). This clears the stored provider subject and
   writes the audit event `USER_RELINK_AUTHORIZED` (admin actor, timestamp,
   hash-chained).
4. **Client signs in with the new account.** The first sign-in whose email
   matches the account row binds the new stable subject (the same
   email-bind path used for admin-precreated accounts). If the client's
   email also changed, the ADMIN first updates the row's email
   ([INCOMPLETE] — email edit is not yet exposed in the admin UI; use the
   role-management API/DB migration path, and see ASSUMPTIONS-AND-GAPS).
5. **Confirmation** — staff confirms with the client that access works and
   records completion in internal notes.

Security properties: nothing about this flow is self-service; it requires
an ADMIN action that is audited on the tamper-evident chain; the firm's
verification happens before any binding changes; and the invitation-first
rule is preserved (a relink never creates matters or grants — it only
re-binds an existing account's sign-in identity).
