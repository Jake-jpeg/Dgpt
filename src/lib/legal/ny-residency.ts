/**
 * Does this case clear New York's door? — one deterministic verdict.
 *
 * OPERATOR DIRECTIVE (2026-07-26): "Get rid of the jurisdiction panel. If a
 * lawyer reviews and fucks up jurisdiction — that's for the lawyer to correct.
 * Jurisdiction should be simple: either they passed or there is a yellow
 * warning sign. IF PASS (GREEN) -> list WHY. IF YELLOW list WHY."
 *
 * So there is no attorney determination form, no candidate/confirmed state,
 * no scope dropdown. There are two colors and a list of reasons.
 *
 * GREEN means every requirement to file the divorce is satisfied on the facts
 * the client gave: a DRL § 230 residence prong, a § 170(7) ground, and a
 * county. YELLOW means one of those is thin or missing, and the card says
 * which one — the attorney fixes it, the machine does not.
 *
 * This module is PURE. Same answers in, same verdict out. It is the single
 * source of truth for the residence prong, so the panel the attorney reads and
 * the paragraph the Verified Complaint pleads can never disagree.
 */
import type { AnswerMap } from "@/lib/intake2/types";

export type ResidencyVerdict = "PASS" | "REVIEW";

/** DRL § 230 prongs, in the order the complaint prefers to plead them. */
export type ResidencyProng =
  | "two_year"
  | "one_year_married"
  | "one_year_spouses"
  | "one_year_cause"
  | "none";

export interface ResidencyCheck {
  verdict: ResidencyVerdict;
  /** The § 230 prong the complaint will plead. */
  prong: ResidencyProng;
  /** Plain-English WHY lines. Green: why it passed. Yellow: what is thin. */
  reasons: string[];
  /** Statutory hooks, for the attorney's eye only. */
  citations: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const YEAR_MS = 365.25 * DAY_MS;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Years of continuous NY residence as of `asOf`, or null when unknown. */
export function residentYears(answers: AnswerMap, asOf: number): number | null {
  const since = str(answers["ny.case.resident_since"]);
  if (!since) return null;
  const t = Date.parse(since);
  if (!Number.isFinite(t)) return null;
  const years = (asOf - t) / YEAR_MS;
  return years < 0 ? null : years;
}

/**
 * The whole jurisdiction story in one object.
 *
 * `asOf` is injectable so the verdict is testable and so a render and a panel
 * viewed seconds apart cannot disagree across a midnight boundary.
 */
export function evaluateResidency(answers: AnswerMap, asOf: number = Date.now()): ResidencyCheck {
  const reasons: string[] = [];
  const citations: string[] = [];

  const residentNow = answers["ny.case.resident_now"] === true;
  const years = residentYears(answers, asOf);
  const marriedInNy = answers["ny.case.married_in_ny"] === true;
  const livedHereAsSpouses = answers["ny.case.lived_in_ny_as_spouses"] === true;
  const county = str(answers["ny.case.county"]);
  const grounds = str(answers["ny.case.grounds_facts"]);
  const groundsOk = grounds === "IRRETRIEVABLE_6MO";

  // ── the residence prong ────────────────────────────────────────────
  let prong: ResidencyProng = "none";
  if (residentNow && years !== null && years >= 2) {
    prong = "two_year";
    reasons.push(
      `A party has resided in New York State continuously for two years or more ` +
        `(${years.toFixed(1)} years on the facts given).`
    );
    citations.push("DRL § 230(5)");
  } else if (residentNow && years !== null && years >= 1 && marriedInNy) {
    prong = "one_year_married";
    reasons.push(
      "A party has resided in New York for at least one year and the parties were married in New York."
    );
    citations.push("DRL § 230(1)");
  } else if (residentNow && years !== null && years >= 1 && livedHereAsSpouses) {
    prong = "one_year_spouses";
    reasons.push(
      "A party has resided in New York for at least one year and the parties lived here together as spouses."
    );
    citations.push("DRL § 230(2)");
  } else if (residentNow && years !== null && years >= 1) {
    prong = "one_year_cause";
    reasons.push(
      "One year of New York residence — the cause of action must also have arisen in New York. " +
        "Confirm that before filing."
    );
    citations.push("DRL § 230(3)");
  } else if (residentNow && years === null) {
    reasons.push(
      "The client lives in New York but has not given a date. The residence period cannot be computed."
    );
    citations.push("DRL § 230");
  } else if (!residentNow) {
    reasons.push(
      "The client does not currently live in New York. Residence has to come from the other party " +
        "or from a two-year period that has already run."
    );
    citations.push("DRL § 230");
  } else {
    reasons.push("Less than one year of New York residence on the facts given.");
    citations.push("DRL § 230");
  }

  // ── the ground ─────────────────────────────────────────────────────
  if (groundsOk) {
    reasons.push(
      "The relationship has been irretrievably broken for at least six months — the uncontested ground. " +
        "Living apart is not required."
    );
    citations.push("DRL § 170(7)");
  } else if (grounds) {
    reasons.push("The client did not state the six-month irretrievable breakdown. Ground needs your review.");
    citations.push("DRL § 170(7)");
  } else {
    reasons.push("No ground stated yet — the interview has not reached it.");
    citations.push("DRL § 170(7)");
  }

  // ── venue ──────────────────────────────────────────────────────────
  if (county) {
    reasons.push(`Venue: ${county} County.`);
  } else {
    reasons.push("No county on file yet — venue is not set.");
  }

  const passes =
    groundsOk &&
    county !== "" &&
    (prong === "two_year" || prong === "one_year_married" || prong === "one_year_spouses");

  return {
    verdict: passes ? "PASS" : "REVIEW",
    prong,
    reasons,
    citations: [...new Set(citations)],
  };
}

/** Short one-line state for a collapsed panel header. */
export function residencySummary(check: ResidencyCheck): string {
  return check.verdict === "PASS" ? "PASS — clear to file" : "REVIEW — see why";
}
