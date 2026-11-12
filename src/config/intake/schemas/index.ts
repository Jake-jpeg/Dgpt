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

export const INTAKE_SCHEMA_VERSION = "2026.07.1";
const EFFECTIVE = "2026-07-12";

function itemsForCategory(items: IntakeItem[], category: MatterCategory): IntakeItem[] {
  return items.filter((i) => !i.categories || i.categories.includes(category));
}

/**
 * Resolve per-state help to this schema's own jurisdiction, and DROP the map
 * (a shared question with no entry for this state ends up with NO help text).
 * New York is the only state in the build (2026-11-12); the map stays so a
 * second state can be added without re-touching every shared item.
 */
function resolveHelpText(item: IntakeItem, jurisdiction: "NY"): IntakeItem {
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
  const jurisdiction = "NY" as const;
  const stateItems = NY_ITEMS;
  const stateSections = NY_SECTIONS;
  const stateDocs = NY_DOCUMENTS;
  const version = INTAKE_SCHEMA_VERSION;
  return {
    id: `${category}@${version}`,
    category,
    jurisdiction,
    version,
    effectiveDate: EFFECTIVE,
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
