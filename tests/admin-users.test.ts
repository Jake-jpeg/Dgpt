/**
 * Admin user management: CLIENT creation is closed, and deletion now CASCADES.
 *
 * Client accounts are born ONLY through invitation acceptance, so the admin
 * create endpoint must refuse role CLIENT. Deletion removes the account AND
 * every piece of case data it OWNS (matters where it is the client, its intake
 * sessions, documents, conflict submissions, disclosure acks), while retaining
 * the tamper-evident audit trail. Two guards apply: no self-deletion, and the
 * last active admin/attorney cannot be removed. A firm user's created_by label
 * is non-FK, so deleting a firm user never destroys other clients' matters.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { resetDbForTests, getDb } from "@/lib/db/index";
import {
  cookieFor,
  provisionAccount,
  setupClientWithMatter,
  jsonRequest,
  params,
  freshLimits,
} from "./helpers";
import { createUser, getUserById } from "@/lib/db/users";
import { POST as createUserRoute, GET as listUsersRoute } from "@/app/api/admin/users/route";
import { DELETE as deleteUserRoute } from "@/app/api/admin/users/[id]/route";
import type { SessionUser } from "@/lib/auth/session";

const SYNTH_ADMIN: SessionUser = {
  subject: "devstub|admin:admin@example.test",
  role: "ADMIN",
  email: "admin@example.test",
  name: "Synthetic Admin",
};

let adminCookie: string;
let adminId: string;

beforeEach(async () => {
  resetDbForTests();
  freshLimits();
  const admin = await provisionAccount(SYNTH_ADMIN);
  adminId = admin.id;
  adminCookie = await cookieFor(SYNTH_ADMIN);
});

async function del(id: string, cookie = adminCookie) {
  freshLimits();
  return deleteUserRoute(
    jsonRequest(`/api/admin/users/${id}`, { method: "DELETE", cookie }),
    params({ id })
  );
}

const count = async (sql: string, arg: string) =>
  (await getDb().get<{ c: number }>(sql, arg))?.c ?? 0;

describe("admin create-user: CLIENT is closed", () => {
  it("rejects role CLIENT with a clear message, creates nothing", async () => {
    const res = await createUserRoute(
      jsonRequest("/api/admin/users", {
        cookie: adminCookie,
        body: { email: "wouldbe-client@example.test", role: "CLIENT" },
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(String(data.error)).toMatch(/invitation only/i);
  });

  it("still allows STAFF / ATTORNEY / ADMIN", async () => {
    for (const role of ["STAFF", "ATTORNEY", "ADMIN"]) {
      freshLimits();
      const res = await createUserRoute(
        jsonRequest("/api/admin/users", {
          cookie: adminCookie,
          body: { email: `new-${role.toLowerCase()}@example.test`, role },
        })
      );
      expect(res.status).toBe(201);
    }
  });
});

describe("admin delete-user: cascade", () => {
  it("hard-deletes a reference-free row and audits the deletion (metadata only)", async () => {
    const victim = await createUser({ email: "clean@example.test", role: "STAFF" });
    const res = await del(victim.id);
    expect(res.status).toBe(200);
    expect(await getUserById(victim.id)).toBeNull();

    const audit = await getDb().all<{ event: string; detail: string | null }>(
      `SELECT event, detail FROM audit_event WHERE event = 'USER_DELETED'`
    );
    expect(audit).toHaveLength(1);
    // Metadata only: email + role, never a subject/token.
    expect(audit[0].detail).toContain("clean@example.test");
    expect(audit[0].detail).toContain("STAFF");
  });

  it("deleting a CLIENT cascades its matter and all case data", async () => {
    const ctx = await setupClientWithMatter();
    // Precondition: the matter + its child rows exist.
    expect(await count(`SELECT COUNT(*) AS c FROM matter WHERE id = ?`, ctx.matterId)).toBe(1);
    expect(
      await count(`SELECT COUNT(*) AS c FROM disclosure_ack WHERE matter_ref = ?`, ctx.matterId)
    ).toBeGreaterThan(0);

    const res = await del(ctx.clientUserId);
    expect(res.status).toBe(200);

    // The client account and everything the matter owned are gone.
    expect(await getUserById(ctx.clientUserId)).toBeNull();
    expect(await count(`SELECT COUNT(*) AS c FROM matter WHERE id = ?`, ctx.matterId)).toBe(0);
    expect(
      await count(`SELECT COUNT(*) AS c FROM disclosure_ack WHERE matter_ref = ?`, ctx.matterId)
    ).toBe(0);
    expect(
      await count(`SELECT COUNT(*) AS c FROM matter_access WHERE matter_id = ?`, ctx.matterId)
    ).toBe(0);
    // The audit trail survives (tamper-evident ledger is never cascaded).
    expect(
      await count(`SELECT COUNT(*) AS c FROM audit_event WHERE event = ?`, "USER_DELETED")
    ).toBe(1);
  });

  it("deleting a firm user leaves other clients' matters intact", async () => {
    const ctx = await setupClientWithMatter();
    // A second attorney so the last-attorney guard permits removing the first.
    await createUser({ email: "attorney2@example.test", role: "ATTORNEY" });

    const res = await del(ctx.attorneyUserId);
    expect(res.status).toBe(200);
    expect(await getUserById(ctx.attorneyUserId)).toBeNull();
    // The client's matter (created_by = deleted attorney, a non-FK label) is
    // untouched; only the attorney's access grant is cleared.
    expect(await count(`SELECT COUNT(*) AS c FROM matter WHERE id = ?`, ctx.matterId)).toBe(1);
    expect(
      await count(`SELECT COUNT(*) AS c FROM matter_access WHERE user_id = ?`, ctx.attorneyUserId)
    ).toBe(0);
  });
});

describe("admin delete-user: guards", () => {
  it("refuses self-deletion", async () => {
    const res = await del(adminId);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(String(data.error)).toMatch(/your own account/i);
    expect(await getUserById(adminId)).not.toBeNull();
  });

  it("refuses to delete the last active attorney", async () => {
    const only = await createUser({ email: "solo-attorney@example.test", role: "ATTORNEY" });
    const res = await del(only.id);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(String(data.error)).toMatch(/last active ATTORNEY/i);
    expect(await getUserById(only.id)).not.toBeNull();
  });

  it("allows deleting an attorney when another active attorney remains", async () => {
    const a1 = await createUser({ email: "a1@example.test", role: "ATTORNEY" });
    await createUser({ email: "a2@example.test", role: "ATTORNEY" });
    const res = await del(a1.id);
    expect(res.status).toBe(200);
    expect(await getUserById(a1.id)).toBeNull();
  });

  it("a non-admin cannot delete", async () => {
    const victim = await createUser({ email: "clean3@example.test", role: "STAFF" });
    const attorneySession: SessionUser = {
      subject: "devstub|attorney:attorney@example.test",
      role: "ATTORNEY",
      email: "attorney@example.test",
      name: "A",
    };
    await provisionAccount(attorneySession);
    const attorneyCookie = await cookieFor(attorneySession);
    const res = await del(victim.id, attorneyCookie);
    expect(res.status).toBe(403);
    expect(await getUserById(victim.id)).not.toBeNull();
  });
});

describe("admin users list: caseData hint", () => {
  it("reports 0 for clean rows and a positive count for referenced accounts", async () => {
    const clean = await createUser({ email: "clean2@example.test", role: "STAFF" });
    const ctx = await setupClientWithMatter();
    freshLimits();
    const res = await listUsersRoute(
      jsonRequest("/api/admin/users", { method: "GET", cookie: adminCookie })
    );
    const { users } = (await res.json()) as {
      users: { id: string; caseData: number }[];
    };
    const byId = new Map(users.map((u) => [u.id, u.caseData]));
    expect(byId.get(clean.id)).toBe(0);
    // The attorney is created_by on the matter; the client is client_user_id.
    expect(byId.get(ctx.attorneyUserId)).toBeGreaterThan(0);
    expect(byId.get(ctx.clientUserId)).toBeGreaterThan(0);
  });
});
