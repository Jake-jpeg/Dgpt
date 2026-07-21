/**
 * Batch 6 acceptance: file storage + attorney-supervised document lifecycle.
 *  - approval is version-specific and hash-bound; revisions lose approval
 *  - release requires a live matching approval + content hash
 *  - STAFF/ADMIN can neither approve nor release (API + structural layers)
 *  - clients never see or fetch unreleased work product
 *  - storage refuses traversal keys and local storage refuses production
 */
import { describe, it, expect, beforeEach } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import {
  cookieFor,
  SYNTH_CLIENT,
  SYNTH_ATTORNEY,
  setupClientWithMatter,
  clearMatter,
  provisionAccount,
  jsonRequest,
  params,
  freshLimits,
  type MatterContext,
} from "./helpers";
import type { SessionUser } from "@/lib/auth/session";
import { setUserRole } from "@/lib/db/users";
import {
  addDocumentVersion,
  approveVersion,
  createDocument,
  getVersion,
  listApprovalsForVersion,
  releaseVersion,
} from "@/lib/db/documents";
import { getFileStorage, resetFileStorageForTests, LocalFileStorage } from "@/lib/storage";
import { GET as docsGet, POST as docsPost } from "@/app/api/matters/[id]/documents/route";
import { POST as approvePost } from "@/app/api/document-versions/[id]/approve/route";
import { POST as releasePost } from "@/app/api/document-versions/[id]/release/route";
import { GET as downloadGet } from "@/app/api/document-versions/[id]/download/route";

let ctx: MatterContext;
let clientCookie: string;
let attorneyCookie: string;

const STAFF_USER: SessionUser = {
  subject: "devstub|staff:docstaff@example.test",
  role: "STAFF",
  email: "docstaff@example.test",
  name: "Doc Staff",
};
const ADMIN_USER: SessionUser = {
  subject: "devstub|admin:docadmin@example.test",
  role: "ADMIN",
  email: "docadmin@example.test",
  name: "Doc Admin",
};

function bytesOf(s: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(s) as Uint8Array<ArrayBuffer>;
}

async function storedVersion(content: string, opts: { docKind?: "GENERAL" | "AI_DRAFT" } = {}) {
  const stored = await getFileStorage().put(bytesOf(content));
  const attorney = (await provisionAccount(SYNTH_ATTORNEY));
  const doc = (await createDocument({
      matterId: ctx.matterId,
      title: "Synthetic Draft",
      docKind: opts.docKind ?? "GENERAL",
      createdBy: attorney.id,
    }));
  const version = (await addDocumentVersion({
      documentId: doc.id,
      storageKey: stored.storageKey,
      sha256: stored.sha256,
      mime: "text/plain",
      sizeBytes: stored.sizeBytes,
      source: "INTERNAL",
      createdBy: attorney.id,
      initialStatus: "ATTORNEY_REVIEW_REQUIRED",
    }));
  return { doc, version, attorney, stored };
}

beforeEach(async () => {
  resetDbForTests();
  resetFileStorageForTests();
  freshLimits();
  ctx = await setupClientWithMatter();
  clientCookie = await cookieFor(SYNTH_CLIENT);
  attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
});

describe("uploads", () => {
  it("client upload works once past conflicts; blocked on a NOT_STARTED matter", async () => {
    // Open-signup matters carry EXTERNAL from birth; rewind this one to the
    // legacy NOT_STARTED posture to pin the guard.
    const { getDb } = await import("@/lib/db/index");
    await getDb().run(`UPDATE matter SET conflict_status = 'NOT_STARTED' WHERE id = ?`, ctx.matterId);
    const mkReq = () => {
      const form = new FormData();
      form.set("file", new File([bytesOf("synthetic pdf bytes")], "cert.pdf", { type: "application/pdf" }));
      return new Request(`http://localhost:3000/api/matters/${ctx.matterId}/documents`, {
        method: "POST",
        headers: { "x-dgpt-csrf": "1", cookie: clientCookie },
        body: form,
      });
    };
    const before = await docsPost(mkReq(), params({ id: ctx.matterId }));
    expect(before.status).toBe(409); // not yet CLEARED

    await clearMatter(ctx.matterId);
    freshLimits();
    const after = await docsPost(mkReq(), params({ id: ctx.matterId }));
    expect(after.status).toBe(201);
    const body = await after.json();
    expect(body.version.status).toBe("DRAFT"); // uploads begin unapproved
  });

  it("disallowed MIME types and oversized files are rejected", async () => {
    await clearMatter(ctx.matterId);
    const exe = new FormData();
    exe.set("file", new File([bytesOf("MZ...")], "evil.exe", { type: "application/x-msdownload" }));
    const res = await docsPost(
      new Request(`http://localhost:3000/api/matters/${ctx.matterId}/documents`, {
        method: "POST",
        headers: { "x-dgpt-csrf": "1", cookie: clientCookie },
        body: exe,
      }),
      params({ id: ctx.matterId })
    );
    expect(res.status).toBe(415);

    process.env.MAX_UPLOAD_MB = "0.000001" as string; // below any real file
    // Non-finite/absurd values fall back to 15MB — use a 16MB+ buffer? Too
    // slow; instead set 1MB-equivalent via integer and a >1MB payload.
    process.env.MAX_UPLOAD_MB = "1";
    const big = new FormData();
    big.set(
      "file",
      new File([new ArrayBuffer(1024 * 1024 + 10)], "big.pdf", { type: "application/pdf" })
    );
    freshLimits();
    const bigRes = await docsPost(
      new Request(`http://localhost:3000/api/matters/${ctx.matterId}/documents`, {
        method: "POST",
        headers: { "x-dgpt-csrf": "1", cookie: clientCookie },
        body: big,
      }),
      params({ id: ctx.matterId })
    );
    expect(bigRes.status).toBe(413);
    delete process.env.MAX_UPLOAD_MB;
  });
});

