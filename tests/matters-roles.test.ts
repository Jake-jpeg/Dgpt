/**
 * Batch 1 acceptance: matter-centered model, DB-stored 4-role RBAC,
 * matter-level authorization, structural attorney-only conflict
 * dispositions. Synthetic identities only.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import {
  createUser,
  getUserByEmail,
  resolveAccount,
  setUserRole,
  type UserRow,
} from "@/lib/db/users";
import {
  attorneySetConflictDisposition,
  canAccessMatter,
  createMatter,
  bindClientToMatter,
  getMatter,
  grantMatterAccess,
  recordScreenStatus,
  SCREEN_STATUSES,
  type ScreenStatus,
} from "@/lib/db/matters";
import { verifyAuditChain, recordAudit } from "@/lib/db/repo";
import { cookieFor, freshLimits, jsonRequest, params } from "./helpers";
import type { SessionUser } from "@/lib/auth/session";
import { GET as mattersGet, POST as mattersPost } from "@/app/api/matters/route";
import { GET as matterGet } from "@/app/api/matters/[id]/route";
import { GET as usersGet, POST as usersPost } from "@/app/api/admin/users/route";
import { PATCH as userPatch } from "@/app/api/admin/users/[id]/route";

function synth(role: UserRow["role"], email: string): { user: UserRow; session: SessionUser } {
  createUser({ email, role });
  const session: SessionUser = {
    subject: `devstub|${role.toLowerCase()}:${email}`,
    role,
    email,
    name: `Synthetic ${role}`,
  };
  // bind subject as a login would
  resolveAccount({
    subject: session.subject,
    email,
    name: session.name,
    sessionRole: role,
    adminBootstrapEmails: [],
  });
  return { user: getUserByEmail(email)!, session };
}

beforeEach(() => {
  resetDbForTests();
  freshLimits();
});

describe("DB-stored roles", () => {
  it("supports exactly CLIENT, STAFF, ATTORNEY, ADMIN", () => {
    for (const role of ["CLIENT", "STAFF", "ATTORNEY", "ADMIN"] as const) {
      const u = createUser({ email: `${role.toLowerCase()}@example.test`, role });
      expect(u.role).toBe(role);
    }
    expect(() =>
      createUser({ email: "x@example.test", role: "SUPERUSER" as never })
    ).toThrow();
  });

  it("the DATABASE role wins over the session-cookie role on protected actions", async () => {
    const { user, session } = synth("STAFF", "staffer@example.test");
    // Demote in the DB; the (still valid) cookie claims STAFF.
    setUserRole(user.id, "CLIENT");
    const cookie = await cookieFor(session);
    const res = await mattersPost(
      jsonRequest("/api/matters", { cookie, body: { label: "M-1" } })
    );
    expect(res.status).toBe(403); // create requires STAFF/ATTORNEY per the DB
  });

  it("STAFF and ADMIN roles are never self-provisioned from a session token", async () => {
    const cookie = await cookieFor({
      subject: "devstub|mallory:mallory@example.test",
      role: "ADMIN",
      email: "mallory@example.test",
      name: "Mallory",
    });
    const res = await usersGet(jsonRequest("/api/admin/users", { cookie, method: "GET" }));
    expect(res.status).toBe(403);
    // The lazily provisioned row is a CLIENT, not an ADMIN.
    expect(getUserByEmail("mallory@example.test")!.role).toBe("CLIENT");
  });

  it("ADMIN_EMAILS is bootstrap-only: listed email provisions ADMIN at first login", async () => {
    process.env.ADMIN_EMAILS = "bootstrap-admin@example.test";
    try {
      const cookie = await cookieFor({
        subject: "devstub|admin:bootstrap-admin@example.test",
        role: "CLIENT",
        email: "bootstrap-admin@example.test",
        name: "Bootstrap",
      });
      const res = await usersGet(jsonRequest("/api/admin/users", { cookie, method: "GET" }));
      expect(res.status).toBe(200);
    } finally {
      delete process.env.ADMIN_EMAILS;
    }
  });
});

describe("matter-level authorization", () => {
  it("a client may access only that client's own matter", async () => {
    const staff = synth("STAFF", "staff@example.test");
    const clientA = synth("CLIENT", "client-a@example.test");
    const clientB = synth("CLIENT", "client-b@example.test");
    const mA = createMatter({ label: "Matter A", createdBy: staff.user.id });
    const mB = createMatter({ label: "Matter B", createdBy: staff.user.id });
    bindClientToMatter(mA.id, clientA.user.id);
    bindClientToMatter(mB.id, clientB.user.id);

    const cookieA = await cookieFor(clientA.session);
    const own = await matterGet(
      jsonRequest(`/api/matters/${mA.id}`, { cookie: cookieA, method: "GET" }),
      params({ id: mA.id })
    );
    expect(own.status).toBe(200);

    const foreign = await matterGet(
      jsonRequest(`/api/matters/${mB.id}`, { cookie: cookieA, method: "GET" }),
      params({ id: mB.id })
    );
    expect(foreign.status).toBe(404); // never confirms existence

    const list = await mattersGet(jsonRequest("/api/matters", { cookie: cookieA, method: "GET" }));
    const body = await list.json();
    expect(body.matters.map((m: { id: string }) => m.id)).toEqual([mA.id]);
  });

  it("STAFF/ATTORNEY access requires an explicit matter grant", () => {
    const staff = synth("STAFF", "staff@example.test");
    const otherStaff = synth("STAFF", "staff2@example.test");
    const m = createMatter({ label: "Matter G", createdBy: staff.user.id });
    grantMatterAccess(m.id, staff.user.id, staff.user.id);
    expect(canAccessMatter(staff.user, getMatter(m.id)!)).toBe(true);
    expect(canAccessMatter(otherStaff.user, getMatter(m.id)!)).toBe(false);
  });

  it("clients never see internal fields from the matter view", async () => {
    const staff = synth("STAFF", "staff@example.test");
    const client = synth("CLIENT", "client@example.test");
    const m = createMatter({ label: "Internal Label — do not show", createdBy: staff.user.id });
    bindClientToMatter(m.id, client.user.id);
    const res = await matterGet(
      jsonRequest(`/api/matters/${m.id}`, { cookie: await cookieFor(client.session), method: "GET" }),
      params({ id: m.id })
    );
    const body = await res.json();
    const raw = JSON.stringify(body);
    expect(raw).not.toContain("Internal Label");
    expect(raw).not.toContain("conflictStatus");
    expect(body.matter.status).toBeTypeOf("string");
  });
});

describe("structural attorney-only conflict dispositions", () => {
  it("automated screening can produce only the four screen statuses", () => {
    const staff = synth("STAFF", "staff@example.test");
    const m = createMatter({ label: "M", createdBy: staff.user.id });
    for (const s of SCREEN_STATUSES) {
      recordScreenStatus(m.id, s);
      expect(getMatter(m.id)!.conflictStatus).toBe(s);
    }
    expect(() => recordScreenStatus(m.id, "CLEARED" as ScreenStatus)).toThrow(/CONFLICT_GUARD/);
    expect(() => recordScreenStatus(m.id, "DECLINED" as ScreenStatus)).toThrow(/CONFLICT_GUARD/);
  });

  it("STAFF and ADMIN cannot clear or decline; ATTORNEY can", () => {
    const staff = synth("STAFF", "staff@example.test");
    const admin = synth("ADMIN", "admin@example.test");
    const attorney = synth("ATTORNEY", "attorney@example.test");
    const m = createMatter({ label: "M", createdBy: staff.user.id });

    for (const actor of [staff.user, admin.user]) {
      expect(() =>
        attorneySetConflictDisposition({
          matterId: m.id,
          actingUserId: actor.id,
          disposition: "CLEARED",
        })
      ).toThrow(/CONFLICT_GUARD/);
    }

    const cleared = attorneySetConflictDisposition({
      matterId: m.id,
      actingUserId: attorney.user.id,
      disposition: "CLEARED",
    });
    expect(cleared.conflictStatus).toBe("CLEARED");
    expect(cleared.conflictStatusSetBy).toBe(attorney.user.id);
  });

  it("the guard re-reads the CURRENT role: a demoted attorney loses the power", () => {
    const attorney = synth("ATTORNEY", "attorney@example.test");
    const m = createMatter({ label: "M", createdBy: attorney.user.id });
    setUserRole(attorney.user.id, "STAFF");
    expect(() =>
      attorneySetConflictDisposition({
        matterId: m.id,
        actingUserId: attorney.user.id,
        disposition: "DECLINED",
      })
    ).toThrow(/CONFLICT_GUARD/);
  });
});

describe("admin user management API", () => {
  it("admin can create users and change roles; changes are audited on the chain", async () => {
    const admin = synth("ADMIN", "admin@example.test");
    const cookie = await cookieFor(admin.session);

    const create = await usersPost(
      jsonRequest("/api/admin/users", {
        cookie,
        body: { email: "newstaff@example.test", role: "STAFF" },
      })
    );
    expect(create.status).toBe(201);
    const created = (await create.json()).user;

    const patch = await userPatch(
      jsonRequest(`/api/admin/users/${created.id}`, {
        cookie,
        method: "PATCH",
        body: { role: "CLIENT", active: false },
      }),
      params({ id: created.id })
    );
    expect(patch.status).toBe(200);
    const updated = getUserByEmail("newstaff@example.test")!;
    expect(updated.role).toBe("CLIENT");
    expect(updated.active).toBe(false);
    expect(verifyAuditChain()).toBeNull();
  });

  it("non-admins get 403 from user management", async () => {
    for (const role of ["CLIENT", "STAFF", "ATTORNEY"] as const) {
      const u = synth(role, `${role.toLowerCase()}-um@example.test`);
      const res = await usersGet(
        jsonRequest("/api/admin/users", { cookie: await cookieFor(u.session), method: "GET" })
      );
      expect(res.status).toBe(403);
    }
  });
});

describe("audit chain tamper evidence", () => {
  it("verifyAuditChain detects a mutated historical row", async () => {
    recordAudit("ref-1", "EVENT_A");
    recordAudit("ref-1", "EVENT_B", "detail");
    recordAudit("ref-2", "EVENT_C");
    expect(verifyAuditChain()).toBeNull();
    const { getDb } = await import("@/lib/db/index");
    getDb().prepare(`UPDATE audit_event SET detail = 'tampered' WHERE event = 'EVENT_B'`).run();
    expect(verifyAuditChain()).not.toBeNull();
  });
});
