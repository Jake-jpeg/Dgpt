/**
 * INTAKE_TURN wire format — the provider-portable shape (2026-08-01).
 *
 * Step 1 of the Haiku → GPT-5.6 Terra swap, PROVEN ON HAIKU FIRST and landed
 * alone so that if the intake regresses we know which change did it.
 *
 * OpenAI strict structured outputs are stricter than Anthropic tool schemas in
 * two ways, and the old schema violated both:
 *
 *   1. every key in `properties` must also be in `required` — the old schema
 *      listed 3 of 6, expressing "optional" by omission;
 *   2. no unconstrained schemas — the old schema carried the answer as
 *      `value: {}` because an intake answer can be a string, a boolean, a
 *      money number, a select code, or an array of child records.
 *
 * So values travel as JSON TEXT in `value_json` and the server parses them
 * before anything else touches them. These tests pin BOTH the structural
 * contract (so a future edit can't quietly re-break strict mode) and the
 * round-trip through the real orchestrator.
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
import { INTAKE_TURN_SCHEMA, coerceTurn, runIntakeTurn } from "@/lib/intake-chat/orchestrator";
import { getSession } from "@/lib/db/repo";
import { getMatterAnswers } from "@/lib/db/intake2";

let ctx: MatterContext;
let sessionId: string;

function mockTurns(...payloads: unknown[]) {
  let i = 0;
  const mock = vi.fn(async (_url: string, init?: { body?: string }) => {
    void init;
    const payload = payloads[Math.min(i, payloads.length - 1)];
    i += 1;
    return new Response(
      JSON.stringify({
        id: `resp_wire_${i}`,
        model: "claude-test-model",
        content: [{ type: "tool_use", id: "toolu_wire", name: "INTAKE_TURN", input: payload }],
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
    say: "Thanks.",
    lang: "en",
    record_answers: null,
    gate_response: null,
    flag_for_attorney: null,
    control: "CONTINUE",
    ...over,
  };
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

/* ── the structural contract ─────────────────────────────────────────── */

describe("INTAKE_TURN_SCHEMA satisfies OpenAI strict structured outputs", () => {
  /** Walk every object node in the schema. */
  function objectNodes(node: unknown, path = "$", out: [string, Record<string, unknown>][] = []) {
    if (!node || typeof node !== "object") return out;
    const n = node as Record<string, unknown>;
    const types = Array.isArray(n.type) ? n.type : [n.type];
    if (types.includes("object")) out.push([path, n]);
    if (n.properties && typeof n.properties === "object") {
      for (const [k, v] of Object.entries(n.properties as Record<string, unknown>)) {
        objectNodes(v, `${path}.${k}`, out);
      }
    }
    if (n.items) objectNodes(n.items, `${path}[]`, out);
    return out;
  }

  const nodes = objectNodes(INTAKE_TURN_SCHEMA);

  it("every object declares additionalProperties: false", () => {
    for (const [path, n] of nodes) {
      expect(n.additionalProperties, `${path} must set additionalProperties:false`).toBe(false);
    }
  });

  it("EVERY property of every object is listed in required — no optional-by-omission", () => {
    for (const [path, n] of nodes) {
      const props = Object.keys((n.properties ?? {}) as Record<string, unknown>).sort();
      const required = ([...((n.required as string[]) ?? [])] as string[]).sort();
      expect(required, `${path} required must list every property`).toEqual(props);
    }
  });

  it("contains NO unconstrained schema — every property declares a type", () => {
    for (const [path, n] of nodes) {
      for (const [k, v] of Object.entries((n.properties ?? {}) as Record<string, unknown>)) {
        const prop = (v ?? {}) as Record<string, unknown>;
        expect(
          prop.type !== undefined || prop.enum !== undefined || prop.anyOf !== undefined,
          `${path}.${k} is unconstrained — OpenAI strict mode rejects {}`
        ).toBe(true);
      }
    }
  });

  it("optionality is expressed as a NULL UNION on the three optional fields", () => {
    const props = (INTAKE_TURN_SCHEMA.properties ?? {}) as Record<string, { type?: unknown }>;
    expect(props.record_answers.type).toEqual(["array", "null"]);
    expect(props.gate_response.type).toEqual(["object", "null"]);
    expect(props.flag_for_attorney.type).toEqual(["object", "null"]);
    // …and the always-present ones are plain scalars.
    expect(props.say.type).toBe("string");
    expect(props.control.type).toBe("string");
  });

  it("the answer value is carried as JSON TEXT, not an open schema", () => {
    const props = INTAKE_TURN_SCHEMA.properties as Record<string, Record<string, never>>;
    const answerItem = (props.record_answers as unknown as { items: { properties: Record<string, { type: string }> } })
      .items.properties;
    expect(answerItem.value_json.type).toBe("string");
    expect(answerItem).not.toHaveProperty("value");

    const gate = (props.gate_response as unknown as { properties: Record<string, { type: string }> })
      .properties;
    expect(gate.value_json.type).toBe("string");
    expect(gate).not.toHaveProperty("value");
  });
});

/* ── coerceTurn ──────────────────────────────────────────────────────── */

