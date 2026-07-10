/**
 * ACCEPTANCE CRITERION 6: all glossary / process / "why we ask" text is
 * loaded from attorney-controlled config (placeholders acceptable in Stage 1
 * and clearly labeled).
 *
 * Plus unit tests for the pure gate/routing/classifier functions.
 */
import { describe, it, expect, vi } from "vitest";
import { CARDS } from "@/config/cards";
import { GLOSSARY } from "@/config/glossary";
import { PROCESS_COPY } from "@/config/process-copy";
import { CLARIFICATIONS } from "@/config/clarifications";
import { SECTIONS, sectionsForTier } from "@/config/intake-fields";
import { evaluateGate } from "@/lib/intake/scope-gate";
import { evaluateBranch, routeAnswer } from "@/lib/intake/tiers";
import { KeywordClassifier } from "@/lib/bot/classifier";
import { StubConflictCheckProvider } from "@/lib/conflict/provider";
import { devAuthStubEnabled } from "@/lib/env";
import { assertCriticalCopyReady, dvCardHasPlaceholder } from "@/lib/config-guard";

describe("criterion 6: attorney-controlled config", () => {
  it("placeholder copy is clearly labeled for the attorney to replace", () => {
    const placeholderMark = "[ATTORNEY TO SUPPLY";
    // Glossary definitions are all placeholders in Stage 1, clearly labeled.
    for (const t of GLOSSARY) expect(t.definition).toContain(placeholderMark);
    for (const c of CLARIFICATIONS) expect(c.text).toContain(placeholderMark);
    for (const copy of Object.values(PROCESS_COPY)) expect(copy).toContain(placeholderMark);
    // Cards: referral/deflection copy also placeholder-labeled.
    for (const card of Object.values(CARDS)) {
      expect(card.body.length).toBeGreaterThan(20);
    }
  });

  it("glossary terms have unique IDs and non-empty aliases", () => {
    const ids = GLOSSARY.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of GLOSSARY) expect(t.aliases.length).toBeGreaterThan(0);
  });

  it("field config is structurally sound (unique IDs, options on selects)", () => {
    const ids = SECTIONS.flatMap((s) => s.fields.map((f) => f.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SECTIONS) {
      for (const f of s.fields) {
        if (f.type === "select") {
          expect(f.options && f.options.length >= 2).toBe(true);
        }
      }
    }
  });

  it("tier composition matches the spec: T2 = BOTH minus T1 confirmations plus ED/maintenance", () => {
    const t1 = sectionsForTier("TIER1").map((s) => s.id);
    const t2 = sectionsForTier("TIER2").map((s) => s.id);
    expect(t1).toContain("t1_confirmations");
    expect(t1).not.toContain("equitable_distribution");
    expect(t1).not.toContain("maintenance");
    expect(t2).not.toContain("t1_confirmations");
    expect(t2).toContain("equitable_distribution");
    expect(t2).toContain("maintenance");
  });
});

describe("scope gate unit behavior", () => {
  it("residency: no → out with attorney-flag card (adultery exception never auto-resolved)", () => {
    const r = evaluateGate("GATE_RESIDENCY", false);
    expect(r).toMatchObject({ outcome: "OUT", card: "RESIDENCY_ATTORNEY_FLAG" });
  });
  it("venue: county captured, never disqualifies", () => {
    const r = evaluateGate("GATE_VENUE", "Bergen");
    expect(r).toMatchObject({ outcome: "PASS", persist: { county: "Bergen" } });
    expect(() => evaluateGate("GATE_VENUE", "Kings")).toThrow(/VALIDATION/);
  });
  it("DV: any yes → hard out with the DV card", () => {
    expect(evaluateGate("GATE_DV", true)).toMatchObject({ outcome: "OUT", card: "DV_RESOURCES" });
    expect(evaluateGate("GATE_DV", false)).toMatchObject({ outcome: "PASS" });
  });
  it("malformed answers throw instead of passing", () => {
    expect(() => evaluateGate("GATE_DV", "maybe")).toThrow(/VALIDATION/);
    expect(() => evaluateGate("GATE_RESIDENCY", 1)).toThrow(/VALIDATION/);
  });
});

