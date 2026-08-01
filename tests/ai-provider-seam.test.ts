/**
 * The provider seam (2026-08-01) — step 2/3 of the Haiku → GPT-5.6 Terra swap.
 *
 * Operator: "I'm an API reseller. So, I'd like to make something so that I can
 * swap out the provider on a whim." So the swap is an ENV FLIP, and so is the
 * rollback.
 *
 * What these tests defend is not "OpenAI works" — it is that swapping the
 * provider cannot quietly weaken the AI_GUARD posture. Every adapter must
 * produce a FORCED tool call, refuse a base-URL override in production, and
 * fail closed when the provider answers with anything other than structured
 * arguments.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  adapterFor,
  anthropicAdapter,
  openaiAdapter,
  isAiProvider,
  AI_PROVIDERS,
  OFFICIAL_ANTHROPIC_MESSAGES_URL,
  OFFICIAL_OPENAI_CHAT_URL,
  type ProviderRequest,
} from "@/lib/ai/providers";
import { callStructured, AiConfigError, safetyIdentifier } from "@/lib/ai/responses";
import {
  intakeChatProvider,
  intakeChatModel,
  IntakeProviderConfigError,
} from "@/config/ai-providers";

const REQ: ProviderRequest = {
  model: "test-model",
  system: "SYSTEM TEXT",
  user: "USER TEXT",
  schemaName: "INTAKE_TURN",
  jsonSchema: { type: "object", additionalProperties: false, required: [], properties: {} },
  safetyId: "m-abc123",
  maxOutputTokens: 4000,
};

beforeEach(() => {
  delete process.env.ANTHROPIC_BASE_URL;
  delete process.env.OPENAI_BASE_URL;
  process.env.APP_STAGE = "local";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.ANTHROPIC_BASE_URL;
  delete process.env.OPENAI_BASE_URL;
  delete process.env.OPENAI_API_KEY;
});

describe("registry", () => {
  it("resolves both providers and refuses an unknown one", () => {
    expect(adapterFor("anthropic").id).toBe("anthropic");
    expect(adapterFor("openai").id).toBe("openai");
    expect(isAiProvider("anthropic")).toBe(true);
    expect(isAiProvider("bedrock")).toBe(false);
    expect(() => adapterFor("bedrock" as never)).toThrow(AiConfigError);
  });

  it("every registered provider names its own key env — no shared credential", () => {
    const envs = AI_PROVIDERS.map((p) => adapterFor(p).apiKeyEnv);
    expect(new Set(envs).size).toBe(envs.length);
    expect(adapterFor("anthropic").apiKeyEnv).toBe("ANTHROPIC_API_KEY");
    expect(adapterFor("openai").apiKeyEnv).toBe("OPENAI_API_KEY");
  });
});

describe("every adapter forces a tool call and carries no PII", () => {
  for (const provider of AI_PROVIDERS) {
    it(`${provider}: pins the named tool and sends the salted id, not a name`, () => {
      const body = JSON.parse(adapterFor(provider).body(REQ));
      const text = JSON.stringify(body);
      // The schema name appears as BOTH the offered tool and the forced choice.
      expect(text).toContain("INTAKE_TURN");
      expect(text).toContain("m-abc123");
      // Bounded output, and the system prompt is carried somewhere.
      expect(text).toContain("SYSTEM TEXT");
      expect(text).toContain("USER TEXT");
      expect(text).toMatch(/4000/);
    });
  }

  it("anthropic uses input_schema + tool_choice{type:tool}", () => {
    const b = JSON.parse(anthropicAdapter.body(REQ));
    expect(b.tools[0].input_schema).toEqual(REQ.jsonSchema);
    expect(b.tool_choice).toEqual({ type: "tool", name: "INTAKE_TURN" });
    expect(b.system).toBe("SYSTEM TEXT");
    expect(b.max_tokens).toBe(4000);
    expect(anthropicAdapter.headers("k")["x-api-key"]).toBe("k");
    expect(anthropicAdapter.headers("k")["anthropic-version"]).toBe("2023-06-01");
  });

  it("openai uses function.parameters + strict + tool_choice{type:function}", () => {
    const b = JSON.parse(openaiAdapter.body(REQ));
    expect(b.tools[0].type).toBe("function");
    expect(b.tools[0].function.parameters).toEqual(REQ.jsonSchema);
    // strict:true is the whole reason INTAKE_TURN_SCHEMA became portable.
    expect(b.tools[0].function.strict).toBe(true);
    expect(b.tool_choice).toEqual({ type: "function", function: { name: "INTAKE_TURN" } });
    // System travels as a message, and the token cap uses the newer key.
    expect(b.messages[0]).toEqual({ role: "system", content: "SYSTEM TEXT" });
    expect(b.max_completion_tokens).toBe(4000);
    expect(b.max_tokens).toBeUndefined();
    expect(openaiAdapter.headers("k").authorization).toBe("Bearer k");
    expect(openaiAdapter.headers("k")["x-api-key"]).toBeUndefined();
  });
});

describe("response parsing differs by provider and fails closed on both", () => {
  it("anthropic: arguments arrive as an OBJECT", () => {
    const out = anthropicAdapter.parse({
      id: "msg_1",
      model: "claude-x",
      content: [{ type: "tool_use", name: "INTAKE_TURN", input: { say: "hi" } }],
      usage: { input_tokens: 11, output_tokens: 22 },
    });
    expect(out.parsed).toEqual({ say: "hi" });
    expect(out.tokensIn).toBe(11);
    expect(out.tokensOut).toBe(22);
  });

  it("openai: arguments arrive as a STRING and are parsed", () => {
    const out = openaiAdapter.parse({
      id: "chatcmpl_1",
      model: "gpt-5.6-terra",
      choices: [
        { message: { tool_calls: [{ function: { name: "INTAKE_TURN", arguments: '{"say":"hi"}' } }] } },
      ],
      usage: { prompt_tokens: 11, completion_tokens: 22 },
    });
    expect(out.parsed).toEqual({ say: "hi" });
    expect(out.tokensIn).toBe(11);
    expect(out.tokensOut).toBe(22);
  });

  it("a prose answer with no tool call is a hard error on BOTH — never a fallback", () => {
    expect(() =>
      anthropicAdapter.parse({ content: [{ type: "text", text: "I'd rather explain…" }] })
    ).toThrow(/no structured output/);
    expect(() =>
      openaiAdapter.parse({ choices: [{ message: { tool_calls: [] } }] })
    ).toThrow(/no structured output/);
    expect(() => openaiAdapter.parse({})).toThrow(/no structured output/);
  });

  it("openai: unparseable arguments error WITHOUT echoing the body", () => {
    try {
      openaiAdapter.parse({
        choices: [{ message: { tool_calls: [{ function: { arguments: "{not json" } }] } }],
      });
      throw new Error("should have thrown");
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toMatch(/unparseable structured output/);
      expect(msg).not.toContain("not json");
    }
  });
});

describe("base-URL overrides stay DEV-ONLY on every provider", () => {
  it("defaults to the official endpoints", () => {
    expect(anthropicAdapter.endpoint()).toBe(OFFICIAL_ANTHROPIC_MESSAGES_URL);
    expect(openaiAdapter.endpoint()).toBe(OFFICIAL_OPENAI_CHAT_URL);
  });

  it("accepts an override locally, appending the provider's own path", () => {
    process.env.ANTHROPIC_BASE_URL = "http://localhost:4545/v1/";
    process.env.OPENAI_BASE_URL = "http://localhost:4546/v1";
    expect(anthropicAdapter.endpoint()).toBe("http://localhost:4545/v1/messages");
    expect(openaiAdapter.endpoint()).toBe("http://localhost:4546/v1/chat/completions");
  });

  it("REFUSES an override in production — for the new provider too", () => {
    // "Production" is the BUILD (NODE_ENV), which is what every deployed
    // stage runs; APP_STAGE only names which deployment it is.
    vi.stubEnv("NODE_ENV", "production");
    process.env.ANTHROPIC_BASE_URL = "http://evil.test/v1";
    process.env.OPENAI_BASE_URL = "http://evil.test/v1";
    for (const stage of ["staging", "closed_pilot"]) {
      process.env.APP_STAGE = stage;
      expect(() => anthropicAdapter.endpoint()).toThrow(/development testing only/);
      expect(() => openaiAdapter.endpoint()).toThrow(/development testing only/);
      expect(() => openaiAdapter.endpoint()).toThrow(/OPENAI_BASE_URL/);
      expect(() => openaiAdapter.endpoint()).toThrow(AiConfigError);
    }
    vi.unstubAllEnvs();
  });
});

describe("callStructured keeps one guard posture across providers", () => {
  function respond(status: number, body: unknown = {}) {
    const mock = vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          status,
          headers: { "content-type": "application/json" },
        })
    );
    vi.stubGlobal("fetch", mock);
    return mock;
  }

  const call = (provider: "anthropic" | "openai") =>
    callStructured({
      model: "m",
      system: "s",
      user: "u",
      schemaName: "INTAKE_TURN",
      jsonSchema: {},
      matterId: "matter-1",
      provider,
    });

  it("names the RIGHT env var when the key is missing", async () => {
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    await expect(call("openai")).rejects.toThrow(/OPENAI_API_KEY is not configured/);
    await expect(call("anthropic")).rejects.toThrow(/ANTHROPIC_API_KEY is not configured/);
    if (saved) process.env.ANTHROPIC_API_KEY = saved;
  });

  it("401 is a config error naming that provider's key, on both", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.OPENAI_API_KEY = "sk-test";
    respond(401);
    await expect(call("anthropic")).rejects.toThrow(/check ANTHROPIC_API_KEY/);
    respond(401);
    await expect(call("openai")).rejects.toThrow(/check OPENAI_API_KEY/);
  });

  it("404 says NO FALLBACK MODEL and is not retried, on both", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.OPENAI_API_KEY = "sk-test";
    for (const p of ["anthropic", "openai"] as const) {
      const mock = respond(404);
      await expect(call(p)).rejects.toThrow(/no fallback model is attempted/);
      expect(mock).toHaveBeenCalledTimes(1);
    }
  });

  it("500 IS retried and then fails, on both", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.AI_MAX_RETRIES = "1";
    for (const p of ["anthropic", "openai"] as const) {
      const mock = respond(500);
      await expect(call(p)).rejects.toThrow(/HTTP 500/);
      expect(mock).toHaveBeenCalledTimes(2); // initial + 1 retry
    }
    delete process.env.AI_MAX_RETRIES;
  });

  it("a successful OpenAI call round-trips through the seam", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    respond(200, {
      id: "chatcmpl_9",
      model: "gpt-5.6-terra",
      choices: [{ message: { tool_calls: [{ function: { arguments: '{"say":"hello"}' } }] } }],
      usage: { prompt_tokens: 7, completion_tokens: 3 },
    });
    const r = await call("openai");
    expect(r.parsed).toEqual({ say: "hello" });
    expect(r.model).toBe("gpt-5.6-terra");
    expect(r.responseId).toBe("chatcmpl_9");
    expect(r.tokensIn).toBe(7);
  });

  it("the safety identifier is a salted hash, never the matter id itself", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const mock = respond(200, {
      choices: [{ message: { tool_calls: [{ function: { arguments: "{}" } }] } }],
    });
    await call("openai");
    const body = (mock.mock.calls[0] as unknown as [string, { body: string }])[1].body;
    expect(body).toContain(safetyIdentifier("matter-1"));
    expect(body).not.toContain("matter-1");
  });
});

/* ── which provider the INTAKE BOT uses ──────────────────────────────── */

