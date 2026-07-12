/**
 * B17 — Generate the NJ/NY intake documentation FROM the shipped config so
 * the docs can never drift from the code. Run with:
 *   npx vite-node scripts/generate-intake-docs.ts
 * Outputs: docs/intake/NJ-INTAKE-MAP.md, NY-INTAKE-MAP.md,
 *          NJ-NY-FORM-MAPPINGS.md, NJ-NY-DOCUMENT-CHECKLISTS.md
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { getSchemaForCategory, INTAKE_SCHEMA_VERSION } from "../src/config/intake/schemas";
import { MATTER_CATEGORIES } from "../src/lib/intake2/types";
import type { IntakeItem, IntakeSchema } from "../src/lib/intake2/types";
import { getAuthority, listAuthorities } from "../src/lib/legal/authority";

mkdirSync("docs/intake", { recursive: true });

const HEADER = (title: string) => `# ${title}

Generated from the shipped intake configuration (schema version
\`${INTAKE_SCHEMA_VERSION}\`) by \`scripts/generate-intake-docs.ts\` — do not
hand-edit; regenerate after config changes. Facts are collected from
clients in plain language; legal conclusions are attorney determinations.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
`;

function conditionText(i: IntakeItem): string {
  const c = i.condition;
  if (!c) return "always";
  if (c.kind === "truthy") return `if ${c.questionId} is yes/answered`;
  if (c.kind === "eq") return `if ${c.questionId} = ${JSON.stringify(c.value)}`;
  if (c.kind === "in") return `if ${c.questionId} ∈ ${JSON.stringify(c.values)}`;
  if (c.kind === "answered") return `if ${c.questionId} answered`;
  return JSON.stringify(c);
}

function authorityCell(i: IntakeItem): string {
  if (!i.authorityIds.length) return "— (purely factual)";
  return i.authorityIds
    .map((id) => {
      const a = getAuthority(id);
      return a ? `${id} (${a.section})` : id;
    })
    .join("; ");
}

function stateMap(state: "NJ" | "NY"): string {
  const categories = MATTER_CATEGORIES.filter((c) => c.startsWith(state + "_"));
  let out = HEADER(`${state === "NJ" ? "New Jersey" : "New York"} Intake Map`);
  for (const category of categories) {
    const schema: IntakeSchema = getSchemaForCategory(category);
    const stateItems = schema.items.filter((i) => !i.id.startsWith("shared."));
    const determinations = schema.items.filter((i) => i.type === "attorney_determination");
    out += `\n## ${category}\n\n`;
    out += `Sections: ${schema.sections.length} · items: ${schema.items.length} `;
    out += `(shared core ${schema.items.length - stateItems.length}, state ${stateItems.length}) · `;
    out += `attorney determinations: ${determinations.length}\n\n`;
    out += `### State-specific items\n\n`;
    out += `| Item | Type | Audience | Shown | Authority mapping |\n|---|---|---|---|---|\n`;
    for (const i of stateItems) {
      out += `| \`${i.id}\`${i.required ? " *(required)*" : ""} | ${i.type} | ${i.audience} | ${conditionText(i)} | ${authorityCell(i)} |\n`;
    }
    out += `\n### Attorney determinations (never client-visible)\n\n`;
    for (const d of determinations) {
      out += `- \`${d.id}\` — ${d.prompt.replace(/^ATTORNEY DETERMINATION:\s*/, "")} `;
      out += `${d.authorityIds.length ? `[${d.authorityIds.join(", ")}]` : ""}\n`;
    }
  }
  return out;
}

writeFileSync("docs/intake/NJ-INTAKE-MAP.md", stateMap("NJ"));
writeFileSync("docs/intake/NY-INTAKE-MAP.md", stateMap("NY"));

/* form mappings */
let forms = HEADER("NJ/NY Official Form-Family Mappings (facts → form fields)");
forms += `
No court form is generated or filed by this system. These mappings power the
attorney-only form-readiness report: they say which collected FACT feeds
which official form family, so the attorney can see what is present and what
is missing before preparing the official form outside this system. County/
part-specific variations are NOT captured. Nothing here is "ready to file";
filing readiness is a separate attorney exact-version approval.

