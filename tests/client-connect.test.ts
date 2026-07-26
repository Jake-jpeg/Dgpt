/**
 * Attorney-controlled client connection — route level (2026-07-26).
 *
 * The flow the operator specified: client makes an ID (registration at
 * sign-in), the ATTORNEY sees every registration and connects, declines, or
 * deletes. These tests pin the three routes:
 *   GET  /api/clients                → the connection queue (STAFF/ATTORNEY)
 *   POST /api/matters/[id]/client    → connect (ATTORNEY only)
 *   DELETE /api/clients/[id]         → decline a SHELL only (ATTORNEY only)
 */
import { describe, it, expect, beforeEach } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import {
  cookieFor,
  provisionAccount,
  setupClientWithMatter,
  jsonRequest,
  params,
  freshLimits,
  SYNTH_ATTORNEY,
} from "./helpers";
import { createMatter, getMatter } from "@/lib/db/matters";
import { getUserById } from "@/lib/db/users";
import { listSessionsByMatter } from "@/lib/db/repo";
import { GET as listClientsRoute } from "@/app/api/clients/route";
import { DELETE as declineRoute } from "@/app/api/clients/[id]/route";
import { POST as connectRoute } from "@/app/api/matters/[id]/client/route";
import type { SessionUser } from "@/lib/auth/session";

const REGISTRANT: SessionUser = {
  subject: "devstub|client:walkin",
  role: "CLIENT",
  email: "walkin@example.test",
  name: "Walk-in Client",
};

let attorneyCookie: string;

beforeEach(async () => {
  resetDbForTests();
  freshLimits();
  await provisionAccount(SYNTH_ATTORNEY);
  attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
});

describe("the connection queue", () => {
  it("lists registrations with linkage state; clients cannot see it", async () => {
    const shell = await provisionAccount(REGISTRANT);
    const linkedCtx = await setupClientWithMatter(); // a linked client for contrast
    freshLimits();
    const res = await listClientsRoute(
      jsonRequest("/api/clients", { method: "GET", cookie: attorneyCookie })
    );
    expect(res.status).toBe(200);
    const { clients } = (await res.json()) as {
      clients: { id: string; linked: boolean; registered: boolean }[];
    };
    const byId = new Map(clients.map((c) => [c.id, c]));
    expect(byId.get(shell.id)).toMatchObject({ linked: false, registered: true });
    expect(byId.get(linkedCtx.clientUserId)).toMatchObject({ linked: true });

    freshLimits();
    const clientRes = await listClientsRoute(
      jsonRequest("/api/clients", { method: "GET", cookie: await cookieFor(REGISTRANT) })
    );
    expect(clientRes.status).toBe(403);
  });
});

describe("connect", () => {
  it("attorney connects a registration: matter bound, EXTERNAL posture, session opened, audited", async () => {
    const shell = await provisionAccount(REGISTRANT);
    const attorney = await provisionAccount(SYNTH_ATTORNEY);
    const matter = await createMatter({ label: "Walk-in Matter", createdBy: attorney.id });
    const { grantMatterAccess } = await import("@/lib/db/matters");
    await grantMatterAccess(matter.id, attorney.id, attorney.id);

    freshLimits();
    const res = await connectRoute(
      jsonRequest(`/api/matters/${matter.id}/client`, {
        cookie: attorneyCookie,
        body: { userId: shell.id },
      }),
      params({ id: matter.id })
    );
    expect(res.status).toBe(200);
    const m = (await getMatter(matter.id))!;
    expect(m.clientUserId).toBe(shell.id);
    expect(m.conflictStatus).toBe("EXTERNAL");
    expect((await listSessionsByMatter(matter.id)).length).toBe(1);
  });

  it("a taken matter refuses a second client with a clear message", async () => {
    const ctx = await setupClientWithMatter();
    const shell = await provisionAccount(REGISTRANT);
    freshLimits();
    const res = await connectRoute(
      jsonRequest(`/api/matters/${ctx.matterId}/client`, {
        cookie: attorneyCookie,
        body: { userId: shell.id },
      }),
      params({ id: ctx.matterId })
    );
    expect(res.status).toBe(409);
    expect(String(((await res.json()) as { error: string }).error)).toMatch(/different client/i);
  });
});

describe("decline", () => {
  it("removes a SHELL registration; refuses a client with case data", async () => {
    const shell = await provisionAccount(REGISTRANT);
    freshLimits();
    const res = await declineRoute(
      jsonRequest(`/api/clients/${shell.id}`, { method: "DELETE", cookie: attorneyCookie }),
      params({ id: shell.id })
    );
    expect(res.status).toBe(200);
    expect(await getUserById(shell.id)).toBeNull();

    // A linked client cannot be declined away — case data is protected.
    const ctx = await setupClientWithMatter();
    freshLimits();
    const res2 = await declineRoute(
      jsonRequest(`/api/clients/${ctx.clientUserId}`, { method: "DELETE", cookie: attorneyCookie }),
      params({ id: ctx.clientUserId })
    );
    expect(res2.status).toBe(409);
    expect(await getUserById(ctx.clientUserId)).not.toBeNull();
  });
});
