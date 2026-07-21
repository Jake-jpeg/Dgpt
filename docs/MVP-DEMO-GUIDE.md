# MVP Demo Guide — DivorceGPT 2.0 (local, synthetic data only)

This walks the complete attorney-supervised workflow on your machine.
**Synthetic identities only — never real client data.**

## 1. One-time setup

In `C:\Users\kim_j\Desktop\Dgpt`, make sure `.env` contains (add/adjust
these lines; keep your existing secrets):

```
DEV_AUTH_STUB=true
ADMIN_EMAILS=admin@example.test
ATTORNEY_EMAILS=attorney@example.test
DATABASE_PATH=./data/demo.db        # a fresh file keeps the demo clean
FILE_STORAGE_DIR=./data/files
AI_FEATURES_ENABLED=false           # portal must work without AI
```

Then:

```bash
npm install        # if not already done
npm run dev        # http://localhost:3000
```

## 2. Automated validation (recommended first)

With the dev server running, in a second terminal:

```bash
node scripts/e2e-demo.mjs
```

This seeds the synthetic firm users through the real admin API, then runs
the full happy path AND the negative paths (staff/admin cannot clear,
approve, or release; clients cannot see drafts or other matters; revisions
lose approvals; release requires the exact matching approval; AI-disabled
mode leaves the portal working) plus a page smoke test. Expected output
ends with `RESULT: 64 passed, 0 failed`.

To only seed the users: `node scripts/e2e-demo.mjs --seed-only`.

## 3. Manual browser walkthrough

Test identities (local test sign-in on `/portal`; any password-free email
works, these are the seeded ones):

| Sign in as | Email |
|---|---|
| Admin | admin@example.test |
| Attorney | attorney@example.test |
| Staff | staff@example.test |
| Client | client@example.test |

Steps (use a normal window + a private window, or sign out between roles):

1. **Attorney** → `/portal` → local test sign-in as
   `attorney@example.test` (Attorney) → lands on **Matters** (`/firm`).
2. **Create matter** — reference like `Demo Matter 2026-001 (synthetic)`.
3. Open the matter → **Invitations → Create invitation** → **Copy URL**
   (shown once).
4. **Client** (private window) → open the copied `/invite?token=…` URL →
   sign in as `client@example.test` (Client) → **Accept invitation**.
5. You land on **My matter**: read the relationship disclosure, tick the
   (unchecked) acknowledgment box, **Record my acknowledgment**.
6. **Provide initial information** → *Begin intake* → enter synthetic names
   (e.g. Casey Syntheticperson / Jordan Syntheticperson) → **Run conflict
   check** → the neutral “submitted for review” message appears. Note the
   intake and uploads stay locked.
7. **Attorney** window → **Conflict review** (`/firm/conflicts`) → the
   matter is pending with the internal screen result → **Clear — proceed**.
   (Sign in as staff or admin to confirm they get no clearance controls and
   the API refuses them.)
8. **Client** window → **My matter** → status is active → **Continue my
   intake** → answer the scope questions (Yes / Kings / No / No /
   “We agree on everything”), the two tier questions (no assets / no
   alimony), fill the required fields, **Save progress** whenever you like →
   **Submit for attorney review**.
9. Client: **Upload a requested document** (any small PDF) — it goes to the
   firm for review. Try **Ask the firm for help** (no reason asked);
   attorney/staff can acknowledge it and record an accommodation (e.g.
   Telephone intake) on the matter page.
10. **Staff** or attorney → matter page → **Documents**: the client upload
    is listed. Add an internal draft (Title “Internal settlement outline
    (synthetic)”, any .txt/.pdf). Every version shows its state and content
    hash; staff has no approval controls.
11. **Attorney** → on the internal draft version: **Approve…** → “Approve
    for client” (the dialog names the exact version + hash) → **Release…**
    — the confirmation shows document, exact version, approval type,
    approving attorney, approval time, destination → **Release this exact
    version**. (Upload a new version first if you want to see approvals NOT
    carrying forward.)
12. **Client** window → **My matter → Documents from the firm** → the
    released document appears → **Download**. Drafts never appear.
13. **Attorney** → matter page → **Audit trail** panel shows the whole
    story (invitation → consent → screen → clearance → upload → approval →
    release). **Admin** (`/admin`) → Audit records shows the same events
    with the hash-chain status INTACT, plus users/roles and retention
    settings.

## 4. Intake review handoff

The completed intake appears for the attorney under **Intake review**
(`/attorney`) exactly as in Stage 1, including the disabled Stage-2 MSA
affordance.

## 5. Resetting the demo

Stop the server and delete `./data/demo.db` and `./data/files`, then start
again — the seed step recreates the firm users.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
