/**
 * Intake tracks — uncontested vs contested (2026-07-26 operator directive).
 *
 * "In the portal, there will be an uncontested and a contested portion."
 * The attorney declares the track per matter:
 *   UNCONTESTED — the lean phased interview (the proven ~16-question walk:
 *                 pleading facts only, no SNW battery, no DOB).
 *   CONTESTED   — the FULL questionnaire, net-worth facts included, so the
 *                 Statement of Net Worth can be prepared from the answers.
 *
 * The track rides `matter_category` (NY_SUPREME_CONTESTED ⇒ contested) and
 * resolves the intake phase to "ALL" — one switch through the one guarded
 * category setter, no parallel plumbing. These tests pin both the config
 * resolution and the route behavior.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import { getSchemaForCategory } from "@/config/intake/schemas";
import { askableItems } from "@/lib/intake-chat/sequencer";
import { estimateQuestionCount } from "@/lib/intake-chat/orchestrator";
import {
  PHASE1_ITEM_IDS,
  matterIntakePhase,
  matterIntakeTrack,
  TRACK_CATEGORY,
} from "@/config/intake/phases";
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

describe("track → phase resolution", () => {
  it("a contested matter always gets the full questionnaire (phase ALL)", () => {
    expect(matterIntakePhase({ intakePhase: 1, matterCategory: "NY_SUPREME_CONTESTED" })).toBe("ALL");
    expect(matterIntakePhase({ intakePhase: 3, matterCategory: "NY_SUPREME_CONTESTED" })).toBe("ALL");
  });

  it("uncontested (and unassigned) matters keep the lean phased interview", () => {
    expect(matterIntakePhase({ intakePhase: 1, matterCategory: "NY_SUPREME_UNCONTESTED" })).toBe(1);
    expect(matterIntakePhase({ intakePhase: 2, matterCategory: "NY_SUPREME_UNCONTESTED" })).toBe(2);
    expect(matterIntakePhase({ intakePhase: 1, matterCategory: null })).toBe(1);
    expect(matterIntakePhase(null)).toBe(1);
  });

  it("track derivation: only NY_SUPREME_CONTESTED is contested", () => {
    expect(matterIntakeTrack({ matterCategory: "NY_SUPREME_CONTESTED" })).toBe("CONTESTED");
    expect(matterIntakeTrack({ matterCategory: "NY_SUPREME_UNCONTESTED" })).toBe("UNCONTESTED");
    expect(matterIntakeTrack({ matterCategory: null })).toBe("UNCONTESTED");
    expect(matterIntakeTrack(null)).toBe("UNCONTESTED");
    expect(TRACK_CATEGORY.CONTESTED).toBe("NY_SUPREME_CONTESTED");
    expect(TRACK_CATEGORY.UNCONTESTED).toBe("NY_SUPREME_UNCONTESTED");
  });
});

/* ── the interviews actually differ ─────────────────────────────────── */

describe("contested asks the full questionnaire; uncontested stays lean", () => {
  const answers = { "shared.relationship.status_kind": "MARRIAGE" };

  it("contested surfaces the SNW facts the uncontested track never asks", () => {
    const schema = getSchemaForCategory("NY_SUPREME_CONTESTED");
    const contested = new Set(askableItems(schema, answers, "ALL").map((i) => i.id));
    // The net-worth battery and DOB — banished from the uncontested track —
    // are exactly what the contested track exists to collect.
    for (const id of [
      "shared.identity.client_dob",
      "shared.income.employers",
      "shared.income.sources",
      "shared.assets.records",
      "shared.debts.records",
    ]) {
      expect(contested.has(id), `${id} missing from the contested interview`).toBe(true);
    }
  });

  it("the uncontested phase-1 fence is untouched: allow-listed items only, never the DOB", () => {
    const schema = getSchemaForCategory("NY_SUPREME_UNCONTESTED");
    const lean = askableItems(schema, answers, 1);
    for (const item of lean) {
      expect(PHASE1_ITEM_IDS.has(item.id), `${item.id} leaked into phase 1`).toBe(true);
    }
    expect(lean.some((i) => i.id === "shared.identity.client_dob")).toBe(false);
  });

  it("the honest question estimate scales with the track", () => {
    const uncontested = estimateQuestionCount(getSchemaForCategory("NY_SUPREME_UNCONTESTED"), 1);
    const contested = estimateQuestionCount(getSchemaForCategory("NY_SUPREME_CONTESTED"), "ALL");
    expect(contested).toBeGreaterThan(uncontested);
  });
});

/* ── routes ─────────────────────────────────────────────────────────── */

describe("track routes", () => {
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
    const matter = await createMatter({ label: "Track Test 2026-001", createdBy: attorneyId });
    await grantMatterAccess(matter.id, attorneyId, attorneyId);
    return matter;
  }

  it("POST {track} flips the matter category and the reported track/phase", async () => {
    const matter = await makeMatter();
    const res = await phasePost(
      jsonRequest(`/api/matters/${matter.id}/phase`, {
        cookie: attorneyCookie,
        body: { track: "CONTESTED" },
      }),
      params({ id: matter.id })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ track: "CONTESTED" });
    const updated = (await getMatter(matter.id))!;
    expect(updated.matterCategory).toBe("NY_SUPREME_CONTESTED");
    expect(matterIntakePhase(updated)).toBe("ALL");

    // And back — the track is switchable, saved answers untouched by design.
    const back = await phasePost(
      jsonRequest(`/api/matters/${matter.id}/phase`, {
        cookie: attorneyCookie,
        body: { track: "UNCONTESTED" },
      }),
      params({ id: matter.id })
    );
    expect(back.status).toBe(200);
    const reverted = (await getMatter(matter.id))!;
    expect(reverted.matterCategory).toBe("NY_SUPREME_UNCONTESTED");
    expect(matterIntakePhase(reverted)).toBe(1);
  });

  it("GET reports the track alongside the phase", async () => {
    const matter = await makeMatter();
    const res = await phaseGet(
      jsonRequest(`/api/matters/${matter.id}/phase`, { method: "GET", cookie: attorneyCookie }),
      params({ id: matter.id })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ phase: 1, track: "UNCONTESTED" });
  });

  it("matter creation accepts the track (attorney) and sets the category", async () => {
    const res = await mattersPost(
      jsonRequest("/api/matters", {
        cookie: attorneyCookie,
        body: { label: "Contested Prospect 2026-002", track: "CONTESTED" },
      })
    );
    expect(res.status).toBe(201);
    const { matter } = (await res.json()) as { matter: { id: string } };
    const row = (await getMatter(matter.id))!;
    expect(row.matterCategory).toBe("NY_SUPREME_CONTESTED");
    expect(matterIntakePhase(row)).toBe("ALL");
  });

  it("rejects a garbage track", async () => {
    const matter = await makeMatter();
    const res = await phasePost(
      jsonRequest(`/api/matters/${matter.id}/phase`, {
        cookie: attorneyCookie,
        body: { track: "FAMILY_COURT" },
      }),
      params({ id: matter.id })
    );
    expect(res.status).toBe(400);
  });
});
