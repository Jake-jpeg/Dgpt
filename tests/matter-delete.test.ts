/**
 * Attorney matter deletion (2026-07-22 operator directive: the lawyer runs
 * their own book — deletion is not admin-only).
 *
 * Invariants:
 *  - ATTORNEY deletes a matter → everything it owns cascades (answers,
 *    sessions, disclosure acks); the audit trail SURVIVES with a
 *    MATTER_DELETED entry.
 *  - A client account orphaned by the deletion (no other case data) is
 *    removed with it; a client with ANOTHER matter keeps their account.
 *  - STAFF and CLIENT cannot delete. LEGAL HOLD is absolute — 409.
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
  SYNTH_ATTORNEY,
  SYNTH_CLIENT,
} from "./helpers";
import { getMatter, createMatter, bindClientToMatter, setLegalHold } from "@/lib/db/matters";
import { getUserById } from "@/lib/db/users";
import { DELETE as deleteMatterRoute } from "@/app/api/matters/[id]/route";

const count = async (sql: string, arg: string) =>
  (await getDb().get<{ c: number }>(sql, arg))?.c ?? 0;

let attorneyCookie: string;

beforeEach(async () => {
  resetDbForTests();
  freshLimits();
  await provisionAccount(SYNTH_ATTORNEY);
  attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
});

async function del(id: string, cookie = attorneyCookie) {
  freshLimits();
  return deleteMatterRoute(
    jsonRequest(`/api/matters/${id}`, { method: "DELETE", cookie }),
    params({ id })
  );
}

describe("attorney matter deletion", () => {
  it("cascades the matter and removes the orphaned client account; audit survives", async () => {
    const ctx = await setupClientWithMatter();
    expect(await count(`SELECT COUNT(*) AS c FROM disclosure_ack WHERE matter_ref = ?`, ctx.matterId)).toBeGreaterThan(0);

    const res = await del(ctx.matterId);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { deleted: boolean; clientAccountDeleted: boolean };
    expect(data.deleted).toBe(true);
    expect(data.clientAccountDeleted).toBe(true); // only matter → orphaned login removed

    expect(await getMatter(ctx.matterId)).toBeNull();
    expect(await getUserById(ctx.clientUserId)).toBeNull();
    expect(await count(`SELECT COUNT(*) AS c FROM disclosure_ack WHERE matter_ref = ?`, ctx.matterId)).toBe(0);
    expect(await count(`SELECT COUNT(*) AS c FROM intake_session WHERE matter_id = ?`, ctx.matterId)).toBe(0);
    // The tamper-evident ledger survives and records the deletion.
    const events = await getDb().all<{ event: string }>(
      `SELECT event FROM audit_event WHERE session_ref = ?`,
      ctx.matterId
    );
    expect(events.map((e) => e.event)).toContain("MATTER_DELETED");
  });

  it("a client with ANOTHER matter keeps their account", async () => {
    const ctx = await setupClientWithMatter();
    const second = await createMatter({ label: "Second Matter", createdBy: ctx.attorneyUserId });
    await bindClientToMatter(second.id, ctx.clientUserId);

    const res = await del(ctx.matterId);
    expect(res.status).toBe(200);
    expect(((await res.json()) as { clientAccountDeleted: boolean }).clientAccountDeleted).toBe(false);
    expect(await getUserById(ctx.clientUserId)).not.toBeNull();
    expect(await getMatter(second.id)).not.toBeNull();
  });

  it("legal hold is absolute: 409, nothing deleted", async () => {
    const ctx = await setupClientWithMatter();
    await setLegalHold(ctx.matterId, true, "litigation hold");
    const res = await del(ctx.matterId);
    expect(res.status).toBe(409);
    expect(await getMatter(ctx.matterId)).not.toBeNull();
  });

  it("STAFF and CLIENT cannot delete", async () => {
    const ctx = await setupClientWithMatter();
    const staff = { subject: "devstub|staff:s@example.test", role: "STAFF" as const, email: "s@example.test", name: "S" };
    await provisionAccount(staff);
    const staffRes = await del(ctx.matterId, await cookieFor(staff));
    expect(staffRes.status).toBe(403);
    const clientRes = await del(ctx.matterId, await cookieFor(SYNTH_CLIENT));
    expect(clientRes.status).toBe(403);
    expect(await getMatter(ctx.matterId)).not.toBeNull();
  });
});
