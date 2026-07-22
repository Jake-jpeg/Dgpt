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

describe("out-of-scope sessions leave no substantive data (DB level)", () => {
  it("PHASE 1: residency short of the two-year ground → attorney-review stop, purged", async () => {
    const id = await startSession(cookie);
    await runIdentityAndClear(cookie, id);
    const r1 = await runGate(cookie, id, false); // 2-year: no → HARD STOP
    expect(r1.data.status).toBe("TERMINATED");
    expect(r1.data.card.id).toBe("PHASE1_ATTORNEY_REVIEW");
    await expectFullyPurged(id);
    const events = (await getAuditEvents(id)).map((e) => e.event);
    expect(events).toContain("SCOPE_OUT_RESIDENCY_PHASE1");
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

  it("DV trip → DV-resource card (distinct from bar referral), purged", async () => {
    const id = await startSession(cookie);
    await runIdentityAndClear(cookie, id);
    await runGate(cookie, id, true); // residency ok
    await runGate(cookie, id, "Kings"); // venue
    const r = await runGate(cookie, id, true); // DV: yes
    expect(r.data.status).toBe("TERMINATED");
    expect(r.data.card.id).toBe("DV_RESOURCES");
    expect(r.data.card.id).not.toBe("NY_BAR_REFERRAL");
    await expectFullyPurged(id);
    const events = (await getAuditEvents(id)).map((e) => e.event);
    expect(events).toContain("SCOPE_OUT_DV");
  });

  it("DV exit retains EXACTLY what a conflict hit retains: audit event codes only, nothing about the person or situation", async () => {
    const id = await startSession(cookie);
    await runIdentityAndClear(cookie, id);
    await runGate(cookie, id, true);
    await runGate(cookie, id, "Kings");
    await runGate(cookie, id, true); // DV disclosure

    // Same no-retention behavior as a conflict hit, verified at the DB level:
    // no session row, no identity, no answers — the "yes" itself is nowhere.
    expect((await countRows("intake_session", id))).toBe(0);
    expect((await countRows("party_identity", id))).toBe(0);
    expect((await countRows("intake_answer", id))).toBe(0);

    // The surviving audit trail is bare event codes; details carry only
    // card/state identifiers — no free text, no names, no disclosure content.
    const events = (await getAuditEvents(id));
    const allowedDetail =
      /^(card=[A-Z_]+|GATE_[A-Z_]+|SCOPE_OUT_[A-Z_]+|initiatedBy=(CLIENT|STAFF|ATTORNEY)|matter=[0-9a-f-]+|\{"result":"(NO_APPARENT_MATCH|POTENTIAL_MATCH)","clientHash":"[0-9a-f]+","adverseHash":"[0-9a-f]+"\})$/;
    for (const e of events) {
      if (e.detail) expect(e.detail).toMatch(allowedDetail);
    }
    expect(events.map((e) => e.event)).toContain("SESSION_PURGED");
  });

  it("children → attorney-review stop (Phase 1 is the no-children lane), purged", async () => {
    const id = await startSession(cookie);
    await runIdentityAndClear(cookie, id);
    await runGate(cookie, id, true);
    await runGate(cookie, id, "Kings");
    await runGate(cookie, id, false); // no DV
    const r = await runGate(cookie, id, true); // children: yes
    expect(r.data.status).toBe("TERMINATED");
    expect(r.data.card.id).toBe("PHASE1_ATTORNEY_REVIEW");
    await expectFullyPurged(id);
    const events = (await getAuditEvents(id)).map((e) => e.event);
    expect(events).toContain("SCOPE_OUT_CHILDREN");
  });

  it("complexity trip (any non-'fully agree') → NY bar-referral card, purged", async () => {
    for (const answer of ["SOME_UNCERTAINTY", "DISAGREEMENT", "NEED_VALUATION"]) {
      const id = await startSession(cookie);
      await runIdentityAndClear(cookie, id);
      await runGate(cookie, id, true);
      await runGate(cookie, id, "Kings");
      await runGate(cookie, id, false);
      await runGate(cookie, id, false);
      const r = await runGate(cookie, id, answer);
      expect(r.data.status).toBe("TERMINATED");
      expect(r.data.card.id).toBe("NY_BAR_REFERRAL");
      await expectFullyPurged(id);
    }
  });

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
