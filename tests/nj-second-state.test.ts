/**
 * New Jersey — the second playbook, end to end (2026-08-23).
 *
 * One engine, two playbooks: these tests pin every seam where the states
 * could bleed into each other — phases, gates, gate wording, the answer
 * store, the render allowlist, the payload mappings (the ADDRESS SEAM),
 * the residency evaluator, and the render route's jurisdiction guard in
 * BOTH directions. New York behavior must be byte-identical throughout;
 * the NY-specific suites prove that by continuing to pass unchanged.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import { resetFileStorageForTests } from "@/lib/storage";
import {
  setupClientWithMatter,
  cookieFor,
  jsonRequest,
  params,
  freshLimits,
  clearMatter,
  SYNTH_ATTORNEY,
  type MatterContext,
} from "./helpers";
import { getMatter } from "@/lib/db/matters";
import { saveMatterAnswers, attorneySetJurisdictionAndScope, schemaForMatter } from "@/lib/db/intake2";
import {
  PHASE1_ITEM_IDS,
  PHASE2_ITEM_IDS,
  NJ_PHASE1_ITEM_IDS,
  NJ_PHASE2_ITEM_IDS,
  clientItemInPhase,
  NJ_CATEGORY,
} from "@/config/intake/phases";
import { NJ_INTAKE_SCHEMA_VERSION, INTAKE_SCHEMA_VERSION, getSchemaForCategory } from "@/config/intake/schemas";
import { evaluateGate } from "@/lib/intake/scope-gate";
import { gateQuestionsFor, GATE_QUESTIONS } from "@/config/gate-questions";
import { evaluateNjResidency } from "@/lib/legal/nj-residency";
import { ALLOWED_RENDERS, isAllowedRender, docxAvailable } from "@/lib/pdf-service/types";
import { buildRenderPayload, buildNjComplaintPayload } from "@/lib/pdf-service/mappings";
import { POST as renderPost } from "@/app/api/matters/[id]/render-pdf/route";
import type { AnswerMap } from "@/lib/intake2/types";

let ctx: MatterContext;
let attorneyCookie: string;

beforeEach(async () => {
  resetDbForTests();
  resetFileStorageForTests();
  freshLimits();
  ctx = await setupClientWithMatter();
  attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
});

afterEach(() => {
  delete process.env.PDF_SERVICE_ENABLED;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/* ── fixtures ─────────────────────────────────────────────────────────── */

const NJ_ANSWERS = [
  { questionId: "shared.identity.client_name", value: "Avery Stagingperson" },
  { questionId: "shared.identity.other_name", value: "Blake Stagingperson" },
  // The CHAT shape: one combined string with an unambiguous ", City, ST ZIP" tail.
  { questionId: "shared.identity.client_address", value: "45 Synthetic Terrace, Hoboken, NJ 07030" },
  { questionId: "shared.identity.other_address", value: { line1: "9 Test Court", city: "Jersey City", state: "NJ", zip: "07302" } },
  { questionId: "shared.relationship.status_kind", value: "MARRIAGE" },
  { questionId: "shared.relationship.marriage_date", value: "2016-09-10" },
  { questionId: "shared.relationship.marriage_place", value: "Newark, NJ" },
  { questionId: "nj.case.county", value: "Hudson" },
  { questionId: "nj.case.grounds_facts", value: "IRRECONCILABLE_6MO" },
];

async function njReadyMatter() {
  await clearMatter(ctx.matterId);
  await attorneySetJurisdictionAndScope({
    matterId: ctx.matterId,
    actingUserId: ctx.attorneyUserId,
    jurisdictionConfirmed: "NJ",
    matterCategory: NJ_CATEGORY,
    scopeStatus: "ACCEPTED",
  });
  await saveMatterAnswers({ matterId: ctx.matterId, actingUserId: ctx.clientUserId, answers: NJ_ANSWERS });
  return (await getMatter(ctx.matterId))!;
}

