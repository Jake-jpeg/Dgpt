/**
 * Phase 1 contract — the intake asks ONLY the Summons + Verified Complaint
 * field set (plus the 5 scope gates handled by the state machine).
 *
 * This is the regression fence against question-bloat: any item added to the
 * schema does NOT reach the phase-1 client unless it is deliberately added to
 * PHASE1_ITEM_IDS. The 2026-07-22 operator directive: the first interview
 * covers jurisdiction + verified-complaint facts, nothing else — settlement /
 * financial questions belong to Phase 2 (stipulation), service/finalization
 * to Phase 3.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getSchemaForCategory } from "@/config/intake/schemas";
import { askableItems } from "@/lib/intake-chat/sequencer";
import { estimateQuestionCount } from "@/lib/intake-chat/orchestrator";
import {
  PHASE1_ITEM_IDS,
  PHASE2_ITEM_IDS,
  activeIntakePhase,
  clientItemInActivePhase,
  matterIntakePhase,
} from "@/config/intake/phases";
import { visibleItems, missingRequired, sectionProgress } from "@/lib/intake2/engine";

const CATEGORY = "NY_SUPREME_UNCONTESTED" as const;

describe("Phase 1 intake contract", () => {
  it("phase 1 is the default (no env needed)", () => {
    expect(activeIntakePhase()).toBe(1);
  });

  it("every askable item is on the Phase-1 allow-list — no question bloat", () => {
    const schema = getSchemaForCategory(CATEGORY);
    // Walk with progressively richer answers so conditional items surface.
    const answerSets = [
      {},
      { "shared.relationship.status_kind": "MARRIAGE" },
      {
        "shared.relationship.status_kind": "MARRIAGE",
        "ny.case.resident_now": true,
        "ny.case.grounds_facts": ["IRRETRIEVABLE_BREAKDOWN"],
      },
    ];
    for (const answers of answerSets) {
      for (const item of askableItems(schema, answers)) {
        expect(PHASE1_ITEM_IDS.has(item.id), `${item.id} asked outside Phase 1`).toBe(true);
      }
    }
  });

  it("the interview is short: ~20 questions estimated, not 130", () => {
    const schema = getSchemaForCategory(CATEGORY);
    const estimate = estimateQuestionCount(schema);
    expect(estimate).toBeLessThanOrEqual(30);
    expect(estimate).toBeGreaterThanOrEqual(10);
  });

  it("phase filter applies to every client surface: sequencer, client view, missing-required, sections", () => {
    const schema = getSchemaForCategory(CATEGORY);
    const answers = { "shared.relationship.status_kind": "MARRIAGE" };
    for (const i of visibleItems(schema, answers, "CLIENT")) {
      expect(PHASE1_ITEM_IDS.has(i.id), `client view leaks ${i.id}`).toBe(true);
    }
    for (const i of missingRequired(schema, answers)) {
      expect(PHASE1_ITEM_IDS.has(i.id), `missing-required leaks ${i.id}`).toBe(true);
    }
    // Sections with no phase-1 items report zero — the form UI hides them.
    const bloatSections = sectionProgress(schema, answers).filter(
      (s) => s.total > 0 && !["identity", "relationship", "ny_case"].includes(s.sectionId)
    );
    expect(bloatSections).toEqual([]);
  });

  it("attorney surfaces are NEVER phase-filtered", () => {
    const schema = getSchemaForCategory(CATEGORY);
    const attorneyItems = visibleItems(schema, {}, "ATTORNEY");
    // Attorney determinations remain visible even though they are not on the
    // phase-1 client list.
    expect(attorneyItems.some((i) => i.type === "attorney_determination")).toBe(true);
    expect(
      clientItemInActivePhase({ id: "ny.det.grounds", audience: "ATTORNEY" })
    ).toBe(true);
  });

  it("INTAKE_PHASE=ALL restores the full questionnaire (phase filter is reversible)", () => {
    process.env.INTAKE_PHASE = "ALL";
    try {
      const schema = getSchemaForCategory(CATEGORY);
      const all = askableItems(schema, { "shared.relationship.status_kind": "MARRIAGE" });
      expect(all.length).toBeGreaterThan(PHASE1_ITEM_IDS.size);
    } finally {
      delete process.env.INTAKE_PHASE;
    }
  });
});

describe("Phase 2 progression contract", () => {
  it("phase 2 is cumulative: everything phase 1 asks, plus the settlement items", () => {
    for (const id of PHASE1_ITEM_IDS) {
      expect(PHASE2_ITEM_IDS.has(id), `${id} lost when advancing to phase 2`).toBe(true);
    }
    expect(PHASE2_ITEM_IDS.size).toBeGreaterThan(PHASE1_ITEM_IDS.size);
  });

  it("advancing a matter to phase 2 opens the settlement questions — and only allow-listed ones", () => {
    const schema = getSchemaForCategory(CATEGORY);
    const answers = { "shared.relationship.status_kind": "MARRIAGE" };
    const p1 = new Set(askableItems(schema, answers, 1).map((i) => i.id));
    const p2 = askableItems(schema, answers, 2);
    // The settlement core appears in phase 2 and was absent in phase 1.
    for (const id of [
      "ny.settlement.plaintiff_income",
      "ny.settlement.defendant_income",
      "ny.settlement.maintenance_waived",
      "ny.settlement.division_terms",
      "shared.assets.records",
      "shared.debts.records",
    ]) {
      expect(p1.has(id), `${id} leaked into phase 1`).toBe(false);
      expect(p2.some((i) => i.id === id), `${id} missing from phase 2`).toBe(true);
    }
    for (const item of p2) {
      expect(PHASE2_ITEM_IDS.has(item.id), `${item.id} asked outside phase 2`).toBe(true);
    }
    // Phase 3 asks the client nothing new.
    expect(askableItems(schema, answers, 3).map((i) => i.id)).toEqual(p2.map((i) => i.id));
  });

  it("matterIntakePhase resolves from the matter row; env ALL overrides", () => {
    expect(matterIntakePhase({ intakePhase: 1 })).toBe(1);
    expect(matterIntakePhase({ intakePhase: 2 })).toBe(2);
    expect(matterIntakePhase({ intakePhase: 3 })).toBe(3);
    expect(matterIntakePhase(null)).toBe(1);
    process.env.INTAKE_PHASE = "ALL";
    try {
      expect(matterIntakePhase({ intakePhase: 1 })).toBe("ALL");
    } finally {
      delete process.env.INTAKE_PHASE;
    }
  });
});
