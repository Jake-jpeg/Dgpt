/**
 * Conversational-intake orchestrator + API (spec §4). NO live provider
 * calls — every Anthropic interaction is a mocked Messages-API fetch that
 * returns a forced INTAKE_TURN tool_use block.
 *
 * Pinned here:
 *  - the scripted welcome is server-side, never model-generated;
 *  - answers persist ONLY through the validated store (an invalid proposal
 *    triggers one corrective retry, and nothing invalid is ever saved);
 *  - gate answers drive the REAL machine (cascade transitions + flags);
 *  - a DV disclosure serves the exit card, pauses the session, and stops
 *    further turns without a provider call;
 *  - completion → READY_FOR_REVIEW only via the sequencer's say-so;
 *  - RBAC: clients only touch their own session; staff/attorney read the
 *    transcript through matter access; the kill switch 503s the POST.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import {
  cookieFor,
  SYNTH_CLIENT,
  SYNTH_ATTORNEY,
  provisionAccount,
  setupClientWithMatter,
  startSession,
  jsonRequest,
  params,
  freshLimits,
  type MatterContext,
} from "./helpers";
import { getSession } from "@/lib/db/repo";
import { getMatterAnswers } from "@/lib/db/intake2";
import { grantMatterAccess } from "@/lib/db/matters";
import { listChatMessages } from "@/lib/db/intake-chat";
import {
  runIntakeTurn,
  ensureWelcomed,
  conversationView,
  INTAKE_TURN_SCHEMA,
} from "@/lib/intake-chat/orchestrator";
import { INTAKE_CONSTITUTION_VERSION } from "@/lib/intake-chat/constitution";
import { GET as chatGet, POST as chatPost } from "@/app/api/intake-chat/[sessionId]/route";
import type { SessionUser } from "@/lib/auth/session";

let ctx: MatterContext;
let clientCookie: string;
let sessionId: string;
let clientUserId: string;

function turnPayload(over: Record<string, unknown> = {}) {
  return {
    say: "Thanks — got it. Next question…",
    lang: "en",
    record_answers: [],
    gate_response: null,
    flag_for_attorney: null,
    control: "CONTINUE",
    ...over,
  };
}

/** Sequential mocked provider responses (one per callStructured call). */
function mockTurns(...payloads: unknown[]) {
  let i = 0;
  const mock = vi.fn(async () => {
    const payload = payloads[Math.min(i, payloads.length - 1)];
    i += 1;
    return new Response(
      JSON.stringify({
        id: `resp_synthetic_${i}`,
        model: "claude-test-model",
        content: [{ type: "tool_use", id: "toolu_synthetic", name: "INTAKE_TURN", input: payload }],
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}

function enableChat() {
  process.env.INTAKE_CHAT_ENABLED = "true";
  process.env.AI_FEATURES_ENABLED = "true";
  process.env.ANTHROPIC_API_KEY = "sk-synthetic-eval-key-never-real";
  process.env.ANTHROPIC_MODEL = "claude-test-model";
  process.env.FIRM_CONTACT = "(201) 555-0100";
}

beforeEach(async () => {
  resetDbForTests();
  freshLimits();
  enableChat();
  ctx = await setupClientWithMatter();
  clientUserId = ctx.clientUserId;
  clientCookie = await cookieFor(SYNTH_CLIENT);
  sessionId = await startSession(clientCookie); // born at GATE_RESIDENCY
});

afterEach(() => {
  delete process.env.INTAKE_CHAT_ENABLED;
  delete process.env.AI_FEATURES_ENABLED;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.FIRM_CONTACT;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("scripted opening", () => {
  it("welcome is server-scripted, records the constitution version, and needs no provider", async () => {
    const boom = vi.fn(() => {
      throw new Error("no provider call for the welcome");
    });
    vi.stubGlobal("fetch", boom);
    await ensureWelcomed(sessionId);
    const t = await listChatMessages(sessionId);
    // The welcome itself is no longer persisted (2026-07-31 — the verbatim
    // transcript is not retained); a SYSTEM_EVENT marker records that it was
    // delivered, and conversationView re-renders the scripted text.
    expect(t[0].role).toBe("SYSTEM_EVENT");
    expect(t[0].content).toContain(INTAKE_CONSTITUTION_VERSION);
    expect(t[1].role).toBe("SYSTEM_EVENT");
    expect(t[1].content).toBe("welcome delivered");
    expect(t).toHaveLength(2);
    const view = await conversationView(sessionId);
    expect(view.transcript[0].role).toBe("ASSISTANT");
    expect(view.transcript[0].content).toContain("not a lawyer");
    // Rule 13: the opening states about how many questions to expect.
    expect(view.transcript[0].content).toMatch(/up to about \d+ questions/);
    expect(boom).not.toHaveBeenCalled();
    // Idempotent — the marker is what makes it so now that the greeting
    // itself leaves no row behind.
    await ensureWelcomed(sessionId);
    const after = await listChatMessages(sessionId);
    expect(after.filter((m) => m.content === "welcome delivered")).toHaveLength(1);
    expect(after.some((m) => m.role === "ASSISTANT")).toBe(false);
  });
});

describe("gates ride the real machine", () => {
  it("a 2-year residency yes advances GATE_RESIDENCY → GATE_VENUE", async () => {
    mockTurns(
      turnPayload({ gate_response: { gateId: "GATE_RESIDENCY", value: true } })
    );
    const r = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "Yes, over ten years." });
    expect(r.stopped).toBeNull();
    expect((await getSession(sessionId))!.state).toBe("GATE_VENUE");
  });

  it("PHASE 1: 1yr + nexus passes clean; under one year → attorney-review card, session pauses", async () => {
    mockTurns(turnPayload({ gate_response: { gateId: "GATE_RESIDENCY", value: false } }));
    await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "No, about 18 months." });
    expect((await getSession(sessionId))!.state).toBe("GATE_RESIDENCY_1YR");

    mockTurns(turnPayload({ gate_response: { gateId: "GATE_RESIDENCY_1YR", value: false } }));
    const r = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "Actually just moved here." });
    // Under one year: durational residency is jurisdictional — the phase-1
    // lane stops and an attorney reviews before anything proceeds.
    expect(r.stopped).toBe("SCOPE");
    expect(r.card?.title).toContain("attorney needs to look");
    expect(r.card?.body).toContain("isn't a rejection");
    const s = (await getSession(sessionId))!;
    expect(s.attorneyFlags.some((f) => f.startsWith("INTAKE_STOPPED_"))).toBe(true);
  });

  it("legacy (INTAKE_PHASE=ALL): the no/no cascade path flags for attorney review and CONTINUES", async () => {
    process.env.INTAKE_PHASE = "ALL";
    try {
      mockTurns(turnPayload({ gate_response: { gateId: "GATE_RESIDENCY", value: false } }));
      await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "No, we moved recently." });
      expect((await getSession(sessionId))!.state).toBe("GATE_RESIDENCY_1YR");

      mockTurns(turnPayload({ gate_response: { gateId: "GATE_RESIDENCY_1YR", value: false } }));
      const r = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "Less than a year." });
      expect(r.stopped).toBeNull(); // legacy: residency NEVER terminates
      const s = (await getSession(sessionId))!;
      expect(s.state).toBe("GATE_VENUE");
      expect(s.attorneyFlags).toContain("RESIDENCY_ATTORNEY_REVIEW");
    } finally {
      delete process.env.INTAKE_PHASE;
    }
  });

  it("a gate answer for the WRONG gate is rejected and retried — the machine owns order", async () => {
    const mock = mockTurns(
      turnPayload({ gate_response: { gateId: "GATE_DV", value: false } }), // wrong: current is GATE_RESIDENCY
      turnPayload({ gate_response: { gateId: "GATE_RESIDENCY", value: true } })
    );
    await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "yes" });
    // wrong gate → correction, correct gate → advance, then the phase-2
    // "ask the next question" call (Rule 12) = 3 provider calls.
    expect(mock).toHaveBeenCalledTimes(3);
    expect((await getSession(sessionId))!.state).toBe("GATE_VENUE");
  });

  it("a DV disclosure serves the exit card and pauses the session; later turns need no provider", async () => {
    // Walk to GATE_DV: residency yes, venue Kings.
    mockTurns(turnPayload({ gate_response: { gateId: "GATE_RESIDENCY", value: true } }));
    await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "yes" });
    mockTurns(turnPayload({ gate_response: { gateId: "GATE_VENUE", value: "Kings" } }));
    await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "Brooklyn — Kings county" });

    mockTurns(turnPayload({ gate_response: { gateId: "GATE_DV", value: true }, control: "STOPPED_DV" }));
    const r = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "yes, there was" });
    expect(r.stopped).toBe("DV");
    expect(r.card?.title).toContain("person");
    expect(JSON.stringify(r.card)).toContain("800-942-6906"); // NYS hotline

    // Paused: the next turn answers WITHOUT calling the provider.
    const boom = vi.fn(() => {
      throw new Error("no provider call while paused");
    });
    vi.stubGlobal("fetch", boom);
    const r2 = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "hello?" });
    expect(r2.stopped).toBe("DV");
    expect(boom).not.toHaveBeenCalled();
  });
});

