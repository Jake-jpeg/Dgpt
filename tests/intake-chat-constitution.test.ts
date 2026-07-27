/**
 * Constitution + sequencer + glossary plumbing.
 *
 * NOTE ON SCOPE: warmth is a PROMPT-level property. These tests do not
 * pretend to measure the model's personality — they assert that the rules
 * and the tone directive actually reach the prompt, that the version is
 * recorded, and that the deterministic sequencer is exhaustive.
 */
import { describe, it, expect, afterEach } from "vitest";
import {
  INTAKE_CONSTITUTION_VERSION,
  buildConstitution,
  intakeTone,
  constitutionEventText,
} from "@/lib/intake-chat/constitution";
import {
  nextStep,
  progress,
  isComplete,
  askableItems,
  type SequencerState,
} from "@/lib/intake-chat/sequencer";
import { lookupGlossary, glossarySliceFor, glossaryNeedsAttorneyContent } from "@/lib/intake-chat/glossary";
import { intakeChatModel } from "@/lib/intake-chat/orchestrator";
import { getSchemaForCategory } from "@/config/intake/schemas";
import { isAnswered } from "@/lib/intake2/engine";
import type { AnswerMap, IntakeItem } from "@/lib/intake2/types";

afterEach(() => {
  delete process.env.INTAKE_TONE;
});

const FIRM = { firmName: "Jake Kim Law Firm", firmContact: "(201) 555-0100" };

describe("constitution 2026-07.6 — drive + count + why + no-documents", () => {
  it("is versioned 2026-07.6 and states the version in the prompt", () => {
    expect(INTAKE_CONSTITUTION_VERSION).toBe("2026-07.6");
    expect(buildConstitution(FIRM)).toContain("CONSTITUTION 2026-07.6");
  });

  it("carries Rule 11 with its example and all four constraints", () => {
    const text = buildConstitution(FIRM);
    expect(text).toContain("11. ACKNOWLEDGE THE HUMAN");
    expect(text).toMatch(/ONE brief, genuine acknowledgment/);
    // The worked example from the amendment.
    expect(text).toContain("best pizza of my life");
    // (a) warmth never outranks the advice rules.
    expect(text).toContain("RULES 2-5 OUTRANK WARMTH, ALWAYS");
    expect(text).toMatch(/that helps your case/i);
    // (b) one beat only.
    expect(text).toContain("ONE BEAT ONLY");
    expect(text).toMatch(/talk pizza all day/);
    // (c) empathy, not therapy — and DV still routes to Rule 7.
    expect(text).toContain("DISTRESS SCALES TO EMPATHY, NOT THERAPY");
    expect(text).toMatch(/never\s+counseling, coping advice, or probing/);
    expect(text).toMatch(/Danger signals still\s+follow Rule 7/);
    // (d) Korean uses the respectful register.
    expect(text).toContain("존댓말");
  });

  it("keeps the pre-existing rules 1-10 intact", () => {
    const text = buildConstitution(FIRM);
    for (const marker of [
      "2. NEVER ADVISE",
      "3. \"HOW DO I ANSWER THIS?\"",
      "4. DEFINITIONS",
      "5. DEFLECT LEGAL QUESTIONS",
      "6. \"WHERE DO I FILE",
      "7. STOPS",
      "8. EXHAUSTIVENESS",
      "9. LANGUAGE",
      "10. TONE",
    ]) {
      expect(text).toContain(marker);
    }
    // Firm identity and contact are configuration, never model-invented.
    expect(text).toContain("Jake Kim Law Firm");
    expect(text).toContain("(201) 555-0100");
  });

  it("carries the 2026-07.6 rules: drive, tell progress, explain why, never ask for documents", () => {
    const text = buildConstitution(FIRM);
    expect(text).toContain("12. YOU MOVE THE CONVERSATION FORWARD");
    expect(text).toMatch(/ask the NEXT question in the SAME reply/);
    expect(text).toMatch(/NEVER end your turn waiting/);
    expect(text).toContain("13. TELL THEM WHERE THEY ARE");
    expect(text).toContain("14. EXPLAIN WHY YOU ASK");
  });
});