/* ── phases: the NJ lists, and the NY lists untouched ─────────────────── */

describe("phases — two playbooks, one filter", () => {
  it("the NY phase lists contain no nj.* id, and the NJ lists no ny.* id", () => {
    for (const id of PHASE1_ITEM_IDS) expect(id.startsWith("nj.")).toBe(false);
    for (const id of PHASE2_ITEM_IDS) expect(id.startsWith("nj.")).toBe(false);
    for (const id of NJ_PHASE1_ITEM_IDS) expect(id.startsWith("nj.")).toBe(true);
    for (const id of NJ_PHASE2_ITEM_IDS) expect(id.startsWith("nj.")).toBe(true);
  });

  it("NJ client items phase correctly: scope in 1, signed MSA in 2 (mirroring NY)", () => {
    const item = (id: string) => ({ id, audience: "CLIENT" });
    expect(clientItemInPhase(item("nj.case.grounds_facts"), 1)).toBe(true);
    expect(clientItemInPhase(item("nj.scope.alimony"), 1)).toBe(true);
    // signed_agreement is a settlement fact — phase 2, exactly like NY's
    expect(clientItemInPhase(item("nj.case.signed_agreement"), 1)).toBe(false);
    expect(clientItemInPhase(item("nj.case.signed_agreement"), 2)).toBe(true);
    // NY ids resolve through the NY lists exactly as before
    expect(clientItemInPhase(item("ny.case.grounds_facts"), 1)).toBe(true);
    expect(clientItemInPhase(item("shared.identity.client_name"), 1)).toBe(true);
    // and a shared settlement fact stays phase-2 for BOTH states
    expect(clientItemInPhase(item("shared.assets.records"), 1)).toBe(false);
    expect(clientItemInPhase(item("shared.assets.records"), 2)).toBe(true);
  });

  it("every NJ phase-list id exists in the built NJ schema (no phantom ids)", () => {
    const schema = getSchemaForCategory(NJ_CATEGORY);
    const ids = new Set(schema.items.map((i) => i.id));
    for (const id of NJ_PHASE2_ITEM_IDS) expect(ids.has(id), `missing ${id}`).toBe(true);
  });
});

/* ── gates: NJ's flat residency rule; NY's cascade untouched ──────────── */