describe("the assistant drives the conversation (Rule 12)", () => {
  it("after recording an answer, a phase-2 call asks the next question in the SAME reply", async () => {
    const mock = mockTurns(
      turnPayload({ gate_response: { gateId: "GATE_RESIDENCY", value: true }, say: "Got it." }),
      turnPayload({ say: "Great — next: which New York county do you live in?" })
    );
    const r = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "yes, 12 years" });
    // Two calls: phase-1 records, phase-2 asks the next question.
    expect(mock).toHaveBeenCalledTimes(2);
    // The client sees the phase-2 reply (the next question), never a dead stop.
    expect(r.say).toContain("county");
    expect((await getSession(sessionId))!.state).toBe("GATE_VENUE");
  });

  it("when the client asks a question instead of answering, nothing advances and there is NO phase-2", async () => {
    const mock = mockTurns(
      turnPayload({ say: "Sure — this asks whether you've lived in New York for 2+ years, which helps the attorney work out where your case can proceed. Whenever you're ready: have you or your spouse lived in NY continuously for the past 2 years?" })
    );
    const r = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "wait, why are you asking that?" });
    expect(mock).toHaveBeenCalledTimes(1); // no drive-forward call
    expect(r.say).toContain("where your case can proceed");
    // Stayed on the same question — nothing recorded.
    expect((await getSession(sessionId))!.state).toBe("GATE_RESIDENCY");
  });
});

