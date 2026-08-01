/**
 * The gate phase must RECORD, not just gate (2026-08-01).
 *
 * From a live screenshot. The client opened with everything at once:
 *
 *   "my name is Jake Kim my wife is Joo Kim we were married on 1/2/2023.
 *    Our relationship fell apart on 1/3/2024. We both live in New York
 *    County, NY have been for the last 10 years. 60W 13th Street,
 *    Manhattan NY."
 *
 * The bot answered "I have all your information" — and then, a dozen turns
 * later, asked for his full legal name, his address, his wife's name, his
 * wife's address, whether they were married, and the marriage date. Every one
 * of those was in that first message. The client's replies degraded to "same
 * as above", "I told you above", "again, above."
 *
 * ROOT CAUSE: `describeStep`'s GATE branch named no question ids at all. It
 * told the model to set `gate_response` and nothing else, so during the entire
 * gate phase — which is where a first message lands — the model COULD NOT
 * record anything. The server was never the obstacle: `saveMatterAnswers`
 * validates ids against the pinned schema and never compares them to the
 * current step, and the gate prefill has always written answers mid-gate.
 * Only the prompt was withholding the roster.
 *
 * These tests pin the prompt contract, because that is where the defect was.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import {
  setupClientWithMatter,
  cookieFor,
  freshLimits,
  startSession,
  SYNTH_CLIENT,
  type MatterContext,
} from "./helpers";
import { runIntakeTurn } from "@/lib/intake-chat/orchestrator";
import { getMatterAnswers } from "@/lib/db/intake2";
import { getSession } from "@/lib/db/repo";

let ctx: MatterContext;
let sessionId: string;

/** The client's real opening message from the screenshot. */
const OPENING =
  "my name is Jake Kim my wife is Joo Kim we were married on 1/2/2023. " +
  "Our relationship fell apart on 1/3/2024. We both live in New York County, NY " +
  "have been for the last 10 years. 60W 13th Street, Manhattan NY.";

