/**
 * Batch 9 acceptance: branding + client-facing language.
 */
import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getDisclosure } from "@/config/disclosure";
import { operatingFirmName, inquiryEmail } from "@/config/branding";
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
    conflictStatus,
    conflictStatusSetBy: null,
    conflictStatusSetAt: null,
    legalHold: false,
    legalHoldReason: null,
    clientUserId: null,
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

  it("the OpenAI non-affiliation statement is retained on the landing page", () => {
    const page = fs.readFileSync(path.join(__dirname, "..", "src", "app", "page.tsx"), "utf8");
    expect(page).toMatch(/not affiliated with,\s*\n?\s*sponsored by, or endorsed by OpenAI/);
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