describe("coerceTurn parses value_json into real values", () => {
  it("handles every value shape the intake actually uses", () => {
    const r = coerceTurn(
      turn({
        record_answers: [
          { questionId: "a.text", value_json: '"Brooklyn"' },
          { questionId: "a.bool", value_json: "true" },
          { questionId: "a.money", value_json: "42000" },
          { questionId: "a.select", value_json: '"KINGS"' },
          {
            questionId: "shared.children.records",
            value_json: '[{"name":"Aaron Doe","dateOfBirth":"2019-03-04"}]',
          },
        ],
      })
    );
    expect("turn" in r).toBe(true);
    const vals = ("turn" in r ? r.turn.record_answers : [])!.map((a) => a.value);
    expect(vals).toEqual([
      "Brooklyn",
      true,
      42000,
      "KINGS",
      [{ name: "Aaron Doe", dateOfBirth: "2019-03-04" }],
    ]);
  });

  it("parses a gate value and keeps false distinct from a missing answer", () => {
    const yes = coerceTurn(turn({ gate_response: { gateId: "GATE_DV", value_json: "true" } }));
    const no = coerceTurn(turn({ gate_response: { gateId: "GATE_DV", value_json: "false" } }));
    expect("turn" in yes && yes.turn.gate_response?.value).toBe(true);
    expect("turn" in no && no.turn.gate_response?.value).toBe(false);
  });

  it("null record_answers and null gate_response are normal, not errors", () => {
    const r = coerceTurn(turn());
    expect("turn" in r).toBe(true);
    if ("turn" in r) {
      expect(r.turn.record_answers).toEqual([]);
      expect(r.turn.gate_response).toBeNull();
    }
  });

  it("malformed JSON becomes a CORRECTION that teaches the format", () => {
    const r = coerceTurn(
      turn({ record_answers: [{ questionId: "a.text", value_json: "Brooklyn" }] }) // unquoted
    );
    expect("correction" in r).toBe(true);
    if ("correction" in r) {
      expect(r.correction).toMatch(/not valid JSON/);
      expect(r.correction).toMatch(/QUOTED JSON string/);
    }
  });

  it("a non-string value_json is refused rather than coerced", () => {
    const r = coerceTurn(turn({ gate_response: { gateId: "GATE_DV", value_json: true } }));
    expect("correction" in r).toBe(true);
  });

  it("still accepts a literal `value` — internal callers and fixtures are unaffected", () => {
    const r = coerceTurn(turn({ record_answers: [{ questionId: "a.text", value: "Brooklyn" }] }));
    expect("turn" in r && r.turn.record_answers![0].value).toBe("Brooklyn");
  });
});

/* ── end to end, through the real orchestrator ───────────────────────── */

describe("the wire format round-trips through runIntakeTurn", () => {
  it("a gate answered as value_json drives the REAL machine", async () => {
    mockTurns(
      turn({
        say: "Thank you — noted.",
        gate_response: { gateId: "GATE_RESIDENCY", value_json: "true" },
      })
    );
    await runIntakeTurn({
      sessionId,
      actingUserId: ctx.clientUserId,
      message: "yes, over two years",
    });
    // "true" parsed out of value_json reached evaluateGate as a real boolean:
    // GATE_RESIDENCY --yes--> GATE_VENUE.
    expect((await getSession(sessionId))!.state).toBe("GATE_VENUE");
  });

  it("record_answers sent as value_json land in the SAME store the form writes", async () => {
    mockTurns(
      turn({
        say: "Thanks.",
        record_answers: [
          { questionId: "shared.identity.client_name", value_json: '"John Doe"' },
          { questionId: "shared.identity.client_prior_names", value_json: '"Jonathan Doe"' },
        ],
      })
    );
    await runIntakeTurn({
      sessionId,
      actingUserId: ctx.clientUserId,
      message: "John Doe, used to go by Jonathan",
    });
    const answers = await getMatterAnswers(ctx.matterId);
    // Strings arrived as strings, not as the literal text '"John Doe"'.
    expect(answers["shared.identity.client_name"]).toBe("John Doe");
    expect(answers["shared.identity.client_prior_names"]).toBe("Jonathan Doe");
  });

  it("an unparseable value_json saves NOTHING and is retried with a correction", async () => {
    const mock = mockTurns(
      // 1st: broken.
      turn({ gate_response: { gateId: "GATE_RESIDENCY", value_json: "yes please" } }),
      // 2nd: the model corrects itself.
      turn({ gate_response: { gateId: "GATE_RESIDENCY", value_json: "true" } })
    );
    await runIntakeTurn({
      sessionId,
      actingUserId: ctx.clientUserId,
      message: "yes, over two years",
    });
    // 3 provider calls: the broken turn, the corrected retry, and the
    // drive-to-next-question that follows any successful advance (Rule 12).
    expect(mock).toHaveBeenCalledTimes(3);
    expect((await getSession(sessionId))!.state).toBe("GATE_VENUE");

    // The retry prompt carried the format lesson.
    const second = JSON.parse(mock.mock.calls[1][1]!.body!);
    expect(second.messages[0].content).toMatch(/value_json/);
  });

  it("two unreadable turns in a row leave the machine exactly where it was", async () => {
    mockTurns(turn({ gate_response: { gateId: "GATE_RESIDENCY", value_json: "<nope>" } }));
    const r = await runIntakeTurn({
      sessionId,
      actingUserId: ctx.clientUserId,
      message: "yes",
    });
    expect((await getSession(sessionId))!.state).toBe("GATE_RESIDENCY");
    expect(r.say).toBeTruthy(); // honest fallback, not a crash
  });
});