describe("intake provider/model resolution — the env flip", () => {
  const ENV = [
    "INTAKE_AI_PROVIDER",
    "INTAKE_MODEL",
    "ANTHROPIC_INTAKE_MODEL",
    "ANTHROPIC_MODEL",
  ];
  beforeEach(() => ENV.forEach((k) => delete process.env[k]));
  afterEach(() => ENV.forEach((k) => delete process.env[k]));

  it("defaults to Anthropic Haiku — unset env changes nothing", () => {
    expect(intakeChatProvider()).toBe("anthropic");
    expect(intakeChatModel()).toBe("claude-haiku-4-5");
  });

  it("INTAKE_AI_PROVIDER=openai flips the provider AND the default model", () => {
    process.env.INTAKE_AI_PROVIDER = "openai";
    expect(intakeChatProvider()).toBe("openai");
    expect(intakeChatModel()).toBe("gpt-5.6-terra");
  });

  it("is case- and whitespace-forgiving on the operator-typed row", () => {
    process.env.INTAKE_AI_PROVIDER = "  OpenAI ";
    expect(intakeChatProvider()).toBe("openai");
  });

  it("INTAKE_MODEL wins outright, on either provider", () => {
    process.env.INTAKE_MODEL = "gpt-5.6-luna";
    expect(intakeChatModel()).toBe("gpt-5.6-luna");
    process.env.INTAKE_AI_PROVIDER = "openai";
    expect(intakeChatModel()).toBe("gpt-5.6-luna");
  });

  it("pre-2026-08-01 rows still resolve on the anthropic path", () => {
    process.env.ANTHROPIC_MODEL = "claude-sonnet-5";
    expect(intakeChatModel()).toBe("claude-sonnet-5");
    process.env.ANTHROPIC_INTAKE_MODEL = "claude-opus-4-8";
    expect(intakeChatModel()).toBe("claude-opus-4-8");
  });

  it("the legacy ANTHROPIC_* rows do NOT leak onto the openai path", () => {
    process.env.INTAKE_AI_PROVIDER = "openai";
    process.env.ANTHROPIC_INTAKE_MODEL = "claude-opus-4-8";
    process.env.ANTHROPIC_MODEL = "claude-sonnet-5";
    expect(intakeChatModel()).toBe("gpt-5.6-terra");
  });

  it("an unknown provider FAILS LOUDLY — no silent fallback to anthropic", () => {
    process.env.INTAKE_AI_PROVIDER = "gemini";
    expect(() => intakeChatProvider()).toThrow(IntakeProviderConfigError);
    expect(() => intakeChatProvider()).toThrow(/not a known provider/);
    expect(() => intakeChatModel()).toThrow(/not a known provider/);
  });
});