describe("gates — NJ flat 12-month residency, shared DV", () => {
  it("NJ residency: yes → venue; no → hard OUT to attorney review (no cascade)", () => {
    expect(evaluateGate("GATE_RESIDENCY", true, "NJ")).toEqual({ outcome: "PASS", next: "GATE_VENUE" });
    const out = evaluateGate("GATE_RESIDENCY", false, "NJ");
    expect(out.outcome).toBe("OUT");
    if (out.outcome === "OUT") {
      expect(out.card).toBe("PHASE1_ATTORNEY_REVIEW");
      expect(out.auditEvent).toBe("SCOPE_OUT_RESIDENCY_PHASE1");
    }
  });

  it("the NY cascade states REFUSE an NJ jurisdiction — never NY law to an NJ client", () => {
    expect(() => evaluateGate("GATE_RESIDENCY_1YR", true, "NJ")).toThrow(/VALIDATION/);
    expect(() => evaluateGate("GATE_RESIDENCY_NEXUS", true, "NJ")).toThrow(/VALIDATION/);
  });

  it("NJ venue accepts NJ counties and rejects NY ones; NY venue is unchanged", () => {
    const nj = evaluateGate("GATE_VENUE", "Bergen", "NJ");
    expect(nj.outcome).toBe("PASS");
    if (nj.outcome === "PASS") expect(nj.persist?.county).toBe("Bergen");
    expect(() => evaluateGate("GATE_VENUE", "Kings", "NJ")).toThrow(/unknown county/);
    const ny = evaluateGate("GATE_VENUE", "Kings");
    expect(ny.outcome).toBe("PASS");
    expect(() => evaluateGate("GATE_VENUE", "Bergen")).toThrow(/unknown county/);
  });

  it("NY default is byte-identical: two-year no → the one-year question, as always", () => {
    expect(evaluateGate("GATE_RESIDENCY", false)).toEqual({ outcome: "PASS", next: "GATE_RESIDENCY_1YR" });
  });

  it("NJ gate WORDING names New Jersey and one year; DV is the SAME object in both states", () => {
    const njq = gateQuestionsFor("NJ");
    expect(njq.GATE_RESIDENCY.prompt).toContain("New Jersey");
    expect(njq.GATE_RESIDENCY.prompt).toContain("1 year");
    expect(njq.GATE_RESIDENCY.prompt).not.toContain("New York");
    expect(njq.GATE_VENUE.prompt).toContain("New Jersey");
    expect(njq.GATE_VENUE.options!.some((o) => o.value === "Bergen")).toBe(true);
    expect(njq.GATE_VENUE.options!.some((o) => o.value === "Kings")).toBe(false);
    // DV / children / complexity: same question, same card, same object.
    expect(njq.GATE_DV).toBe(GATE_QUESTIONS.GATE_DV);
    expect(njq.GATE_CHILDREN).toBe(GATE_QUESTIONS.GATE_CHILDREN);
    expect(njq.GATE_COMPLEXITY).toBe(GATE_QUESTIONS.GATE_COMPLEXITY);
    // And NY's own wording object is exactly the untouched original.
    expect(gateQuestionsFor("NY")).toBe(GATE_QUESTIONS);
  });
});

/* ── the answer store: one playbook per matter ────────────────────────── */

describe("answer store — the NJ schema refuses NY answers and vice versa", () => {
  it("an NJ matter accepts nj.* + shared.*, refuses ny.*; version pinned to the NJ line", async () => {
    const matter = await njReadyMatter();
    expect(matter.matterCategory).toBe(NJ_CATEGORY);
    expect(matter.intakeSchemaVersion).toBe(NJ_INTAKE_SCHEMA_VERSION);
    expect(schemaForMatter(matter).jurisdiction).toBe("NJ");
    await expect(
      saveMatterAnswers({
        matterId: matter.id,
        actingUserId: ctx.clientUserId,
        answers: [{ questionId: "ny.case.county", value: "KINGS" }],
      })
    ).rejects.toThrow();
  });

  it("a NY matter keeps the NY version pin (regression: the pin follows the category)", async () => {
    await clearMatter(ctx.matterId);
    await attorneySetJurisdictionAndScope({
      matterId: ctx.matterId,
      actingUserId: ctx.attorneyUserId,
      jurisdictionConfirmed: "NY",
      matterCategory: "NY_SUPREME_UNCONTESTED",
    });
    const matter = (await getMatter(ctx.matterId))!;
    expect(matter.intakeSchemaVersion).toBe(INTAKE_SCHEMA_VERSION);
  });
});

/* ── the render allowlist ─────────────────────────────────────────────── */

describe("render allowlist — the ten NJ forms, by RL's exact route names", () => {
  const NJ_FORMS = [
    "complaint", "summons", "verification",
    "acknowledgment", "cdr_plaintiff", "cdr_defendant", "insurance",
    "jod", "jod_cert_plaintiff", "jod_cert_defendant",
  ];

  it("exactly these ten nj pairs are allowlisted; no Word build claimed for any", () => {
    const nj = ALLOWED_RENDERS.filter((r) => r.state === "nj").map((r) => r.form);
    expect(nj).toEqual(NJ_FORMS);
    for (const f of NJ_FORMS) {
      expect(isAllowedRender("nj", f)).toBe(true);
      expect(docxAvailable("nj", f)).toBe(false); // RL has no NJ Word builds yet
    }
    expect(isAllowedRender("nj", "ud1")).toBe(false); // NY forms never leak into NJ
    expect(isAllowedRender("ny", "jod")).toBe(false); // and vice versa
  });
});

