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

/** Dispatch strictly by the allowlisted (state, form) pair. */
export function buildRenderPayload(
  state: string,
  form: string,
  matter: MatterRow,
  answers: AnswerMap
): RenderPayload {
  if (state === "ny" && form === "ud1") return buildNyUd1Payload(matter, answers);
  if (state === "ny" && form === "complaint") return buildNyComplaintPayload(matter, answers);
  throw new Error("VALIDATION: unsupported state/form pair");
}
