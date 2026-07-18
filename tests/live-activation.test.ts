/**
 * Live-acceptance activation corrections (offline regression):
 *  - ANTHROPIC_BASE_URL is a LOCAL-ONLY endpoint override for offline mock
 *    testing; refused outside APP_STAGE=local (no traffic redirection in
 *    staging/pilot);
 *  - callStructured targets the override in local mode (captured, no
 *    network);
 *  - default remains the official Anthropic Messages endpoint.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { messagesUrl, callStructured, AiConfigError } from "@/lib/ai/responses";

afterEach(() => {
  delete process.env.ANTHROPIC_BASE_URL;
  delete process.env.APP_STAGE;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.AI_MAX_RETRIES;
  vi.unstubAllGlobals();
});

describe("ANTHROPIC_BASE_URL override (local-only)", () => {
  it("defaults to the official Messages endpoint", () => {
    delete process.env.ANTHROPIC_BASE_URL;
    expect(messagesUrl()).toBe("https://api.anthropic.com/v1/messages");
  });

  it("is refused in production builds (every deployed stage)", () => {
    process.env.ANTHROPIC_BASE_URL = "http://localhost:4545/v1";
    vi.stubEnv("NODE_ENV", "production");
    for (const stage of ["staging", "closed_pilot"]) {
      process.env.APP_STAGE = stage;
      expect(() => messagesUrl()).toThrow(AiConfigError);
      expect(() => messagesUrl()).toThrow(/development testing only/);
    }
    vi.unstubAllEnvs();
  });

  it("resolves to <base>/messages in development and is actually used by callStructured", async () => {
    process.env.APP_STAGE = "local";
    process.env.ANTHROPIC_BASE_URL = "http://localhost:4545/v1/";
    process.env.ANTHROPIC_API_KEY = "sk-ant-synthetic-test-key-never-real";
    process.env.AI_MAX_RETRIES = "0";
    expect(messagesUrl()).toBe("http://localhost:4545/v1/messages");

    const mock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          id: "resp_mock",
          model: "m",
          content: [{ type: "tool_use", id: "toolu_mock", name: "T", input: { ok: true } }],
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", mock);
    const out = await callStructured({
      model: "m",
      system: "s",
      user: "u",
      schemaName: "T",
      jsonSchema: { type: "object" },
      matterId: null,
    });
    expect(out.responseId).toBe("resp_mock");
    expect(out.parsed).toEqual({ ok: true });
    const firstCall = mock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(firstCall[0])).toBe("http://localhost:4545/v1/messages");
  });
});
