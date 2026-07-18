/**
 * Batch 7 acceptance: OpenAI service layer.
 *  - STAFF/ATTORNEY only; client routes/roles can never invoke it
 *  - disabled mode (AI_FEATURES_ENABLED != "true"): no network call, portal
 *    unaffected, endpoint answers 503
 *  - artifacts always start ATTORNEY_REVIEW_REQUIRED and stay client-invisible
 *  - confidential sentinel values never appear in logs or audit rows
 *  - secrets never ride NEXT_PUBLIC_* variables
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { resetDbForTests, getDb } from "@/lib/db/index";
import {
  cookieFor,
  SYNTH_CLIENT,
  SYNTH_ATTORNEY,
  setupClientWithMatter,
  provisionAccount,
  jsonRequest,
  params,
  freshLimits,
  type MatterContext,
} from "./helpers";
import { resetFileStorageForTests } from "@/lib/storage";
import { invokeInternalAi, aiFeaturesEnabled } from "@/lib/ai/anthropic";
import { AiDisabledError } from "@/lib/ai/types";
import { POST as aiPost } from "@/app/api/matters/[id]/ai/route";
import { GET as docsGet } from "@/app/api/matters/[id]/documents/route";
import { GET as downloadGet } from "@/app/api/document-versions/[id]/download/route";

const SENTINEL = "CONFIDENTIAL-SENTINEL-93b1f-do-not-log";

let ctx: MatterContext;
let attorneyCookie: string;
let clientCookie: string;

function mockOpenAiFetch(replyText = `internal draft mentioning ${SENTINEL}`) {
  const mock = vi.fn(async () =>
    new Response(
      JSON.stringify({ content: [{ type: "text", text: replyText }], usage: { input_tokens: 5, output_tokens: 5 } }),
      { status: 200, headers: { "content-type": "application/json" } }
    )
  );
  vi.stubGlobal("fetch", mock);
  return mock;
}

beforeEach(async () => {
  resetDbForTests();
  resetFileStorageForTests();
  freshLimits();
  ctx = await setupClientWithMatter();
  attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
  clientCookie = await cookieFor(SYNTH_CLIENT);
  process.env.AI_FEATURES_ENABLED = "true";
  process.env.ANTHROPIC_API_KEY = "sk-synthetic-test-key-never-real";
  process.env.ANTHROPIC_MODEL = "claude-test-model";
});

afterEach(() => {
  delete process.env.AI_FEATURES_ENABLED;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_MODEL;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("access control", () => {
  it("client role cannot invoke the AI endpoint", async () => {
    const mock = mockOpenAiFetch();
    const res = await aiPost(
      jsonRequest(`/api/matters/${ctx.matterId}/ai`, {
        cookie: clientCookie,
        body: { feature: "INTERNAL_SUMMARY" },
      }),
      params({ id: ctx.matterId })
    );
    expect(res.status).toBe(403);
    expect(mock).not.toHaveBeenCalled();
  });

  it("no client-reachable route imports the AI layer (static check)", () => {
    const apiDir = path.join(__dirname, "..", "src", "app", "api");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (p.endsWith(".ts") && fs.readFileSync(p, "utf8").includes("@/lib/ai/")) {
          offenders.push(p);
        }
      }
    };
    walk(apiDir);
    // Exactly two importers, both STAFF/ATTORNEY-only: the AI action route
    // and the explicit local document-extraction route (B9). No client route
    // may ever appear in this list.
    const normalized = offenders.map((p) => p.replaceAll("\\", "/")).sort();
    expect(normalized.length).toBe(2);
    expect(normalized[0]).toContain("/api/document-versions/[id]/extract/route.ts");
    expect(normalized[1]).toContain("/api/matters/[id]/ai/route.ts");
    for (const file of offenders) {
      const src = fs.readFileSync(file, "utf8");
      expect(src).toMatch(/requireUser\(req, \["STAFF", "ATTORNEY"\]\)/);
    }
  });

  it("the structural guard re-reads the role: a demoted staffer is denied", async () => {
    mockOpenAiFetch();
    const staff = provisionAccount({
      subject: "devstub|staff:aistaff@example.test",
      role: "STAFF",
      email: "aistaff@example.test",
      name: "AI Staff",
    });
    const { setUserRole } = await import("@/lib/db/users");
    setUserRole(staff.id, "STAFF");
    setUserRole(staff.id, "CLIENT"); // demote
    await expect(
      invokeInternalAi({
        feature: "ISSUE_LIST",
        matterId: ctx.matterId,
        actingUserId: staff.id,
        context: {},
      })
    ).rejects.toThrow(/AI_GUARD/);
  });
});

describe("kill switch", () => {
  it("AI disabled → 503 from the endpoint, zero network calls", async () => {
    process.env.AI_FEATURES_ENABLED = "false";
    const mock = mockOpenAiFetch();
    expect(aiFeaturesEnabled()).toBe(false);
    const res = await aiPost(
      jsonRequest(`/api/matters/${ctx.matterId}/ai`, {
        cookie: attorneyCookie,
        body: { feature: "INTERNAL_SUMMARY" },
      }),
      params({ id: ctx.matterId })
    );
    expect(res.status).toBe(503);
    expect(mock).not.toHaveBeenCalled();
  });

  it("AI disabled → the ordinary portal keeps working (matter view, documents)", async () => {
    process.env.AI_FEATURES_ENABLED = "false";
    const { GET: matterGet } = await import("@/app/api/matters/[id]/route");
    freshLimits();
    const view = await matterGet(
      jsonRequest(`/api/matters/${ctx.matterId}`, { method: "GET", cookie: clientCookie }),
      params({ id: ctx.matterId })
    );
    expect(view.status).toBe(200);
    freshLimits();
    const docs = await docsGet(
      jsonRequest(`/api/matters/${ctx.matterId}/documents`, { method: "GET", cookie: attorneyCookie }),
      params({ id: ctx.matterId })
    );
    expect(docs.status).toBe(200);
  });

  it("invokeInternalAi throws AiDisabledError before any provider contact", async () => {
    process.env.AI_FEATURES_ENABLED = "false";
    const mock = mockOpenAiFetch();
    const attorney = provisionAccount(SYNTH_ATTORNEY);
    await expect(
      invokeInternalAi({
        feature: "INTERNAL_SUMMARY",
        matterId: ctx.matterId,
        actingUserId: attorney.id,
        context: {},
      })
    ).rejects.toBeInstanceOf(AiDisabledError);
    expect(mock).not.toHaveBeenCalled();
  });
});

describe("artifacts", () => {
  it("AI output lands as ATTORNEY_REVIEW_REQUIRED and is invisible to the client", async () => {
    mockOpenAiFetch();
    const res = await aiPost(
      jsonRequest(`/api/matters/${ctx.matterId}/ai`, {
        cookie: attorneyCookie,
        body: { feature: "DOCUMENT_DRAFT", instruction: "internal working draft" },
      }),
      params({ id: ctx.matterId })
    );
    expect(res.status).toBe(201);
    const { artifact } = await res.json();
    expect(artifact.status).toBe("ATTORNEY_REVIEW_REQUIRED");

    // Client list: nothing. Client download: 404.
    freshLimits();
    const list = await docsGet(
      jsonRequest(`/api/matters/${ctx.matterId}/documents`, { method: "GET", cookie: clientCookie }),
      params({ id: ctx.matterId })
    );
    const body = await list.json();
    expect(JSON.stringify(body)).not.toContain(artifact.versionId);
    freshLimits();
    const dl = await downloadGet(
      jsonRequest(`/api/document-versions/${artifact.versionId}/download`, { method: "GET", cookie: clientCookie }),
      params({ id: artifact.versionId })
    );
    expect(dl.status).toBe(404);
  });
});

describe("confidentiality", () => {
  it("sentinel values in context/output never reach console logs or audit rows", async () => {
    mockOpenAiFetch();
    const logSpy = vi.spyOn(console, "log");
    const errSpy = vi.spyOn(console, "error");
    const warnSpy = vi.spyOn(console, "warn");

    const attorney = provisionAccount(SYNTH_ATTORNEY);
    await invokeInternalAi({
      feature: "INTERNAL_SUMMARY",
      matterId: ctx.matterId,
      actingUserId: attorney.id,
      context: { clientStatement: SENTINEL },
    });

    for (const spy of [logSpy, errSpy, warnSpy]) {
      const logged = spy.mock.calls.flat().map(String).join("\n");
      expect(logged).not.toContain(SENTINEL);
    }
    // Audit + ai_invocation rows: metadata only.
    const audit = getDb().prepare(`SELECT event, detail FROM audit_event`).all() as {
      event: string;
      detail: string | null;
    }[];
    expect(JSON.stringify(audit)).not.toContain(SENTINEL);
    const ai = getDb().prepare(`SELECT * FROM ai_invocation`).all();
    expect(JSON.stringify(ai)).not.toContain(SENTINEL);
    expect(JSON.stringify(ai)).not.toContain("sk-synthetic");
  });

  it("no OPENAI secret rides a NEXT_PUBLIC variable anywhere in src/", () => {
    const srcDir = path.join(__dirname, "..", "src");
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(p)) {
          const content = fs.readFileSync(p, "utf8");
          if (/NEXT_PUBLIC_[A-Z_]*(OPENAI|ANTHROPIC|API_KEY|SECRET|TOKEN)/.test(content)) hits.push(p);
        }
      }
    };
    walk(srcDir);
    expect(hits).toEqual([]);
  });

  it("provider errors surface as neutral AI_GUARD messages (no payload echo)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(`{"error":{"message":"prompt echo ${SENTINEL}"}}`, { status: 400 }))
    );
    const attorney = provisionAccount(SYNTH_ATTORNEY);
    await expect(
      invokeInternalAi({
        feature: "ISSUE_LIST",
        matterId: ctx.matterId,
        actingUserId: attorney.id,
        context: {},
      })
    ).rejects.toThrow(/AI_GUARD: provider request failed \(HTTP 400\)/);
  });
});
