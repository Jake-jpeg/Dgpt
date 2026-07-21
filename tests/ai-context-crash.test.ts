/**
 * Phase 0 regression: buildMatterContext against a matter carrying FULL
 * client intake state.
 *
 * Production symptom: every /api/matters/[id]/ai action failed in ~71ms with
 * a generic 500 — before any provider call — but only on matters with a
 * linked CLIENT + intake2 answers + attorney determination. A bare matter
 * ran the whole pipeline fine, which is why this survived the existing suite.
 */
import { describe, it, expect } from "vitest";
import { setupClientWithMatter, clearMatter } from "./helpers";
import {
  attorneySetJurisdictionAndScope,
  saveMatterAnswers,
  schemaForMatter,
} from "@/lib/db/intake2";
import { getMatter } from "@/lib/db/matters";
import { createDocument, addDocumentVersion } from "@/lib/db/documents";
import { getFileStorage } from "@/lib/storage";
import { buildMatterContext } from "@/lib/ai/run-action";
import type { IntakeItem } from "@/lib/intake2/types";

/** A type-appropriate synthetic value for any schema item. */
function valueFor(item: IntakeItem): unknown {
  switch (item.type) {
    case "yes_no":
      return true;
    case "money":
    case "percent":
    case "integer":
      return 1;
    case "date":
      return "2025-01-15";
    case "date_range":
      return { from: "2024-01-01", to: "2025-01-15" };
    case "single_select":
      return item.options?.[0]?.value ?? "UNKNOWN";
    case "multi_select":
      return item.options?.length ? [item.options[0].value] : [];
    case "address":
      return { line1: "1 Synthetic Way", city: "Testville", state: "NY", zip: "11200" };
    case "person":
      return { fullLegalName: "Casey Syntheticperson" };
    case "entity":
      return { name: "Synthetic Entity LLC" };
    // Repeating groups carry the residence/state rows jurisdictionSignals reads.
    case "repeat_child":
    case "repeat_asset":
    case "repeat_debt":
    case "repeat_case":
    case "repeat_employer":
    case "repeat_income":
    case "repeat_insurance":
      return [{ state: "NY", label: "Synthetic row", amount: 1 }];
    default:
      return "Synthetic answer";
  }
}

/** A matter with the exact state that broke production. */
async function matterWithFullClientState(): Promise<string> {
  const ctx = await setupClientWithMatter();
  await clearMatter(ctx.matterId);
  (await attorneySetJurisdictionAndScope({
        matterId: ctx.matterId,
        actingUserId: ctx.attorneyUserId,
        jurisdictionConfirmed: "NY",
        matterCategory: "NY_SUPREME_UNCONTESTED",
        scopeStatus: "ACCEPTED",
      }));

  const matter = (await getMatter(ctx.matterId));
  if (!matter) throw new Error("fixture: matter vanished");
  const schema = schemaForMatter(matter);

  // Every CLIENT-answerable item — the "exhaustive intake" state.
  const answers = schema.items
    .filter(
      (i) =>
        i.audience === "CLIENT" &&
        i.type !== "document_request" &&
        i.type !== "attorney_determination"
    )
    .map((i) => ({ questionId: i.id, value: valueFor(i) }));

  (await saveMatterAnswers({
        matterId: ctx.matterId,
        actingUserId: ctx.clientUserId,
        answers,
      }));

  // A client-uploaded document + version: the documents/extraction flatMap
  // is the one context branch a bare matter never reaches.
  const bytes = new TextEncoder().encode("synthetic upload");
  const stored = await getFileStorage().put(bytes);
  const doc = (await createDocument({
      matterId: ctx.matterId,
      title: "Synthetic upload",
      docKind: "CLIENT_UPLOAD",
      createdBy: ctx.clientUserId,
    }));
  (await addDocumentVersion({
        documentId: doc.id,
        storageKey: stored.storageKey,
        sha256: stored.sha256,
        mime: "application/pdf",
        sizeBytes: stored.sizeBytes,
        originalFilename: "synthetic.pdf",
        source: "UPLOAD",
        createdBy: ctx.clientUserId,
      }));
  return ctx.matterId;
}

describe("buildMatterContext on a matter with full client intake state", () => {
  it("does not throw (the production 500)", async () => {
    const matterId = await matterWithFullClientState();
    expect(() => buildMatterContext(matterId)).not.toThrow();
  });

  it("returns a usable context: answers, checklist, and citable id sets", async () => {
    const matterId = await matterWithFullClientState();
    const { contextJson, answerIds, documentVersionIds } = (await buildMatterContext(matterId));
    const parsed = JSON.parse(contextJson);
    expect(parsed.matter.category).toBe("NY_SUPREME_UNCONTESTED");
    expect(parsed.intakeAnswers.length).toBeGreaterThan(0);
    expect(Array.isArray(parsed.checklist)).toBe(true);
    expect(answerIds.size).toBeGreaterThan(0);
    expect(documentVersionIds.size).toBe(1);
    expect(parsed.documents).toHaveLength(1);
    // Every reported answer is citable.
    for (const a of parsed.intakeAnswers) expect(answerIds.has(a.questionId)).toBe(true);
  });

  it("still works on a BARE matter (the case that always passed)", async () => {
    const ctx = await setupClientWithMatter();
    expect(() => buildMatterContext(ctx.matterId)).not.toThrow();
  });
});
