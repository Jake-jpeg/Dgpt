/**
 * Uncontested-only — the product has ONE track (2026-07-26 operator directive:
 * "The whole scope is uncontested… We're not doing contested at all.").
 *
 * This file replaces tests/intake-track.test.ts, which pinned the removed
 * UNCONTESTED/CONTESTED switch. What is pinned now is the absence of that
 * switch: the phase route takes a phase and nothing else, matter creation
 * takes a label and nothing else, and the phase-1 fence still holds.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import { getSchemaForCategory } from "@/config/intake/schemas";
import { askableItems } from "@/lib/intake-chat/sequencer";
import { PHASE1_ITEM_IDS, matterIntakePhase, UNCONTESTED_CATEGORY } from "@/config/intake/phases";
import {
  cookieFor,
  provisionAccount,
  jsonRequest,
  params,
  freshLimits,
  SYNTH_ATTORNEY,
} from "./helpers";
import { createMatter, getMatter, grantMatterAccess } from "@/lib/db/matters";
import { GET as phaseGet, POST as phasePost } from "@/app/api/matters/[id]/phase/route";
import { POST as mattersPost } from "@/app/api/matters/route";

/* ── config resolution ─────────────────────────────────────────────── */

describe("phase resolution", () => {
  it("the phase comes from the matter, never from a category", () => {
    expect(matterIntakePhase({ intakePhase: 1, matterCategory: "NY_SUPREME_UNCONTESTED" })).toBe(1);
    expect(matterIntakePhase({ intakePhase: 2, matterCategory: "NY_SUPREME_UNCONTESTED" })).toBe(2);
    expect(matterIntakePhase({ intakePhase: 3, matterCategory: null })).toBe(3);
    expect(matterIntakePhase(null)).toBe(1);
  });

  it("there is exactly one category for this product", () => {
    expect(UNCONTESTED_CATEGORY).toBe("NY_SUPREME_UNCONTESTED");
  });
});

/* ── the phase-1 fence still holds ──────────────────────────────────── */

describe("phase 1 stays lean", () => {
  const answers = { "shared.relationship.status_kind": "MARRIAGE" };

  it("allow-listed items only, and never the DOB", () => {
    const schema = getSchemaForCategory(UNCONTESTED_CATEGORY);
    const lean = askableItems(schema, answers, 1);
    for (const item of lean) {
      expect(PHASE1_ITEM_IDS.has(item.id), `${item.id} leaked into phase 1`).toBe(true);
    }
    expect(lean.some((i) => i.id === "shared.identity.client_dob")).toBe(false);
  });

  it("the scope questions are in phase 1 — that IS intake part one", () => {
    const schema = getSchemaForCategory(UNCONTESTED_CATEGORY);
    const ids = new Set(schema.items.map((i) => i.id));
    for (const id of [
      "ny.scope.custody",
      "ny.scope.child_support",
      "ny.scope.maintenance",
      "ny.scope.equitable_distribution",
      "ny.scope.all_resolved",
    ]) {
      expect(ids.has(id), `${id} missing from the schema`).toBe(true);
      expect(PHASE1_ITEM_IDS.has(id), `${id} not in the phase-1 allow-list`).toBe(true);
    }
  });
});

/* ── routes ─────────────────────────────────────────────────────────── */

describe("phase route", () => {
  let attorneyCookie: string;
  let attorneyId: string;

  beforeEach(async () => {
    resetDbForTests();
    freshLimits();
    const account = await provisionAccount(SYNTH_ATTORNEY);
    attorneyId = account.id;
    attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
  });

  async function makeMatter() {
    const matter = await createMatter({ label: "Phase Test 2026-001", createdBy: attorneyId });
    await grantMatterAccess(matter.id, attorneyId, attorneyId);
    return matter;
  }

  it("GET reports the phase, and nothing about a track", async () => {
    const matter = await makeMatter();
    const res = await phaseGet(
      jsonRequest(`/api/matters/${matter.id}/phase`, { method: "GET", cookie: attorneyCookie }),
      params({ id: matter.id })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ phase: 1 });
    expect(body.track).toBeUndefined();
  });

  it("POST advances and rewinds the phase", async () => {
    const matter = await makeMatter();
    const res = await phasePost(
      jsonRequest(`/api/matters/${matter.id}/phase`, { cookie: attorneyCookie, body: { phase: 2 } }),
      params({ id: matter.id })
    );
    expect(res.status).toBe(200);
    expect(matterIntakePhase((await getMatter(matter.id))!)).toBe(2);

    const back = await phasePost(
      jsonRequest(`/api/matters/${matter.id}/phase`, { cookie: attorneyCookie, body: { phase: 1 } }),
      params({ id: matter.id })
    );
    expect(back.status).toBe(200);
    expect(matterIntakePhase((await getMatter(matter.id))!)).toBe(1);
  });

  it("a track in the body is no longer a valid payload", async () => {
    const matter = await makeMatter();
    const res = await phasePost(
      jsonRequest(`/api/matters/${matter.id}/phase`, {
        cookie: attorneyCookie,
        body: { track: "CONTESTED" },
      }),
      params({ id: matter.id })
    );
    expect(res.status).toBe(400);
  });

  it("an attorney-created matter is categorized uncontested at creation", async () => {
    const res = await mattersPost(
      jsonRequest("/api/matters", {
        cookie: attorneyCookie,
        body: { label: "Prospect 2026-002" },
      })
    );
    expect(res.status).toBe(201);
    const { matter } = (await res.json()) as { matter: { id: string } };
    const row = (await getMatter(matter.id))!;
    expect(row.matterCategory).toBe(UNCONTESTED_CATEGORY);
    expect(matterIntakePhase(row)).toBe(1);
  });
});