describe("answers: the model proposes, the server disposes", () => {
  beforeEach(async () => {
    // Past the gates: yes → Kings → no DV → no children → fully agree.
    for (const [gate, value] of [
      ["GATE_RESIDENCY", true],
      ["GATE_VENUE", "Kings"],
      ["GATE_DV", false],
      ["GATE_CHILDREN", false],
      ["GATE_COMPLEXITY", "FULLY_AGREE"],
    ] as const) {
      mockTurns(turnPayload({ gate_response: { gateId: gate, value } }));
      await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "answer" });
    }
    expect((await getSession(sessionId))!.state).toBe("TIER_BRANCH");
  });

  it("a valid proposed answer lands in the SAME store the form writes", async () => {
    mockTurns(
      turnPayload({
        record_answers: [{ questionId: "shared.identity.client_name", value: "Casey Syntheticperson" }],
      })
    );
    await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "My name is Casey Syntheticperson" });
    const answers = await getMatterAnswers(ctx.matterId);
    expect(answers["shared.identity.client_name"]).toBe("Casey Syntheticperson");
    // The transcript records the machine moment, not just the chat.
    const events = (await listChatMessages(sessionId)).filter((m) => m.role === "SYSTEM_EVENT");
    expect(events.some((e) => e.content === "answer recorded q=shared.identity.client_name")).toBe(true);
  });

  it("an INVALID proposal is rejected, retried once, and never saved", async () => {
    const mock = mockTurns(
      turnPayload({ record_answers: [{ questionId: "made.up.question", value: "x" }] }),
      turnPayload({ record_answers: [{ questionId: "shared.identity.client_name", value: "Casey S." }] })
    );
    await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "Casey S." });
    // invalid → correction, valid → save + advance, then phase-2 ask = 3.
    expect(mock).toHaveBeenCalledTimes(3);
    const answers = await getMatterAnswers(ctx.matterId);
    expect(answers["made.up.question"]).toBeUndefined();
    expect(answers["shared.identity.client_name"]).toBe("Casey S.");
  });

  it("two invalid proposals in a row save NOTHING and return an honest fallback", async () => {
    const mock = mockTurns(
      turnPayload({ record_answers: [{ questionId: "nope.one", value: 1 }] }),
      turnPayload({ record_answers: [{ questionId: "nope.two", value: 2 }] })
    );
    const r = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "hm" });
    expect(mock).toHaveBeenCalledTimes(2);
    expect(r.say.toLowerCase()).toContain("once more");
    const answers = await getMatterAnswers(ctx.matterId);
    expect(Object.keys(answers).filter((k) => k.startsWith("nope."))).toEqual([]);
  });

  it("unknown answer ids are rejected; premature INTAKE_COMPLETE is ignored", async () => {
    const mock = mockTurns(
      turnPayload({ record_answers: [{ questionId: "shared.does_not_exist", value: "x" }] }),
      turnPayload({ control: "INTAKE_COMPLETE" }) // premature: questions remain
    );
    const r = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "I have that document" });
    expect(mock).toHaveBeenCalledTimes(2);
    expect(r.complete).toBe(false);
    expect((await getSession(sessionId))!.state).not.toBe("READY_FOR_REVIEW");
  });
});

