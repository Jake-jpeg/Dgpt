/**
 * ACCEPTANCE CRITERION 5: both intake modes work — (a) client-initiated
 * intake surfacing to the attorney for review; (b) attorney-initiated intake
 * for an existing client. Both pass through the same conflict wall and scope
 * gate.
 *
 * ACCEPTANCE CRITERION 7: the Stage-2 "execute draft" affordance is disabled/
 * stubbed and wired to nothing.
 */
import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  cookieFor,
  SYNTH_CLIENT,
  SYNTH_ATTORNEY,
  startSession,
  runToTierBranch,
  runBranch,
  runIdentity,
  submitAnswersHttp,
  completeHttp,
  TIER1_ANSWERS,
  TIER2_ANSWERS,
  HIT_IDENTITY,
  jsonRequest,
  params,
  freshLimits,
} from "./helpers";
import { GET as attorneyList } from "@/app/api/attorney/sessions/route";
import { GET as attorneyDetail } from "@/app/api/attorney/sessions/[id]/route";
import { getAuditEvents } from "@/lib/db/repo";

beforeEach(freshLimits);

describe("mode (a): client-initiated intake → attorney review", () => {
  it("full Tier 1 happy path lands in the attorney's ready-for-review list", async () => {
    const clientCookie = await cookieFor(SYNTH_CLIENT);
    const id = await startSession(clientCookie);
    await runToTierBranch(clientCookie, id);
    const b = await runBranch(clientCookie, id, "NONE", "NONE");
    expect(b.data.tier).toBe("TIER1");

    const save = await submitAnswersHttp(clientCookie, id, TIER1_ANSWERS);
    expect(save.data.missing).toEqual([]);
    const done = await completeHttp(clientCookie, id);
    expect(done.status).toBe(200);
    expect(done.data.state).toBe("READY_FOR_REVIEW");

    // The conflict wall was actually passed through (audited).
    const events = getAuditEvents(id).map((e) => e.event);
    expect(events).toContain("CONFLICT_SCREEN_RUN");
    expect(events).toContain("CONFLICT_CLEARED_BY_ATTORNEY");
    expect(events).toContain("READY_FOR_REVIEW");

    // Attorney sees it.
    const attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
    freshLimits();
    const listRes = await attorneyList(
      jsonRequest("/api/attorney/sessions", { method: "GET", cookie: attorneyCookie })
    );
    const list = await listRes.json();
    expect(list.ready.map((r: { id: string }) => r.id)).toContain(id);

    // Review detail contains the packaged intake.
    freshLimits();
    const detailRes = await attorneyDetail(
      jsonRequest(`/api/attorney/sessions/${id}`, { method: "GET", cookie: attorneyCookie }),
      params({ id })
    );
    expect(detailRes.status).toBe(200);
    const detail = await detailRes.json();
    expect(detail.session.tier).toBe("TIER1");
    expect(detail.identity.clientParty.fullLegalName).toBe("Casey Syntheticperson");
    expect(detail.sections.length).toBeGreaterThan(3);
    expect(detail.audit.map((a: { event: string }) => a.event)).toContain("CONFLICT_CLEARED_BY_ATTORNEY");
  });

  it("incomplete intake cannot be completed", async () => {
    const clientCookie = await cookieFor(SYNTH_CLIENT);
    const id = await startSession(clientCookie);
    await runToTierBranch(clientCookie, id);
    await runBranch(clientCookie, id, "NONE", "NONE");
    await submitAnswersHttp(clientCookie, id, TIER1_ANSWERS.slice(0, 3));
    const done = await completeHttp(clientCookie, id);
    expect(done.status).toBe(400);
  });

  it("Tier-1 confirmations must be true — an unchecked confirmation is rejected", async () => {
    const clientCookie = await cookieFor(SYNTH_CLIENT);
    const id = await startSession(clientCookie);
    await runToTierBranch(clientCookie, id);
    await runBranch(clientCookie, id, "NONE", "NONE");
    const r = await submitAnswersHttp(clientCookie, id, [
      { fieldId: "t1_no_assets_confirm", value: false },
    ]);
    expect(r.status).toBe(400);
  });

  it("unknown / out-of-tier fields are rejected", async () => {
    const clientCookie = await cookieFor(SYNTH_CLIENT);
    const id = await startSession(clientCookie);
    await runToTierBranch(clientCookie, id);
    await runBranch(clientCookie, id, "NONE", "NONE"); // TIER1
    const r1 = await submitAnswersHttp(clientCookie, id, [
      { fieldId: "maint_amount", value: 1000 }, // Tier-2 field
    ]);
    expect(r1.status).toBe(400);
    const r2 = await submitAnswersHttp(clientCookie, id, [
      { fieldId: "made_up_field", value: "x" },
    ]);
    expect(r2.status).toBe(400);
  });
});