describe("tier routing unit behavior", () => {
  it("branch: NONE+NONE→TIER1; SETTLED/AGREED→TIER2; UNSURE→OUT", () => {
    expect(evaluateBranch("NONE", "NONE")).toMatchObject({ outcome: "TIER1" });
    expect(evaluateBranch("SETTLED", "NONE")).toMatchObject({ outcome: "TIER2" });
    expect(evaluateBranch("NONE", "AGREED")).toMatchObject({ outcome: "TIER2" });
    expect(evaluateBranch("UNSURE", "NONE")).toMatchObject({ outcome: "OUT" });
  });

  it("retirement tree: 401k/pension split → QDRO flag; IRA split → no QDRO; military flagged", () => {
    const q = routeAnswer("ed_retirement_accounts", [
      { accountType: "401K", holder: "CLIENT", division: "SPLIT_AGREED" },
    ]);
    expect(q).toMatchObject({ outcome: "CONTINUE", qdroFlag: true });

    const ira = routeAnswer("ed_retirement_accounts", [
      { accountType: "IRA_TRADITIONAL", holder: "CLIENT", division: "SPLIT_AGREED" },
    ]);
    expect(ira).toMatchObject({ outcome: "CONTINUE" });
    expect((ira as { qdroFlag?: boolean }).qdroFlag).toBeFalsy();

    const mil = routeAnswer("ed_retirement_accounts", [
      { accountType: "MILITARY", holder: "SPOUSE", division: "OTHER_AGREED" },
    ]);
    expect(mil).toMatchObject({ outcome: "CONTINUE", qdroFlag: true });
    expect((mil as { attorneyFlags?: string[] }).attorneyFlags).toContain(
      "MILITARY_RETIREMENT_DIVISION"
    );
  });

  it("business interest / valuation / retirement disagreement → OUT", () => {
    expect(routeAnswer("ed_business_interest", true)).toMatchObject({ outcome: "OUT" });
    expect(routeAnswer("ed_valuation_needed", true)).toMatchObject({ outcome: "OUT" });
    expect(
      routeAnswer("ed_retirement_accounts", [
        { accountType: "PENSION", holder: "CLIENT", division: "UNSURE" },
      ])
    ).toMatchObject({ outcome: "OUT" });
  });
});

describe("classifier unit behavior", () => {
  const c = new KeywordClassifier();
  it("definition requests map to glossary terms", () => {
    expect(c.classify("what does equitable distribution mean?")).toMatchObject({
      intent: "DEFINITION",
      termId: "TERM_EQUITABLE_DISTRIBUTION",
    });
    expect(c.classify("QDRO?")).toMatchObject({ intent: "DEFINITION", termId: "TERM_QDRO" });
  });
  it("applied-to-my-facts beats a term match", () => {
    expect(c.classify("so does that mean I waive alimony?")).toMatchObject({
      intent: "ADVICE_SEEKING",
    });
    expect(c.classify("should I ask for alimony")).toMatchObject({ intent: "ADVICE_SEEKING" });
  });
  it("unknown stuff is UNRECOGNIZED, never guessed", () => {
    expect(c.classify("tell me a joke about judges")).toMatchObject({ intent: "UNRECOGNIZED" });
  });
});

describe("stub conflict provider", () => {
  it("matches against the synthetic list, normalized", async () => {
    const p = new StubConflictCheckProvider();
    const hit = await p.check(
      { fullLegalName: "harold   FICTIONBERG", priorNames: [] },
      { fullLegalName: "Someone Else", priorNames: [] }
    );
    expect(hit).toBe("HIT");
    const clear = await p.check(
      { fullLegalName: "Casey Syntheticperson", priorNames: [] },
      { fullLegalName: "Jordan Syntheticperson", priorNames: [] }
    );
    expect(clear).toBe("CLEAR");
  });
});

describe("DV card ship-blocker guard", () => {
  const filledCard = {
    id: "DV_RESOURCES",
    title: "This needs a person, not an automated intake",
    body: "Please contact Example Law LLC at (201) 555-0100 directly, or reach the Domestic Violence / Victim's unit at your county courthouse.",
    resources: [{ label: "Contact the firm", value: "Example Law LLC — (201) 555-0100" }],
  };

  it("detects the unfilled placeholder in the shipped DV card", () => {
    expect(dvCardHasPlaceholder()).toBe(true); // Stage 1 ships unfilled — by design
    expect(dvCardHasPlaceholder(filledCard)).toBe(false);
  });

  it("production boot REFUSES while the DV card is unfilled", () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      expect(() => assertCriticalCopyReady()).toThrowError(/SHIP_BLOCKER/);
      expect(() => assertCriticalCopyReady(filledCard)).not.toThrow();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("non-production only warns, never blocks local testing", () => {
    expect(() => assertCriticalCopyReady()).not.toThrow();
  });
});

describe("dev auth stub production lock", () => {
  it("is structurally disabled when NODE_ENV=production, regardless of the flag", () => {
    vi.stubEnv("DEV_AUTH_STUB", "true");
    vi.stubEnv("NODE_ENV", "production");
    try {
      expect(devAuthStubEnabled()).toBe(false);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
