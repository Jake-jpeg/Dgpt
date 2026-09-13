/**
 * ACCEPTANCE CRITERION 6: all glossary / process / "why we ask" text is
 * loaded from attorney-controlled config (placeholders acceptable in Stage 1
 * and clearly labeled).
 *
 * Plus unit tests for the pure gate/routing/classifier functions.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CARDS, getCard } from "@/config/cards";
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
  it("residency cascade: 2-year yes passes straight to venue", () => {
    expect(evaluateGate("GATE_RESIDENCY", true)).toMatchObject({ outcome: "PASS", next: "GATE_VENUE" });
  });
  // ── Residency policy (2026-09-13 — NOTHING STOPS THE CLIENT):
  //    2yr → clean pass; 1yr + objective nexus (§230(1)/(2)) → clean pass;
  //    1yr no nexus (§230(3) cause-in-NY) → pass FLAGGED for attorney;
  //    under 1 year → pass FLAGGED (only §230(4) could remain — the
  //    attorney's determination, made on a case they can see).
  it("PHASE 1: 2-year no → continues to the one-year question (the 1-yr prongs are real law)", () => {
    expect(evaluateGate("GATE_RESIDENCY", false)).toMatchObject({
      outcome: "PASS",
      next: "GATE_RESIDENCY_1YR",
    });
  });
  it("under one year → flag for attorney review, interview continues (never a stop, 2026-09-13)", () => {
    expect(evaluateGate("GATE_RESIDENCY_1YR", false)).toMatchObject({
      outcome: "PASS",
      next: "GATE_VENUE",
      reviewFlags: ["RESIDENCY_ATTORNEY_REVIEW"],
      auditEvent: "GATE_FLAG_RESIDENCY",
    });
  });
  it("PHASE 1: 1yr + objective nexus passes CLEAN; 1yr without nexus passes FLAGGED (§230(3))", () => {
    expect(evaluateGate("GATE_RESIDENCY_1YR", true)).toMatchObject({
      outcome: "PASS",
      next: "GATE_RESIDENCY_NEXUS",
    });
    const clean = evaluateGate("GATE_RESIDENCY_NEXUS", true);
    expect(clean).toMatchObject({ outcome: "PASS", next: "GATE_VENUE" });
    expect((clean as { reviewFlags?: string[] }).reviewFlags).toBeUndefined();
    expect(evaluateGate("GATE_RESIDENCY_NEXUS", false)).toMatchObject({
      outcome: "PASS",
      next: "GATE_VENUE",
      reviewFlags: ["RESIDENCY_ATTORNEY_REVIEW"],
    });
  });
  // ── Legacy cascade (INTAKE_PHASE=ALL): the § 230 cascade never terminates.
  describe("legacy cascade under INTAKE_PHASE=ALL", () => {
    beforeEach(() => {
      process.env.INTAKE_PHASE = "ALL";
    });
    afterEach(() => {
      delete process.env.INTAKE_PHASE;
    });
    it("2-year no continues to the 1-year question — never out", () => {
      const r = evaluateGate("GATE_RESIDENCY", false);
      expect(r).toMatchObject({ outcome: "PASS", next: "GATE_RESIDENCY_1YR" });
      expect((r as { reviewFlags?: string[] }).reviewFlags).toBeUndefined();
    });
    it("1-year no → flag for attorney review, intake continues", () => {
      const r = evaluateGate("GATE_RESIDENCY_1YR", false);
      expect(r).toMatchObject({ outcome: "PASS", next: "GATE_VENUE", reviewFlags: ["RESIDENCY_ATTORNEY_REVIEW"] });
    });
    it("1-year yes → NY-nexus question", () => {
      expect(evaluateGate("GATE_RESIDENCY_1YR", true)).toMatchObject({ outcome: "PASS", next: "GATE_RESIDENCY_NEXUS" });
    });
    it("nexus yes passes clean; nexus no flags and continues", () => {
      const yes = evaluateGate("GATE_RESIDENCY_NEXUS", true);
      expect(yes).toMatchObject({ outcome: "PASS", next: "GATE_VENUE" });
      expect((yes as { reviewFlags?: string[] }).reviewFlags).toBeUndefined();
      expect(evaluateGate("GATE_RESIDENCY_NEXUS", false)).toMatchObject({
        outcome: "PASS", next: "GATE_VENUE", reviewFlags: ["RESIDENCY_ATTORNEY_REVIEW"],
      });
    });
  });
  it("venue: NY county captured, never disqualifies; NJ counties are unknown", () => {
    const r = evaluateGate("GATE_VENUE", "Kings");
    expect(r).toMatchObject({ outcome: "PASS", persist: { county: "Kings" } });
    expect(() => evaluateGate("GATE_VENUE", "Bergen")).toThrow(/VALIDATION/);
  });
  it("venue: 'not sure' flags for the attorney and continues — venue is never a rejection", () => {
    expect(evaluateGate("GATE_VENUE", "UNSURE")).toMatchObject({
      outcome: "PASS", next: "GATE_DV", reviewFlags: ["VENUE_UNSURE"],
    });
  });
  // ── NOTHING STOPS THE CLIENT (operator, 2026-09-13: "EVERYTHING is fair
  //    game… even DV, because a lawyer is reviewing the whole thing").
  it("DV: any yes → PASS + attorney flag + the state's resources card; the interview continues", () => {
    expect(evaluateGate("GATE_DV", true)).toMatchObject({
      outcome: "PASS", next: "GATE_CHILDREN", reviewFlags: ["DV_DISCLOSED_ATTORNEY_REVIEW"], card: "DV_RESOURCES",
    });
    expect(evaluateGate("GATE_DV", true, "NJ")).toMatchObject({ outcome: "PASS", card: "DV_RESOURCES_NJ" });
    const no = evaluateGate("GATE_DV", false);
    expect(no).toMatchObject({ outcome: "PASS", next: "GATE_CHILDREN" });
    expect(no.card).toBeUndefined();
    expect(no.reviewFlags).toBeUndefined();
  });
  it("children: yes → PASS + attorney flag (the packet recites them); no → clean pass", () => {
    expect(evaluateGate("GATE_CHILDREN", true)).toMatchObject({
      outcome: "PASS", next: "GATE_COMPLEXITY", reviewFlags: ["CHILDREN_PRESENT_ATTORNEY_REVIEW"],
    });
    expect(evaluateGate("GATE_CHILDREN", true, "NJ")).toMatchObject({ outcome: "PASS", next: "GATE_COMPLEXITY" });
    expect(evaluateGate("GATE_CHILDREN", false)).toMatchObject({ outcome: "PASS", next: "GATE_COMPLEXITY" });
  });
  it("complexity: anything but FULLY_AGREE → PASS + attorney flag; never a referral card", () => {
    expect(evaluateGate("GATE_COMPLEXITY", "FULLY_AGREE")).toMatchObject({ outcome: "PASS", next: "TIER_BRANCH" });
    for (const v of ["SOME_UNCERTAINTY", "DISAGREEMENT", "NEED_VALUATION"]) {
      const r = evaluateGate("GATE_COMPLEXITY", v);
      expect(r).toMatchObject({ outcome: "PASS", next: "TIER_BRANCH", reviewFlags: ["COMPLEXITY_ATTORNEY_REVIEW"] });
      expect(r.card).toBeUndefined();
    }
    expect(() => evaluateGate("GATE_COMPLEXITY", "MAYBE")).toThrow(/VALIDATION/);
  });
  it("no gate, in either state, can produce anything but PASS", () => {
    const answers: [Parameters<typeof evaluateGate>[0], unknown][] = [
      ["GATE_RESIDENCY", false], ["GATE_RESIDENCY_1YR", false], ["GATE_RESIDENCY_NEXUS", false],
      ["GATE_VENUE", "UNSURE"], ["GATE_DV", true], ["GATE_CHILDREN", true], ["GATE_COMPLEXITY", "DISAGREEMENT"],
    ];
    for (const [g, v] of answers) expect(evaluateGate(g, v, "NY").outcome).toBe("PASS");
    for (const [g, v] of answers) {
      if (g === "GATE_RESIDENCY_1YR" || g === "GATE_RESIDENCY_NEXUS") continue; // not in the NJ cascade
      expect(evaluateGate(g, v, "NJ").outcome).toBe("PASS");
    }
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

  it("detects an unconfigured firm contact on the served DV card; env fills it (2026-09-13)", () => {
    vi.stubEnv("FIRM_CONTACT", "");
    vi.stubEnv("FIRM_ATTORNEY_FIRM", "");
    vi.stubEnv("FIRM_ATTORNEY_PHONE", "");
    vi.stubEnv("NEXT_PUBLIC_INQUIRY_EMAIL", "");
    try {
      expect(dvCardHasPlaceholder()).toBe(true); // nothing configured → neutral "the firm directly"
      expect(getCard("DV_RESOURCES").resources![0].value).toBe("the firm directly");
      expect(dvCardHasPlaceholder(filledCard)).toBe(false);
      // The signature-block env the Word engine already requires fills the card.
      vi.stubEnv("FIRM_ATTORNEY_FIRM", "Example Law LLC");
      vi.stubEnv("FIRM_ATTORNEY_PHONE", "(201) 555-0100");
      const served = getCard("DV_RESOURCES");
      expect(served.resources![0].value).toBe("Example Law LLC — (201) 555-0100");
      expect(served.body).toContain("Example Law LLC — (201) 555-0100");
      expect(served.body).not.toContain("[FIRM_CONTACT_LINE]");
      expect(dvCardHasPlaceholder()).toBe(false);
      // NJ card carries the same contact and the state's own hotline.
      const nj = getCard("DV_RESOURCES_NJ");
      expect(nj.resources![0].value).toBe("Example Law LLC — (201) 555-0100");
      expect(nj.resources!.some((r) => r.value.includes("1-800-572-SAFE"))).toBe(true);
      // Neither card tells the client the intake will not continue.
      expect(served.body).not.toMatch(/will not continue/i);
      expect(nj.body).not.toMatch(/will not continue/i);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("production boot REFUSES while the DV card has no firm contact", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FIRM_CONTACT", "");
    vi.stubEnv("FIRM_ATTORNEY_FIRM", "");
    vi.stubEnv("FIRM_ATTORNEY_PHONE", "");
    vi.stubEnv("NEXT_PUBLIC_INQUIRY_EMAIL", "");
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
