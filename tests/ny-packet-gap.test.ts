/**
 * The NY packet gap, session one (2026-11-02): UD-3, the two notices served
 * with the summons, and the UD-8 family — plus the rule for the second
 * spouse's facts (B's own statement wins; a disagreement is blank + flagged).
 */
import { describe, it, expect } from "vitest";
import { renderWord, wordFormExists } from "@/lib/word";
import { docxText } from "./word-helpers";
import { computeCssa, fica, percentageFor } from "@/lib/word/forms/ny/cssa";
import { buildRenderPayload, defendantFacts } from "@/lib/pdf-service/mappings";
import { isAllowedRender } from "@/lib/pdf-service/types";
import type { MatterRow } from "@/lib/db/matters";
import { AUTOMATIC_ORDERS_PARAGRAPHS } from "@/lib/word/forms/ny/notices";

const matter = { id: "m1", matterCategory: "NY_SUPREME_UNCONTESTED" } as unknown as MatterRow;

const A = {
  "shared.identity.client_name": "Casey Syntheticperson",
  "shared.identity.other_name": "Jordan Syntheticperson",
  "shared.identity.client_address": { line1: "1 Main St", city: "Fort Lee", state: "NJ", zip: "07024" },
  "shared.identity.other_address": { line1: "9 Elm Ave", city: "Flushing", state: "NY", zip: "11354" },
  "shared.identity.client_dob": "1985-03-04",
  "shared.identity.other_dob": "1986-07-08",
  "ny.case.county": "queens",
  "shared.children.any": true,
  "shared.children.records": [
    { name: "Avery Syntheticperson", dateOfBirth: "2016-05-01" },
    { name: "Blake Syntheticperson", dateOfBirth: "2019-09-12" },
  ],
  "shared.children.insurance": "Jordan's employer plan (Aetna)",
  "ny.settlement.plaintiff_income": "60000",
  "ny.settlement.defendant_income": "90000",
  "ny.settlement.custodial_parent": "ME",
  "ny.settlement.child_support_terms": "Jordan pays $1,700 a month until the kids are 21.",
};
const B = {
  "shared.identity.client_name": "Jordan Syntheticperson",
  "shared.identity.client_address": { line1: "9 Elm Ave", city: "Flushing", state: "NY", zip: "11354" },
  "shared.identity.client_dob": "1986-07-08",
  "ny.settlement.plaintiff_income": "90000", // B's OWN income, from B's seat
  "ny.settlement.defendant_income": "60000",
  "ny.settlement.custodial_parent": "OTHER", // from B's seat, "the other party" = the plaintiff
  "ny.settlement.child_support_terms": "Jordan pays $1,700 a month until the kids are 21.",
};

describe("CSSA arithmetic (DRL § 240(1-b)) — deterministic, every step printed", () => {
  it("FICA, percentages, basic obligation, pro rata, monthly/weekly", () => {
    expect(fica(60000)).toBe(4590); // 7.65%
    expect(fica(300000)).toBe(184500 * 0.062 + 300000 * 0.0145); // SS capped at the wage base
    expect(percentageFor(1)).toBe(0.17);
    expect(percentageFor(2)).toBe(0.25);
    expect(percentageFor(5)).toBe(0.35);
    const c = computeCssa({ custodialGross: 60000, nonCustodialGross: 90000, children: 2 });
    expect(c.custodial.adjusted).toBe(55410);
    expect(c.nonCustodial.adjusted).toBe(83115);
    expect(c.combined).toBe(138525);
    expect(c.aboveCap).toBe(0);
    expect(c.basicAnnual).toBe(34631.25);
    expect(c.nonCustodial.share).toBe(0.6);
    expect(c.ncpAnnualBeforeReserve).toBe(20778.75);
    expect(c.reserve.applied).toBe("NONE");
    expect(c.ncpMonthly).toBe(1731.56);
    expect(c.ncpWeekly).toBe(399.59);
  });

  it("income above the cap is set aside for the attorney; the reserve and poverty tests bite", () => {
    const high = computeCssa({ custodialGross: 150000, nonCustodialGross: 150000, children: 1 });
    expect(high.aboveCap).toBeGreaterThan(0);
    expect(high.combinedUpToCap).toBe(193000);
    const low = computeCssa({ custodialGross: 50000, nonCustodialGross: 30000, children: 3 });
    expect(low.reserve.applied).toBe("RESERVE");
    expect(low.ncpAnnual).toBe(low.nonCustodial.adjusted - 21546);
    const poor = computeCssa({ custodialGross: 50000, nonCustodialGross: 12000, children: 1 });
    expect(poor.reserve.applied).toBe("POVERTY_MINIMUM");
    expect(poor.ncpAnnual).toBe(300);
  });
});

