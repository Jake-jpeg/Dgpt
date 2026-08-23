/**
 * Does this case clear New Jersey's door? — one deterministic verdict.
 *
 * The NJ mirror of ny-residency.ts, and deliberately SMALLER: New Jersey's
 * durational rule is flat — N.J.S.A. 2A:34-10, one year of continuous
 * residence before filing — with no NY-style § 230 pathway tiers. So there
 * is one prong, two colors, and a list of reasons, exactly like the NY card
 * (operator directive 2026-07-26: "either they passed or there is a yellow
 * warning sign. IF PASS (GREEN) -> list WHY. IF YELLOW list WHY.").
 *
 * GREEN means the flat one-year residence rule, the 2A:34-2(i)
 * irreconcilable-differences ground, and a county are all satisfied on the
 * facts the client gave. YELLOW means one of those is thin or missing, and
 * the card says which — the attorney fixes it, the machine does not.
 *
 * This module is PURE. Same answers in, same verdict out.
 */
import type { AnswerMap } from "@/lib/intake2/types";

export type NjResidencyVerdict = "PASS" | "REVIEW";

export interface NjResidencyCheck {
  verdict: NjResidencyVerdict;
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

/** Years of continuous NJ residence as of `asOf`, or null when unknown. */
export function njResidentYears(answers: AnswerMap, asOf: number): number | null {
  const since = str(answers["nj.case.resident_since"]);
  if (!since) return null;
  const t = Date.parse(since);
  if (!Number.isFinite(t)) return null;
  const years = (asOf - t) / YEAR_MS;
  return years < 0 ? null : years;
}

/**
 * The whole NJ jurisdiction story in one object. `asOf` is injectable so
 * the verdict is testable and stable across a midnight boundary.
 */
export function evaluateNjResidency(answers: AnswerMap, asOf: number = Date.now()): NjResidencyCheck {
  const reasons: string[] = [];
  const citations: string[] = [];

  const residentNow = answers["nj.case.resident_now"] === true;
  const years = njResidentYears(answers, asOf);
  const county = str(answers["nj.case.county"]);
  const grounds = str(answers["nj.case.grounds_facts"]);
  const groundsOk = grounds === "IRRECONCILABLE_6MO";

  // ── the residence rule (flat, one prong) ───────────────────────────
  let residenceOk = false;
  if (residentNow && years !== null && years >= 1) {
    residenceOk = true;
    reasons.push(
      `A party has resided in New Jersey continuously for one year or more ` +
        `(${years.toFixed(1)} years on the facts given).`
    );
    citations.push("N.J.S.A. 2A:34-10");
  } else if (residentNow && years === null) {
    reasons.push(
      "The client lives in New Jersey but has not given a date. The residence period cannot be computed."
    );
    citations.push("N.J.S.A. 2A:34-10");
  } else if (!residentNow) {
    reasons.push(
      "The client does not currently live in New Jersey. Residence has to come from the other party — confirm before filing."
    );
    citations.push("N.J.S.A. 2A:34-10");
  } else {
    reasons.push("Less than one year of New Jersey residence on the facts given.");
    citations.push("N.J.S.A. 2A:34-10");
  }

  // ── the ground ─────────────────────────────────────────────────────
  if (groundsOk) {
    reasons.push(
      "Irreconcilable differences for at least six months with no reasonable prospect of reconciliation — " +
        "the uncontested ground. Living apart is not required."
    );
    citations.push("N.J.S.A. 2A:34-2(i)");
  } else if (grounds) {
    reasons.push(
      "The client did not state six months of irreconcilable differences. Ground needs your review."
    );
    citations.push("N.J.S.A. 2A:34-2(i)");
  } else {
    reasons.push("No ground stated yet — the interview has not reached it.");
    citations.push("N.J.S.A. 2A:34-2(i)");
  }

  // ── venue ──────────────────────────────────────────────────────────
  if (county) {
    reasons.push(`Venue: ${county} County (Superior Court, Chancery Division, Family Part).`);
  } else {
    reasons.push("No county on file yet — venue is not set.");
  }

  const passes = residenceOk && groundsOk && county !== "";

  return {
    verdict: passes ? "PASS" : "REVIEW",
    reasons,
    citations: [...new Set(citations)],
  };
}

/** Short one-line state for a collapsed panel header. */
export function njResidencySummary(check: NjResidencyCheck): string {
  return check.verdict === "PASS" ? "PASS — clear to file" : "REVIEW — see why";
}
