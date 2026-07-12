/**
 * ACCEPTANCE CRITERION 1 (2.0 form): the conflict wall cannot be bypassed.
 *
 * Automated screening can only park a matter for review — it can never
 * CLEAR or DECLINE. Substantive intake stays blocked until an ATTORNEY
 * records a CLEARED disposition; STAFF/ADMIN attempts fail structurally.
 * The client sees one neutral message for every screen outcome and never
 * the internal result.
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
  setConflictDisposition,
  clearMatter,
  provisionAccount,
  HIT_IDENTITY,
  jsonRequest,
  params,
  freshLimits,
} from "./helpers";
import { countRows, getAuditEvents, getSession, insertAnswer } from "@/lib/db/repo";
import { getMatter } from "@/lib/db/matters";
import { listConflictSubmissionsForMatter } from "@/lib/db/conflicts";
import { resetDbForTests } from "@/lib/db/index";
import { GET as viewRoute } from "@/app/api/intake/[id]/route";
import { POST as completeRoute } from "@/app/api/intake/[id]/complete/route";
import { POST as conflictRoute } from "@/app/api/matters/[id]/conflict/route";
import type { SessionUser } from "@/lib/auth/session";

let cookie: string;

beforeEach(async () => {
  resetDbForTests();
  cookie = await cookieFor(SYNTH_CLIENT);
  freshLimits();
});

describe("conflict wall — bypass attempts fail server-side", () => {
  it("rejects gate answers before screening has even run", async () => {
    const id = await startSession(cookie);
    const r = await runGate(cookie, id, true);
    expect(r.status).toBe(409);
  });

  it("rejects gate answers AFTER screening but BEFORE attorney clearance", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id);
    const r = await runGate(cookie, id, true);
    expect(r.status).toBe(409);
    expect(getSession(id)?.state).toBe("CONFLICT_REVIEW_PENDING");
  });

  it("rejects tier-branch and substantive answers before clearance", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id);
    const rb = await runBranch(cookie, id, "NONE", "NONE");
    expect(rb.status).toBe(409);
    const ra = await submitAnswersHttp(cookie, id, [
      { fieldId: "marriage_date", value: "2015-06-20" },
    ]);
    expect(ra.status).toBe(409);
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

  it("persistence layer itself refuses substantive writes without attorney clearance", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id);
    expect(() => insertAnswer(id, "marriage_date", "2015-06-20")).toThrowError(
      /PERSISTENCE_GUARD/
    );
  });

  it("cannot skip ahead in the gate sequence (server owns gate order)", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id);
    const matterId = getSession(id)!.matterId!;
    await clearMatter(matterId);
    // Session is now at GATE_RESIDENCY. Try to answer with a county (the
    // GATE_VENUE payload) — rejected as malformed; state does not advance.
    const r = await runGate(cookie, id, "Bergen");
    expect(r.status).toBe(400);
    expect(getSession(id)?.state).toBe("GATE_RESIDENCY");
  });
});

describe("automated screening never clears, never declines", () => {
  it("a clean screen still pends attorney review (NO_APPARENT_MATCH)", async () => {
    const id = await startSession(cookie);
    const r = await runIdentity(cookie, id);
    expect(r.status).toBe(200);
    expect(r.data.result).toBe("PENDING_REVIEW");
    const matter = getMatter(getSession(id)!.matterId!)!;
    expect(matter.conflictStatus).toBe("NO_APPARENT_MATCH"); // not CLEARED
    expect(getSession(id)!.conflictClear).toBe(false);
  });

  it("a potential match pends review with the SAME neutral client message", async () => {
    const cleanId = await startSession(cookie);
    const clean = await runIdentity(cookie, cleanId);

    const hitCookie = await cookieFor({
      subject: "devstub|client:hitclient@example.test",
      role: "CLIENT",
      email: "hitclient@example.test",
      name: "Hit Client",
    } satisfies SessionUser);
    const hitId = await startSession(hitCookie);
    const hit = await runIdentity(hitCookie, hitId, HIT_IDENTITY);

    // Identical externally: status, result, and message.
    expect(hit.status).toBe(clean.status);
    expect(hit.data).toEqual(clean.data === null ? null : { ...clean.data, state: hit.data.state });
    expect(hit.data.message).toContain("submitted for review");
    // No internal reasoning leaks.
    const raw = JSON.stringify(hit.data);
    expect(raw).not.toMatch(/POTENTIAL_MATCH|NO_APPARENT_MATCH|match|score/);

    // Internally distinguished for the attorney.
    expect(getMatter(getSession(hitId)!.matterId!)!.conflictStatus).toBe("POTENTIAL_MATCH");
  });

  it("prior/maiden names also trigger the screen (tiebreaker matching)", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id, {
      clientParty: { fullLegalName: "Totally Cleanname", priorNames: ["Sylvia Placeholder"] },
      adverseParty: { fullLegalName: "Also Cleanname", priorNames: [] },
    });
    expect(getMatter(getSession(id)!.matterId!)!.conflictStatus).toBe("POTENTIAL_MATCH");
  });

  it("screen results are audited with hashed names, never plaintext", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id, HIT_IDENTITY);
    const events = getAuditEvents(id).map((e) => e.event);
    expect(events).toContain("CONFLICT_SCREEN_RUN");
    expect(events).toContain("CONFLICT_SCREEN_RESULT");
    const result = getAuditEvents(id).find((e) => e.event === "CONFLICT_SCREEN_RESULT");
    expect(result!.detail!.toLowerCase()).not.toContain("fictionberg");
    expect(result!.detail!.toLowerCase()).not.toContain("syntheticperson");
  });
});

describe("attorney-only dispositions", () => {
  it("only ATTORNEY may clear: STAFF and ADMIN get 403 from the route", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id);
    const matterId = getSession(id)!.matterId!;

    for (const [role, email] of [
      ["STAFF", "staffer@example.test"],
      ["ADMIN", "admin@example.test"],
    ] as const) {
      const user: SessionUser = {
        subject: `devstub|${role.toLowerCase()}:${email}`,
        role,
        email,
        name: role,
      };
      const account = provisionAccount(user);
      const { setUserRole } = await import("@/lib/db/users");
      setUserRole(account.id, role);
      freshLimits();
      const res = await conflictRoute(
        jsonRequest(`/api/matters/${matterId}/conflict`, {
          cookie: await cookieFor(user),
          body: { disposition: "CLEARED" },
        }),
        params({ id: matterId })
      );
      expect([403, 404]).toContain(res.status); // role-refused (or no grant)
      expect(getMatter(matterId)!.conflictStatus).not.toBe("CLEARED");
    }
  });

  it("attorney CLEARED unblocks the parked session and intake proceeds", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id);
    const matterId = getSession(id)!.matterId!;
    await clearMatter(matterId);

    expect(getMatter(matterId)!.conflictStatus).toBe("CLEARED");
    expect(getSession(id)!.state).toBe("GATE_RESIDENCY");
    expect(getSession(id)!.conflictClear).toBe(true);
    const r = await runGate(cookie, id, true);
    expect(r.status).toBe(200);
  });

  it("attorney DECLINED purges session content but retains conflict history", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id, HIT_IDENTITY);
    const matterId = getSession(id)!.matterId!;

    const r = await setConflictDisposition(matterId, "DECLINED");
    expect(r.status).toBe(200);

    // Session + identity + answers gone.
    expect(countRows("intake_session", id)).toBe(0);
    expect(countRows("party_identity", id)).toBe(0);
    expect(countRows("intake_answer", id)).toBe(0);

    // Retained: the conflict submission (future conflict checks) + audit.
    const subs = listConflictSubmissionsForMatter(matterId);
    expect(subs.length).toBe(1);
    expect(subs[0].disposition).toBe("DECLINED");
    expect(subs[0].adverseParty.fullLegalName).toBe("Harold Fictionberg");
    expect(getMatter(matterId)!.conflictStatus).toBe("DECLINED");
    expect(getMatter(matterId)!.lifecycle).toBe("DECLINED");
    expect(getAuditEvents(id).map((e) => e.event)).toContain("SESSION_PURGED");
  });

  it("a declined client's session is gone; the matter view stays neutral", async () => {
    const id = await startSession(cookie);
    await runIdentity(cookie, id, HIT_IDENTITY);
    const matterId = getSession(id)!.matterId!;
    await setConflictDisposition(matterId, "DECLINED");

    const res = await viewRoute(
      jsonRequest(`/api/intake/${id}`, { method: "GET", cookie }),
      params({ id })
    );
    expect(res.status).toBe(404);

    const { GET: matterView } = await import("@/app/api/matters/[id]/route");
    freshLimits();
    const mres = await matterView(
      jsonRequest(`/api/matters/${matterId}`, { method: "GET", cookie }),
      params({ id: matterId })
    );
    const body = await mres.json();
    expect(JSON.stringify(body)).not.toMatch(/DECLINED|POTENTIAL_MATCH|conflict/i);
  });

  it("identity capture collects names only — extra fields are ignored, never stored", async () => {
    const id = await startSession(cookie);
    const r = await runIdentity(cookie, id, {
      clientParty: { fullLegalName: "Casey Syntheticperson", priorNames: [] },
      adverseParty: { fullLegalName: "Jordan Syntheticperson", priorNames: [] },
      ssn: "000-00-0000",
      story: "here is my whole situation…",
    });
    expect(r.data.result).toBe("PENDING_REVIEW");
    expect(countRows("intake_answer", id)).toBe(0);
    const subs = listConflictSubmissionsForMatter(getSession(id)!.matterId!);
    expect(JSON.stringify(subs)).not.toContain("000-00-0000");
  });
});