describe("the second spouse's facts on the forms", () => {
  it("B's own statement wins; agreement passes; disagreement is blank and flagged", () => {
    const agree = defendantFacts(A, B);
    expect(agree.defendantIncome).toBe("90000");
    expect(agree.defendantDob).toBe("1986-07-08");
    expect(agree.reviewFlags).toEqual([]);
    const onlyA = defendantFacts(A, null);
    expect(onlyA.defendantIncome).toBe("90000");
    const differ = defendantFacts(A, { ...B, "ny.settlement.plaintiff_income": "120000", "shared.identity.client_dob": "1986-07-09" });
    expect(differ.defendantIncome).toBe("");
    expect(differ.defendantDob).toBe("");
    expect(differ.reviewFlags.join(" ")).toMatch(/Defendant's income.*different answers/);
    expect(differ.reviewFlags).toHaveLength(2);
  });

  it("custodial parent is read from each seat's perspective; a disagreement is flagged, never decided", () => {
    const ok = buildRenderPayload("ny", "ud8", matter, A, B);
    expect(ok.custodialParty).toBe("plaintiff");
    expect(ok.reviewFlags).toBe("");
    const bad = buildRenderPayload("ny", "ud8", matter, A, { ...B, "ny.settlement.custodial_parent": "ME" });
    expect(bad.custodialParty).toBe("");
    expect(bad.reviewFlags).toMatch(/Custodial parent: the two spouses disagree/);
  });
});

describe("the six new NY forms render", () => {
  it("are on the allowlist and in the engine", () => {
    for (const f of ["ud3", "automatic_orders", "guideline_maintenance", "ud8", "ud8a", "ud8b"]) {
      expect(isAllowedRender("ny", f), f).toBe(true);
      expect(wordFormExists("ny", f), f).toBe(true);
    }
  });

  it("UD-8 prints the computed steps, the guideline year, the parties' words, and the attorney's blanks", async () => {
    const payload = buildRenderPayload("ny", "ud8", matter, A, B);
    const out = await renderWord("ny", "ud8", payload);
    const text = await docxText(out.bytes);
    expect(text).toContain("CHILD SUPPORT WORKSHEET");
    expect(text).toContain("Number of children: 2");
    expect(text).toContain("$34,631.25"); // basic obligation
    expect(text).toContain("$1,731.56"); // monthly
    expect(text).toContain("60%"); // NCP share
    expect(text).toContain("2026 Child Support Standards Chart");
    expect(text).toContain("Jordan pays $1,700 a month");
    expect(text).toContain("ATTORNEY DETERMINATION");
    expect(text).toContain("Non-custodial parent (Jordan Syntheticperson)");
    expect(out.filename).toBe("NY_UD8_Syntheticperson.docx");
  });

  it("UD-8a and UD-8b carry the children and never an SSN; UD-8 refuses a childless matter", async () => {
    const a = await docxText((await renderWord("ny", "ud8a", buildRenderPayload("ny", "ud8a", matter, A, B))).bytes);
    expect(a).toContain("SUPPORT COLLECTION UNIT INFORMATION SHEET");
    expect(a).toContain("Avery Syntheticperson");
    expect(a).toContain("_____ - _____ - _________");
    expect(a).not.toMatch(/\d{3}-\d{2}-\d{4}/);
    const b = await docxText((await renderWord("ny", "ud8b", buildRenderPayload("ny", "ud8b", matter, A, B))).bytes);
    expect(b).toContain("QUALIFIED MEDICAL CHILD SUPPORT ORDER");
    expect(b).toContain("Blake Syntheticperson");
    expect(b).toContain("Aetna");
    expect(() => buildRenderPayload("ny", "ud8", matter, { ...A, "shared.children.records": [] }, B)).toThrow(/children/);
  });

  it("UD-3 prefills the defendant's address from B and lists the papers served; the notices print the prescribed text", async () => {
    const ud3 = await docxText((await renderWord("ny", "ud3", buildRenderPayload("ny", "ud3", matter, A, B))).bytes);
    expect(ud3).toContain("AFFIDAVIT OF SERVICE");
    expect(ud3).toContain("9 Elm Ave");
    expect(ud3).toContain("Notice of Automatic Orders, and Notice of Guideline Maintenance");
    expect(ud3).toContain("not in the military service");
    const ao = await docxText((await renderWord("ny", "automatic_orders", buildRenderPayload("ny", "automatic_orders", matter, A))).bytes);
    expect(ao).toContain("NOTICE OF AUTOMATIC ORDERS");
    expect(AUTOMATIC_ORDERS_PARAGRAPHS).toHaveLength(5);
    expect(ao).toContain("Neither party shall sell, transfer, encumber");
    expect(ao).toContain("22 NYCRR");
    const gm = await docxText((await renderWord("ny", "guideline_maintenance", buildRenderPayload("ny", "guideline_maintenance", matter, A))).bytes);
    expect(gm).toContain("NOTICE OF GUIDELINE MAINTENANCE");
    expect(gm).toContain("$241,000"); // the 2026 cap, from config
  });
});
