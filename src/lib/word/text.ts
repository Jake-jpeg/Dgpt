/**
 * Text helpers shared by every Word generator — ported from the ReportLab
 * generators' helpers so the words on the paper do not change when the pen
 * does. Pure functions, no I/O.
 */

/**
 * Name casing that survives real surnames (RL generate_ud1.title_case).
 * str.capitalize() printed "Sampleton-vandermeer" in a signature block —
 * a party's name, wrong, on a paper they sign. Uppercase after word starts
 * and separators (hyphen, apostrophe, period); lowercase elsewhere.
 */
export function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      let boundary = true;
      let out = "";
      for (const ch of word) {
        if (/\p{L}/u.test(ch)) {
          out += boundary ? ch.toUpperCase() : ch.toLowerCase();
          boundary = false;
        } else {
          out += ch;
          boundary = "-'’.".includes(ch);
        }
      }
      return out;
    })
    .join(" ");
}

/** Split "street, City, ST 12345" into [street, "City, ST 12345"]; else [whole]. */
export function formatAddressLines(address: string): string[] {
  const a = address.trim();
  if (!a) return [];
  const m1 = /,\s*([^,]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)$/.exec(a);
  if (m1) return [a.slice(0, m1.index).trim(), m1[1].trim()];
  const m2 = /,\s*([A-Z]{2}\s+\d{5}(?:-\d{4})?)$/.exec(a);
  if (m2) {
    const before = a.slice(0, m2.index);
    const lastComma = before.lastIndexOf(",");
    if (lastComma > 0) {
      return [before.slice(0, lastComma).trim(), `${before.slice(lastComma + 1).trim()}, ${m2[1].trim()}`];
    }
  }
  return [a];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2018-03-11" → "March 11, 2018". Anything else passes through untouched. */
export function pleadingDate(v: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((v ?? "").trim());
  if (!m) return (v ?? "").trim();
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${month} ${Number(m[3])}, ${m[1]}` : v.trim();
}

/** "Kings" / "KINGS" / "Kings County" → "Kings" (display) — RL strips the suffix. */
export function countyName(v: string): string {
  return titleCase((v ?? "").replace(/\s+County$/i, "").trim());
}

/** Join address parts, dropping empties — never prints ", ," for a blank line. */
export function joinParts(parts: (string | undefined)[], sep = ", "): string {
  return parts.map((p) => (p ?? "").trim()).filter(Boolean).join(sep);
}

/** Truthy in the RL sense: any non-empty string except "false"/"0"/"no". */
export function truthy(v: string | undefined): boolean {
  const s = (v ?? "").trim().toLowerCase();
  return s !== "" && s !== "false" && s !== "0" && s !== "no";
}