`;
const byForm = new Map<string, { item: IntakeItem; field: string; category: string }[]>();
for (const category of MATTER_CATEGORIES) {
  const schema = getSchemaForCategory(category);
  for (const item of schema.items) {
    for (const out of item.outputs ?? []) {
      const list = byForm.get(out.form) ?? [];
      if (!list.some((e) => e.item.id === item.id && e.field === out.field)) {
        list.push({ item, field: out.field, category });
      }
      byForm.set(out.form, list);
    }
  }
}
for (const [form, entries] of [...byForm.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  forms += `\n## ${form}\n\n| Form field | Fed by item | Type |\n|---|---|---|\n`;
  for (const e of entries) {
    forms += `| ${e.field} | \`${e.item.id}\` | ${e.item.type} |\n`;
  }
}
writeFileSync("docs/intake/NJ-NY-FORM-MAPPINGS.md", forms);

/* checklists */
let checks = HEADER("NJ/NY Deterministic Document Checklists");
checks += `
The checklist is derived from the versioned schema + the client's factual
answers by \`deriveChecklist\` — never by a model. Clients see plain-language
requests for applicable items only. Staff can mark received/incomplete;
waiving an item is an ATTORNEY-ONLY determination. The checklist is the
AUTHORITATIVE document list; the AI document-gap report is commentary that
can never modify it.

`;
for (const category of MATTER_CATEGORIES) {
  const schema = getSchemaForCategory(category);
  const triggers = new Map<string, string[]>();
  for (const item of schema.items) {
    for (const docId of item.documentIds ?? []) {
      const list = triggers.get(docId) ?? [];
      list.push(`\`${item.id}\`${item.condition ? ` (${conditionText(item)})` : ""}`);
      triggers.set(docId, list);
    }
  }
  const docs = schema.documents ?? [];
  checks += `\n## ${category}\n\n| Document | Requested when |\n|---|---|\n`;
  for (const d of docs) {
    const t = triggers.get(d.id);
    checks += `| ${d.title} | ${t ? "triggered by " + t.join("; ") : "baseline for this workflow"} |\n`;
  }
}
writeFileSync("docs/intake/NJ-NY-DOCUMENT-CHECKLISTS.md", checks);

/* legal review queue */
let queue = HEADER("NJ/NY Legal Review Queue (counsel action list)");
queue += `
Everything below awaits a HUMAN counsel decision. Nothing in the runtime
snapshot ships APPROVED; approving, retiring, or superseding a record goes
through docs/legal-authority/LEGAL-CONTENT-CHANGE-CONTROL.md.

## Authority records pending counsel review

| ID | Jurisdiction | Section | Status | Open notes |
|---|---|---|---|---|
`;
for (const a of listAuthorities()) {
  const open = a.notes.filter(
    (n) => n.includes("[needs cite check]") || n.includes("[not found]") || n.toUpperCase().includes("SUPERSEDED")
  );
  queue += `| ${a.id} | ${a.jurisdiction} | ${a.section} | ${a.status} | ${open.join(" · ") || "—"} |\n`;
}
queue += `
## Client-facing copy pending counsel review

Every intake item ships \`reviewStatus: COUNSEL_REVIEW_REQUIRED\` — counsel
review of the client-facing wording is a prerequisite to any use beyond the
local proof. Items marked [COUNSEL REVIEW REQUIRED] in prompts/help text
(e.g. the client certification language) are the highest-priority subset.

## Structural review items

- Retention policy final values — [COUNSEL REVIEW REQUIRED]
- Client certification wording (shared.review.certification) — [COUNSEL REVIEW REQUIRED]
- County/part practice variations are explicitly OUT OF SCOPE of this build
  and must be handled by the attorney per matter.
`;
writeFileSync("docs/intake/NJ-NY-LEGAL-REVIEW-QUEUE.md", queue);

console.log("Generated docs/intake/*.md from schema version", INTAKE_SCHEMA_VERSION);
