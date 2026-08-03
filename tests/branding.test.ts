/**
 * Batch 9 acceptance: branding + client-facing language.
 */
import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getDisclosure } from "@/config/disclosure";
import { operatingFirmName, inquiryEmail, nonAffiliationNotice } from "@/config/branding";
import { clientMatterStatus } from "@/lib/matters/client-view";
import type { MatterRow } from "@/lib/db/matters";

afterEach(() => {
  delete process.env.NEXT_PUBLIC_OPERATING_FIRM_NAME;
  delete process.env.NEXT_PUBLIC_INQUIRY_EMAIL;
});

function fakeMatter(conflictStatus: MatterRow["conflictStatus"]): MatterRow {
  return {
    id: "m",
    label: "l",
    lifecycle: "PROSPECTIVE",
    expectedClientEmail: null,
    conflictStatus,
    conflictStatusSetBy: null,
    conflictStatusSetAt: null,
    legalHold: false,
    legalHoldReason: null,
    clientUserId: null,
    jurisdictionCandidate: null,
    jurisdictionConfirmed: null,
    jurisdictionConfirmedBy: null,
    jurisdictionConfirmedAt: null,
    matterCategory: null,
    matterCategoryConfirmedBy: null,
    scopeStatus: "UNREVIEWED",
    scopeNotes: null,
    intakeSchemaVersion: null,
  intakePhase: 1,
    createdBy: "x",
    createdAt: "",
    updatedAt: "",
    lastActivityAt: "",
  };
}

describe("operating-firm branding is configuration", () => {
  it("defaults to the exact firm name and follows the env override", () => {
    expect(operatingFirmName()).toBe("Jake Kim Law Firm");
    process.env.NEXT_PUBLIC_OPERATING_FIRM_NAME = "Synthetic Firm LLP";
    expect(operatingFirmName()).toBe("Synthetic Firm LLP");
    expect(getDisclosure().paragraphs.join(" ")).toContain("Synthetic Firm LLP");
  });

  it("inquiry email has no hard-coded fallback address", () => {
    delete process.env.NEXT_PUBLIC_INQUIRY_EMAIL;
    expect(inquiryEmail()).toBe("");
  });

  it("no hard-coded @divorcegpt.com or fallback mailbox anywhere in src/", () => {
    const srcDir = path.join(__dirname, "..", "src");
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(p)) {
          const content = fs.readFileSync(p, "utf8");
          if (/@divorcegpt\.com|admin@juneguidedsolutions\.com/i.test(content)) hits.push(p);
        }
      }
    };
    walk(srcDir);
    expect(hits).toEqual([]);
  });

  it("the non-affiliation notice names the confusion it exists to answer", () => {
    const notice = nonAffiliationNotice();
    expect(notice).toMatch(/OpenAI/);
    expect(notice).toMatch(/ChatGPT/);
    expect(notice).toMatch(/not affiliated with, sponsored by, or endorsed by/);
  });

  it("it never names the AI provider actually in use — that changes by env flip", () => {
    // A vendor named in client copy becomes FALSE the day AI_PROVIDER moves.
    // "any AI provider" is true whichever way the switch is set.
    expect(nonAffiliationNotice()).toMatch(/any AI provider/);
    expect(nonAffiliationNotice()).not.toMatch(/Anthropic|Claude|Gemini|Terra/i);
  });

  it("both the landing page and the signed-in portal carry it", () => {
    const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, "..", ...p), "utf8");
    expect(read("src", "app", "page.tsx")).toMatch(/nonAffiliationNotice\(\)/);
    expect(read("src", "components", "shell.tsx")).toMatch(/nonAffiliationNotice\(\)/);
  });
});

describe("client-facing language stays neutral", () => {
  it("every pending screen state reads identically and exposes nothing internal", () => {
    const pending = ["NO_APPARENT_MATCH", "POTENTIAL_MATCH", "NEEDS_MORE_INFORMATION", "PENDING_ATTORNEY_REVIEW"] as const;
    const texts = pending.map((s) => clientMatterStatus(fakeMatter(s)));
    expect(new Set(texts).size).toBe(1);
    for (const t of texts) {
      expect(t).not.toMatch(/match|conflict|score|risk|decline/i);
    }
  });

  it("the [COUNSEL REVIEW REQUIRED] marker never appears in rendered client strings", () => {
    const d = getDisclosure();
    const rendered = [d.title, d.acknowledgeLabel, ...d.paragraphs].join(" ");
    expect(rendered).not.toContain("[COUNSEL REVIEW REQUIRED]");
    const statuses = (["NOT_STARTED", "CLEARED", "DECLINED", "PENDING_ATTORNEY_REVIEW"] as const).map(
      (s) => clientMatterStatus(fakeMatter(s))
    );
    expect(statuses.join(" ")).not.toContain("[COUNSEL REVIEW REQUIRED]");
  });
});