describe("intake chat model (operator decision 2026-07-26: Haiku for speed)", () => {
  afterEach(() => {
    delete process.env.ANTHROPIC_INTAKE_MODEL;
    delete process.env.ANTHROPIC_MODEL;
  });

  it("defaults to claude-haiku-4-5 — the fastest current model", () => {
    delete process.env.ANTHROPIC_INTAKE_MODEL;
    delete process.env.ANTHROPIC_MODEL;
    expect(intakeChatModel()).toBe("claude-haiku-4-5");
  });

  it("ANTHROPIC_INTAKE_MODEL overrides without a deploy; ANTHROPIC_MODEL is the middle fallback", () => {
    process.env.ANTHROPIC_MODEL = "claude-sonnet-5";
    expect(intakeChatModel()).toBe("claude-sonnet-5");
    process.env.ANTHROPIC_INTAKE_MODEL = "claude-opus-4-8";
    expect(intakeChatModel()).toBe("claude-opus-4-8");
  });
});

describe("INTAKE_TONE configuration", () => {
  it("defaults to WARM when unset", () => {
    delete process.env.INTAKE_TONE;
    expect(intakeTone()).toBe("WARM");
    expect(buildConstitution(FIRM)).toContain("TONE: WARM. Rule 11 applies in full.");
  });

  it("honours NEUTRAL and compresses the acknowledgment directive", () => {
    process.env.INTAKE_TONE = "NEUTRAL";
    expect(intakeTone()).toBe("NEUTRAL");
    const text = buildConstitution(FIRM);
    expect(text).toContain("TONE: NEUTRAL");
    expect(text).toContain("COMPRESSED form");
    expect(text).not.toContain("Rule 11 applies in full");
    // Rule 11 itself is still present — NEUTRAL compresses it, not deletes it.
    expect(text).toContain("11. ACKNOWLEDGE THE HUMAN");
  });

  it("is case-insensitive and falls back to WARM on an unrecognised value", () => {
    process.env.INTAKE_TONE = "neutral";
    expect(intakeTone()).toBe("NEUTRAL");
    process.env.INTAKE_TONE = "SARCASTIC";
    expect(intakeTone()).toBe("WARM");
    process.env.INTAKE_TONE = "";
    expect(intakeTone()).toBe("WARM");
  });

  it("records tone AND version in the session marker", () => {
    delete process.env.INTAKE_TONE;
    expect(constitutionEventText()).toBe(
      "intake assistant started (constitution 2026-07.6, tone WARM)"
    );
    process.env.INTAKE_TONE = "NEUTRAL";
    expect(constitutionEventText()).toContain("tone NEUTRAL");
    expect(constitutionEventText()).toContain("2026-07.6");
  });
});

// ── sequencer ────────────────────────────────────────────────────────

const SCHEMA = getSchemaForCategory("NY_SUPREME_UNCONTESTED");

function baseState(over: Partial<SequencerState> = {}): SequencerState {
  return {
    schema: SCHEMA,
    answers: {},
    machineState: "GATE_RESIDENCY",
    checklist: [],
    welcomed: false,
    readBackShown: false,
    confirmed: false,
    stopped: null,
    ...over,
  };
}

/** Answer an item well enough that isAnswered() is satisfied. */
function answer(item: IntakeItem): unknown {
  if (item.type === "yes_no") return true;
  if (item.type === "multi_select") return ["X"];
  if (item.type.startsWith("repeat_")) return [{ state: "NY" }];
  if (item.type === "money" || item.type === "percent" || item.type === "integer") return 1;
  return "answered";
}

