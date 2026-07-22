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
 * claude/PHASE1-verified-complaint-spec.md). Children are asserted zero
 * because the children gate STOPS any child case before intake completes;
 * the generator renders an [ATTORNEY REVIEW REQUIRED] paragraph as a
 * defense-in-depth backstop if that invariant is ever violated.
 */
/**
 * Which DRL § 230 residence prong the complaint pleads — derived from the
 * same facts the gates collected. Deterministic; the attorney sees the
 * pleaded prong on the draft and the § 230(3) posture arrives pre-flagged
 * (RESIDENCY_ATTORNEY_REVIEW) from the residency gates.
 */
function residencyBasisFromAnswers(answers: AnswerMap): string {
  const since = str(answers["ny.case.resident_since"]);
  if (since) {
    const t = Date.parse(since);
    const twoYearsMs = 2 * 365.25 * 24 * 60 * 60 * 1000;
    if (Number.isFinite(t) && Date.now() - t >= twoYearsMs) return "two_year"; // § 230(5)
  }
  if (Boolean(answers["ny.case.married_in_ny"])) return "one_year_married"; // § 230(1)
  if (Boolean(answers["ny.case.lived_in_ny_as_spouses"])) return "one_year_spouses"; // § 230(2)
  if (since) return "one_year_cause"; // § 230(3) — gate-flagged for attorney review
  return "two_year"; // no date on file: default prong; attorney reviews the draft
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
    unemancipatedChildren: "0",
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
