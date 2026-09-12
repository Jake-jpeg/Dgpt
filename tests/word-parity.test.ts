/**
 * Word parity — every form the Word engine produces must carry the SAME
 * WORDS the ReportLab generator produced on the same fixture (multiset,
 * layout-blind; see word-helpers.ts). Retiring the PDFs must not retire a
 * single word of court-mandated language.
 *
 * Golden text: tests/golden/word/<case>.txt, captured 2026-09-12 by
 * rendering RL's generators on RL's own QA fixtures (fixtures.json) and
 * running pdftotext -layout. Regenerate ONLY with the operator's approval —
 * a golden change is a legal-content change.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderWord } from "@/lib/word";
import { docxText, normalizeTokens, tokenDiff } from "./word-helpers";

const DIR = path.join(__dirname, "golden", "word");
const FX = JSON.parse(readFileSync(path.join(DIR, "fixtures.json"), "utf8")) as Record<string, Record<string, unknown>>;
const BASE = FX.BASE, KIDS = FX.KIDS, RELIGIOUS = FX.RELIGIOUS, NJ = FX.NJ_BASE;

// The ReportLab complaint hardcoded the firm's signature block as Python
// constants; the Word engine takes it from the payload (FIRM_ATTORNEY_* env
// via mappings.ts) and prints blanks when unset. The golden was captured
// with those constants, so the fixture supplies the same values explicitly.
const ATTY = {
  attorneyName: "Jake S. Kim, Esq.",
  attorneyFirm: "Jake Kim Law Firm, LLC",
  attorneyAddress: "2460 Lemoine Avenue, Suite 400H\nFort Lee, New Jersey 07024",
  attorneyPhone: "(201) 800-4564",
};

/** golden case → (state, form, payload) */
export const CASES: [string, string, string, Record<string, unknown>][] = [
  ["ud1-base", "ny", "ud1", BASE],
  ["ud1-defendant", "ny", "ud1", { ...BASE, qualifyingParty: "defendant", qualifyingAddress: BASE.defendantAddress }],
  ["complaint-base", "ny", "complaint", { ...BASE, ...ATTY }],
  ["complaint-kids", "ny", "complaint", { ...KIDS, ...ATTY }],
  ["complaint-religious", "ny", "complaint", { ...RELIGIOUS, ...ATTY }],
  ["ud4-religious", "ny", "ud4", RELIGIOUS],
  ["ud5-base", "ny", "ud5", BASE],
  ["ud9-base", "ny", "ud9", BASE],
  ["ud12-base", "ny", "ud12", BASE],
  ["ud6-base", "ny", "ud6", BASE],
  ["ud6-kids", "ny", "ud6", KIDS],
  ["ud6-religious", "ny", "ud6", RELIGIOUS],
  ["ud7-base", "ny", "ud7", BASE],
  ["ud7-kids", "ny", "ud7", KIDS],
  ["ud7-religious", "ny", "ud7", RELIGIOUS],
  ["ud14-base", "ny", "ud14", BASE],
  ["ud15-base", "ny", "ud15", BASE],
  // UD-10: the fixture's legacy letter "A" contradicts its residencyBasis
  // "two_year"; the golden was captured with the letter made consistent
  // ("F") because the Word form pleads the BASIS (see judgment.ts).
  ["ud10-base", "ny", "ud10", { ...BASE, residencyType: "F" }],
  ["ud10-kids", "ny", "ud10", { ...KIDS, residencyType: "F" }],
  ["ud10-religious", "ny", "ud10", { ...RELIGIOUS, residencyType: "F" }],
  ["ud11-base", "ny", "ud11", BASE],
  ["ud11-kids", "ny", "ud11", KIDS],
  ["ud11-religious", "ny", "ud11", RELIGIOUS],
  ["stipulation-base", "ny", "stipulation", BASE],
  ["stipulation-kids", "ny", "stipulation", KIDS],
  ["nj-complaint", "nj", "complaint", NJ],
  ["nj-summons", "nj", "summons", NJ],
  ["nj-verification", "nj", "verification", NJ],
  ["nj-acknowledgment", "nj", "acknowledgment", NJ],
  ["nj-cdr-plaintiff", "nj", "cdr_plaintiff", NJ],
  ["nj-cdr-defendant", "nj", "cdr_defendant", NJ],
  ["nj-insurance", "nj", "insurance", NJ],
  ["nj-jod", "nj", "jod", NJ],
  ["nj-jod-cert-p", "nj", "jod_cert_plaintiff", NJ],
  ["nj-jod-cert-d", "nj", "jod_cert_defendant", NJ],
];

describe("Word parity with the ReportLab generators", () => {
  for (const [name, state, form, payload] of CASES) {
    it(`${name}: same words, none lost, none invented`, async () => {
      const out = await renderWord(state, form, payload);
      const actual = normalizeTokens(await docxText(out.bytes));
      const golden = normalizeTokens(readFileSync(path.join(DIR, `${name}.txt`), "utf8"));
      const { missing, extra } = tokenDiff(golden, actual);
      expect({ missing, extra }).toEqual({ missing: [], extra: [] });
    });
  }
});
