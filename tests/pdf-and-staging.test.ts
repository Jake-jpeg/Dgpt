/**
 * Online-staging additions (offline regression): deterministic PDF
 * mappings, the server-only RL client contract, the ATTORNEY-only render
 * route + lifecycle, the synthetic-ephemeral-storage guard, the health
 * endpoint, and the staging acceptance endpoint's gating.
 * NO network: the RL service is a mocked fetch.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import { resetFileStorageForTests, assertEphemeralStorageFlagsValid, getFileStorage } from "@/lib/storage";
import {
  cookieFor,
  SYNTH_CLIENT,
  SYNTH_ATTORNEY,
  setupClientWithMatter,
  jsonRequest,
  params,
  freshLimits,
  clearMatter,
  type MatterContext,
} from "./helpers";
import { getMatter } from "@/lib/db/matters";
import { saveMatterAnswers, attorneySetJurisdictionAndScope } from "@/lib/db/intake2";
import { buildRenderPayload, buildNyUd1Payload } from "@/lib/pdf-service/mappings";
import { renderPdf, pdfServiceEnabled } from "@/lib/pdf-service/client";
import { PdfServiceError } from "@/lib/pdf-service/types";
import { listDocumentsForMatter, listVersions } from "@/lib/db/documents";
import { GET as renderGet, POST as renderPost } from "@/app/api/matters/[id]/render-pdf/route";
import { GET as docsGet } from "@/app/api/matters/[id]/documents/route";
import { POST as releasePost } from "@/app/api/document-versions/[id]/release/route";
import { GET as healthGet } from "@/app/api/health/route";
import { POST as acceptancePost } from "@/app/api/staging/acceptance/route";

let ctx: MatterContext;
let attorneyCookie: string;
let clientCookie: string;

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]); // "%PDF-1.4\n"

function mockRlFetch(status = 200, body: BodyInit = PDF_BYTES, headers: Record<string, string> = {}) {
  const mock = vi.fn(async () =>
    new Response(body, {
      status,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="NY_UD1_Avery.pdf"',
        ...headers,
      },
    })
  );
  vi.stubGlobal("fetch", mock);
  return mock;
}

function enablePdfService() {
  process.env.PDF_SERVICE_ENABLED = "true";
  process.env.PDF_SERVICE_URL = "http://rl.test";
  process.env.PDF_SERVICE_TOKEN = "synthetic-service-token-never-real";
}

const NY_MAPPING_ANSWERS = [
  { questionId: "shared.identity.client_name", value: "Avery Stagingperson" },
  { questionId: "shared.identity.other_name", value: "Blake Stagingperson" },
  { questionId: "shared.identity.client_address", value: { line1: "12 Synthetic Way", city: "Brooklyn", state: "NY", zip: "11201" } },
  { questionId: "shared.relationship.status_kind", value: "MARRIAGE" },
  { questionId: "shared.relationship.marriage_date", value: "2015-06-15" },
  { questionId: "shared.relationship.marriage_state", value: "NY" },
  { questionId: "ny.case.county", value: "KINGS" },
];

beforeEach(async () => {
  resetDbForTests();
  resetFileStorageForTests();
  freshLimits();
  ctx = await setupClientWithMatter();
  attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
  clientCookie = await cookieFor(SYNTH_CLIENT);
});

afterEach(() => {
  delete process.env.PDF_SERVICE_ENABLED;
  delete process.env.PDF_SERVICE_URL;
  delete process.env.PDF_SERVICE_TOKEN;
  delete process.env.SYNTHETIC_STAGING_EPHEMERAL_STORAGE;
  delete process.env.SYNTHETIC_DEMO_ONLY;
  delete process.env.APP_STAGE;
  delete process.env.ADMIN_SECRET;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function nyReadyMatter() {
  await clearMatter(ctx.matterId);
  (await attorneySetJurisdictionAndScope({
        matterId: ctx.matterId,
        actingUserId: ctx.attorneyUserId,
        jurisdictionConfirmed: "NY",
        matterCategory: "NY_SUPREME_UNCONTESTED",
        scopeStatus: "ACCEPTED",
      }));
  (await saveMatterAnswers({ matterId: ctx.matterId, actingUserId: ctx.clientUserId, answers: NY_MAPPING_ANSWERS }));
  return (await getMatter(ctx.matterId))!;
}

describe("deterministic mappings", () => {
  it("same answers always produce the identical payload; county is title-cased", async () => {
    const matter = await nyReadyMatter();
    const answers = Object.fromEntries(NY_MAPPING_ANSWERS.map((a) => [a.questionId, a.value]));
    const p1 = buildNyUd1Payload(matter, answers);
    const p2 = buildNyUd1Payload(matter, answers);
    expect(p1).toEqual(p2);
    expect(p1.filingCounty).toBe("Kings");
    expect(p1.plaintiffAddress).toBe("12 Synthetic Way, Brooklyn, NY 11201");
    expect(p1.dateFiled).toBe(""); // court-stamped: never invented
  });

  it("missing critical facts throw VALIDATION — nothing is invented", async () => {
    const matter = await nyReadyMatter();
    expect(() => buildRenderPayload("ny", "ud1", matter, {})).toThrow(/VALIDATION/);
    expect(() => buildRenderPayload("ny", "nonsense", matter, {})).toThrow(/unsupported/);
    expect(() => buildRenderPayload("nj", "verification", matter, {})).toThrow(/unsupported/);
  });

  it("Phase-3 UD-14/UD-15 payloads: caption facts mapped, clerk/server fields blank on purpose", async () => {
    const matter = await nyReadyMatter();
    const answers = {
      ...Object.fromEntries(NY_MAPPING_ANSWERS.map((a) => [a.questionId, a.value])),
      "shared.identity.other_address": { line1: "9 Other St", city: "Brooklyn", state: "NY", zip: "11215" },
      "ny.case.index_number": "EF001234-2026",
    };
    const ud14 = buildRenderPayload("ny", "ud14", matter, answers);
    expect(ud14.county).toBe("Kings");
    expect(ud14.indexNumber).toBe("EF001234-2026");
    expect(ud14.defendantAddress).toBe("9 Other St, Brooklyn, NY 11215");
    expect(ud14.judgmentEntryDate).toBe(""); // clerk-stamped: never invented

    const ud15 = buildRenderPayload("ny", "ud15", matter, answers);
    expect(ud15.defendantCurrentAddress).toBe("9 Other St, Brooklyn, NY 11215");

    // The defendant's address is critical for service forms — refuse without it.
    const noAddr = Object.fromEntries(NY_MAPPING_ANSWERS.map((a) => [a.questionId, a.value]));
    expect(() => buildRenderPayload("ny", "ud14", matter, noAddr)).toThrow(/VALIDATION/);
    expect(() => buildRenderPayload("ny", "ud15", matter, noAddr)).toThrow(/VALIDATION/);
  });

  it("Phase-2 stipulation payload: agreed terms verbatim, guideline inputs, waiver flag", async () => {
    const matter = await nyReadyMatter();
    const answers = {
      ...Object.fromEntries(NY_MAPPING_ANSWERS.map((a) => [a.questionId, a.value])),
      "shared.identity.other_address": { line1: "9 Other St", city: "Brooklyn", state: "NY", zip: "11215" },
      "shared.relationship.marriage_place": "Brooklyn",
      "ny.settlement.plaintiff_income": 68000,
      "ny.settlement.defendant_income": 52000,
      "ny.settlement.maintenance_waived": true,
      "ny.settlement.division_terms": "I keep the Honda and its loan.",
      "shared.assets.records": [{ kind: "Vehicle", description: "2019 Honda", owner: "Plaintiff" }],
      "shared.debts.records": [],
    };
    const p = buildRenderPayload("ny", "stipulation", matter, answers);
    expect(p.maintenanceWaived).toBe("true");
    expect(p.plaintiffIncome).toBe("68000");
    expect(p.divisionTerms).toBe("I keep the Honda and its loan.");
    expect(p.assetsSummary).toContain("2019 Honda");
    // waived=false flows through as "false" (the generator's attorney-drafts path)
    const p2 = buildRenderPayload("ny", "stipulation", matter, {
      ...answers,
      "ny.settlement.maintenance_waived": false,
    });
    expect(p2.maintenanceWaived).toBe("false");
  });

  it("Phase-2 packet payloads: UD-4 refuses civil ceremonies; religious flag is omitted-when-false", async () => {
    const matter = await nyReadyMatter();
    const answers = {
      ...Object.fromEntries(NY_MAPPING_ANSWERS.map((a) => [a.questionId, a.value])),
      "shared.identity.other_address": { line1: "9 Other St", city: "Brooklyn", state: "NY", zip: "11215" },
      "shared.relationship.ceremony_type": "CIVIL",
    };
    // Civil ceremony: UD-4 (Barriers) must refuse; DRL § 253 doesn't apply.
    expect(() => buildRenderPayload("ny", "ud4", matter, answers)).toThrow(/religious/i);
    // Python generators treat ANY non-empty string as truthy, so the civil
    // payload must OMIT religiousCeremony entirely, never carry "false".
    const ud6 = buildRenderPayload("ny", "ud6", matter, answers);
    expect("religiousCeremony" in ud6).toBe(false);
    const ud6r = buildRenderPayload("ny", "ud6", matter, {
      ...answers,
      "shared.relationship.ceremony_type": "RELIGIOUS",
    });
    expect(ud6r.religiousCeremony).toBe("true");
    // Judgment + Findings render from caption facts.
    expect(buildRenderPayload("ny", "ud11", matter, answers).county).toBe("Kings");
    expect(buildRenderPayload("ny", "ud10", matter, answers).marriageDate).toBe("2015-06-15");
  });
});

describe("RL client contract", () => {
  it("sends the bearer token server-to-server and validates the PDF magic", async () => {
    enablePdfService();
    const mock = mockRlFetch();
    const result = await renderPdf({ state: "ny", form: "ud1", payload: { plaintiffName: "A" } });
    expect(result.sha256).toHaveLength(64);
    expect(result.filename).toBe("NY_UD1_Avery.pdf");
    const [url, init] = mock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toBe("http://rl.test/generate/ny/ud1");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer synthetic-service-token-never-real");
  });

  it("401 from RL fails immediately (no retry); 5xx retries exactly once", async () => {
    enablePdfService();
    const unauth = vi.fn(async () => new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", unauth);
    await expect(renderPdf({ state: "ny", form: "ud1", payload: {} })).rejects.toBeInstanceOf(PdfServiceError);
    expect(unauth).toHaveBeenCalledTimes(1);

    const flaky = vi.fn(async () => new Response("{}", { status: 500 }));
    vi.stubGlobal("fetch", flaky);
    await expect(renderPdf({ state: "ny", form: "ud1", payload: {} })).rejects.toBeInstanceOf(PdfServiceError);
    expect(flaky).toHaveBeenCalledTimes(2);
  });

  it("a non-PDF body is rejected even with a 200", async () => {
    enablePdfService();
    mockRlFetch(200, JSON.stringify({ nope: true }), { "content-type": "application/json" });
    await expect(renderPdf({ state: "ny", form: "ud1", payload: {} })).rejects.toThrow(/non-PDF/);
  });

  it("disabled service refuses locally without any fetch", async () => {
    const mock = vi.fn();
    vi.stubGlobal("fetch", mock);
    expect(pdfServiceEnabled()).toBe(false);
    await expect(renderPdf({ state: "ny", form: "ud1", payload: {} })).rejects.toThrow(/not configured/);
    expect(mock).not.toHaveBeenCalled();
  });
});

describe("render route lifecycle", () => {
  it("CLIENT and STAFF cannot render; ATTORNEY renders ATTORNEY_REVIEW_REQUIRED; client cannot see it; release refused pre-approval", async () => {
    const matter = await nyReadyMatter();
    enablePdfService();
    mockRlFetch();

    freshLimits();
    const clientTry = await renderPost(
      jsonRequest(`/api/matters/${matter.id}/render-pdf`, {
        cookie: clientCookie,
        body: { state: "ny", form: "ud1", confirmFormData: true },
      }),
      params({ id: matter.id })
    );
    expect(clientTry.status).toBe(403);

    freshLimits();
    const res = await renderPost(
      jsonRequest(`/api/matters/${matter.id}/render-pdf`, {
        cookie: attorneyCookie,
        body: { state: "ny", form: "ud1", confirmFormData: true },
      }),
      params({ id: matter.id })
    );
    expect(res.status).toBe(201);
    const data = (await res.json()) as { artifact: { versionId: string; status: string; sha256: string } };
    expect(data.artifact.status).toBe("ATTORNEY_REVIEW_REQUIRED");

    // APP_STAGE is unset in this suite (production posture): the rendered
    // document carries the clean review label, never the synthetic marker.
    const rendered = (await listDocumentsForMatter(matter.id)).find((d) => d.docKind === "RENDERED_FORM")!;
    expect(rendered.title).toContain("attorney review required");
    expect(rendered.title).not.toContain("SYNTHETIC");

    // Staging keeps the loud synthetic marker on newly rendered documents.
    process.env.APP_STAGE = "staging";
    freshLimits();
    const stagingRes = await renderPost(
      jsonRequest(`/api/matters/${matter.id}/render-pdf`, {
        cookie: attorneyCookie,
        body: { state: "ny", form: "ud1", confirmFormData: true },
      }),
      params({ id: matter.id })
    );
    expect(stagingRes.status).toBe(201);
    const stagingDoc = (await listDocumentsForMatter(matter.id))
      .filter((d) => d.docKind === "RENDERED_FORM")
      .find((d) => d.title.includes("SYNTHETIC STAGING DOCUMENT"));
    expect(stagingDoc).toBeTruthy();
    delete process.env.APP_STAGE;

    const version = (await listVersions(rendered.id))[0];
    expect(version.mime).toBe("application/pdf");
    expect(version.sha256).toBe(data.artifact.sha256);

    // Client documents view must not include the unreleased rendered form.
    vi.unstubAllGlobals();
    freshLimits();
    const clientDocs = await docsGet(
      jsonRequest(`/api/matters/${matter.id}/documents`, { method: "GET", cookie: clientCookie }),
      params({ id: matter.id })
    );
    expect(JSON.stringify(await clientDocs.json())).not.toContain(version.id);

    freshLimits();
    const rel = await releasePost(
      jsonRequest(`/api/document-versions/${version.id}/release`, {
        cookie: attorneyCookie,
        body: { destination: "CLIENT_PORTAL" },
      }),
      params({ id: version.id })
    );
    expect(rel.status).toBeGreaterThanOrEqual(400);
  });

  /**
   * Operator directive 2026-07-26: "Get rid of the jurisdiction panel." This
   * is a New York-only product, so a blank jurisdiction field is not a reason
   * to refuse a NY render — the ATTORNEY's render request IS the
   * determination, and it is written to the matter (audited) on the way
   * through. What must still refuse is a matter confirmed to ANOTHER state:
   * that is a real conflict, not an empty field.
   */
  it("a blank jurisdiction is confirmed to NY by the attorney's render request", async () => {
    await clearMatter(ctx.matterId);
    const blank = (await getMatter(ctx.matterId))!;
    expect(blank.jurisdictionConfirmed).toBeNull();
    enablePdfService();
    mockRlFetch();
    freshLimits();
    const res = await renderPost(
      jsonRequest(`/api/matters/${blank.id}/render-pdf`, {
        cookie: attorneyCookie,
        body: { state: "ny", form: "ud1", confirmFormData: true },
      }),
      params({ id: blank.id })
    );
    // No 409: it gets past the jurisdiction guard. (With the answers cleared
    // it then fails the deterministic mapping's completeness check — 400 —
    // which is the correct next objection: missing FACTS, not missing form.)
    expect(res.status).not.toBe(409);
    expect((await getMatter(blank.id))!.jurisdictionConfirmed).toBe("NY");
  });

  it("service disabled ⇒ 503 and the manual workflow is unaffected", async () => {
    const matter = await nyReadyMatter();
    freshLimits();
    const res = await renderPost(
      jsonRequest(`/api/matters/${matter.id}/render-pdf`, {
        cookie: attorneyCookie,
        body: { state: "ny", form: "ud1", confirmFormData: true },
      }),
      params({ id: matter.id })
    );
    expect(res.status).toBe(503);
  });

  it("allowlist inspection GET is staff/attorney only", async () => {
    const matter = await nyReadyMatter();
    freshLimits();
    const res = await renderGet(
      jsonRequest(`/api/matters/${matter.id}/render-pdf`, { method: "GET", cookie: clientCookie }),
      params({ id: matter.id })
    );
    expect(res.status).toBe(403);
  });
});

