/**
 * Deterministic intake → RL form-field mappings (Part 3).
 *
 * Pure functions over the matter's SAVED intake answers and the attorney's
 * jurisdiction determination. No model output enters this path; the same
 * answers always produce the same payload. Missing critical facts throw
 * VALIDATION errors — nothing is invented.
 */
import type { MatterRow } from "@/lib/db/matters";
import type { AnswerMap } from "@/lib/intake2/types";
import { evaluateResidency } from "@/lib/legal/ny-residency";
import type { RenderPayload } from "./types";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
}

interface AddressValue {
  line1?: string;
  city?: string;
  state?: string;
  zip?: string;
}

/** "12 Synthetic Way, Buffalo, NY 14201" from the structured answer. */
function combinedAddress(v: unknown): string {
  if (!v || typeof v !== "object") return "";
  const a = v as AddressValue;
  const parts = [str(a.line1), str(a.city), [str(a.state), str(a.zip)].filter(Boolean).join(" ")];
  return parts.filter(Boolean).join(", ");
}

/** "KINGS" (stored option value) → "Kings" (RL display form). */
function titleCaseCounty(v: unknown): string {
  const s = str(v);
  if (!s) return "";
  return s
    .split(/[_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
}

interface ChildValue {
  name?: string;
  dateOfBirth?: string;
}

/** The children the client listed (repeat_child rows with a name). */
function childRows(answers: AnswerMap): ChildValue[] {
  const v = answers["shared.children.records"];
  if (!Array.isArray(v)) return [];
  return (v as ChildValue[]).filter((c) => c && typeof c === "object" && str(c.name));
}

/** ¶FIFTH count — how many children of the marriage the pleading recites. */
function childCount(answers: AnswerMap): number {
  return childRows(answers).length;
}

/**
 * "Jane Doe, born 2015-04-02; John Doe, born 2018-11-19" — the name-and-DOB
 * recital ¶FIFTH prints. Nothing else about the children goes on the
 * pleading.
 */
function childrenDetail(answers: AnswerMap): string {
  return childRows(answers)
    .map((c) => {
      const dob = pleadingDate(str(c.dateOfBirth));
      return dob ? `${str(c.name)}, born ${dob}` : str(c.name);
    })
    .join("; ");
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2018-03-11" → "March 11, 2018". A pleading does not print ISO dates. */
function pleadingDate(v: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
  if (!m) return v.trim();
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${month} ${Number(m[3])}, ${m[1]}` : v.trim();
}

function required(payload: RenderPayload, keys: string[]): void {
  const missing = keys.filter((k) => !payload[k]);
  if (missing.length > 0) {
    throw new Error(`VALIDATION: form data incomplete — missing ${missing.join(", ")}`);
  }
}

/** Shared party/base fields from the intake answers. */
function baseFields(answers: AnswerMap): RenderPayload {
  return {
    plaintiffName: str(answers["shared.identity.client_name"]),
    defendantName: str(answers["shared.identity.other_name"]),
    plaintiffAddress: combinedAddress(answers["shared.identity.client_address"]),
    plaintiffPhone: "", // deliberately blank: client phone is sensitive contact data
    marriageDate: str(answers["shared.relationship.marriage_date"]),
    marriageState: str(answers["shared.relationship.marriage_state"]),
    marriageCity: str(answers["shared.relationship.marriage_place"]).split(",")[0]?.trim() ?? "",
  };
}

export function buildNyUd1Payload(matter: MatterRow, answers: AnswerMap): RenderPayload {
  const addr = combinedAddress(answers["shared.identity.client_address"]);
  const payload: RenderPayload = {
    ...baseFields(answers),
    filingCounty: titleCaseCounty(answers["ny.case.county"]),
    qualifyingParty: "plaintiff",
    qualifyingAddress: addr,
    dateFiled: "", // court-stamped; never pre-filled
  };
  required(payload, ["plaintiffName", "defendantName", "plaintiffAddress", "filingCounty", "qualifyingAddress"]);
  return payload;
}

/**
 * NY Verified Complaint (Phase 1). Consumes exactly the Phase-1 field set —
 * every value below traces to a pleading paragraph (see
 * claude/PHASE1-verified-complaint-spec.md).
 */
/**
 * Which DRL § 230 residence prong the complaint pleads — derived from the
 * same facts the gates collected. Deterministic; the attorney sees the
 * pleaded prong on the draft and the § 230(3) posture arrives pre-flagged
 * (RESIDENCY_ATTORNEY_REVIEW) from the residency gates.
 */
function residencyBasisFromAnswers(answers: AnswerMap): string {
  // One source of truth: the same evaluation the attorney's PASS/REVIEW card
  // shows. A prong the panel calls thin must never print as clean on the
  // pleading. "none" falls back to the two-year prong so the draft is complete
  // for the attorney to correct — the card already told them it needs work.
  const prong = evaluateResidency(answers).prong;
  return prong === "none" ? "two_year" : prong;
}

/**
 * The attorney signature block on the Verified Complaint.
 *
 * This used to live ONLY as a Python constant inside the RL repo, which meant
 * changing the firm's filing address required a code edit in a second repo
 * plus a manual PDF-service redeploy. The address that prints on a NY Supreme
 * Court pleading is not a deployment artifact — it is a firm decision that can
 * change (see Judiciary Law § 470, which requires a nonresident NY-admitted
 * attorney to maintain an office for the transaction of law business WITHIN
 * New York; it does not reach an attorney who resides in New York).
 *
 * So DGPT now sends it, from env, and the RL constants become the fallback of
 * a fallback. Leaving every row unset reproduces today's output byte for byte.
 * Values are TRIMMED and empty rows are DROPPED, so a blank env var falls
 * through to the generator default rather than printing an empty block.
 *
 * `FIRM_ATTORNEY_ADDRESS` accepts a literal "\n" for the second line.
 */
function firmSignatureBlock(): Record<string, string> {
  const rows: Record<string, string | undefined> = {
    attorneyName: process.env.FIRM_ATTORNEY_NAME,
    attorneyFirm: process.env.FIRM_ATTORNEY_FIRM,
    attorneyAddress: process.env.FIRM_ATTORNEY_ADDRESS?.replace(/\\n/g, "\n"),
    attorneyPhone: process.env.FIRM_ATTORNEY_PHONE,
  };
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(rows)) {
    const trimmed = typeof v === "string" ? v.trim() : "";
    if (trimmed) out[k] = trimmed;
  }
  return out;
}

export function buildNyComplaintPayload(matter: MatterRow, answers: AnswerMap): RenderPayload {
  const place = str(answers["shared.relationship.marriage_place"]);
  const state = str(answers["shared.relationship.marriage_state"]);
  const marriagePlace =
    place && state && !place.toUpperCase().includes(state.toUpperCase())
      ? `${place}, ${state}`
      : place || state;
  const ceremonyRaw = str(answers["shared.relationship.ceremony_type"]).toUpperCase();
  const payload: RenderPayload = {
    ...baseFields(answers),
    county: titleCaseCounty(answers["ny.case.county"]),
    residencyBasis: residencyBasisFromAnswers(answers),
    plaintiffAddress: combinedAddress(answers["shared.identity.client_address"]),
    defendantAddress: combinedAddress(answers["shared.identity.other_address"]),
    residentParty: "plaintiff",
    marriagePlace,
    ceremonyType: ceremonyRaw === "RELIGIOUS" ? "religious" : "civil",
    // ¶FIFTH. Counted from the children the client actually listed. This used
    // to be hard-wired to "0" on the theory that a child case never reached
    // here; that is no longer true and never should have printed a sworn
    // pleading paragraph from an assumption. Operator directive 2026-07-26:
    // "the lawyer wouldn't know if the client has kids or not. That's the
    // whole point of the intake."
    unemancipatedChildren: String(childCount(answers)),
    childrenDetail: childrenDetail(answers),
    // Firm signature block — env-driven, empty by default (§ 470 note above).
    ...firmSignatureBlock(),
  };
  required(payload, [
    "plaintiffName",
    "defendantName",
    "county",
    "plaintiffAddress",
    "defendantAddress",
    "marriageDate",
    "marriagePlace",
  ]);
  return payload;
}

/**
 * NY UD-14 Notice of Entry (Phase 3 — post-judgment). judgmentEntryDate is
 * deliberately BLANK: the entry date exists only on the county clerk's
 * stamp; the attorney fills it at service time (same pattern as dateFiled).
 * indexNumber comes from the intake answer when the client/firm has recorded
 * it; otherwise the form renders a blank for the attorney.
 */
export function buildNyUd14Payload(matter: MatterRow, answers: AnswerMap): RenderPayload {
  const payload: RenderPayload = {
    plaintiffName: str(answers["shared.identity.client_name"]),
    defendantName: str(answers["shared.identity.other_name"]),
    county: titleCaseCounty(answers["ny.case.county"]),
    indexNumber: str(answers["ny.case.index_number"]),
    plaintiffAddress: combinedAddress(answers["shared.identity.client_address"]),
    defendantAddress: combinedAddress(answers["shared.identity.other_address"]),
    judgmentEntryDate: "", // clerk-stamped; attorney completes at service
  };
  required(payload, ["plaintiffName", "defendantName", "county", "plaintiffAddress", "defendantAddress"]);
  return payload;
}

/**
 * NY UD-15 Affirmation of Service by Mail of the JOD (Phase 3). The server
 * must be a third party over 18 (not the plaintiff) — server identity and
 * mailing date are completed by the firm at execution; the payload carries
 * only the caption facts and the defendant's current mailing address.
 */
export function buildNyUd15Payload(matter: MatterRow, answers: AnswerMap): RenderPayload {
  const defendantAddress = combinedAddress(answers["shared.identity.other_address"]);
  const payload: RenderPayload = {
    plaintiffName: str(answers["shared.identity.client_name"]),
    defendantName: str(answers["shared.identity.other_name"]),
    county: titleCaseCounty(answers["ny.case.county"]),
    indexNumber: str(answers["ny.case.index_number"]),
    defendantAddress,
    defendantCurrentAddress: defendantAddress,
  };
  required(payload, ["plaintiffName", "defendantName", "county", "defendantCurrentAddress"]);
  return payload;
}

/* ── Phase 2: the uncontested packet + stipulation ─────────────────────
 * Shared principles: caption facts from saved answers; court-stamped dates,
 * SSNs, and service execution details are NEVER collected online and render
 * as blanks for the firm (the never-invent pattern). religious/appearance
 * booleans are OMITTED when false — the Python generators treat any
 * non-empty string (including "false") as truthy. */

function captionFields(answers: AnswerMap): RenderPayload {
  return {
    plaintiffName: str(answers["shared.identity.client_name"]),
    defendantName: str(answers["shared.identity.other_name"]),
    county: titleCaseCounty(answers["ny.case.county"]),
    indexNumber: str(answers["ny.case.index_number"]),
  };
}

function isReligious(answers: AnswerMap): boolean {
  return str(answers["shared.relationship.ceremony_type"]).toUpperCase() === "RELIGIOUS";
}

function marriagePlaceCombined(answers: AnswerMap): string {
  const place = str(answers["shared.relationship.marriage_place"]);
  const state = str(answers["shared.relationship.marriage_state"]);
  return place && state && !place.toUpperCase().includes(state.toUpperCase())
    ? `${place}, ${state}`
    : place || state;
}

/** Flatten a repeat-row answer (array of objects) into deterministic lines. */
function summarizeRepeat(v: unknown): string {
  if (!Array.isArray(v)) return "";
  return v
    .map((row) => {
      if (!row || typeof row !== "object") return "";
      return Object.values(row as Record<string, unknown>)
        .map((x) => str(x))
        .filter(Boolean)
        .join(" — ");
    })
    .filter(Boolean)
    .join("\n");
}

export function buildNyStipulationPayload(matter: MatterRow, answers: AnswerPayloadMap): RenderPayload {
  const waived = answers["ny.settlement.maintenance_waived"];
  const nameRestore = answers["shared.relationship.name_restoration"]
    ? str(answers["shared.relationship.name_restoration_name"])
    : "";
  const payload: RenderPayload = {
    ...captionFields(answers),
    plaintiffAddress: combinedAddress(answers["shared.identity.client_address"]),
    defendantAddress: combinedAddress(answers["shared.identity.other_address"]),
    marriageDate: str(answers["shared.relationship.marriage_date"]),
    marriagePlace: marriagePlaceCombined(answers),
    plaintiffIncome: str(answers["ny.settlement.plaintiff_income"]),
    defendantIncome: str(answers["ny.settlement.defendant_income"]),
    maintenanceWaived: waived === false ? "false" : "true",
    assetsSummary: summarizeRepeat(answers["shared.assets.records"]),
    debtsSummary: summarizeRepeat(answers["shared.debts.records"]),
    divisionTerms: str(answers["ny.settlement.division_terms"]),
    nameRestoration: nameRestore,
  };
  required(payload, [
    "plaintiffName",
    "defendantName",
    "county",
    "plaintiffAddress",
    "defendantAddress",
    "marriageDate",
    "marriagePlace",
  ]);
  return payload;
}
type AnswerPayloadMap = AnswerMap;

function packetPayload(
  answers: AnswerMap,
  extra: RenderPayload,
  requiredKeys: string[]
): RenderPayload {
  const payload: RenderPayload = { ...captionFields(answers), ...extra };
  required(payload, requiredKeys);
  return payload;
}

export function buildNyPacketPayload(form: string, matter: MatterRow, answers: AnswerMap): RenderPayload {
  const religious: RenderPayload = isReligious(answers) ? { religiousCeremony: "true" } : {};
  const pAddr = combinedAddress(answers["shared.identity.client_address"]);
  const dAddr = combinedAddress(answers["shared.identity.other_address"]);
  switch (form) {
    case "ud4": // Barriers to Remarriage — religious ceremonies only.
      if (!isReligious(answers)) {
        throw new Error("VALIDATION: UD-4 applies only to a religious ceremony (DRL § 253)");
      }
      // Service execution details are firm-completed at service time.
      return packetPayload(answers, {}, ["plaintiffName", "defendantName", "county"]);
    case "ud5": // Affirmation of Regularity — defendantAppeared OMITTED (generator default).
      return packetPayload(answers, {}, ["plaintiffName", "defendantName", "county"]);
    case "ud6": // Plaintiff's Affidavit — SSNs deliberately blank (never collected online).
      return packetPayload(
        answers,
        {
          plaintiffAddress: pAddr,
          defendantAddress: dAddr,
          marriageDate: str(answers["shared.relationship.marriage_date"]),
          marriagePlace: marriagePlaceCombined(answers),
          residencyType: residencyBasisFromAnswers(answers),
          ...religious,
        },
        ["plaintiffName", "defendantName", "county", "plaintiffAddress", "marriageDate"]
      );
    case "ud7": // Defendant's Affidavit — summonsDate firm-completed.
      return packetPayload(answers, { defendantAddress: dAddr, ...religious }, [
        "plaintiffName",
        "defendantName",
        "county",
      ]);
    case "ud9": // Note of Issue — filing/service dates firm-completed; phones sensitive, blank.
      return packetPayload(
        answers,
        { plaintiffAddress: pAddr, defendantAddress: dAddr },
        ["plaintiffName", "defendantName", "county"]
      );
    case "ud10": {
      // Findings of Fact — marriage venue split for the form.
      const place = str(answers["shared.relationship.marriage_place"]);
      return packetPayload(
        answers,
        {
          marriageCity: place.split(",")[0]?.trim() ?? "",
          marriageState: str(answers["shared.relationship.marriage_state"]),
          marriageDate: str(answers["shared.relationship.marriage_date"]),
          residencyType: residencyBasisFromAnswers(answers),
          ...religious,
        },
        ["plaintiffName", "defendantName", "county", "marriageDate"]
      );
    }
    case "ud11": // Judgment of Divorce.
      return packetPayload(answers, { plaintiffAddress: pAddr, defendantAddress: dAddr, ...religious }, [
        "plaintiffName",
        "defendantName",
        "county",
      ]);
    case "ud12": // Part 130 Certification.
      return packetPayload(answers, {}, ["plaintiffName", "defendantName", "county"]);
    default:
      throw new Error("VALIDATION: unsupported packet form");
  }
}

/** Dispatch strictly by the allowlisted (state, form) pair. */
export function buildRenderPayload(
  state: string,
  form: string,
  matter: MatterRow,
  answers: AnswerMap
): RenderPayload {
  if (state === "ny" && form === "ud1") return buildNyUd1Payload(matter, answers);
  if (state === "ny" && form === "complaint") return buildNyComplaintPayload(matter, answers);
  if (state === "ny" && form === "stipulation") return buildNyStipulationPayload(matter, answers);
  if (state === "ny" && ["ud4", "ud5", "ud6", "ud7", "ud9", "ud10", "ud11", "ud12"].includes(form)) {
    return buildNyPacketPayload(form, matter, answers);
  }
  if (state === "ny" && form === "ud14") return buildNyUd14Payload(matter, answers);
  if (state === "ny" && form === "ud15") return buildNyUd15Payload(matter, answers);
  throw new Error("VALIDATION: unsupported state/form pair");
}