/* ── mappings: determinism, the address seam, nothing invented ────────── */

describe("NJ mappings — the address seam handled the careful way", () => {
  const base: AnswerMap = {
    "shared.identity.client_name": "Avery Stagingperson",
    "shared.identity.other_name": "Blake Stagingperson",
    "shared.relationship.marriage_date": "2016-09-10",
    "shared.relationship.marriage_place": "Newark, NJ",
    "nj.case.county": "Hudson",
  };

  it("a structured address object splits exactly; payload is deterministic", async () => {
    const matter = await njReadyMatter();
    const answers: AnswerMap = {
      ...base,
      "shared.identity.client_address": { line1: "45 Synthetic Terrace", city: "Hoboken", state: "NJ", zip: "07030" },
      "shared.identity.other_address": { line1: "9 Test Court", city: "Jersey City", state: "NJ", zip: "07302" },
    };
    const p1 = buildNjComplaintPayload(matter, answers);
    const p2 = buildNjComplaintPayload(matter, answers);
    expect(p1).toEqual(p2);
    expect(p1.plaintiffAddress).toBe("45 Synthetic Terrace");
    expect(p1.plaintiffCityStateZip).toBe("Hoboken, NJ 07030");
    expect(p1.plaintiffFullCityState).toBe("Hoboken, NJ");
    expect(p1.defendantCityStateZip).toBe("Jersey City, NJ 07302");
    expect(p1.filingCounty).toBe("Hudson");
    expect(p1.ceremonyType).toBe("civil");
    expect(p1.plaintiffPhone).toBe(""); // sensitive contact data — never mapped
    expect(p1.docketNumber).toBe(""); // clerk-assigned — blank until real
  });

  it("a chat-written string splits ONLY on an unambiguous ', City, ST ZIP' tail", async () => {
    const matter = await njReadyMatter();
    const answers: AnswerMap = {
      ...base,
      "shared.identity.client_address": "45 Synthetic Terrace, Hoboken, NJ 07030",
      "shared.identity.other_address": "9 Test Court, Jersey City, NJ 07302-1234",
    };
    const p = buildNjComplaintPayload(matter, answers);
    expect(p.plaintiffAddress).toBe("45 Synthetic Terrace");
    expect(p.plaintiffCityStateZip).toBe("Hoboken, NJ 07030");
    expect(p.defendantCityStateZip).toBe("Jersey City, NJ 07302-1234");
  });

  it("an AMBIGUOUS string goes on the paper whole — a wrong guess would print in a caption", async () => {
    const matter = await njReadyMatter();
    const answers: AnswerMap = {
      ...base,
      "shared.identity.client_address": "45 Synthetic Terrace, Hoboken", // no ST ZIP tail
      "shared.identity.other_address": "9 Test Court, Jersey City, New Jersey", // spelled-out state
    };
    const p = buildNjComplaintPayload(matter, answers);
    expect(p.plaintiffAddress).toBe("45 Synthetic Terrace, Hoboken");
    expect(p.plaintiffCityStateZip).toBe(""); // blank for the attorney, never guessed
    expect(p.defendantAddress).toBe("9 Test Court, Jersey City, New Jersey");
    expect(p.defendantCityStateZip).toBe("");
  });

  it("missing critical facts throw VALIDATION on every NJ form; nothing is invented", async () => {
    const matter = await njReadyMatter();
    for (const form of ["complaint", "summons", "verification", "jod", "insurance"]) {
      expect(() => buildRenderPayload("nj", form, matter, {})).toThrow(/VALIDATION.*incomplete/);
    }
  });
});

/* ── the residency evaluator ──────────────────────────────────────────── */

