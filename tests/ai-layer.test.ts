/**
 * Batch 7 acceptance: the internal AI service layer.
 *
 * Migrated from the deleted src/lib/ai/anthropic.ts to the single provider
 * client (src/lib/ai/responses.ts -> callStructured). The free-text features
 * now return their prose through a minimal forced tool, so the provider MOCK
 * returns a tool_use block instead of a text block, and a 400 surfaces as
 * AiConfigError rather than a plain Error. Every assertion below still
 * asserts the same property it always did: access control, kill switch,
 * artifact status, and no-payload-echo - against the new shapes.
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
import { invokeInternalAi, aiFeaturesEnabled } from "@/lib/ai/internal";
import { AiDisabledError } from "@/lib/ai/types";
import { AiConfigError } from "@/lib/ai/responses";
import { POST as aiPost } from "@/app/api/matters/[id]/ai/route";
import { GET as docsGet } from "@/app/api/matters/[id]/documents/route";
import { GET as downloadGet } from "@/app/api/document-versions/[id]/download/route";

const SENTINEL = "CONFIDENTIAL-SENTINEL-93b1f-do-not-log";

let ctx: MatterContext;
let attorneyCookie: string;
let clientCookie: string;

/**
 * The provider now answers with a forced tool_use block (the free-text
 * features carry their prose in `input.text`), so the mock mirrors that.
 */
function mockProviderFetch(replyText = `internal draft mentioning ${SENTINEL}`) {
  const mock = vi.fn(async () =>
    new Response(
      JSON.stringify({
        id: "msg_synthetic",
        model: "claude-test-model",
        content: [{ type: "tool_use", name: "INTERNAL_SUMMARY", input: { text: replyText } }],
        usage: { input_tokens: 5, output_tokens: 5 },
      }),
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
    const mock = mockProviderFetch();
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
    mockProviderFetch();
    const staff = (await provisionAccount({
          subject: "devstub|staff:aistaff@example.test",
          role: "STAFF",
          email: "aistaff@example.test",
          name: "AI Staff",
        }));
    const { setUserRole } = await import("@/lib/db/users");
    (await setUserRole(staff.id, "STAFF"));
    (await setUserRole(staff.id, "CLIENT")); // demote
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
  it("AI disabled �?' 503 from the endpoint, zero network calls", async () => {
    process.env.AI_FEATURES_ENABLED = "false";
    const mock = mockProviderFetch();
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

  it("AI disabled �?' the ordinary portal keeps working (matter view, documents)", async () => {
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
    const mock = mockProviderFetch();
    const attorney = (await provisionAccount(SYNTH_ATTORNEY));
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
    mockProviderFetch();
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
    mockProviderFetch();
    const logSpy = vi.spyOn(console, "log");
    const errSpy = vi.spyOn(console, "error");
    const warnSpy = vi.spyOn(console, "warn");

    const attorney = (await provisionAccount(SYNTH_ATTORNEY));
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
    const audit = (await getDb().all<{ event: string; detail: string | null }>(
      `SELECT event, detail FROM audit_event`
    ));
    expect(JSON.stringify(audit)).not.toContain(SENTINEL);
    const ai = (await getDb().all(`SELECT * FROM ai_invocation`));
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
    const attorney = (await provisionAccount(SYNTH_ATTORNEY));
    // Shape change from the fold: on the single client a 400 is a
    // CONFIGURATION fault (AiConfigError), not a transport failure. The
    // property under test is unchanged and still asserted below: the message
    // names the status code and NEVER echoes the provider payload.
    const call = invokeInternalAi({
      feature: "ISSUE_LIST",
      matterId: ctx.matterId,
      actingUserId: attorney.id,
      context: {},
    });
    call.catch(() => {}); // assertion target below; pre-attach so no unhandled rejection
    await expect(call).rejects.toThrow(AiConfigError);
    await expect(call).rejects.toThrow(/^AI_GUARD:/);
    await expect(call).rejects.toThrow(/HTTP 400/);
    await expect(call).rejects.not.toThrow(new RegExp(SENTINEL));
  });

  it("a failed call is audited as ERROR with the status code, never the body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(`{"error":{"message":"prompt echo ${SENTINEL}"}}`, { status: 400 }))
    );
    const attorney = (await provisionAccount(SYNTH_ATTORNEY));
    await expect(
      invokeInternalAi({
        feature: "ISSUE_LIST",
        matterId: ctx.matterId,
        actingUserId: attorney.id,
        context: {},
      })
    ).rejects.toThrow();

    // The old path logged status=ERROR with no indication of WHY. It now
    // carries the classification — metadata only.
    const rows = (await getDb().all<{ status: string }>(
      `SELECT status FROM ai_invocation WHERE matter_ref = ?`,
      ctx.matterId
    ));
    expect(rows.some((r) => r.status === "ERROR")).toBe(true);

    const audit = (await getDb().all<{ detail: string | null }>(
      `SELECT detail FROM audit_event`
    ));
    const details = audit.map((a) => a.detail ?? "").join("\n");
    expect(details).toContain("status=ERROR");
    expect(details).toContain("detail=http-400");
    expect(details).not.toContain(SENTINEL);
  });
});

