/**
 * Synthetic end-to-end validation of the 2.0 MVP against a RUNNING local
 * dev server. SYNTHETIC DATA ONLY.
 *
 * Server prerequisites (see docs/MVP-DEMO-GUIDE.md):
 *   DEV_AUTH_STUB=true
 *   ADMIN_EMAILS=admin@example.test
 *   ATTORNEY_EMAILS includes attorney@example.test
 *   (fresh DATABASE_PATH recommended)
 *
 * Usage:  node scripts/e2e-demo.mjs [--seed-only]
 *         BASE_URL=http://localhost:3000 node scripts/e2e-demo.mjs
 *
 * Exit code 0 = every step passed. Prints PASS/FAIL per step.
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SEED_ONLY = process.argv.includes("--seed-only");

let passed = 0;
let failed = 0;
const failures = [];

function ok(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Minimal persona with its own cookie + fake source IP (rate-limit lane). */
function persona(email, role, ip) {
  return { email, role, ip, cookie: "" };
}

async function call(p, method, path, body, extra = {}) {
  const headers = {
    "x-dgpt-csrf": "1",
    "x-forwarded-for": p.ip,
    ...(p.cookie ? { cookie: p.cookie } : {}),
    ...(extra.form ? {} : { "content-type": "application/json" }),
  };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: extra.form ? body : body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie && setCookie.includes("dgpt_session=")) {
    p.cookie = setCookie.split(";")[0];
  }
  let data = {};
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) data = await res.json().catch(() => ({}));
  else data = { _raw: await res.text().catch(() => "") };
  return { status: res.status, data };
}

async function login(p) {
  const r = await call(p, "POST", "/api/auth/dev-login", {
    role: p.role,
    email: p.email,
    name: p.email.split("@")[0],
  });
  if (r.status !== 200) {
    throw new Error(
      `dev-login failed for ${p.email} (HTTP ${r.status}) — is the server running with DEV_AUTH_STUB=true?`
    );
  }
  await call(p, "GET", "/api/auth/me"); // provisions/binds the account row
}