describe("NJ residency card — flat 2A:34-10 rule, two colors, reasons", () => {
  const AS_OF = Date.parse("2026-08-23T12:00:00Z");

  it("one year + ground + county = PASS, with the WHY spelled out", () => {
    const check = evaluateNjResidency(
      {
        "nj.case.resident_now": true,
        "nj.case.resident_since": "2024-01-15",
        "nj.case.county": "Hudson",
        "nj.case.grounds_facts": "IRRECONCILABLE_6MO",
      },
      AS_OF
    );
    expect(check.verdict).toBe("PASS");
    expect(check.reasons.join(" ")).toContain("one year or more");
    expect(check.citations).toContain("N.J.S.A. 2A:34-10");
    expect(check.citations).toContain("N.J.S.A. 2A:34-2(i)");
  });

  it("under a year = REVIEW naming the gap; missing county = REVIEW", () => {
    const short = evaluateNjResidency(
      {
        "nj.case.resident_now": true,
        "nj.case.resident_since": "2026-05-01",
        "nj.case.county": "Hudson",
        "nj.case.grounds_facts": "IRRECONCILABLE_6MO",
      },
      AS_OF
    );
    expect(short.verdict).toBe("REVIEW");
    expect(short.reasons.join(" ")).toContain("Less than one year");

    const noCounty = evaluateNjResidency(
      {
        "nj.case.resident_now": true,
        "nj.case.resident_since": "2020-01-01",
        "nj.case.grounds_facts": "IRRECONCILABLE_6MO",
      },
      AS_OF
    );
    expect(noCounty.verdict).toBe("REVIEW");
    expect(noCounty.reasons.join(" ")).toContain("venue is not set");
  });
});

/* ── the seam, at the route, in BOTH directions ───────────────────────── */

describe("render route — the jurisdiction guard cuts both ways", () => {
  function renderReq(matterId: string, state: string, form: string) {
    return renderPost(
      jsonRequest(`/api/matters/${matterId}/render-pdf`, {
        cookie: attorneyCookie,
        body: { state, form, confirmFormData: true },
      }),
      params({ id: matterId })
    );
  }

  it("an NJ matter cannot render a NY form → 409; a NY matter cannot render an NJ form → 409", async () => {
    process.env.PDF_SERVICE_ENABLED = "true";
    process.env.PDF_SERVICE_URL = "http://rl.test";
    process.env.PDF_SERVICE_TOKEN = "synthetic-service-token-never-real";

    const nj = await njReadyMatter();
    freshLimits();
    const crossNy = await renderReq(nj.id, "ny", "ud1");
    expect(crossNy.status).toBe(409);

    await clearMatter(ctx.matterId);
    await attorneySetJurisdictionAndScope({
      matterId: ctx.matterId,
      actingUserId: ctx.attorneyUserId,
      jurisdictionConfirmed: "NY",
      matterCategory: "NY_SUPREME_UNCONTESTED",
    });
    freshLimits();
    const crossNj = await renderReq(ctx.matterId, "nj", "complaint");
    expect(crossNj.status).toBe(409);
  });

  it("an UNCONFIRMED matter whose picker candidate says NJ refuses a NY render (no silent flip)", async () => {
    // A staff-created NJ matter has candidate=NJ and no confirmation. The
    // old auto-confirm would have flipped it to NY on the attorney's first
    // NY render click — that would be a silent jurisdiction change.
    const { createMatter, getMatter: getM } = await import("@/lib/db/matters");
    const m = await createMatter({ label: "NJ candidate", createdBy: ctx.attorneyUserId, jurisdictionCandidate: "NJ" });
    const { grantMatterAccess } = await import("@/lib/db/matters");
    await grantMatterAccess(m.id, ctx.attorneyUserId, ctx.attorneyUserId);
    freshLimits();
    const res = await renderReq(m.id, "ny", "ud1");
    expect(res.status).toBe(409);
    expect((await getM(m.id))!.jurisdictionConfirmed).toBeNull(); // nothing was flipped
  });
});