function mockTurns(...payloads: unknown[]) {
  let i = 0;
  const mock = vi.fn(async (_url: string, init?: { body?: string }) => {
    void init;
    const payload = payloads[Math.min(i, payloads.length - 1)];
    i += 1;
    return new Response(
      JSON.stringify({
        id: `resp_${i}`,
        model: "claude-test-model",
        content: [{ type: "tool_use", id: "t", name: "INTAKE_TURN", input: payload }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}

function turn(over: Record<string, unknown> = {}) {
  return {
    say: "Thank you.",
    lang: "en",
    record_answers: null,
    gate_response: null,
    flag_for_attorney: null,
    control: "CONTINUE",
    ...over,
  };
}

/** The system+user prompt the Nth provider call actually received. */
function promptOf(mock: ReturnType<typeof mockTurns>, n = 0): string {
  const body = JSON.parse(mock.mock.calls[n][1]!.body!);
  return `${body.system}\n${body.messages.map((m: { content: string }) => m.content).join("\n")}`;
}

beforeEach(async () => {
  resetDbForTests();
  freshLimits();
  process.env.INTAKE_CHAT_ENABLED = "true";
  process.env.AI_FEATURES_ENABLED = "true";
  process.env.ANTHROPIC_API_KEY = "sk-synthetic-eval-key-never-real";
  process.env.ANTHROPIC_MODEL = "claude-test-model";
  ctx = await setupClientWithMatter();
  sessionId = await startSession(await cookieFor(SYNTH_CLIENT));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the gate-phase prompt offers the pending roster", () => {
  it("names recordable question ids while the session is on a GATE", async () => {
    const mock = mockTurns(turn({ gate_response: { gateId: "GATE_RESIDENCY", value_json: "true" } }));
    await runIntakeTurn({ sessionId, actingUserId: ctx.clientUserId, message: OPENING });

    // The very first call happens at GATE_RESIDENCY.
    expect((await getSession(sessionId))!.state).not.toBe("GATE_RESIDENCY"); // it advanced
    const prompt = promptOf(mock, 0);

    // The roster is present, with real ids the client's opening answers.
    expect(prompt).toContain("shared.identity.client_name");
    expect(prompt).toContain("record_answers");
    // And the instruction that stops the re-asking.
    expect(prompt).toMatch(/NEVER ASK WHAT THEY ALREADY TOLD YOU/i);
  });

  it("still tells the model how to answer the gate itself", async () => {
    const mock = mockTurns(turn({ gate_response: { gateId: "GATE_RESIDENCY", value_json: "true" } }));
    await runIntakeTurn({ sessionId, actingUserId: ctx.clientUserId, message: "yes" });
    const prompt = promptOf(mock, 0);
    expect(prompt).toContain("gate_response");
    expect(prompt).toContain("GATE_RESIDENCY");
  });
});

describe("facts given during the gate phase are SAVED", () => {
  it("a gate answer and volunteered facts land in the same turn", async () => {
    mockTurns(
      turn({
        say: "Thank you, Jake.",
        gate_response: { gateId: "GATE_RESIDENCY", value_json: "true" },
        record_answers: [
          { questionId: "shared.identity.client_name", value_json: '"Jake Kim"' },
          { questionId: "shared.identity.other_name", value_json: '"Joo Kim"' },
        ],
      })
    );
    await runIntakeTurn({ sessionId, actingUserId: ctx.clientUserId, message: OPENING });

    const answers = await getMatterAnswers(ctx.matterId);
    expect(answers["shared.identity.client_name"]).toBe("Jake Kim");
    expect(answers["shared.identity.other_name"]).toBe("Joo Kim");
    // The gate still advanced — recording alongside does not cost the gate.
    expect((await getSession(sessionId))!.state).toBe("GATE_VENUE");
  });

  it("a saved fact is then FACTS ON FILE, so the next turn is told not to re-ask", async () => {
    mockTurns(
      turn({
        gate_response: { gateId: "GATE_RESIDENCY", value_json: "true" },
        record_answers: [{ questionId: "shared.identity.client_name", value_json: '"Jake Kim"' }],
      })
    );
    await runIntakeTurn({ sessionId, actingUserId: ctx.clientUserId, message: OPENING });

    const mock2 = mockTurns(turn({ gate_response: { gateId: "GATE_VENUE", value_json: '"NEW YORK"' } }));
    await runIntakeTurn({ sessionId, actingUserId: ctx.clientUserId, message: "New York County" });

    const prompt = promptOf(mock2, 0);
    // The name the client already gave is in front of the model as a FACT,
    // and it is no longer offered as something still to ask.
    expect(prompt).toContain("Jake Kim");
  });

  it("the roster SHRINKS as facts are recorded — an answered id is not re-offered", async () => {
    mockTurns(
      turn({
        gate_response: { gateId: "GATE_RESIDENCY", value_json: "true" },
        record_answers: [{ questionId: "shared.identity.client_name", value_json: '"Jake Kim"' }],
      })
    );
    await runIntakeTurn({ sessionId, actingUserId: ctx.clientUserId, message: OPENING });

    const mock2 = mockTurns(turn({ gate_response: { gateId: "GATE_VENUE", value_json: '"NEW YORK"' } }));
    await runIntakeTurn({ sessionId, actingUserId: ctx.clientUserId, message: "New York County" });

    // The roster is the run of "- <id>: …" lines directly after the marker.
    // Bound it there: the rest of the prompt legitimately mentions the id
    // again under FACTS ON FILE, which is the point.
    const after = promptOf(mock2, 0).split("QUESTIONS YOU MAY ALSO RECORD RIGHT NOW:")[1] ?? "";
    const roster: string[] = [];
    for (const line of after.split("\n").slice(1)) {
      if (!line.startsWith("- ")) break; // the roster block ends here
      roster.push(line);
    }
    expect(roster.length).toBeGreaterThan(0);
    const ids = roster.map((l) => l.slice(2).split(":")[0]);
    expect(ids).toContain("shared.identity.other_name"); // still to ask
    expect(ids).not.toContain("shared.identity.client_name"); // already answered
  });
});

describe("the section counter matches the rail the client can see", () => {
  it("counts only sections the client actually walks in this phase", async () => {
    const { nextStep } = await import("@/lib/intake-chat/sequencer");
    const { schemaForMatter } = await import("@/lib/db/intake2");
    const { getMatter } = await import("@/lib/db/matters");
    const matter = (await getMatter(ctx.matterId))!;
    const step = nextStep({
      schema: schemaForMatter(matter),
      answers: {},
      machineState: "INTAKE",
      checklist: [],
      welcomed: true,
      readBackShown: false,
      confirmed: false,
      phase: 1,
    });
    // The live screenshot read "Section 3 of 25" beside a rail listing eight.
    // Whatever the real number is, it must be small and it must not be the
    // raw schema section count.
    expect(step.sectionCount).toBeGreaterThan(0);
    expect(step.sectionCount).toBeLessThan(15);
    expect(step.sectionIndex).not.toBeNull();
    expect(step.sectionIndex!).toBeLessThanOrEqual(step.sectionCount);
  });
});
