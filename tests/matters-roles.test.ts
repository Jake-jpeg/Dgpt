/**
 * Batch 1 acceptance: matter-centered model, DB-stored 4-role RBAC,
 * matter-level authorization, structural attorney-only conflict
 * dispositions. Synthetic identities only.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import {
  createUser,
  findAccountForSession,
  getUserByEmail,
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

async function synth(role: UserRow["role"], email: string): Promise<{ user: UserRow; session: SessionUser }> {
  (await createUser({ email, role }));
  const session: SessionUser = {
    subject: `devstub|${role.toLowerCase()}:${email}`,
    role,
    email,
    name: `Synthetic ${role}`,
  };
  // bind subject as a login would
  (await findAccountForSession({
        subject: session.subject,
        email,
        name: session.name,
        adminBootstrapEmails: [],
      }));
  return { user: (await getUserByEmail(email))!, session };
}

beforeEach(() => {
  resetDbForTests();
  freshLimits();
});

describe("DB-stored roles", () => {
  it("supports exactly CLIENT, STAFF, ATTORNEY, ADMIN", async () => {
    for (const role of ["CLIENT", "STAFF", "ATTORNEY", "ADMIN"] as const) {
      const u = (await createUser({ email: `${role.toLowerCase()}@example.test`, role }));
      expect(u.role).toBe(role);
    }
    await expect(
      createUser({ email: "x@example.test", role: "SUPERUSER" as never })
    ).rejects.toThrow();
  });

  it("the DATABASE role wins over the session-cookie role on protected actions", async () => {
    const { user, session } = (await synth("STAFF", "staffer@example.test"));
    // Demote in the DB; the (still valid) cookie claims STAFF.
    (await setUserRole(user.id, "CLIENT"));
    const cookie = await cookieFor(session);
    const res = await mattersPost(
      jsonRequest("/api/matters", { cookie, body: { label: "M-1" } })
    );
    expect(res.status).toBe(403); // create requires STAFF/ATTORNEY per the DB
  });

  it("NO account is ever self-provisioned from a session token", async () => {
    const cookie = await cookieFor({
      subject: "devstub|mallory:mallory@example.test",
      role: "ADMIN",
      email: "mallory@example.test",
      name: "Mallory",
    });
    const res = await usersGet(jsonRequest("/api/admin/users", { cookie, method: "GET" }));
    expect(res.status).toBe(403);
    // Pilot hardening: authentication alone creates NOTHING — no row at all.
    expect((await getUserByEmail("mallory@example.test"))).toBeNull();
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
    const staff = (await synth("STAFF", "staff@example.test"));
    const clientA = (await synth("CLIENT", "client-a@example.test"));
    const clientB = (await synth("CLIENT", "client-b@example.test"));
    const mA = (await createMatter({ label: "Matter A", createdBy: staff.user.id }));
    const mB = (await createMatter({ label: "Matter B", createdBy: staff.user.id }));
    (await bindClientToMatter(mA.id, clientA.user.id));
    (await bindClientToMatter(mB.id, clientB.user.id));

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

  it("firm-wide (2026-07-21): any active STAFF/ATTORNEY sees every matter — no grant needed; a deactivated one sees nothing", async () => {
    const staff = (await synth("STAFF", "staff@example.test"));
    const otherStaff = (await synth("STAFF", "staff2@example.test"));
    const attorney = (await synth("ATTORNEY", "atty@example.test"));
    // A matter created by one firm member, with NO grant to the others —
    // as happens when a client self-signs-up (created_by = the client).
    const m = (await createMatter({ label: "Matter G", createdBy: staff.user.id }));
    const row = (await getMatter(m.id))!;
    expect((await canAccessMatter(staff.user, row))).toBe(true);
    expect((await canAccessMatter(otherStaff.user, row))).toBe(true); // firm-wide, ungranted
    expect((await canAccessMatter(attorney.user, row))).toBe(true);
    // Deactivation still revokes all access immediately.
    expect((await canAccessMatter({ ...otherStaff.user, active: false }, row))).toBe(false);
  });

  it("a CLIENT still sees ONLY their own matter, never another client's", async () => {
    const staff = (await synth("STAFF", "staff@example.test"));
    const clientA = (await synth("CLIENT", "clienta@example.test"));
    const clientB = (await synth("CLIENT", "clientb@example.test"));
    const m = (await createMatter({ label: "A's matter", createdBy: staff.user.id }));
    (await bindClientToMatter(m.id, clientA.user.id));
    const row = (await getMatter(m.id))!;
    expect((await canAccessMatter(clientA.user, row))).toBe(true);
    expect((await canAccessMatter(clientB.user, row))).toBe(false);
  });

  it("clients never see internal fields from the matter view", async () => {
    const staff = (await synth("STAFF", "staff@example.test"));
    const client = (await synth("CLIENT", "client@example.test"));
    const m = (await createMatter({ label: "Internal Label — do not show", createdBy: staff.user.id }));
    (await bindClientToMatter(m.id, client.user.id));
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
  it("automated screening can produce only the four screen statuses", async () => {
    const staff = (await synth("STAFF", "staff@example.test"));
    const m = (await createMatter({ label: "M", createdBy: staff.user.id }));
    for (const s of SCREEN_STATUSES) {
      (await recordScreenStatus(m.id, s));
      expect((await getMatter(m.id))!.conflictStatus).toBe(s);
    }
    await expect(
      recordScreenStatus(m.id, "CLEARED" as ScreenStatus)
    ).rejects.toThrow(/CONFLICT_GUARD/);
    await expect(
      recordScreenStatus(m.id, "DECLINED" as ScreenStatus)
    ).rejects.toThrow(/CONFLICT_GUARD/);
  });

  it("STAFF and ADMIN cannot clear or decline; ATTORNEY can", async () => {
    const staff = (await synth("STAFF", "staff@example.test"));
    const admin = (await synth("ADMIN", "admin@example.test"));
    const attorney = (await synth("ATTORNEY", "attorney@example.test"));
    const m = (await createMatter({ label: "M", createdBy: staff.user.id }));

    for (const actor of [staff.user, admin.user]) {
      await expect(
      attorneySetConflictDisposition({
        matterId: m.id,
        actingUserId: actor.id,
        disposition: "CLEARED",
        })
    ).rejects.toThrow(/CONFLICT_GUARD/);
    }

    const cleared = (await attorneySetConflictDisposition({
          matterId: m.id,
          actingUserId: attorney.user.id,
          disposition: "CLEARED",
        }));
    expect(cleared.conflictStatus).toBe("CLEARED");
    expect(cleared.conflictStatusSetBy).toBe(attorney.user.id);
  });

  it("the guard re-reads the CURRENT role: a demoted attorney loses the power", async () => {
    const attorney = (await synth("ATTORNEY", "attorney@example.test"));
    const m = (await createMatter({ label: "M", createdBy: attorney.user.id }));
    (await setUserRole(attorney.user.id, "STAFF"));
    await expect(
      attorneySetConflictDisposition({
        matterId: m.id,
        actingUserId: attorney.user.id,
        disposition: "DECLINED",
        })
    ).rejects.toThrow(/CONFLICT_GUARD/);
  });
});

describe("admin user management API", () => {
  it("admin can create users and change roles; changes are audited on the chain", async () => {
    const admin = (await synth("ADMIN", "admin@example.test"));
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
    const updated = (await getUserByEmail("newstaff@example.test"))!;
    expect(updated.role).toBe("CLIENT");
    expect(updated.active).toBe(false);
    expect((await verifyAuditChain())).toBeNull();
  });

  it("non-admins get 403 from user management", async () => {
    for (const role of ["CLIENT", "STAFF", "ATTORNEY"] as const) {
      const u = (await synth(role, `${role.toLowerCase()}-um@example.test`));
      const res = await usersGet(
        jsonRequest("/api/admin/users", { cookie: await cookieFor(u.session), method: "GET" })
      );
      expect(res.status).toBe(403);
    }
  });
});

describe("audit chain tamper evidence", () => {
  it("verifyAuditChain detects a mutated historical row", async () => {
    (await recordAudit("ref-1", "EVENT_A"));
    (await recordAudit("ref-1", "EVENT_B", "detail"));
    (await recordAudit("ref-2", "EVENT_C"));
    expect((await verifyAuditChain())).toBeNull();
    const { getDb } = await import("@/lib/db/index");
    await getDb().run(`UPDATE audit_event SET detail = 'tampered' WHERE event = 'EVENT_B'`);
    expect((await verifyAuditChain())).not.toBeNull();
  });
});