describe("mode (b): attorney-initiated intake — same wall, same gate", () => {
  it("attorney runs a Tier 2 intake for an existing client, QDRO flagged, ready for review", async () => {
    const attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
    const id = await startSession(attorneyCookie);
    await runToTierBranch(attorneyCookie, id);
    const b = await runBranch(attorneyCookie, id, "SETTLED", "AGREED");
    expect(b.data.tier).toBe("TIER2");

    const save = await submitAnswersHttp(attorneyCookie, id, TIER2_ANSWERS);
    expect(save.data.missing).toEqual([]);
    const done = await completeHttp(attorneyCookie, id);
    expect(done.data.state).toBe("READY_FOR_REVIEW");

    freshLimits();
    const detailRes = await attorneyDetail(
      jsonRequest(`/api/attorney/sessions/${id}`, { method: "GET", cookie: attorneyCookie }),
      params({ id })
    );
    const detail = await detailRes.json();
    expect(detail.session.initiatedBy).toBe("ATTORNEY");
    expect(detail.session.tier).toBe("TIER2");
    // QDRO-needed = in scope, flagged, intake continued to completion.
    expect(detail.session.qdroFlag).toBe(true);
    expect(detail.session.attorneyFlags).toContain("QDRO_NEEDED");
    // The wall was audited for the attorney path too.
    expect(detail.audit.map((a: { event: string }) => a.event)).toContain("CONFLICT_SCREEN_RUN");
  });

  it("attorney-initiated sessions hit the conflict wall exactly like client ones", async () => {
    const attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
    const id = await startSession(attorneyCookie);
    const r = await runIdentity(attorneyCookie, id, HIT_IDENTITY);
    // Same wall: the screen pends attorney review even for attorney-initiated
    // sessions — no privileged path, no automated clearance.
    expect(r.data.result).toBe("PENDING_REVIEW");
    const { getSession } = await import("@/lib/db/repo");
    const { getMatter } = await import("@/lib/db/matters");
    expect(getMatter(getSession(id)!.matterId!)!.conflictStatus).toBe("POTENTIAL_MATCH");
  });

  it("attorney cannot skip the scope gate on their own intake", async () => {
    const attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
    const id = await startSession(attorneyCookie);
    await runIdentity(attorneyCookie, id);
    // Straight to answers without the gates → rejected.
    const r = await submitAnswersHttp(attorneyCookie, id, [
      { fieldId: "marriage_date", value: "2010-01-01" },
    ]);
    expect(r.status).toBe(409);
  });
});

describe("criterion 7: Stage-2 drafting is stubbed and wired to nothing", () => {
  it("the review API advertises draftingAvailable=false", async () => {
    const clientCookie = await cookieFor(SYNTH_CLIENT);
    const id = await startSession(clientCookie);
    await runToTierBranch(clientCookie, id);
    await runBranch(clientCookie, id, "NONE", "NONE");
    await submitAnswersHttp(clientCookie, id, TIER1_ANSWERS);
    await completeHttp(clientCookie, id);

    const attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
    freshLimits();
    const detailRes = await attorneyDetail(
      jsonRequest(`/api/attorney/sessions/${id}`, { method: "GET", cookie: attorneyCookie }),
      params({ id })
    );
    const detail = await detailRes.json();
    expect(detail.stage2.draftingAvailable).toBe(false);
  });

  it("no drafting/MSA/document endpoint exists anywhere in the API surface", () => {
    const apiDir = path.join(__dirname, "..", "src", "app", "api");
    const routes: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else routes.push(p);
      }
    };
    walk(apiDir);
    const offenders = routes.filter((r) => /draft|msa|document|generate/i.test(r));
    expect(offenders).toEqual([]);
  });

  it("the review UI renders the Stage-2 button disabled", () => {
    const page = fs.readFileSync(
      path.join(__dirname, "..", "src", "app", "attorney", "session", "[id]", "page.tsx"),
      "utf8"
    );
    // The affordance exists…
    expect(page).toContain("Generate MSA draft (Stage 2)");
    // …is disabled…
    expect(page).toMatch(/<button\s[^>]*disabled/);
    // …and has no click handler wired to it.
    expect(page).not.toMatch(/Generate MSA draft[\s\S]{0,200}onClick/);
    expect(page.slice(0, page.indexOf("Generate MSA draft"))).not.toMatch(
      /onClick[^\n]*draft/i
    );
  });
});
