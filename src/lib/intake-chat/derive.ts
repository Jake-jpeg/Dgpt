/**
 * Deterministic answer derivation — "never ask what you already know".
 *
 * WHY THIS EXISTS. The 2026-07-26 live interview asked the client where the
 * ceremony took place, then asked the state ("I already said NY"), then asked
 * civil-or-religious ("Civil — again — stated above"), then asked whether they
 * were married in New York ("I already said NY — are you broken?"). One
 * sentence from the client, four questions from the machine.
 *
 * Two things caused that: the schema split one real-world fact across several
 * items, and the model was instructed to record ONLY the current question's
 * id. This module fixes the first half — the SERVER derives the implied items
 * from what the client already said, writes them through the same validated
 * store the form uses, and the sequencer then silently skips them.
 *
 * RULES THIS FILE OBEYS:
 *   1. Derivations are DETERMINISTIC — no model call, no guessing. If the
 *      text does not clearly say it, nothing is written.
 *   2. Derivations NEVER overwrite an answer that already exists. A client's
 *      own answer always wins.
 *   3. Derivations are CONSERVATIVE. A wrong derived fact is worse than one
 *      extra question, because the attorney reviews the pleading, not the
 *      transcript. When in doubt, derive nothing and let the question be
 *      asked.
 *   4. Every derived value is a canonical value the pinned schema accepts —
 *      it goes through saveMatterAnswers like any other answer, and is
 *      audit-logged as a derivation.
 */
import type { AnswerMap } from "@/lib/intake2/types";

export interface DerivedAnswer {
  questionId: string;
  value: unknown;
  /** Human-readable reason, written to the audit log. */
  because: string;
}

/** USPS abbreviation → canonical token used across the codebase. */
const US_STATES: Record<string, string> = {
  AL: "ALABAMA", AK: "ALASKA", AZ: "ARIZONA", AR: "ARKANSAS", CA: "CALIFORNIA",
  CO: "COLORADO", CT: "CONNECTICUT", DE: "DELAWARE", DC: "DISTRICT OF COLUMBIA",
  FL: "FLORIDA", GA: "GEORGIA", HI: "HAWAII", ID: "IDAHO", IL: "ILLINOIS",
  IN: "INDIANA", IA: "IOWA", KS: "KANSAS", KY: "KENTUCKY", LA: "LOUISIANA",
  ME: "MAINE", MD: "MARYLAND", MA: "MASSACHUSETTS", MI: "MICHIGAN",
  MN: "MINNESOTA", MS: "MISSISSIPPI", MO: "MISSOURI", MT: "MONTANA",
  NE: "NEBRASKA", NV: "NEVADA", NH: "NEW HAMPSHIRE", NJ: "NEW JERSEY",
  NM: "NEW MEXICO", NY: "NEW YORK", NC: "NORTH CAROLINA", ND: "NORTH DAKOTA",
  OH: "OHIO", OK: "OKLAHOMA", OR: "OREGON", PA: "PENNSYLVANIA",
  RI: "RHODE ISLAND", SC: "SOUTH CAROLINA", SD: "SOUTH DAKOTA",
  TN: "TENNESSEE", TX: "TEXAS", UT: "UTAH", VT: "VERMONT", VA: "VIRGINIA",
  WA: "WASHINGTON", WV: "WEST VIRGINIA", WI: "WISCONSIN", WY: "WYOMING",
  PR: "PUERTO RICO",
};

const NAME_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATES).map(([abbr, name]) => [name, abbr])
);

