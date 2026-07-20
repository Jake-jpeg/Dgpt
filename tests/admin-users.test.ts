/**
 * Admin user management: CLIENT creation is closed, and hard-deletion is
 * guarded by a zero-reference rule.
 *
 * Client accounts are born ONLY through invitation acceptance, so the admin
 * create endpoint must refuse role CLIENT. Deletion must never orphan case
 * history: a referenced account is deactivated, never removed.
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

beforeEach(async () => {
  resetDbForTests();
  freshLimits();
  provisionAccount(SYNTH_ADMIN);
  adminCookie = await cookieFor(SYNTH_ADMIN);
});

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

describe("admin delete-user: guarded by zero references", () => {
  it("hard-deletes a reference-free row and audits the deletion (metadata only)", async () => {
    const victim = createUser({ email: "clean@example.test", role: "STAFF" });
    freshLimits();
    const res = await deleteUserRoute(
      jsonRequest(`/api/admin/users/${victim.id}`, { method: "DELETE", cookie: adminCookie }),
      params({ id: victim.id })
    );
    expect(res.status).toBe(200);
    expect(getUserById(victim.id)).toBeNull();

    const audit = getDb()
      .prepare(`SELECT event, detail FROM audit_event WHERE event = 'USER_DELETED'`)
      .all() as { event: string; detail: string | null }[];
    expect(audit).toHaveLength(1);
    // Metadata only: email + role, never a subject/token.
    expect(audit[0].detail).toContain("clean@example.test");
    expect(audit[0].detail).toContain("STAFF");
  });

  it("refuses to delete a referenced account with 409 and keeps the row", async () => {
    // The attorney is created_by on the matter → referenced.
    const ctx = await setupClientWithMatter();
    freshLimits();
    const res = await deleteUserRoute(
      jsonRequest(`/api/admin/users/${ctx.attorneyUserId}`, {
        method: "DELETE",
        cookie: adminCookie,
      }),
      params({ id: ctx.attorneyUserId })
    );
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(String(data.error)).toMatch(/case history — deactivate instead/i);
    expect(getUserById(ctx.attorneyUserId)).not.toBeNull();

    // The bound client is referenced too (client_user_id).
    freshLimits();
    const clientRes = await deleteUserRoute(
      jsonRequest(`/api/admin/users/${ctx.clientUserId}`, {
        method: "DELETE",
        cookie: adminCookie,
      }),
      params({ id: ctx.clientUserId })
    );
    expect(clientRes.status).toBe(409);
    expect(getUserById(ctx.clientUserId)).not.toBeNull();
  });

  it("marks referenced rows non-deletable and clean rows deletable in the list", async () => {
    const clean = createUser({ email: "clean2@example.test", role: "STAFF" });
    const ctx = await setupClientWithMatter();
    freshLimits();
    const res = await listUsersRoute(
      jsonRequest("/api/admin/users", { method: "GET", cookie: adminCookie })
    );
    const { users } = (await res.json()) as {
      users: { id: string; deletable: boolean }[];
    };
    const byId = new Map(users.map((u) => [u.id, u.deletable]));
    expect(byId.get(clean.id)).toBe(true);
    expect(byId.get(ctx.attorneyUserId)).toBe(false);
  });

  it("a non-admin cannot delete", async () => {
    const victim = createUser({ email: "clean3@example.test", role: "STAFF" });
    const attorney = provisionAccount({
      subject: "devstub|attorney:attorney@example.test",
      role: "ATTORNEY",
      email: "attorney@example.test",
      name: "A",
    });
    void attorney;
    const attorneyCookie = await cookieFor({
      subject: "devstub|attorney:attorney@example.test",
      role: "ATTORNEY",
      email: "attorney@example.test",
      name: "A",
    });
    freshLimits();
    const res = await deleteUserRoute(
      jsonRequest(`/api/admin/users/${victim.id}`, { method: "DELETE", cookie: attorneyCookie }),
      params({ id: victim.id })
    );
    expect(res.status).toBe(403);
    expect(getUserById(victim.id)).not.toBeNull();
  });
});