describe("approval is version-exact and hash-bound", () => {
  it("attorney approves an exact version; approval records id + sha256 + type + destination", async () => {
    const { version, attorney } = await storedVersion("v1 content");
    const approval = (await approveVersion({
          versionId: version.id,
          actingUserId: attorney.id,
          approvalType: "FOR_CLIENT",
          destination: "CLIENT_PORTAL",
        }));
    expect(approval.documentVersionId).toBe(version.id);
    expect(approval.sha256).toBe(version.sha256);
    expect((await getVersion(version.id))!.status).toBe("APPROVED_FOR_CLIENT");
  });

  it("a revised version begins unapproved and the old approval does not transfer", async () => {
    const { doc, version, attorney } = await storedVersion("v1 content");
    (await approveVersion({
            versionId: version.id,
            actingUserId: attorney.id,
            approvalType: "FOR_CLIENT",
            destination: "CLIENT_PORTAL",
          }));
    const stored2 = await getFileStorage().put(bytesOf("v2 content — changed"));
    const v2 = (await addDocumentVersion({
          documentId: doc.id,
          storageKey: stored2.storageKey,
          sha256: stored2.sha256,
          mime: "text/plain",
          sizeBytes: stored2.sizeBytes,
          source: "INTERNAL",
          createdBy: attorney.id,
          initialStatus: "ATTORNEY_REVIEW_REQUIRED",
        }));
    expect(v2.status).toBe("ATTORNEY_REVIEW_REQUIRED");
    expect((await listApprovalsForVersion(v2.id))).toEqual([]);
    // v1 got superseded — its approval can no longer release anything.
    expect((await getVersion(version.id))!.status).toBe("SUPERSEDED");
    await expect(
      releaseVersion({
        versionId: version.id,
        actingUserId: attorney.id,
        destination: "CLIENT_PORTAL",
        contentSha256: version.sha256,
        })
    ).rejects.toThrow(/DOCUMENT_GUARD/);
    // And v2 cannot ride on v1's approval.
    await expect(
      releaseVersion({
        versionId: v2.id,
        actingUserId: attorney.id,
        destination: "CLIENT_PORTAL",
        contentSha256: stored2.sha256,
        })
    ).rejects.toThrow(/DOCUMENT_GUARD/);
  });

  it("STAFF and ADMIN cannot approve or release — structurally", async () => {
    const { version } = await storedVersion("v1 content");
    const staff = (await provisionAccount(STAFF_USER));
    (await setUserRole(staff.id, "STAFF"));
    const admin = (await provisionAccount(ADMIN_USER));
    (await setUserRole(admin.id, "ADMIN"));
    for (const actor of [staff, admin]) {
      await expect(
      approveVersion({
        versionId: version.id,
        actingUserId: actor.id,
        approvalType: "FOR_CLIENT",
        destination: "CLIENT_PORTAL",
        })
    ).rejects.toThrow(/DOCUMENT_GUARD/);
      await expect(
      releaseVersion({
        versionId: version.id,
        actingUserId: actor.id,
        destination: "CLIENT_PORTAL",
        contentSha256: version.sha256,
        })
    ).rejects.toThrow(/DOCUMENT_GUARD/);
    }
  });

  it("STAFF and ADMIN are refused at the API layer too", async () => {
    const { version } = await storedVersion("v1 content");
    for (const user of [STAFF_USER, ADMIN_USER]) {
      const account = (await provisionAccount(user));
      (await setUserRole(account.id, user.role));
      freshLimits();
      const res = await approvePost(
        jsonRequest(`/api/document-versions/${version.id}/approve`, {
          cookie: await cookieFor(user),
          body: { approvalType: "FOR_CLIENT", destination: "CLIENT_PORTAL" },
        }),
        params({ id: version.id })
      );
      expect(res.status).toBe(403);
    }
  });

  it("release verifies hash against the ACTUAL stored bytes", async () => {
    const { version, attorney, stored } = await storedVersion("v1 content");
    (await approveVersion({
            versionId: version.id,
            actingUserId: attorney.id,
            approvalType: "FOR_CLIENT",
            destination: "CLIENT_PORTAL",
          }));
    // Tamper with the stored file AFTER approval.
    const storage = getFileStorage() as LocalFileStorage;
    await storage.delete(stored.storageKey);
    const fs = await import("node:fs");
    const path = await import("node:path");
    fs.writeFileSync(
      path.resolve(process.env.FILE_STORAGE_DIR!, stored.storageKey),
      "tampered content"
    );
    freshLimits();
    const res = await releasePost(
      jsonRequest(`/api/document-versions/${version.id}/release`, {
        cookie: attorneyCookie,
        body: { destination: "CLIENT_PORTAL" },
      }),
      params({ id: version.id })
    );
    expect(res.status).toBe(409); // DOCUMENT_GUARD: hash mismatch
  });

  it("release to a destination the approval did not authorize is refused", async () => {
    const { version, attorney } = await storedVersion("v1 content");
    (await approveVersion({
            versionId: version.id,
            actingUserId: attorney.id,
            approvalType: "FOR_CLIENT",
            destination: "CLIENT_PORTAL",
          }));
    await expect(
      releaseVersion({
        versionId: version.id,
        actingUserId: attorney.id,
        destination: "FILING",
        contentSha256: version.sha256,
        })
    ).rejects.toThrow(/DOCUMENT_GUARD/);
  });
});