function text(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function answered(answers: AnswerMap, id: string): boolean {
  const v = answers[id];
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

/**
 * Pull a US state out of a free-text place. Returns the USPS abbreviation, or
 * null when the text does not unambiguously name exactly one state.
 *
 * Deliberately strict:
 *   - a two-letter token is only a state if it stands alone as a word
 *     (so "Goshen, NY 10940" → NY, but "INDIANAPOLIS" does not yield IN);
 *   - a full state name must appear as a whole phrase;
 *   - if the text names TWO different states, we derive nothing.
 */
export function parseUsState(place: string): string | null {
  const upper = ` ${place.toUpperCase().replace(/[.,;/()]/g, " ").replace(/\s+/g, " ")} `;
  const hits = new Set<string>();

  // Full names first — longest match wins ("NEW YORK" before "NEW ...").
  for (const name of Object.keys(NAME_TO_ABBR).sort((a, b) => b.length - a.length)) {
    if (upper.includes(` ${name} `)) hits.add(NAME_TO_ABBR[name]);
  }
  // Standalone abbreviations.
  for (const abbr of Object.keys(US_STATES)) {
    if (new RegExp(`(^| )${abbr}( |$)`).test(upper)) hits.add(abbr);
  }

  if (hits.size !== 1) return null;
  return [...hits][0];
}

/** Non-US signal: the text names a country other than the United States. */
const FOREIGN_HINT =
  /\b(KOREA|CHINA|JAPAN|INDIA|MEXICO|CANADA|ENGLAND|UNITED KINGDOM|UK|IRELAND|FRANCE|GERMANY|ITALY|SPAIN|POLAND|UKRAINE|RUSSIA|BRAZIL|COLOMBIA|DOMINICAN REPUBLIC|HAITI|JAMAICA|NIGERIA|GHANA|PHILIPPINES|VIETNAM|PAKISTAN|BANGLADESH|ISRAEL|EGYPT|TURKEY|GREECE|PORTUGAL|ARGENTINA|PERU|ECUADOR|GUYANA|TRINIDAD)\b/;

/**
 * Everything the server can infer from what is already on file. Pure: same
 * answers in, same derivations out. Callers write these through the normal
 * validated answer store.
 */
export function deriveImpliedAnswers(
  answers: AnswerMap,
  jurisdiction: "NY" | "NJ" = "NY"
): DerivedAnswer[] {
  const out: DerivedAnswer[] = [];
  const place = text(answers["shared.relationship.marriage_place"]);

  // ── 1. State of the ceremony, from the place the client gave ────────
  // "Goshen, NY 10940" already answers "which state?". Asking again is the
  // single most-complained-about redundancy in the live transcript.
  let stateAbbr: string | null = null;
  if (place && !answered(answers, "shared.relationship.marriage_state")) {
    stateAbbr = parseUsState(place);
    if (stateAbbr) {
      out.push({
        questionId: "shared.relationship.marriage_state",
        value: stateAbbr,
        because: `client's place of marriage ("${place}") names ${US_STATES[stateAbbr]}`,
      });
    }
  } else if (answered(answers, "shared.relationship.marriage_state")) {
    const existing = text(answers["shared.relationship.marriage_state"]).toUpperCase();
    stateAbbr = US_STATES[existing] ? existing : (NAME_TO_ABBR[existing] ?? null);
  }

  // ── 2. Married in New York? ─────────────────────────────────────────
  // Never asked as its own question anymore. TRUE only when a US state was
  // positively identified as NY; FALSE only when another US state or a
  // foreign country was positively identified. Ambiguous text derives
  // nothing, and the attorney sees the § 230 prong on the draft either way.
  // NY-ONLY: ny.case.married_in_ny is not in the NJ schema, and answer
  // saves are all-or-nothing — one rejected id would have silently cost an
  // NJ matter the shared derivations above.
  if (jurisdiction === "NY" && place && !answered(answers, "ny.case.married_in_ny")) {
    if (stateAbbr === "NY") {
      out.push({
        questionId: "ny.case.married_in_ny",
        value: true,
        because: `place of marriage ("${place}") is in New York`,
      });
    } else if (stateAbbr && stateAbbr !== "NY") {
      out.push({
        questionId: "ny.case.married_in_ny",
        value: false,
        because: `place of marriage ("${place}") is in ${US_STATES[stateAbbr]}, not New York`,
      });
    } else if (FOREIGN_HINT.test(place.toUpperCase())) {
      out.push({
        questionId: "ny.case.married_in_ny",
        value: false,
        because: `place of marriage ("${place}") is outside the United States`,
      });
    }
  }

  // ── 3. Civil or religious, when the client already said so ──────────
  // Only on an explicit word. A venue name is NOT enough — "St. Mary's Hall"
  // is a catering hall as often as a church, and DRL § 253 turns on this.
  if (place && !answered(answers, "shared.relationship.ceremony_type")) {
    const u = place.toUpperCase();
    const civil = /\bCIVIL\b|\bCITY HALL\b|\bTOWN HALL\b|\bCLERK'?S OFFICE\b|\bJUSTICE OF THE PEACE\b/.test(u);
    const religious = /\bRELIGIOUS\b/.test(u);
    if (civil && !religious) {
      out.push({
        questionId: "shared.relationship.ceremony_type",
        value: "CIVIL",
        because: `client described the ceremony as civil ("${place}")`,
      });
    } else if (religious && !civil) {
      out.push({
        questionId: "shared.relationship.ceremony_type",
        value: "RELIGIOUS",
        because: `client described the ceremony as religious ("${place}")`,
      });
    }
  }

  // ── 4. No children ⇒ nothing to record about children ───────────────
  // Operator directive: "No to kids -> immediately to ED." The children
  // detail item is already conditional on shared.children.any, so this
  // derivation writes nothing — it exists as the documented anchor for why
  // the interview jumps straight to the scope questions.

  return out;
}