async function main() {
  console.log(`\nDivorceGPT 2.0 — synthetic end-to-end validation against ${BASE}\n`);

  const admin = persona("admin@example.test", "ADMIN", "10.90.0.1");
  const attorney = persona("attorney@example.test", "ATTORNEY", "10.90.0.2");
  const staff = persona("staff@example.test", "STAFF", "10.90.0.3");
  const client = persona("client@example.test", "CLIENT", "10.90.0.4");
  const intruder = persona("client-two@example.test", "CLIENT", "10.90.0.5");

  // ── Seed firm users through the real admin APIs ────────────────────
  console.log("Seed — synthetic firm users (admin bootstrap + admin API)");
  await login(admin);
  const users = await call(admin, "GET", "/api/admin/users");
  ok("admin signs in via ADMIN_EMAILS bootstrap", users.status === 200, `HTTP ${users.status}`);
  const have = new Map((users.data.users ?? []).map((u) => [u.email, u]));
  for (const [email, role] of [
    ["attorney@example.test", "ATTORNEY"],
    ["staff@example.test", "STAFF"],
  ]) {
    if (!have.has(email)) {
      const r = await call(admin, "POST", "/api/admin/users", { email, role });
      ok(`seed ${role} ${email}`, r.status === 201, `HTTP ${r.status}`);
    } else {
      ok(`seed ${role} ${email} (already present)`, true);
    }
  }
  if (SEED_ONLY) {
    console.log("\nSeed complete (--seed-only).");
    return;
  }

  await login(attorney);
  await login(staff);
  await login(client);
  await login(intruder);
  const staffId = (await call(admin, "GET", "/api/admin/users")).data.users.find(
    (u) => u.email === "staff@example.test"
  )?.id;

  // ── 1. Create matter ───────────────────────────────────────────────
  console.log("\nHappy path");
  const created = await call(attorney, "POST", "/api/matters", {
    label: "Demo Matter 2026-001 (synthetic)",
  });
  ok("1. attorney creates matter", created.status === 201, `HTTP ${created.status}`);
  const matterId = created.data.matter?.id;
  const grant = await call(attorney, "POST", `/api/matters/${matterId}/access`, {
    userId: staffId,
    action: "GRANT",
  });
  ok("1b. staff granted matter access", grant.status === 200, `HTTP ${grant.status}`);

  // ── 2. Invitation ──────────────────────────────────────────────────
  const invite = await call(attorney, "POST", `/api/matters/${matterId}/invitations`, {});
  ok("2. invitation created (token shown once)", invite.status === 201 && invite.data.token);
  const token = invite.data.token;

  // ── 3. Accept ──────────────────────────────────────────────────────
  const accept = await call(client, "POST", "/api/invitations/accept", { token });
  ok("3. client accepts invitation", accept.status === 200, `HTTP ${accept.status}`);
  const replay = await call(client, "POST", "/api/invitations/accept", { token });
  ok("3b. replayed token rejected neutrally", replay.status === 400);

  // ── 4. Disclosure ──────────────────────────────────────────────────
  const blockedStart = await call(client, "POST", "/api/intake/start", { matterId });
  ok("4a. intake blocked before disclosure ack", blockedStart.status === 409);
  const disclosure = await call(client, "GET", "/api/disclosure");
  const version = disclosure.data.disclosure?.version;
  const ack = await call(client, "POST", `/api/matters/${matterId}/consent`, {
    version,
    acknowledge: true,
  });
  ok("4b. affirmative disclosure acknowledgment recorded", ack.status === 200);

  // ── 5. Conflict submission ─────────────────────────────────────────
  const start = await call(client, "POST", "/api/intake/start", { matterId });
  ok("5a. intake session starts after ack", start.status === 200, `HTTP ${start.status}`);
  const sessionId = start.data.session?.id;
  const identity = await call(client, "POST", `/api/intake/${sessionId}/identity`, {
    clientParty: { fullLegalName: "Casey Syntheticperson", priorNames: [] },
    adverseParty: { fullLegalName: "Jordan Syntheticperson", priorNames: [] },
  });
  ok(
    "5b. conflict screen pends review with neutral message",
    identity.status === 200 &&
      identity.data.result === "PENDING_REVIEW" &&
      String(identity.data.message).includes("submitted for review")
  );

  // ── 6. Substantive intake blocked before clearance ─────────────────
  const early = await call(client, "POST", `/api/intake/${sessionId}/gate`, { answer: true });
  ok("6. substantive intake blocked pre-clearance", early.status === 409);

  // Negative: staff/admin cannot clear or decline.
  const staffClear = await call(staff, "POST", `/api/matters/${matterId}/conflict`, {
    disposition: "CLEARED",
  });
  ok("N1. STAFF cannot clear conflicts", staffClear.status === 403, `HTTP ${staffClear.status}`);
  const adminClear = await call(admin, "POST", `/api/matters/${matterId}/conflict`, {
    disposition: "DECLINED",
  });
  ok("N2. ADMIN cannot clear/decline conflicts", adminClear.status === 403, `HTTP ${adminClear.status}`);

  // ── 7. Attorney clears ─────────────────────────────────────────────
  const queue = await call(attorney, "GET", "/api/attorney/conflicts");
  ok(
    "7a. matter appears in attorney conflict queue",
    queue.status === 200 && queue.data.pending?.some((r) => r.matterId === matterId)
  );
  const clear = await call(attorney, "POST", `/api/matters/${matterId}/conflict`, {
    disposition: "CLEARED",
  });
  ok("7b. attorney clears the matter", clear.status === 200 && clear.data.conflictStatus === "CLEARED");

  // ── 8. Client completes intake ─────────────────────────────────────
  for (const answer of [true, "Bergen", false, false, "FULLY_AGREE"]) {
    const g = await call(client, "POST", `/api/intake/${sessionId}/gate`, { answer });
    if (g.status !== 200) {
      ok(`8a. gate answer ${JSON.stringify(answer)}`, false, `HTTP ${g.status}`);
    }
  }
  const branch = await call(client, "POST", `/api/intake/${sessionId}/branch`, {
    branch_assets: "NONE",
    branch_alimony: "NONE",
  });
  ok("8a. gates + tier branch (TIER1)", branch.status === 200 && branch.data.tier === "TIER1");
  const TIER1 = [
    ["grounds_basis", "IRRECONCILABLE_6MO"],
    ["grounds_date", "2025-01-15"],
    ["marriage_date", "2015-06-20"],
    ["marriage_place", "Hackensack, New Jersey"],
    ["ceremony_type", "CIVIL"],
    ["client_address", "1 Synthetic Way, Testville NJ 07000"],
    ["client_phone", "555-000-0000"],
    ["client_email", "client@example.test"],
    ["spouse_address", "2 Synthetic Way, Testville NJ 07000"],
    ["separation_date", "2025-01-15"],
    ["living_arrangement", "SEPARATE_RESIDENCES"],
    ["children_confirm_none", true],
    ["t1_no_assets_confirm", true],
    ["t1_no_alimony_confirm", true],
    ["name_change_requested", "NONE"],
    ["prior_actions_any", false],
  ].map(([fieldId, value]) => ({ fieldId, value }));
  const answers = await call(client, "POST", `/api/intake/${sessionId}/answers`, {
    answers: TIER1,
  });
  ok("8b. intake answers saved (progress persisted)", answers.status === 200);
  const complete = await call(client, "POST", `/api/intake/${sessionId}/complete`);
  ok(
    "8c. intake completes → READY_FOR_REVIEW",
    complete.status === 200 && complete.data.state === "READY_FOR_REVIEW"
  );

  // ── 9. Client uploads a test document ──────────────────────────────
  const upForm = new FormData();
  upForm.set(
    "file",
    new File([new TextEncoder().encode("synthetic marriage certificate")], "certificate.pdf", {
      type: "application/pdf",
    })
  );
  upForm.set("title", "Marriage certificate (synthetic)");
  const upload = await call(client, "POST", `/api/matters/${matterId}/documents`, upForm, {
    form: true,
  });
  ok("9. client uploads a document", upload.status === 201, `HTTP ${upload.status}`);

  // ── 10. Staff/attorney review ──────────────────────────────────────
  const staffDocs = await call(staff, "GET", `/api/matters/${matterId}/documents`);
  ok(
    "10a. staff sees the upload for review",
    staffDocs.status === 200 &&
      staffDocs.data.documents?.some((d) => d.title.includes("Marriage certificate"))
  );
  const staffList = await call(staff, "GET", "/api/matters");
  ok(
    "10b. staff matter list shows client + statuses",
    staffList.status === 200 &&
      staffList.data.matters?.some(
        (m) => m.id === matterId && m.client?.email === "client@example.test"
      )
  );

  // ── 11. Internal document version ──────────────────────────────────
  const draftForm = new FormData();
  draftForm.set(
    "file",
    new File([new TextEncoder().encode("internal draft v1 — synthetic")], "draft.txt", {
      type: "text/plain",
    })
  );
  draftForm.set("title", "Internal settlement outline (synthetic)");
  const internal = await call(staff, "POST", `/api/matters/${matterId}/documents`, draftForm, {
    form: true,
  });
  ok("11. staff creates an internal document version", internal.status === 201);
  const draftDocId = internal.data.document?.id;
  const draftV1 = internal.data.version?.id;

  // Negative: client cannot see or fetch the unreleased draft.
  const clientDocs = await call(client, "GET", `/api/matters/${matterId}/documents`);
  ok(
    "N3. client cannot view unreleased drafts",
    clientDocs.status === 200 &&
      !JSON.stringify(clientDocs.data).includes(draftV1 ?? "nope") &&
      !JSON.stringify(clientDocs.data.released).includes("Internal settlement")
  );
  const clientFetch = await call(client, "GET", `/api/document-versions/${draftV1}/download`);
  ok("N3b. client download of a draft 404s", clientFetch.status === 404);

  // Negative: staff/admin cannot approve or release.
  const staffApprove = await call(staff, "POST", `/api/document-versions/${draftV1}/approve`, {
    approvalType: "FOR_CLIENT",
    destination: "CLIENT_PORTAL",
  });
  ok("N4. STAFF cannot approve", staffApprove.status === 403);
  const adminApprove = await call(admin, "POST", `/api/document-versions/${draftV1}/approve`, {
    approvalType: "FOR_CLIENT",
    destination: "CLIENT_PORTAL",
  });
  ok("N5. ADMIN cannot approve", adminApprove.status === 403);
  const staffRelease = await call(staff, "POST", `/api/document-versions/${draftV1}/release`, {
    destination: "CLIENT_PORTAL",
  });
  ok("N6. STAFF cannot release", staffRelease.status === 403);
  const adminRelease = await call(admin, "POST", `/api/document-versions/${draftV1}/release`, {
    destination: "CLIENT_PORTAL",
  });
  ok("N7. ADMIN cannot release", adminRelease.status === 403);

  // Negative: release without any approval fails.
  const releaseUnapproved = await call(
    attorney,
    "POST",
    `/api/document-versions/${draftV1}/release`,
    { destination: "CLIENT_PORTAL" }
  );
  ok("N8. release without approval is refused", releaseUnapproved.status === 409);

  // ── 12. Attorney approves the exact version ────────────────────────
  const approve = await call(attorney, "POST", `/api/document-versions/${draftV1}/approve`, {
    approvalType: "FOR_CLIENT",
    destination: "CLIENT_PORTAL",
  });
  ok(
    "12. attorney approves exact version (id + sha256 bound)",
    approve.status === 200 && approve.data.approval?.versionId === draftV1
  );

  // Negative: a revision does NOT inherit the approval.
  const revForm = new FormData();
  revForm.set(
    "file",
    new File([new TextEncoder().encode("internal draft v2 — revised synthetic")], "draft-v2.txt", {
      type: "text/plain",
    })
  );
  const revision = await call(staff, "POST", `/api/documents/${draftDocId}/versions`, revForm, {
    form: true,
  });
  ok("N9a. revision uploads (begins unapproved)", revision.status === 201);
  const draftV2 = revision.data.version?.id;
  const releaseV2 = await call(attorney, "POST", `/api/document-versions/${draftV2}/release`, {
    destination: "CLIENT_PORTAL",
  });
  ok("N9b. revised version does not inherit prior approval", releaseV2.status === 409);
  const releaseV1Superseded = await call(
    attorney,
    "POST",
    `/api/document-versions/${draftV1}/release`,
    { destination: "CLIENT_PORTAL" }
  );
  ok("N9c. superseded v1 can no longer release", releaseV1Superseded.status === 409);

  // ── 13. Approve + release the current version ──────────────────────
  const approveV2 = await call(attorney, "POST", `/api/document-versions/${draftV2}/approve`, {
    approvalType: "FOR_CLIENT",
    destination: "CLIENT_PORTAL",
  });
  ok("13a. attorney approves v2", approveV2.status === 200);
  const wrongDest = await call(attorney, "POST", `/api/document-versions/${draftV2}/release`, {
    destination: "FILING",
  });
  ok("N10. release to an unauthorized destination is refused", wrongDest.status === 409);
  const release = await call(attorney, "POST", `/api/document-versions/${draftV2}/release`, {
    destination: "CLIENT_PORTAL",
  });
  ok("13b. attorney releases the exact approved version", release.status === 200);

  // ── 14. Client sees + downloads the released document ──────────────
  const clientDocs2 = await call(client, "GET", `/api/matters/${matterId}/documents`);
  const releasedRow = clientDocs2.data.released?.find((r) => r.versionId === draftV2);
  ok("14a. released document appears for the client", Boolean(releasedRow));
  const download = await call(client, "GET", `/api/document-versions/${draftV2}/download`);
  ok(
    "14b. client downloads the released content",
    download.status === 200 && String(download.data._raw).includes("v2 — revised synthetic")
  );

  // ── 15. Audit trail ────────────────────────────────────────────────
  const audit = await call(attorney, "GET", `/api/matters/${matterId}/audit`);
  const events = (audit.data.events ?? []).map((e) => e.event);
  for (const expected of [
    "INVITATION_CREATED",
    "INVITATION_ACCEPTED",
    "CONSENT_RECORDED",
    "CONFLICT_SCREEN_RUN",
    "CONFLICT_DISPOSITION",
    "DOCUMENT_UPLOADED",
    "DOCUMENT_APPROVED",
    "DOCUMENT_RELEASED",
  ]) {
    ok(`15. audit contains ${expected}`, events.includes(expected));
  }
  const adminAudit = await call(admin, "GET", "/api/admin/audit?limit=50");
  ok("15b. admin audit review works + chain intact", adminAudit.status === 200 && adminAudit.data.chainIntact === true);

  // ── Cross-matter isolation ─────────────────────────────────────────
  const foreign = await call(intruder, "GET", `/api/matters/${matterId}`);
  ok("N11. another client cannot access the matter (404)", foreign.status === 404);
  const foreignDocs = await call(intruder, "GET", `/api/matters/${matterId}/documents`);
  ok("N11b. …or its documents (404)", foreignDocs.status === 404);

  // ── AI-disabled mode ───────────────────────────────────────────────
  const ai = await call(attorney, "POST", `/api/matters/${matterId}/ai`, {
    feature: "INTERNAL_SUMMARY",
  });
  const aiClient = await call(client, "POST", `/api/matters/${matterId}/ai`, {
    feature: "INTERNAL_SUMMARY",
  });
  ok("N12a. client role cannot invoke AI", aiClient.status === 403);
  if (ai.status === 503) {
    ok("N12b. AI disabled ⇒ 503 and portal unaffected", true);
  } else {
    ok("N12b. AI enabled path returns an artifact", ai.status === 201);
  }
  const portalStill = await call(client, "GET", `/api/matters/${matterId}`);
  ok("N12c. ordinary portal still works", portalStill.status === 200);

  // ── Page smoke ─────────────────────────────────────────────────────
  console.log("\nPage smoke (HTTP 200 render)");
  for (const path of [
    "/",
    "/portal",
    "/invite",
    "/portal/matter",
    "/intake",
    "/firm",
    "/firm/conflicts",
    `/firm/matters/${matterId}`,
    "/admin",
    "/attorney",
  ]) {
    const res = await fetch(`${BASE}${path}`, { headers: { "x-forwarded-for": "10.90.0.9" } });
    ok(`page ${path}`, res.status === 200, `HTTP ${res.status}`);
  }

  console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log("Failures:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(`\nFATAL: ${e.message}`);
  process.exitCode = 1;
});
