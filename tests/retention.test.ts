/**
 * Batch 8 acceptance: retention, legal hold, audit.
 *  - legal hold blocks purge absolutely
 *  - engaged matters are exempt from the prospective purge path
 *  - conflict history + disclosure acks + audit chain survive a purge
 *  - retention thresholds are configurable (admin), not hard-coded
 */
import { describe, it, expect, beforeEach } from "vitest";
import { resetDbForTests, getDb } from "@/lib/db/index";
import {
  cookieFor,
  SYNTH_CLIENT,
  startSession,
  runIdentity,
  jsonRequest,
  freshLimits,
  provisionAccount,
} from "./helpers";
import { getSession, countRows, verifyAuditChain } from "@/lib/db/repo";
import { getMatter, setLegalHold, setMatterLifecycle } from "@/lib/db/matters";
import { countConflictSubmissions } from "@/lib/db/conflicts";
import { purgeMatterContent, sweepMatters } from "@/lib/retention";
import { resetFileStorageForTests } from "@/lib/storage";
import { CONFIG_KEYS, getConfigNumber, setConfigValue } from "@/lib/db/config";
import { PUT as configPut } from "@/app/api/admin/config/route";
import type { SessionUser } from "@/lib/auth/session";

let clientCookie: string;

async function matterWithContent(): Promise<{ matterId: string; sessionId: string }> {
  const sessionId = await startSession(clientCookie);
  await runIdentity(clientCookie, sessionId);
  const matterId = getSession(sessionId)!.matterId!;
  return { matterId, sessionId };
}

function backdateMatter(matterId: string, days: number): void {
  const past = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  getDb().prepare(`UPDATE matter SET last_activity_at = ? WHERE id = ?`).run(past, matterId);
}

beforeEach(async () => {
  resetDbForTests();
  resetFileStorageForTests();
  freshLimits();
  clientCookie = await cookieFor(SYNTH_CLIENT);
});

describe("legal hold", () => {
  it("blocks direct purge and the sweep", async () => {
    const { matterId, sessionId } = await matterWithContent();
    setLegalHold(matterId, true, "synthetic litigation hold");
    await expect(purgeMatterContent(matterId, "TEST")).rejects.toThrow(/RETENTION_GUARD/);

    backdateMatter(matterId, 365);
    const reports = await sweepMatters();
    expect(reports.map((r) => r.matterId)).not.toContain(matterId);
    expect(countRows("intake_session", sessionId)).toBe(1); // untouched

    // Releasing the hold makes the same matter sweepable again.
    setLegalHold(matterId, false);
    const after = await sweepMatters();
    expect(after.map((r) => r.matterId)).toContain(matterId);
    expect(countRows("intake_session", sessionId)).toBe(0);
  });
});

describe("lifecycle exemptions", () => {
  it("ENGAGED matters are exempt from the prospective purge path", async () => {
    const { matterId, sessionId } = await matterWithContent();
    setMatterLifecycle(matterId, "ENGAGED");
    await expect(purgeMatterContent(matterId, "TEST")).rejects.toThrow(/RETENTION_GUARD/);
    backdateMatter(matterId, 365);
    const reports = await sweepMatters();
    expect(reports.map((r) => r.matterId)).not.toContain(matterId);
    expect(countRows("intake_session", sessionId)).toBe(1);
  });

  it("fresh prospective matters are not swept; stale ones are", async () => {
    const fresh = await matterWithContent();
    const staleUser: SessionUser = {
      subject: "devstub|client:stale@example.test",
      role: "CLIENT",
      email: "stale@example.test",
      name: "Stale",
    };
    provisionAccount(staleUser);
    const staleCookie = await cookieFor(staleUser);
    const staleSession = await startSession(staleCookie);
    await runIdentity(staleCookie, staleSession);
    const staleMatter = getSession(staleSession)!.matterId!;
    backdateMatter(staleMatter, getConfigNumber(CONFIG_KEYS.RETENTION_PROSPECTIVE_DAYS) + 5);

    const reports = await sweepMatters();
    expect(reports.map((r) => r.matterId)).toContain(staleMatter);
    expect(reports.map((r) => r.matterId)).not.toContain(fresh.matterId);
  });
});

describe("what survives a purge", () => {
  it("conflict history, disclosure acks, and the audit chain survive", async () => {
    const { matterId, sessionId } = await matterWithContent();
    expect(countConflictSubmissions(matterId)).toBe(1);
    const acksBefore = getDb()
      .prepare(`SELECT COUNT(*) c FROM disclosure_ack WHERE matter_ref = ?`)
      .get(matterId) as { c: number };
    expect(acksBefore.c).toBe(1);

    await purgeMatterContent(matterId, "TEST_PURGE");

    // Substantive content gone.
    expect(countRows("intake_session", sessionId)).toBe(0);
    expect(countRows("party_identity", sessionId)).toBe(0);
    expect(countRows("intake_answer", sessionId)).toBe(0);

    // Retained minimum intact.
    expect(countConflictSubmissions(matterId)).toBe(1);
    const acksAfter = getDb()
      .prepare(`SELECT COUNT(*) c FROM disclosure_ack WHERE matter_ref = ?`)
      .get(matterId) as { c: number };
    expect(acksAfter.c).toBe(1);
    expect(verifyAuditChain()).toBeNull();
    const events = getDb()
      .prepare(`SELECT event FROM audit_event WHERE session_ref = ?`)
      .all(matterId) as { event: string }[];
    expect(events.map((e) => e.event)).toContain("RETENTION_PURGE");
    expect(getMatter(matterId)).not.toBeNull(); // disposition record remains
  });
});

describe("configurable retention (no hard-coded final periods)", () => {
  it("admin can change thresholds through the config API", async () => {
    const admin: SessionUser = {
      subject: "devstub|admin:retadmin@example.test",
      role: "ADMIN",
      email: "retadmin@example.test",
      name: "Ret Admin",
    };
    const account = provisionAccount(admin);
    const { setUserRole } = await import("@/lib/db/users");
    setUserRole(account.id, "ADMIN");

    const res = await configPut(
      jsonRequest("/api/admin/config", {
        method: "PUT",
        cookie: await cookieFor(admin),
        body: { key: "retention.prospective_days", value: "90" },
      })
    );
    expect(res.status).toBe(200);
    expect(getConfigNumber(CONFIG_KEYS.RETENTION_PROSPECTIVE_DAYS)).toBe(90);
  });

  it("attorney-only rules are NOT admin-configurable", async () => {
    const admin: SessionUser = {
      subject: "devstub|admin:retadmin2@example.test",
      role: "ADMIN",
      email: "retadmin2@example.test",
      name: "Ret Admin 2",
    };
    const account = provisionAccount(admin);
    const { setUserRole } = await import("@/lib/db/users");
    setUserRole(account.id, "ADMIN");
    freshLimits();
    const res = await configPut(
      jsonRequest("/api/admin/config", {
        method: "PUT",
        cookie: await cookieFor(admin),
        body: { key: "approvals.allow_staff", value: "true" },
      })
    );
    expect(res.status).toBe(400); // unknown key — no such surface exists
  });

  it("sweep can be disabled entirely via config", async () => {
    const { matterId } = await matterWithContent();
    backdateMatter(matterId, 365);
    setConfigValue(CONFIG_KEYS.RETENTION_SWEEP_ENABLED, "false", "test");
    expect(await sweepMatters()).toEqual([]);
    setConfigValue(CONFIG_KEYS.RETENTION_SWEEP_ENABLED, "true", "test");
    expect((await sweepMatters()).map((r) => r.matterId)).toContain(matterId);
  });
});