const SYNTH_STAFF: SessionUser = {
  subject: "devstub|staff:staffer@example.test",
  role: "STAFF",
  email: "staffer@example.test",
  name: "Synthetic Staffer",
};

describe("API surface", () => {
  it("kill switch: POST 503s with a use-the-form message; GET still serves", async () => {
    process.env.INTAKE_CHAT_ENABLED = "false";
    freshLimits();
    const res = await chatPost(
      jsonRequest(`/api/intake-chat/${sessionId}`, { cookie: clientCookie, body: { message: "hi" } }),
      params({ sessionId })
    );
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("form");
    freshLimits();
    const g = await chatGet(
      jsonRequest(`/api/intake-chat/${sessionId}`, { method: "GET", cookie: clientCookie }),
      params({ sessionId })
    );
    expect(g.status).toBe(200);
    expect((await g.json()).enabled).toBe(false);
  });

  it("a client cannot touch another client's session (404, never existence)", async () => {
    const other: SessionUser = {
      subject: "google|other-client-sub",
      role: "CLIENT",
      email: "otherclient@example.test",
      name: "Other Client",
    };
    await provisionAccount(other);
    freshLimits();
    const res = await chatPost(
      jsonRequest(`/api/intake-chat/${sessionId}`, {
        cookie: await cookieFor(other),
        body: { message: "let me in" },
      }),
      params({ sessionId })
    );
    expect(res.status).toBe(404);
  });

  it("ADMIN cannot post turns; STAFF is refused the chat GET entirely", async () => {
    const admin: SessionUser = {
      subject: "devstub|admin:admin@example.test",
      role: "ADMIN",
      email: "admin@example.test",
      name: "Admin",
    };
    await provisionAccount(admin);
    freshLimits();
    const res = await chatPost(
      jsonRequest(`/api/intake-chat/${sessionId}`, { cookie: await cookieFor(admin), body: { message: "hi" } }),
      params({ sessionId })
    );
    expect([401, 403]).toContain(res.status);

    // 2026-07-31: the verbatim transcript is not retained and the firm's
    // read-only panel is gone, so there is nothing here for the firm to read.
    // Matter access no longer buys a way in — the route is CLIENT-only.
    const staffAccount = await provisionAccount(SYNTH_STAFF);
    await grantMatterAccess(ctx.matterId, staffAccount.id, ctx.attorneyUserId);
    await ensureWelcomed(sessionId);
    freshLimits();
    const g = await chatGet(
      jsonRequest(`/api/intake-chat/${sessionId}`, { method: "GET", cookie: await cookieFor(SYNTH_STAFF) }),
      params({ sessionId })
    );
    expect([401, 403]).toContain(g.status);
  });

  it("not even the ATTORNEY can read the chat — there is no transcript to read", async () => {
    // The attorney's window into a matter is the structured ANSWERS and the
    // lock panel's reason code, not the client's words (operator, 2026-07-31:
    // "Nuke the transcript"). Deciding whether to reopen means calling the
    // client. Matter access is irrelevant here; the route is CLIENT-only.
    await ensureWelcomed(sessionId);
    freshLimits();
    const g = await chatGet(
      jsonRequest(`/api/intake-chat/${sessionId}`, { method: "GET", cookie: await cookieFor(SYNTH_ATTORNEY) }),
      params({ sessionId })
    );
    expect([401, 403]).toContain(g.status);

    // And nothing the client said is on disk to leak in the first place.
    const rows = await listChatMessages(sessionId);
    expect(rows.every((m) => m.role === "SYSTEM_EVENT")).toBe(true);
  });
});

describe("prompt plumbing", () => {
  it("the provider payload carries the versioned constitution and the forced INTAKE_TURN tool", async () => {
    const mock = mockTurns(turnPayload({ gate_response: { gateId: "GATE_RESIDENCY", value: true } }));
    await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "yes" });
    const [, init] = mock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.system).toContain(`CONSTITUTION ${INTAKE_CONSTITUTION_VERSION}`);
    expect(body.system).toContain("RULES 2-5 OUTRANK WARMTH");
    expect(body.tool_choice).toEqual({ type: "tool", name: "INTAKE_TURN" });
    expect(body.tools[0].input_schema).toEqual(INTAKE_TURN_SCHEMA);
    // Metadata uses the safety identifier — never client PII.
    expect(JSON.stringify(body.metadata)).not.toContain("client@");
    expect(JSON.stringify(body.metadata)).not.toContain("Casey");
  });
});