/* ── SCOPE GUARD ─────────────────────────────────────────────────────── */

describe("the swap is INTAKE BOT only", () => {
  // Operator directive 2026-07-31 was "intake bot change". callStructured has
  // three call sites; the other two are the attorney workbench (Sonnet 5) and
  // internal actions. If a future edit passes `provider` from either of them,
  // or reads the intake env rows there, the swap has leaked.
  it("neither the workbench nor internal actions choose a provider", async () => {
    const { readFileSync } = await import("node:fs");
    for (const file of ["src/lib/ai/run-action.ts", "src/lib/ai/internal.ts"]) {
      const src = readFileSync(file, "utf8");
      expect(src, `${file} must not pass a provider`).not.toMatch(/provider\s*:/);
      expect(src, `${file} must not read the intake provider row`).not.toContain(
        "INTAKE_AI_PROVIDER"
      );
      expect(src, `${file} must not resolve the intake model`).not.toContain("intakeChatModel");
    }
  });

  it("the intake orchestrator DOES choose one, at every provider call", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/lib/intake-chat/orchestrator.ts", "utf8");
    const calls = src.match(/await callStructured\(\{/g) ?? [];
    const chosen = src.match(/provider: intakeChatProvider\(\)/g) ?? [];
    expect(calls.length).toBeGreaterThan(0);
    expect(chosen.length).toBe(calls.length);
  });
});
