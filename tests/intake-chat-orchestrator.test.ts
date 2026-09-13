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
 *  - NOTHING STOPS THE CLIENT (2026-09-13): a DV disclosure shows the
 *    resources card, flags the session for the attorney, and CONTINUES;
 *    children / disagreement / short residency flag and continue;
 *  - gates read the facts on file: a child recorded at the children gate
 *    settles the gate without re-asking (the NJ live run asked it 4×);
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

  it("no 'Where we left off' while the client is still on the first question (2026-09-12)", async () => {
    await ensureWelcomed(sessionId);
    const fresh = await conversationView(sessionId);
    // The welcome already ends with the first question; repeating it under
    // a resume heading before anything was answered read as a bug.
    expect(fresh.transcript).toHaveLength(1);
    expect(fresh.transcript[0].content).toMatch(/First question:/);
    expect(fresh.transcript.some((m) => m.content.startsWith("Where we left off"))).toBe(false);

    // One answer in → the resume line appears for the step that is pending.
    mockTurns(turnPayload({ gate_response: { gateId: "GATE_RESIDENCY", value: true } }));
    await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "Yes, over ten years." });
    const resumed = await conversationView(sessionId);
    expect(resumed.transcript).toHaveLength(2);
    expect(resumed.transcript[1].content).toMatch(/^Where we left off — /);
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

  it("under one year → attorney-review FLAG, the interview continues (nothing stops the client, 2026-09-13)", async () => {
    mockTurns(turnPayload({ gate_response: { gateId: "GATE_RESIDENCY", value: false } }));
    await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "No, about 18 months." });
    expect((await getSession(sessionId))!.state).toBe("GATE_RESIDENCY_1YR");

    mockTurns(turnPayload({ gate_response: { gateId: "GATE_RESIDENCY_1YR", value: false } }));
    const r = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "Actually just moved here." });
    expect(r.stopped).toBeNull();
    expect(r.card).toBeNull();
    const s = (await getSession(sessionId))!;
    expect(s.state).toBe("GATE_VENUE");
    expect(s.attorneyFlags).toContain("RESIDENCY_ATTORNEY_REVIEW");
    expect(s.attorneyFlags.some((f) => f.startsWith("INTAKE_STOPPED_"))).toBe(false);
  });

  it("INTAKE_PHASE=ALL behaves identically — there is one policy now", async () => {
    process.env.INTAKE_PHASE = "ALL";
    try {
      mockTurns(turnPayload({ gate_response: { gateId: "GATE_RESIDENCY", value: false } }));
      await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "No, we moved recently." });
      mockTurns(turnPayload({ gate_response: { gateId: "GATE_RESIDENCY_1YR", value: false } }));
      const r = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "Less than a year." });
      expect(r.stopped).toBeNull();
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

  it("a DV disclosure shows the resources card WITH the firm's contact, flags the attorney, and CONTINUES", async () => {
    process.env.FIRM_ATTORNEY_FIRM = "Example Law LLC";
    process.env.FIRM_ATTORNEY_PHONE = "(201) 555-0199";
    try {
      // Walk to GATE_DV: residency yes, venue Kings.
      mockTurns(turnPayload({ gate_response: { gateId: "GATE_RESIDENCY", value: true } }));
      await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "yes" });
      mockTurns(turnPayload({ gate_response: { gateId: "GATE_VENUE", value: "Kings" } }));
      await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "Brooklyn — Kings county" });

      mockTurns(
        turnPayload({ gate_response: { gateId: "GATE_DV", value: true }, say: "I'm so sorry. An attorney will review this personally." }),
        turnPayload({ say: "Whenever you're ready — do you and your spouse have children together?" })
      );
      const r = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "yes, there was" });
      expect(r.stopped).toBeNull();
      // The interview moved on to the children gate.
      const s = (await getSession(sessionId))!;
      expect(s.state).toBe("GATE_CHILDREN");
      expect(s.attorneyFlags).toContain("DV_DISCLOSED_ATTORNEY_REVIEW");
      // The card rides along for the client to see once — firm contact
      // filled from env (FIRM_CONTACT wins when set; enableChat sets it).
      expect(r.card?.title).toContain("your attorney will review this personally");
      expect(JSON.stringify(r.card)).toContain("800-942-6906"); // NYS hotline
      expect(r.card?.resources?.[0].value).toBe("(201) 555-0100");
      expect(r.card?.body).not.toMatch(/will not continue/i);

      // Not paused: the next turn goes to the provider like any other.
      const mock = mockTurns(turnPayload({ gate_response: { gateId: "GATE_CHILDREN", value: false } }));
      const r2 = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "no children" });
      expect(r2.stopped).toBeNull();
      expect(mock).toHaveBeenCalled();
      expect((await getSession(sessionId))!.state).toBe("GATE_COMPLEXITY");
    } finally {
      delete process.env.FIRM_ATTORNEY_FIRM;
      delete process.env.FIRM_ATTORNEY_PHONE;
    }
  });

  it("children: yes → flag + continue, and the gate answer prefills shared.children.any (never re-asked)", async () => {
    for (const [gate, value] of [
      ["GATE_RESIDENCY", true],
      ["GATE_VENUE", "Kings"],
      ["GATE_DV", false],
    ] as const) {
      mockTurns(turnPayload({ gate_response: { gateId: gate, value } }));
      await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "…" });
    }
    mockTurns(turnPayload({ gate_response: { gateId: "GATE_CHILDREN", value: true } }));
    const r = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "Yes, one son." });
    expect(r.stopped).toBeNull();
    const s = (await getSession(sessionId))!;
    expect(s.state).toBe("GATE_COMPLEXITY");
    expect(s.attorneyFlags).toContain("CHILDREN_PRESENT_ATTORNEY_REVIEW");
    expect((await getMatterAnswers(ctx.matterId))["shared.children.any"]).toBe(true);
  });

  it("the gate reads the facts on file: a child RECORDED at the children gate settles the gate without gate_response (the 4× re-ask)", async () => {
    for (const [gate, value] of [
      ["GATE_RESIDENCY", true],
      ["GATE_VENUE", "Kings"],
      ["GATE_DV", false],
    ] as const) {
      mockTurns(turnPayload({ gate_response: { gateId: gate, value } }));
      await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "…" });
    }
    expect((await getSession(sessionId))!.state).toBe("GATE_CHILDREN");
    // The model records the child but omits gate_response — exactly what
    // happened live on 2026-09-12 ("Yes - just Aaron, born March 4 2018").
    const mock = mockTurns(
      turnPayload({
        gate_response: null,
        record_answers: [
          { questionId: "shared.children.any", value_json: "true" },
          { questionId: "shared.children.records", value_json: JSON.stringify([{ fullName: "Aaron Test", dateOfBirth: "2018-03-04" }]) },
        ],
      }),
      turnPayload({ say: "Thanks. Do you fully agree on how everything is divided?" })
    );
    const r = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "Yes - just Aaron, born March 4 2018" });
    expect(r.stopped).toBeNull();
    const s = (await getSession(sessionId))!;
    expect(s.state).toBe("GATE_COMPLEXITY"); // settled from the record, not re-asked
    expect(s.attorneyFlags).toContain("CHILDREN_PRESENT_ATTORNEY_REVIEW");
    expect(mock).toHaveBeenCalledTimes(2); // record turn + the drive-forward ask
    const events = (await listChatMessages(sessionId)).filter((m) => m.role === "SYSTEM_EVENT").map((m) => m.content);
    expect(events).toContain("gate GATE_CHILDREN settled from the facts on file");
  });

  it("complexity: disagreement → flag + continue into the questions", async () => {
    for (const [gate, value] of [
      ["GATE_RESIDENCY", true],
      ["GATE_VENUE", "Kings"],
      ["GATE_DV", false],
      ["GATE_CHILDREN", false],
    ] as const) {
      mockTurns(turnPayload({ gate_response: { gateId: gate, value } }));
      await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "…" });
    }
    mockTurns(turnPayload({ gate_response: { gateId: "GATE_COMPLEXITY", value: "DISAGREEMENT" } }));
    const r = await runIntakeTurn({ sessionId, actingUserId: clientUserId, message: "we disagree about the house" });
    expect(r.stopped).toBeNull();
    expect(r.card).toBeNull(); // no bar-referral card, ever
    const s = (await getSession(sessionId))!;
    expect(s.state).toBe("TIER_BRANCH");
    expect(s.attorneyFlags).toContain("COMPLEXITY_ATTORNEY_REVIEW");
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
