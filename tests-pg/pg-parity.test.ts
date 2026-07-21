/**
 * PostgreSQL parity — the SAME production code paths the SQLite suite
 * exercises, against a REAL Postgres server. Everything here is a behavior
 * that could plausibly differ between engines; each test names the risk.
 *
 * The schema is dropped and recreated at suite start (synthetic data only).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb, resetDbForTests } from "@/lib/db/index";
import {
  createSession,
  updateSession,
  recordAudit,
  verifyAuditChain,
  purgeSession,
  countRows,
  setIdentity,
  getIdentity,
} from "@/lib/db/repo";
import {
  createUser,
  getUserByEmail,
  deleteUserIfUnreferenced,
  countUserReferences,
  findAccountForSession,
} from "@/lib/db/users";
import { createMatter, grantMatterAccess, hasMatterGrant, getMatter } from "@/lib/db/matters";
import { createInvitation, previewInvitation, acceptInvitation } from "@/lib/db/invitations";
import { appendChatMessage, countChatMessages, listChatMessages } from "@/lib/db/intake-chat";
import { setConfigValue, getConfigValue, CONFIG_KEYS } from "@/lib/db/config";
import { toDollarPlaceholders } from "@/lib/db/driver";

async function wipeSchema(): Promise<void> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  } finally {
    await pool.end();
  }
}

beforeAll(async () => {
  await wipeSchema();
  resetDbForTests();
});

afterAll(() => {
  resetDbForTests();
});

describe("engine + DDL", () => {
  it("runs on the postgres dialect with a real round-trip", async () => {
    const db = getDb();
    expect(db.dialect).toBe("postgres");
    const r = await db.get<{ one: number }>("SELECT 1 AS one");
    expect(r?.one).toBe(1);
  });

  it("DDL is idempotent: a second cold init succeeds against the same schema", async () => {
    await getDb().get("SELECT 1 AS one"); // ensure initialized once
    resetDbForTests(); // forget the pool — simulates a fresh deploy boot
    const r = await getDb().get<{ one: number }>("SELECT 1 AS one"); // re-runs DDL + migrations
    expect(r?.one).toBe(1);
  });

  it("placeholder translation is quote- and comment-aware", () => {
    expect(toDollarPlaceholders("SELECT ? WHERE a = '?' AND b = ?")).toBe(
      "SELECT $1 WHERE a = '?' AND b = $2"
    );
    expect(toDollarPlaceholders("-- is this ? a question\nSELECT ?")).toBe(
      "-- is this ? a question\nSELECT $1"
    );
  });
});

describe("value parity with node:sqlite", () => {
  it("COUNT(*) arrives as a NUMBER (int8 parser), so guard comparisons hold", async () => {
    const n = await countRows("audit_event");
    expect(typeof n).toBe("number");
  });

  it("INTEGER booleans read back as 1/0 so `=== 1` mapping holds", async () => {
    const s = await createSession({
      initiatedBy: "CLIENT",
      ownerSubject: "pg|subject-bool",
      initialState: "PRE_GATE",
    });
    expect(s.conflictClear).toBe(false);
    await updateSession(s.id, { conflictClear: true });
    const raw = await getDb().get<{ conflict_clear: number }>(
      `SELECT conflict_clear FROM intake_session WHERE id = ?`,
      s.id
    );
    expect(raw?.conflict_clear).toBe(1);
  });

  it("a unique violation surfaces with the SQLite-shaped message", async () => {
    await createUser({ email: "dupe@example.test", role: "STAFF" });
    await expect(createUser({ email: "dupe@example.test", role: "STAFF" })).rejects.toThrow(
      /UNIQUE constraint failed: app_user/
    );
  });

  it("ON CONFLICT DO UPDATE (excluded.*) upserts exactly one row", async () => {
    await setConfigValue(CONFIG_KEYS.RETENTION_ABANDONED_DAYS, "21", "admin-1");
    await setConfigValue(CONFIG_KEYS.RETENTION_ABANDONED_DAYS, "28", "admin-2");
    expect(await getConfigValue(CONFIG_KEYS.RETENTION_ABANDONED_DAYS)).toBe("28");
    const r = await getDb().get<{ c: number }>(
      `SELECT COUNT(*) AS c FROM app_config WHERE key = ?`,
      CONFIG_KEYS.RETENTION_ABANDONED_DAYS
    );
    expect(r?.c).toBe(1);
  });

  it("ON CONFLICT DO NOTHING keeps the first grant without error", async () => {
    const staff = await createUser({ email: "grantee@example.test", role: "STAFF" });
    const m = await createMatter({ label: "PG-M1", createdBy: staff.id });
    await grantMatterAccess(m.id, staff.id, staff.id);
    await grantMatterAccess(m.id, staff.id, staff.id); // duplicate — silent no-op
    expect(await hasMatterGrant(m.id, staff.id)).toBe(true);
  });
});

describe("foreign keys + purge (retention parity)", () => {
  it("intake_chat_message CASCADEs with its session", async () => {
    const s = await createSession({
      initiatedBy: "CLIENT",
      ownerSubject: "pg|cascade",
      initialState: "PRE_GATE",
    });
    await appendChatMessage({ sessionId: s.id, role: "CLIENT", content: "confidential" });
    await appendChatMessage({ sessionId: s.id, role: "ASSISTANT", content: "reply" });
    expect(await countChatMessages(s.id)).toBe(2);
    expect((await listChatMessages(s.id)).map((m) => m.seq)).toEqual([1, 2]);
    await getDb().run(`DELETE FROM intake_session WHERE id = ?`, s.id);
    expect(await countChatMessages(s.id)).toBe(0);
  });

  it("purgeSession removes substantive rows and leaves the audit trail", async () => {
    const s = await createSession({
      initiatedBy: "CLIENT",
      ownerSubject: "pg|purge",
      initialState: "PRE_GATE",
    });
    await setIdentity(
      s.id,
      { fullLegalName: "Synthetic Client", priorNames: [] },
      { fullLegalName: "Synthetic Adverse", priorNames: [] }
    );
    expect(await getIdentity(s.id)).not.toBeNull();
    await purgeSession(s.id, "PG_PARITY_TEST");
    expect(await countRows("intake_session", s.id)).toBe(0);
    expect(await countRows("party_identity", s.id)).toBe(0);
    const events = await countRows("audit_event", s.id);
    expect(events).toBeGreaterThan(0); // SESSION_PURGED survives
  });

  it("delete guard: a referenced user row is refused, an unreferenced one deletes", async () => {
    const creator = await createUser({ email: "creator@example.test", role: "ATTORNEY" });
    await createMatter({ label: "PG-REF", createdBy: creator.id });
    expect(await countUserReferences(creator)).toBeGreaterThan(0);
    expect((await deleteUserIfUnreferenced(creator.id)).deleted).toBe(false);
    expect(await getUserByEmail("creator@example.test")).not.toBeNull();

    const clean = await createUser({ email: "clean@example.test", role: "STAFF" });
    expect((await deleteUserIfUnreferenced(clean.id)).deleted).toBe(true);
    expect(await getUserByEmail("clean@example.test")).toBeNull();
  });
});

describe("audit hash chain under real concurrency", () => {
  it("25 concurrent appends serialize (advisory lock) and the chain verifies", async () => {
    await Promise.all(
      Array.from({ length: 25 }, (_, i) => recordAudit(`pg-conc-${i}`, "PG_CONCURRENCY_TEST", `i=${i}`))
    );
    expect(await verifyAuditChain()).toBeNull();
  });

  it("a tampered historical row still breaks the chain", async () => {
    await recordAudit("pg-tamper", "EVENT_X", "original");
    expect(await verifyAuditChain()).toBeNull();
    await getDb().run(`UPDATE audit_event SET detail = 'tampered' WHERE session_ref = 'pg-tamper'`);
    expect(await verifyAuditChain()).not.toBeNull();
    // repair so later tests see an intact chain
    await getDb().run(`UPDATE audit_event SET detail = 'original' WHERE session_ref = 'pg-tamper'`);
    expect(await verifyAuditChain()).toBeNull();
  });
});

describe("invitations end-to-end on postgres", () => {
  it("mint → preview → accept binds the client; replay is refused neutrally", async () => {
    const attorney = await createUser({ email: "attorney@example.test", role: "ATTORNEY" });
    const m = await createMatter({ label: "PG-INV", createdBy: attorney.id });
    const { rawToken } = await createInvitation({ matterId: m.id, createdBy: attorney.id });

    expect(await previewInvitation(rawToken)).not.toBeNull();
    const client = await findAccountForSession({
      subject: "pg|client:invitee",
      email: "invitee@example.test",
      adminBootstrapEmails: [],
    });
    expect(client).toBeNull(); // providers authenticate; the DB authorizes

    const clientRow = await createUser({ email: "invitee@example.test", role: "CLIENT" });
    const accepted = await acceptInvitation({ rawToken, clientUserId: clientRow.id });
    expect(accepted?.usedByUserId).toBe(clientRow.id);
    expect((await getMatter(m.id))?.clientUserId).toBe(clientRow.id);

    expect(await acceptInvitation({ rawToken, clientUserId: clientRow.id })).toBeNull();
  });
});

describe("THE RECEIPT — data survives a process restart", () => {
  it("rows written before a pool teardown are still there after a fresh init", async () => {
    const marker = await createUser({ email: "survivor@example.test", role: "STAFF" });
    resetDbForTests(); // full teardown — what a redeploy does to the process
    const again = await getUserByEmail("survivor@example.test"); // fresh pool + DDL re-run
    expect(again?.id).toBe(marker.id);
    expect(again?.role).toBe("STAFF");
  });
});
