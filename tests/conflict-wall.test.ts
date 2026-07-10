/**
 * ACCEPTANCE CRITERION 1: the conflict wall cannot be bypassed. Attempting to
 * reach substantive intake without a CLEAR — via direct API manipulation —
 * fails server-side.
 *
 * Also covers the HIT path: static referral card, session ended, no
 * substantive data persisted, minimal audit only (hashed names, never
 * plaintext).
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  cookieFor,
  SYNTH_CLIENT,
  startSession,
  runIdentity,
  runGate,
  runBranch,
  submitAnswersHttp,
  HIT_IDENTITY,
  jsonRequest,
  params,
  freshLimits,
} from "./helpers";
import { countRows, getAuditEvents, getSession } from "@/lib/db/repo";
import { insertAnswer } from "@/lib/db/repo";
import { GET as viewRoute } from "@/app/api/intake/[id]/route";
import { POST as completeRoute } from "@/app/api/intake/[id]/complete/route";

let cookie: string;

beforeEach(async () => {
  cookie = await cookieFor(SYNTH_CLIENT);
  freshLimits();
});

describe("conflict wall — bypass attempts fail server-side", () => {
  it("rejects gate answers before any conflict check", async () => {
    const id = await startSession(cookie);
    const r = await runGate(cookie, id, true);
    expect(r.status).toBe(409);
  });

  it("rejects tier-branch answers before any conflict check", async () => {
    const id = await startSession(cookie);
    const r = await runBranch(cookie, id, "NONE", "NONE");
    expect(r.status).toBe(409);
  });

  it("rejects substantive answers before any conflict check", async () => {
    const id = await startSession(cookie);
    const r = await submitAnswersHttp(cookie, id, [
      { fieldId: "marriage_date", value: "2015-06-20" },
    ]);
    expect(r.status).toBe(409);
    expect(countRows("intake_answer", id)).toBe(0);
  });

  it("rejects completing an intake straight from PRE_GATE", async () => {
    const id = await startSession(cookie);
    const res = await completeRoute(
      jsonRequest(`/api/intake/${id}/complete`, { cookie }),
      params({ id })
    );
    expect(res.status).toBe(409);
  });

  it("persistence layer itself refuses substantive writes without CLEAR", async () => {
    const id = await startSession(cookie);
    expect(() => insertAnswer(id, "marriage_date", "2015-06-20")).toThrowError(
      /PERSISTENCE_GUARD/
    );
  });

  it("cannot skip ahead in the gate sequence (server owns gate order)", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id);
    // Session is now at GATE_RESIDENCY. Try to answer with a county (the
    // GATE_VENUE payload) — the residency evaluator rejects it as malformed;
    // the state does not advance.
    const r = await runGate(cookie, id, "Bergen");
    expect(r.status).toBe(400);
    expect(getSession(id)?.state).toBe("GATE_RESIDENCY");
  });
});

describe("conflict wall — HIT path", () => {
  it("serves the static referral card, ends the session, persists nothing substantive", async () => {
    const id = await startSession(cookie);
    const r = await runIdentity(cookie, id, HIT_IDENTITY);

    // Static forward-out card, verbatim from config.
    expect(r.data.status).toBe("TERMINATED");
    expect(r.data.card.id).toBe("CONFLICT_REFERRAL");

    // DB level: session, identity, and answers are all gone.
    expect(countRows("intake_session", id)).toBe(0);
    expect(countRows("party_identity", id)).toBe(0);
    expect(countRows("intake_answer", id)).toBe(0);

    // Minimal audit only: a check ran and returned a hit.
    const events = getAuditEvents(id).map((e) => e.event);
    expect(events).toContain("CONFLICT_CHECK_RUN");
    expect(events).toContain("CONFLICT_HIT");
    expect(events).toContain("SESSION_PURGED");

    // The audit detail must NOT contain the parties' names in plaintext.
    const hit = getAuditEvents(id).find((e) => e.event === "CONFLICT_HIT");
    expect(hit?.detail).toBeTruthy();
    expect(hit!.detail!.toLowerCase()).not.toContain("fictionberg");
    expect(hit!.detail!.toLowerCase()).not.toContain("syntheticperson");
  });

  it("a terminated (hit) session cannot be used afterwards", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id, HIT_IDENTITY);
    const res = await viewRoute(
      jsonRequest(`/api/intake/${id}`, { method: "GET", cookie }),
      params({ id })
    );
    expect(res.status).toBe(404);
    const g = await runGate(cookie, id, true);
    expect(g.status).toBe(404);
  });

  it("prior/maiden names also trigger the check (tiebreaker matching)", async () => {
    const id = await startSession(cookie);
    const r = await runIdentity(cookie, id, {
      clientParty: { fullLegalName: "Totally Cleanname", priorNames: ["Sylvia Placeholder"] },
      adverseParty: { fullLegalName: "Also Cleanname", priorNames: [] },
    });
    expect(r.data.status).toBe("TERMINATED");
    expect(r.data.card.id).toBe("CONFLICT_REFERRAL");
  });

  it("identity capture collects names only — extra fields are ignored, never stored", async () => {
    const id = await startSession(cookie);
    const r = await runIdentity(cookie, id, {
      clientParty: { fullLegalName: "Casey Syntheticperson", priorNames: [] },
      adverseParty: { fullLegalName: "Jordan Syntheticperson", priorNames: [] },
      ssn: "000-00-0000",
      story: "here is my whole situation…",
    });
    expect(r.data.result).toBe("CLEAR");
    // Nothing substantive persisted at the pre-gate step.
    expect(countRows("intake_answer", id)).toBe(0);
  });
});
