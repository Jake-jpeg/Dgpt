/**
 * Word-parity helpers: read the words out of a .docx and out of the golden
 * ReportLab text, normalize both the same way, and compare as multisets.
 *
 * WHY MULTISETS. pdftotext -layout interleaves the two caption columns on
 * one line and wraps at ReportLab's pixel widths; Word wraps where Word
 * wraps. Sequence comparison would fail on layout alone. A multiset of
 * words is layout-blind and still catches the failures that matter: a
 * dropped sentence, an altered statutory phrase, an invented word.
 *
 * NORMALIZATION (applied identically to both sides):
 *  - footers ("(Form UD-x)", "Page N of N") are not part of the body;
 *  - ISO dates become pleading dates ("2016-06-18" → "June 18, 2016") —
 *    the Word forms print dates the way a pleading does, the RL forms
 *    printed whatever they were given;
 *  - every non-alphanumeric character is a separator, so "-against-",
 *    "vs." and "DIVISION-" compare on their letters, and underscore fill
 *    lines and dashed rules vanish.
 */
import JSZip from "jszip";
import { pleadingDate } from "@/lib/word/text";

export async function docxText(bytes: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const xml = await zip.file("word/document.xml")!.async("string");
  // paragraphs → newlines, tabs → spaces, then pull every <w:t>
  const withBreaks = xml.replace(/<\/w:p>/g, "\n").replace(/<w:tab\/>/g, " ");
  const texts = [...withBreaks.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|\n/g)].map((m) => (m[1] === undefined ? "\n" : m[1]));
  return texts
    .join("")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export function normalizeTokens(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .filter((l) => !/^\s*\(Form [A-Z0-9-]+a?\)\s*$/.test(l) && !/^\s*Page \d+( of \d+)?\s*$/.test(l));
  const joined = lines
    .join("\n")
    // the typed caption rule "-------X" is a table border in Word
    .replace(/-{5,}X/g, " ")
    .replace(/\d{4}-\d{2}-\d{2}/g, (d) => pleadingDate(d))
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/ /g, " ");
  return joined
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
}

/** Multiset difference: what the golden has that the docx lacks, and vice versa. */
export function tokenDiff(golden: string[], actual: string[]): { missing: string[]; extra: string[] } {
  const count = (arr: string[]) => {
    const m = new Map<string, number>();
    for (const t of arr) m.set(t, (m.get(t) ?? 0) + 1);
    return m;
  };
  const g = count(golden);
  const a = count(actual);
  const missing: string[] = [];
  const extra: string[] = [];
  for (const [t, n] of g) for (let i = 0; i < n - (a.get(t) ?? 0); i++) missing.push(t);
  for (const [t, n] of a) for (let i = 0; i < n - (g.get(t) ?? 0); i++) extra.push(t);
  return { missing, extra };
}
