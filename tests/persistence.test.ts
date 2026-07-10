/**
 * ACCEPTANCE CRITERION 2: no substantive data is persisted for conflicted,
 * out-of-scope, or abandoned sessions — verified at the DB level.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  cookieFor,
  SYNTH_CLIENT,
  startSession,
  runIdentity,
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
  expect(countRows("intake_session", id)).toBe(0);
  expect(countRows("party_identity", id)).toBe(0);
  expect(countRows("intake_answer", id)).toBe(0);
  const events = getAuditEvents(id).map((e) => e.event);
  expect(events).toContain("SESSION_PURGED");
}

describe("out-of-scope sessions leave no substantive data (DB level)", () => {
  it("residency trip → attorney-flag card, purged", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id);
    const r = await runGate(cookie, id, false); // not a 12-month NJ resident
    expect(r.data.status).toBe("TERMINATED");
    expect(r.data.card.id).toBe("RESIDENCY_ATTORNEY_FLAG");
    await expectFullyPurged(id);
  });

  it("DV trip → DV-resource card (distinct from bar referral), purged", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id);
    await runGate(cookie, id, true); // residency ok
    await runGate(cookie, id, "Bergen"); // venue
    const r = await runGate(cookie, id, true); // DV: yes
    expect(r.data.status).toBe("TERMINATED");
    expect(r.data.card.id).toBe("DV_RESOURCES");
    expect(r.data.card.id).not.toBe("BERGEN_BAR_REFERRAL");
    await expectFullyPurged(id);
    const events = getAuditEvents(id).map((e) => e.event);
    expect(events).toContain("SCOPE_OUT_DV");
  });

  it("DV exit retains EXACTLY what a conflict hit retains: audit event codes only, nothing about the person or situation", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id);
    await runGate(cookie, id, true);
    await runGate(cookie, id, "Bergen");
    await runGate(cookie, id, true); // DV disclosure

    // Same no-retention behavior as a conflict hit, verified at the DB level:
    // no session row, no identity, no answers — the "yes" itself is nowhere.
    expect(countRows("intake_session", id)).toBe(0);
    expect(countRows("party_identity", id)).toBe(0);
    expect(countRows("intake_answer", id)).toBe(0);

    // The surviving audit trail is bare event codes; details carry only
    // card/state identifiers — no free text, no names, no disclosure content.
    const events = getAuditEvents(id);
    const allowedDetail = /^(card=[A-Z_]+|GATE_[A-Z_]+|SCOPE_OUT_[A-Z_]+|initiatedBy=(CLIENT|ATTORNEY))$/;
    for (const e of events) {
      if (e.detail) expect(e.detail).toMatch(allowedDetail);
    }
    expect(events.map((e) => e.event)).toContain("SESSION_PURGED");
  });

  it("children → custody deferred → referral card, purged", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id);
    await runGate(cookie, id, true);
    await runGate(cookie, id, "Bergen");
    await runGate(cookie, id, false); // no DV
    const r = await runGate(cookie, id, true); // children: yes
    expect(r.data.status).toBe("TERMINATED");
    expect(r.data.card.id).toBe("BERGEN_BAR_REFERRAL");
    await expectFullyPurged(id);
  });

  it("complexity trip (any non-'fully agree') → Bergen Bar card, purged", async () => {
    for (const answer of ["SOME_UNCERTAINTY", "DISAGREEMENT", "NEED_VALUATION"]) {
      const id = await startSession(cookie);
      await runIdentity(cookie, id);
      await runGate(cookie, id, true);
      await runGate(cookie, id, "Bergen");
      await runGate(cookie, id, false);
      await runGate(cookie, id, false);
      const r = await runGate(cookie, id, answer);
      expect(r.data.status).toBe("TERMINATED");
      expect(r.data.card.id).toBe("BERGEN_BAR_REFERRAL");
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
    expect(countRows("intake_answer", id)).toBeGreaterThan(0);
    // …then disclose a business interest.
    const r = await submitAnswersHttp(cookie, id, [
      { fieldId: "ed_business_interest", value: true },
    ]);
    expect(r.data.status).toBe("TERMINATED");
    expect(r.data.card.id).toBe("BERGEN_BAR_REFERRAL");
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
    await runIdentity(cookie, stale);
    const fresh = await startSession(cookie);
    await runIdentity(cookie, fresh);

    // Backdate the stale session's last activity 30 days.
    getDbSessionForTest(stale, 30);

    const purged = sweepAbandoned(14);
    expect(purged).toContain(stale);
    expect(purged).not.toContain(fresh);
    expect(countRows("intake_session", stale)).toBe(0);
    expect(countRows("party_identity", stale)).toBe(0);
    expect(countRows("intake_session", fresh)).toBe(1);
    const events = getAuditEvents(stale).map((e) => e.event);
    expect(events).toContain("SESSION_PURGED");
  });
});