describe("client visibility", () => {
  it("client sees only released documents; drafts and AI documents are invisible and unfetchable", async () => {
    await clearMatter(ctx.matterId);
    const { version, attorney } = await storedVersion("draft not for client");
    const ai = await storedVersion("ai internal summary", { docKind: "AI_DRAFT" });

    // Unreleased: list shows nothing, download 404s.
    freshLimits();
    let res = await docsGet(
      jsonRequest(`/api/matters/${ctx.matterId}/documents`, { method: "GET", cookie: clientCookie }),
      params({ id: ctx.matterId })
    );
    let body = await res.json();
    expect(body.released).toEqual([]);
    expect(JSON.stringify(body)).not.toContain("Synthetic Draft");

    freshLimits();
    const dl = await downloadGet(
      jsonRequest(`/api/document-versions/${version.id}/download`, { method: "GET", cookie: clientCookie }),
      params({ id: version.id })
    );
    expect(dl.status).toBe(404);
    freshLimits();
    const dlAi = await downloadGet(
      jsonRequest(`/api/document-versions/${ai.version.id}/download`, { method: "GET", cookie: clientCookie }),
      params({ id: ai.version.id })
    );
    expect(dlAi.status).toBe(404);

    // Approve + release the first one → becomes visible and downloadable.
    (await approveVersion({
            versionId: version.id,
            actingUserId: attorney.id,
            approvalType: "FOR_CLIENT",
            destination: "CLIENT_PORTAL",
          }));
    (await releaseVersion({
            versionId: version.id,
            actingUserId: attorney.id,
            destination: "CLIENT_PORTAL",
            contentSha256: version.sha256,
          }));
    freshLimits();
    res = await docsGet(
      jsonRequest(`/api/matters/${ctx.matterId}/documents`, { method: "GET", cookie: clientCookie }),
      params({ id: ctx.matterId })
    );
    body = await res.json();
    expect(body.released.length).toBe(1);
    expect(body.released[0].versionId).toBe(version.id);
    freshLimits();
    const dl2 = await downloadGet(
      jsonRequest(`/api/document-versions/${version.id}/download`, { method: "GET", cookie: clientCookie }),
      params({ id: version.id })
    );
    expect(dl2.status).toBe(200);
    expect(await dl2.text()).toBe("draft not for client");
  });

  it("another client cannot reach the matter's documents at all", async () => {
    const other: SessionUser = {
      subject: "devstub|client:othermatter@example.test",
      role: "CLIENT",
      email: "othermatter@example.test",
      name: "Other",
    };
    (await provisionAccount(other));
    freshLimits();
    const res = await docsGet(
      jsonRequest(`/api/matters/${ctx.matterId}/documents`, { method: "GET", cookie: await cookieFor(other) }),
      params({ id: ctx.matterId })
    );
    expect(res.status).toBe(404);
  });
});

describe("storage hardening", () => {
  it("path traversal keys are rejected", async () => {
    const storage = getFileStorage();
    await expect(storage.get("../../etc/passwd")).rejects.toThrow(/STORAGE_GUARD/);
    await expect(storage.get("..%2f..%2fsecret")).rejects.toThrow(/STORAGE_GUARD/);
  });

  it("local storage refuses production without the explicit test override", async () => {
    const { resetFileStorageForTests: reset, getFileStorage: get } = await import("@/lib/storage");
    reset();
    const orig = process.env.NODE_ENV;
    // @ts-expect-error NODE_ENV is writable in tests
    process.env.NODE_ENV = "production";
    try {
      expect(() => get()).toThrow(/not configured/i);
      process.env.FILE_STORAGE_ALLOW_LOCAL_TEST = "true";
      expect(() => get()).not.toThrow();
    } finally {
      // @ts-expect-error restore
      process.env.NODE_ENV = orig;
      delete process.env.FILE_STORAGE_ALLOW_LOCAL_TEST;
      reset();
    }
  });
});
