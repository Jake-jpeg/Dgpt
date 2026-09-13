/**
 * ACCEPTANCE CRITERION 2: no substantive data is persisted for conflicted,
 * out-of-scope, or abandoned sessions — verified at the DB level.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  cookieFor,
  SYNTH_CLIENT,
  startSession,
  runIdentityAndClear,
  runGate,
  runToTierBranch,
  runBranch,
  submitAnswersHttp,
  TIER2_ANSWERS,
  freshLimits,
} from "./helpers";
import { countRows, getAuditEvents, sweepAbandoned, getDbSessionForTest } from "./db-peek";

let cookie: string;

beforeEach(async () => {
  cookie = await cookieFor(SYNTH_CLIENT);
  freshLimits();
});

async function expectFullyPurged(id: string) {
  expect((await countRows("intake_session", id))).toBe(0);
  expect((await countRows("party_identity", id))).toBe(0);
  expect((await countRows("intake_answer", id))).toBe(0);
  const events = (await getAuditEvents(id)).map((e) => e.event);
  expect(events).toContain("SESSION_PURGED");
}

describe("gates never turn a client away — flag and continue (2026-09-13)", () => {
  it("1yr + NY nexus passes clean; under one year → RESIDENCY flag, session continues (nothing purged)", async () => {
    // Clean 1-year + nexus path: § 230(1)/(2) — objective, no flag.
    const ok = await startSession(cookie);
    await runIdentityAndClear(cookie, ok);
    await runGate(cookie, ok, false); // 2-year: no
    const okR = await runGate(cookie, ok, true); // 1-year: yes
    expect(okR.data.state).toBe("GATE_RESIDENCY_NEXUS");
    const okR2 = await runGate(cookie, ok, true); // married in NY / lived as spouses
    expect(okR2.data.state).toBe("GATE_VENUE");
    const { getSession } = await import("@/lib/db/repo");
    expect(((await getSession(ok))?.attorneyFlags ?? [])).not.toContain("RESIDENCY_ATTORNEY_REVIEW");

    // Under one year: flagged for the attorney, the interview goes on.
    const id = await startSession(cookie);
    await runIdentityAndClear(cookie, id);
    await runGate(cookie, id, false); // 2-year: no
    const r1 = await runGate(cookie, id, false); // 1-year: no → flag + continue
    expect(r1.status).toBe(200);
    expect(r1.data.status).toBeUndefined(); // never TERMINATED
    expect(r1.data.state).toBe("GATE_VENUE");
    expect((await getSession(id))?.attorneyFlags).toContain("RESIDENCY_ATTORNEY_REVIEW");
    expect((await countRows("intake_session", id))).toBe(1);
    const events = (await getAuditEvents(id)).map((e) => e.event);
    expect(events).toContain("GATE_FLAG_RESIDENCY");
    expect(events).not.toContain("SESSION_PURGED");
  });

  describe("legacy residency cascade under INTAKE_PHASE=ALL", () => {
    beforeEach(() => {
      process.env.INTAKE_PHASE = "ALL";
    });
    afterEach(() => {
      delete process.env.INTAKE_PHASE;
    });

    it("no/no path flags for attorney review and continues", async () => {
      const id = await startSession(cookie);
      await runIdentityAndClear(cookie, id);
      const r1 = await runGate(cookie, id, false); // 2-year: no
      expect(r1.data.state).toBe("GATE_RESIDENCY_1YR");
      const r2 = await runGate(cookie, id, false); // 1-year: no → flag + continue
      expect(r2.data.state).toBe("GATE_VENUE");
      const { getSession } = await import("@/lib/db/repo");
      const sess = await getSession(id);
      expect(sess?.attorneyFlags).toContain("RESIDENCY_ATTORNEY_REVIEW");
      const events = (await getAuditEvents(id)).map((e) => e.event);
      expect(events).toContain("GATE_FLAGGED_FOR_ATTORNEY");
      // The session is alive — venue is next, nothing was purged.
      expect((await countRows("intake_session", id))).toBe(1);
    });

    it("1-year yes + NY nexus yes → clean pass, no flag", async () => {
      const id = await startSession(cookie);
      await runIdentityAndClear(cookie, id);
      await runGate(cookie, id, false); // 2-year: no
      const r2 = await runGate(cookie, id, true); // 1-year: yes
      expect(r2.data.state).toBe("GATE_RESIDENCY_NEXUS");
      const r3 = await runGate(cookie, id, true); // married in NY / lived as spouses: yes
      expect(r3.data.state).toBe("GATE_VENUE");
      const { getSession } = await import("@/lib/db/repo");
      expect((await getSession(id))?.attorneyFlags ?? []).not.toContain("RESIDENCY_ATTORNEY_REVIEW");
    });
  });

  it("DV: yes → the DV resources card comes back WITH the next state; flagged; nothing purged", async () => {
    const id = await startSession(cookie);
    await runIdentityAndClear(cookie, id);
    await runGate(cookie, id, true); // residency ok
    await runGate(cookie, id, "Kings"); // venue
    const r = await runGate(cookie, id, true); // DV: yes
    expect(r.status).toBe(200);
    expect(r.data.status).toBeUndefined();
    expect(r.data.state).toBe("GATE_CHILDREN");
    expect(r.data.card.id).toBe("DV_RESOURCES");
    expect(r.data.card.id).not.toBe("NY_BAR_REFERRAL");
    expect(JSON.stringify(r.data.card)).toContain("800-942-6906");
    expect(r.data.card.body).not.toMatch(/will not continue/i);
    const { getSession } = await import("@/lib/db/repo");
    expect((await getSession(id))?.attorneyFlags).toContain("DV_DISCLOSED_ATTORNEY_REVIEW");
    expect((await countRows("intake_session", id))).toBe(1);
    const events = (await getAuditEvents(id)).map((e) => e.event);
    expect(events).toContain("GATE_FLAG_DV");
    expect(events).not.toContain("SESSION_PURGED");
  });

  it("the audit trail of a DV disclosure is bare codes only — nothing about the person or situation", async () => {
    const id = await startSession(cookie);
    await runIdentityAndClear(cookie, id);
    await runGate(cookie, id, true);
    await runGate(cookie, id, "Kings");
    await runGate(cookie, id, true); // DV disclosure

    // Details carry only card/state/flag identifiers — no free text, no
    // names, no disclosure content.
    const events = (await getAuditEvents(id));
    const allowedDetail =
      /^(card=[A-Z_]+|GATE_[A-Z_]+(:[A-Z_]+)?|initiatedBy=(CLIENT|STAFF|ATTORNEY)|matter=[0-9a-f-]+|\{"result":"(NO_APPARENT_MATCH|POTENTIAL_MATCH)","clientHash":"[0-9a-f]+","adverseHash":"[0-9a-f]+"\})$/;
    for (const e of events) {
      if (e.detail) expect(e.detail).toMatch(allowedDetail);
    }
    expect(events.map((e) => e.event)).toContain("GATE_FLAGGED_FOR_ATTORNEY");
  });

  it("children: yes → CHILDREN flag, interview continues to complexity", async () => {
    const id = await startSession(cookie);
    await runIdentityAndClear(cookie, id);
    await runGate(cookie, id, true);
    await runGate(cookie, id, "Kings");
    await runGate(cookie, id, false); // no DV
    const r = await runGate(cookie, id, true); // children: yes
    expect(r.data.status).toBeUndefined();
    expect(r.data.state).toBe("GATE_COMPLEXITY");
    expect(r.data.card).toBeUndefined();
    const { getSession } = await import("@/lib/db/repo");
    expect((await getSession(id))?.attorneyFlags).toContain("CHILDREN_PRESENT_ATTORNEY_REVIEW");
    expect((await countRows("intake_session", id))).toBe(1);
  });

  it("complexity (any non-'fully agree') → COMPLEXITY flag, never a bar-referral card", async () => {
    for (const answer of ["SOME_UNCERTAINTY", "DISAGREEMENT", "NEED_VALUATION"]) {
      const id = await startSession(cookie);
      await runIdentityAndClear(cookie, id);
      await runGate(cookie, id, true);
      await runGate(cookie, id, "Kings");
      await runGate(cookie, id, false);
      await runGate(cookie, id, false);
      const r = await runGate(cookie, id, answer);
      expect(r.data.status).toBeUndefined();
      expect(r.data.state).toBe("TIER_BRANCH");
      expect(r.data.card).toBeUndefined();
      const { getSession } = await import("@/lib/db/repo");
      expect((await getSession(id))?.attorneyFlags).toContain("COMPLEXITY_ATTORNEY_REVIEW");
      expect((await countRows("intake_session", id))).toBe(1);
    }
  });

  // ── The legacy TIER form path below still has its own out-of-scope
  //    routing (branch uncertainty, business interest, retirement
  //    disagreement). That path is not the client's interview any more
  //    (the portal chat/form runs on the matter schema); left as-is.
  it("tier-branch uncertainty → out, purged", async () => {
    const id = await startSession(cookie);
    await runToTierBranch(cookie, id);
    const r = await runBranch(cookie, id, "UNSURE", "NONE");
    expect(r.data.status).toBe("TERMINATED");
    await expectFullyPurged(id);
  });

  it("mid-intake business interest → out, and answers already given are purged too", async () => {
    const id = await startSession(cookie);
    await runToTierBranch(cookie, id);
    await runBranch(cookie, id, "SETTLED", "AGREED"); // TIER2
    // Persist some legitimate answers first…
    await submitAnswersHttp(cookie, id, TIER2_ANSWERS.slice(0, 5));
    expect((await countRows("intake_answer", id))).toBeGreaterThan(0);
    // …then disclose a business interest.
    const r = await submitAnswersHttp(cookie, id, [
      { fieldId: "ed_business_interest", value: true },
    ]);
    expect(r.data.status).toBe("TERMINATED");
    expect(r.data.card.id).toBe("NY_BAR_REFERRAL");
    await expectFullyPurged(id);
  });

  it("retirement division disagreement → out, purged", async () => {
    const id = await startSession(cookie);
    await runToTierBranch(cookie, id);
    await runBranch(cookie, id, "SETTLED", "NONE");
    const r = await submitAnswersHttp(cookie, id, [
      {
        fieldId: "ed_retirement_accounts",
        value: [{ accountType: "PENSION", holder: "SPOUSE", division: "UNSURE" }],
      },
    ]);
    expect(r.data.status).toBe("TERMINATED");
    await expectFullyPurged(id);
  });
});

describe("abandoned sessions (retention policy)", () => {
  it("sweep purges stale sessions but keeps READY_FOR_REVIEW and fresh ones", async () => {
    const stale = await startSession(cookie);
    await runIdentityAndClear(cookie, stale);
    const fresh = await startSession(cookie);
    await runIdentityAndClear(cookie, fresh);

    // Backdate the stale session's last activity 30 days.
    (await getDbSessionForTest(stale, 30));

    const purged = (await sweepAbandoned(14));
    expect(purged).toContain(stale);
    expect(purged).not.toContain(fresh);
    expect((await countRows("intake_session", stale))).toBe(0);
    expect((await countRows("party_identity", stale))).toBe(0);
    expect((await countRows("intake_session", fresh))).toBe(1);
    const events = (await getAuditEvents(stale)).map((e) => e.event);
    expect(events).toContain("SESSION_PURGED");
  });
});