describe("synthetic ephemeral-storage guard (Part 8)", () => {
  it("override is refused outside staging+synthetic and kills startup", () => {
    process.env.SYNTHETIC_STAGING_EPHEMERAL_STORAGE = "true";
    process.env.APP_STAGE = "closed_pilot";
    process.env.SYNTHETIC_DEMO_ONLY = "true";
    expect(() => assertEphemeralStorageFlagsValid()).toThrow(/STORAGE_GUARD/);
    process.env.APP_STAGE = "staging";
    delete process.env.SYNTHETIC_DEMO_ONLY;
    expect(() => assertEphemeralStorageFlagsValid()).toThrow(/STORAGE_GUARD/);
    process.env.SYNTHETIC_DEMO_ONLY = "true";
    expect(() => assertEphemeralStorageFlagsValid()).not.toThrow();
  });

  it("production storage refusal stands UNLESS the synthetic staging override is fully satisfied", () => {
    vi.stubEnv("NODE_ENV", "production");
    resetFileStorageForTests();
    expect(() => getFileStorage()).toThrow(/STORAGE_GUARD/);

    process.env.SYNTHETIC_STAGING_EPHEMERAL_STORAGE = "true";
    process.env.APP_STAGE = "staging";
    process.env.SYNTHETIC_DEMO_ONLY = "true";
    resetFileStorageForTests();
    expect(() => getFileStorage()).not.toThrow();
  });
});

describe("health + acceptance gating", () => {
  it("health returns booleans/labels only — never key material", async () => {
    process.env.APP_STAGE = "staging";
    const res = await healthGet();
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.stage).toBe("staging");
    expect(typeof body.aiConfigured).toBe("boolean");
    const raw = JSON.stringify(body);
    expect(raw).not.toMatch(/sk-[A-Za-z0-9]/);
    expect(raw).not.toContain("OPENAI_API_KEY");
  });

  it("acceptance endpoint is a neutral 404 outside synthetic staging and 401 without the bearer", async () => {
    const req = (body: unknown) =>
      new Request("http://localhost/api/staging/acceptance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    process.env.APP_STAGE = "local";
    expect((await acceptancePost(req({ step: "ny-setup" }))).status).toBe(404);

    process.env.APP_STAGE = "staging";
    process.env.SYNTHETIC_DEMO_ONLY = "true";
    process.env.ADMIN_SECRET = "synthetic-admin-secret";
    expect((await acceptancePost(req({ step: "ny-setup" }))).status).toBe(401);
  });
});
