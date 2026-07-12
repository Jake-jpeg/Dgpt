/**
 * Live-acceptance activation corrections (offline regression):
 *  - OPENAI_BASE_URL is a LOCAL-ONLY endpoint override for offline mock
 *    testing; refused outside APP_STAGE=local (no traffic redirection in
 *    staging/pilot);
 *  - callStructured targets the override in local mode (captured, no
 *    network);
 *  - default remains the official endpoint.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { responsesUrl, callStructured, AiConfigError } from "@/lib/ai/responses";

afterEach(() => {
  delete process.env.OPENAI_BASE_URL;
  delete process.env.APP_STAGE;
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_MAX_RETRIES;
  vi.unstubAllGlobals();
});

describe("OPENAI_BASE_URL override (local-only)", () => {
  it("defaults to the official Responses endpoint", () => {
    delete process.env.OPENAI_BASE_URL;
    expect(responsesUrl()).toBe("https://api.openai.com/v1/responses");
  });

  it("is refused in production builds (every deployed stage)", () => {
    process.env.OPENAI_BASE_URL = "http://localhost:4545/v1";
    vi.stubEnv("NODE_ENV", "production");
    for (const stage of ["staging", "closed_pilot"]) {
      process.env.APP_STAGE = stage;
      expect(() => responsesUrl()).toThrow(AiConfigError);
      expect(() => responsesUrl()).toThrow(/development testing only/);
    }
    vi.unstubAllEnvs();
  });

  it("resolves to <base>/responses in development and is actually used by callStructured", async () => {
    process.env.APP_STAGE = "local";
    process.env.OPENAI_BASE_URL = "http://localhost:4545/v1/";
    process.env.OPENAI_API_KEY = "sk-synthetic-test-key-never-real";
    process.env.OPENAI_MAX_RETRIES = "0";
    expect(responsesUrl()).toBe("http://localhost:4545/v1/responses");

    const mock = vi.fn(async () =>
      new Response(
        JSON.stringify({ id: "resp_mock", model: "m", output_text: "{\"ok\":true}", usage: { input_tokens: 1, output_tokens: 1 } }),
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
    const firstCall = mock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(firstCall[0])).toBe("http://localhost:4545/v1/responses");
  });
});
