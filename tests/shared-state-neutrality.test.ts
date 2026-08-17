/**
 * The shared layer belongs to BOTH states, so it may name NEITHER.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * DivorceGPT runs one engine and two playbooks: a New York intake and a New
 * Jersey intake that never reason about each other's law. That separation is
 * easy to picture at the bot layer and easy to lose at the data layer,
 * because both playbooks compose the SAME `shared.*` items.
 *
 * On 2026-08-12, wiring New Jersey turned up exactly one contaminated row:
 * `shared.relationship.ceremony_type` explained itself with "New York asks
 * this because a religious ceremony can carry an extra step at the end of
 * the case (DRL § 253)". A New Jersey client would have been shown that
 * sentence — not because a model answered out of state, but because one
 * static string sat on a row both interviews read. New Jersey has no
 * removal-of-barriers analogue, so the sentence was both foreign and wrong.
 *
 * A sweep of every CLIENT-audience shared item found that one hit and no
 * others. This file freezes that result. The escape hatch is deliberate and
 * narrow: per-state copy belongs in `helpTextByJurisdiction`, which
 * buildSchema resolves to the schema's own state and strips from the built
 * output, so it can never travel to the other state's client payload.
 *
 * THE STANDARD: a shared client-facing string names no state and cites no
 * statute. If a question needs one to make sense, it is not a shared
 * question — or its explanation belongs in helpTextByJurisdiction.
 */
import { describe, expect, it } from "vitest";
import { SHARED_ITEMS, SHARED_SECTIONS } from "@/config/intake/shared/core";
import { getSchemaForCategory } from "@/config/intake/schemas";

/** State names and citation forms that must not appear in shared copy. */
const STATE_MARKER = /\bNew York\b|\bNew Jersey\b|\bNY\b|\bNJ\b|\bDRL\b|\bFCA\b|N\.?J\.?S\.?A|\bSupreme Court\b|\bIndex No\b|§/i;

/** Every string on an item that a client can actually read. */
function clientStrings(item: (typeof SHARED_ITEMS)[number]): string[] {
  return [
    item.prompt,
    item.helpText ?? "",
    ...(item.options ?? []).map((o) => o.label),
  ].filter(Boolean);
}

describe("shared intake items are state-neutral", () => {
  const clientItems = SHARED_ITEMS.filter((i) => i.audience === "CLIENT");

  it("there are shared client items to check (guards a vacuous pass)", () => {
    expect(clientItems.length).toBeGreaterThan(10);
  });

  it.each(clientItems.map((i) => [i.id, i] as const))(
    "%s carries no state name or citation in its client-facing copy",
    (_id, item) => {
      for (const s of clientStrings(item)) {
        expect(s).not.toMatch(STATE_MARKER);
      }
    }
  );

  it("shared section titles and descriptions name no state", () => {
    for (const section of SHARED_SECTIONS) {
      expect(section.title).not.toMatch(STATE_MARKER);
      expect(section.description ?? "").not.toMatch(STATE_MARKER);
    }
  });

  it("per-state help is the ONLY escape hatch, and it resolves per schema", () => {
    const ny = getSchemaForCategory("NY_SUPREME_UNCONTESTED");
    const nj = getSchemaForCategory("NJ_SUPER_UNCONTESTED");
    const nyCeremony = ny.items.find((i) => i.id === "shared.relationship.ceremony_type")!;
    const njCeremony = nj.items.find((i) => i.id === "shared.relationship.ceremony_type")!;

    // Same question, same id, same stored answer — different explanation.
    expect(nyCeremony.helpText).toMatch(/New York/);
    // New Jersey has no analogue to describe, so it says nothing at all.
    expect(njCeremony.helpText).toBeUndefined();
  });

  it("a built schema never carries the other state's copy", () => {
    for (const category of ["NY_SUPREME_UNCONTESTED", "NJ_SUPER_UNCONTESTED"] as const) {
      const schema = getSchemaForCategory(category);
      for (const item of schema.items) {
        // The raw map is stripped at build time; if it survived, a client
        // payload could serialise the other state's sentence.
        expect(item.helpTextByJurisdiction).toBeUndefined();
      }
    }
    const njRaw = JSON.stringify(getSchemaForCategory("NJ_SUPER_UNCONTESTED"));
    expect(njRaw).not.toMatch(/New York/);
  });
});
