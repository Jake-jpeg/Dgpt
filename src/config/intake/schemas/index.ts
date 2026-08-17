/**
 * Schema registry — composes the shared core with the state module for
 * each supported matter category, at a pinned version. The attorney's
 * category confirmation (Batch 6) selects which schema a matter uses;
 * `intakeSchemaVersion` on the matter pins it.
 */
import type { IntakeItem, IntakeSchema, MatterCategory } from "@/lib/intake2/types";
import { MATTER_CATEGORIES } from "@/lib/intake2/types";
import { SHARED_DOCUMENTS, SHARED_ITEMS, SHARED_SECTIONS } from "../shared/core";
import { NY_DOCUMENTS, NY_ITEMS, NY_SECTIONS } from "../ny/items";
import { NJ_DOCUMENTS, NJ_ITEMS, NJ_SECTIONS } from "../nj/items";

export const INTAKE_SCHEMA_VERSION = "2026.07.1";
const EFFECTIVE = "2026-07-12";

/**
 * New Jersey is pinned SEPARATELY. The NY version is a statement about when
 * the NY questionnaire was last reviewed by counsel, and shipping a second
 * state must not silently re-date it — a matter's `intakeSchemaVersion`
 * pins the questions it was interviewed under, and those two review
 * histories are genuinely independent.
 */
export const NJ_INTAKE_SCHEMA_VERSION = "2026.08.1";
const NJ_EFFECTIVE = "2026-08-12";

function itemsForCategory(items: IntakeItem[], category: MatterCategory): IntakeItem[] {
  return items.filter((i) => !i.categories || i.categories.includes(category));
}

/** The state module a category is interviewed from. No default: an
 *  unrecognised prefix is a build-time gap, not something to guess at. */
function isNewJersey(category: MatterCategory): boolean {
  return category.startsWith("NJ_");
}

/**
 * Resolve per-state help to this schema's own jurisdiction, and DROP the map.
 *
 * Two things matter here. The built schema must carry the right state's
 * sentence, and it must not carry the other state's at all — the map is the
 * one place a NY string could ride into an NJ client payload, so it does not
 * survive the build. A shared question with no entry for this state ends up
 * with NO help text, deliberately: New Jersey has no removal-of-barriers
 * step to describe, and inventing a substitute would be worse than silence.
 */
function resolveHelpText(item: IntakeItem, jurisdiction: "NY" | "NJ"): IntakeItem {
  if (!item.helpTextByJurisdiction) return item;
  const { helpTextByJurisdiction, ...rest } = item;
  const resolved = helpTextByJurisdiction[jurisdiction];
  if (resolved === undefined) {
    const { helpText: _dropped, ...noHelp } = rest;
    return noHelp;
  }
  return { ...rest, helpText: resolved };
}

function buildSchema(category: MatterCategory): IntakeSchema {
  const nj = isNewJersey(category);
  const jurisdiction: "NY" | "NJ" = nj ? "NJ" : "NY";
  const stateItems = nj ? NJ_ITEMS : NY_ITEMS;
  const stateSections = nj ? NJ_SECTIONS : NY_SECTIONS;
  const stateDocs = nj ? NJ_DOCUMENTS : NY_DOCUMENTS;
  const version = nj ? NJ_INTAKE_SCHEMA_VERSION : INTAKE_SCHEMA_VERSION;
  return {
    id: `${category}@${version}`,
    category,
    jurisdiction,
    version,
    effectiveDate: nj ? NJ_EFFECTIVE : EFFECTIVE,
    reviewStatus: "COUNSEL_REVIEW_REQUIRED",
    sections: [...SHARED_SECTIONS, ...stateSections],
    items: [
      ...itemsForCategory(SHARED_ITEMS, category),
      ...itemsForCategory(stateItems, category),
    ].map((i) => resolveHelpText(i, jurisdiction)),
    documents: [...SHARED_DOCUMENTS, ...stateDocs],
  };
}

const SCHEMAS = new Map<MatterCategory, IntakeSchema>(
  MATTER_CATEGORIES.map((c) => [c, buildSchema(c)])
);

export function getSchemaForCategory(category: MatterCategory): IntakeSchema {
  const s = SCHEMAS.get(category);
  if (!s) throw new Error(`VALIDATION: no intake schema for category ${category}`);
  return s;
}

export function listSchemas(): IntakeSchema[] {
  return [...SCHEMAS.values()];
}