describe("sequencer — deterministic and exhaustive", () => {
  it("opens with the scripted welcome", () => {
    expect(nextStep(baseState()).kind).toBe("WELCOME");
  });

  it("asks exactly the gate the machine is parked on; questions begin only past the gates", () => {
    // The machine owns gate order (the NY residency cascade branches).
    for (const gate of [
      "GATE_RESIDENCY",
      "GATE_RESIDENCY_1YR",
      "GATE_RESIDENCY_NEXUS",
      "GATE_VENUE",
      "GATE_DV",
      "GATE_CHILDREN",
      "GATE_COMPLEXITY",
    ] as const) {
      const step = nextStep(baseState({ welcomed: true, machineState: gate }));
      expect(step.kind).toBe("GATE");
      expect(step.id).toBe(gate);
      expect(step.gate?.prompt.length).toBeGreaterThan(5);
    }
    expect(nextStep(baseState({ welcomed: true, machineState: "TIER_BRANCH" })).kind).toBe("QUESTION");
    // A legacy/unexpected machine state never silently skips the gates.
    expect(nextStep(baseState({ welcomed: true, machineState: "PRE_GATE" })).kind).toBe("STOPPED");
  });

  it("visits EVERY visible client item before moving past the question phase", () => {
    const state = baseState({ welcomed: true, machineState: "TIER_BRANCH" });
    const visited = new Set<string>();
    // Bounded loop: far more iterations than items, so a stuck sequencer
    // fails loudly instead of hanging.
    for (let i = 0; i < 2000; i++) {
      const step = nextStep(state);
      if (step.kind !== "QUESTION") break;
      visited.add(step.id!);
      state.answers = { ...state.answers, [step.id!]: answer(step.item!) };
    }
    const remaining = askableItems(SCHEMA, state.answers).filter(
      (i) => !isAnswered(i, state.answers)
    );
    expect(remaining).toEqual([]);
    expect(visited.size).toBeGreaterThan(0);
    // Nothing askable was skipped.
    for (const item of askableItems(SCHEMA, {} as AnswerMap)) {
      if (visited.has(item.id)) continue;
      // An item only legitimately goes unvisited if answers made it invisible.
      expect(askableItems(SCHEMA, state.answers).some((i) => i.id === item.id)).toBe(false);
    }
  });

  it("NEVER walks the checklist (2026-07-26): questions go straight to read-back", () => {
    // The first live interview ballooned to 30+ turns because the sequencer
    // interrogated the client about every catalog document — including child
    // documents in a no-kids case. Documents move over EMAIL now; this test
    // pins that even REQUIRED_NOW checklist entries are never asked.
    const state = baseState({
      welcomed: true,
      machineState: "TIER_BRANCH",
      checklist: [
        { documentId: "DOC_A", title: "A", requestText: "a", status: "REQUIRED_NOW", triggeredBy: [] },
        { documentId: "DOC_B", title: "B", requestText: "b", status: "REQUIRED_NOW", triggeredBy: [] },
      ],
    });

    // Answer to a fixpoint: answers reveal conditional items, so a single
    // pass over the initially-visible set is not enough.
    for (let i = 0; i < 2000; i++) {
      const s = nextStep(state);
      if (s.kind !== "QUESTION") break;
      state.answers = { ...state.answers, [s.id!]: answer(s.item!) };
    }

    // No CHECKLIST step, ever — unreported REQUIRED_NOW docs notwithstanding.
    expect(nextStep(state).kind).toBe("READBACK");
    state.readBackShown = true;
    expect(nextStep(state).kind).toBe("CONFIRM");
    state.confirmed = true;

    const final = nextStep(state);
    expect(final.kind).toBe("COMPLETE");
    expect(isComplete(state)).toBe(true);
  });

  it("a stop outranks everything still pending", () => {
    const state = baseState({ welcomed: true, stopped: "DV" });
    const step = nextStep(state);
    expect(step.kind).toBe("STOPPED");
    expect(step.id).toBe("DV");
    expect(isComplete(state)).toBe(false);
  });

  it("reports progress with a section label for the indicator", () => {
    const state = baseState({ welcomed: true, machineState: "TIER_BRANCH" });
    const p = progress(state);
    expect(p.total).toBeGreaterThan(0);
    expect(p.answered).toBe(0);
    expect(p.sectionCount).toBeGreaterThan(0);
    expect(p.sectionIndex).toBeGreaterThanOrEqual(1);
    expect(typeof p.sectionTitle).toBe("string");
  });

  it("is pure: the same state yields the same step", () => {
    const state = baseState({ welcomed: true });
    expect(nextStep(state)).toEqual(nextStep(state));
  });
});

describe("glossary — reuses the attorney-controlled config", () => {
  it("treats unwritten [ATTORNEY TO SUPPLY] entries as a MISS", () => {
    // Every term ships as a placeholder, so nothing is injectable yet.
    expect(glossaryNeedsAttorneyContent()).toBe(true);
    expect(lookupGlossary("qdro")).toBeNull();
    expect(lookupGlossary("equitable distribution")).toBeNull();
    expect(glossarySliceFor("tell me about equitable distribution and alimony")).toEqual([]);
  });

  it("misses unknown terms without throwing", () => {
    expect(lookupGlossary("pizza")).toBeNull();
    expect(glossarySliceFor("")).toEqual([]);
  });
});
