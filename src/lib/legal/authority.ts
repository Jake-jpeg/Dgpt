/**
 * Legal-authority snapshot — the ONLY legal-content source the runtime uses.
 *
 * LAW SNAPSHOT RULE: the running application NEVER browses the web for
 * client legal analysis. All legal references resolve against this local,
 * dated snapshot (src/config/legal-authority/{nj,ny}/records.json), governed
 * by docs/legal-authority/LEGAL-CONTENT-CHANGE-CONTROL.md.
 *
 * Guards:
 *  - Nothing in the snapshot is auto-APPROVED; records begin RESEARCHED or
 *    COUNSEL_REVIEW_REQUIRED.
 *  - Client-facing legal conclusions derived from unapproved content are
 *    refused (assertClientLegalContentAllowed).
 *  - ALLOW_UNAPPROVED_LEGAL_CONTENT=true is a LOCAL-ONLY development aid for
 *    internal (staff/attorney) surfaces: it never enables client-facing
 *    conclusions, always produces a loud warning, and is REJECTED at startup
 *    outside APP_STAGE=local (src/instrumentation.ts).
 *  - Stale/unversioned/superseded content produces attorney/admin warnings.
 */
import njSnapshot from "@/config/legal-authority/nj/records.json";
import nySnapshot from "@/config/legal-authority/ny/records.json";
import { isLocalStage, appStage } from "@/config/stage";

export type AuthorityStatus =
  | "RESEARCHED"
  | "COUNSEL_REVIEW_REQUIRED"
  | "APPROVED"
  | "RETIRED"
  | "SUPERSEDED";

export interface AuthorityRecord {
  id: string;
  jurisdiction: "NJ" | "NY";
  topic: string;
  proposition: string;
  authorityType: string;
  authorityName: string;
  section: string;
  officialSource: string;
  retrievedAt: string;
  effectiveDate: string | null;
  status: AuthorityStatus;
  notes: string[];
}

interface Snapshot {
  jurisdiction: string;
  snapshotNote: string;
  records: AuthorityRecord[];
}

const ALL: AuthorityRecord[] = [
  ...(njSnapshot as Snapshot).records,
  ...(nySnapshot as Snapshot).records,
];

const BY_ID = new Map(ALL.map((r) => [r.id, r]));

export function listAuthorities(jurisdiction?: "NJ" | "NY"): AuthorityRecord[] {
  return jurisdiction ? ALL.filter((r) => r.jurisdiction === jurisdiction) : [...ALL];
}

export function getAuthority(id: string): AuthorityRecord | null {
  return BY_ID.get(id) ?? null;
}

export function isKnownAuthorityId(id: string): boolean {
  return BY_ID.has(id);
}

// ── Snapshot version / freshness ─────────────────────────────────────

export function legalContentVersion(): string {
  return process.env.LEGAL_CONTENT_VERSION ?? "";
}

export function legalContentReviewedAt(): string {
  return process.env.LEGAL_CONTENT_REVIEWED_AT ?? "";
}

export function legalContentMaxAgeDays(): number {
  const n = Number(process.env.LEGAL_CONTENT_MAX_AGE_DAYS ?? "180");
  return Number.isFinite(n) && n > 0 ? n : 180;
}

export function allowUnapprovedLegalContent(): boolean {
  return process.env.ALLOW_UNAPPROVED_LEGAL_CONTENT === "true" && isLocalStage();
}

/** Startup guard: the local-only override is rejected outside local. */
export function assertLegalContentFlagsValid(): void {
  if (process.env.ALLOW_UNAPPROVED_LEGAL_CONTENT === "true" && !isLocalStage()) {
    throw new Error(
      `LEGAL_CONTENT_GUARD: ALLOW_UNAPPROVED_LEGAL_CONTENT=true is refused when ` +
        `APP_STAGE=${appStage()} — it is a local development aid only.`
    );
  }
}

export interface LegalContentWarning {
  code:
    | "NO_VERSION"
    | "NO_REVIEWED_DATE"
    | "REVIEW_AGE_EXCEEDED"
    | "UNAPPROVED_CONTENT"
    | "SUPERSEDED_FORM_RISK"
    | "LOCAL_UNAPPROVED_OVERRIDE";
  message: string;
}

/** Attorney/admin-visible warnings about the legal-content snapshot. */
export function legalContentWarnings(now = new Date()): LegalContentWarning[] {
  const warnings: LegalContentWarning[] = [];
  if (!legalContentVersion()) {
    warnings.push({
      code: "NO_VERSION",
      message: "Legal-content snapshot has no LEGAL_CONTENT_VERSION set.",
    });
  }
  const reviewedAt = legalContentReviewedAt();
  if (!reviewedAt) {
    warnings.push({
      code: "NO_REVIEWED_DATE",
      message: "Legal-content snapshot has no LEGAL_CONTENT_REVIEWED_AT date.",
    });
  } else {
    const reviewed = new Date(reviewedAt);
    const ageDays = (now.getTime() - reviewed.getTime()) / 86_400_000;
    if (Number.isNaN(reviewed.getTime()) || ageDays > legalContentMaxAgeDays()) {
      warnings.push({
        code: "REVIEW_AGE_EXCEEDED",
        message: `Legal-content review age exceeds ${legalContentMaxAgeDays()} days — re-verification required.`,
      });
    }
  }
  const unapproved = ALL.filter((r) => r.status !== "APPROVED");
  if (unapproved.length > 0) {
    warnings.push({
      code: "UNAPPROVED_CONTENT",
      message: `${unapproved.length} of ${ALL.length} authority records are not APPROVED (counsel review pending).`,
    });
  }
  const supersededRisk = ALL.filter(
    (r) =>
      r.status === "SUPERSEDED" ||
      r.notes.some((n) => n.toUpperCase().includes("SUPERSEDED"))
  );
  if (supersededRisk.length > 0) {
    warnings.push({
      code: "SUPERSEDED_FORM_RISK",
      message: `${supersededRisk.length} authority record(s) reference potentially superseded official material: ${supersededRisk.map((r) => r.id).join(", ")}.`,
    });
  }
  if (allowUnapprovedLegalContent()) {
    warnings.push({
      code: "LOCAL_UNAPPROVED_OVERRIDE",
      message:
        "ALLOW_UNAPPROVED_LEGAL_CONTENT=true (LOCAL ONLY): internal surfaces may use unapproved legal content for development. This never enables client-facing legal conclusions.",
    });
  }
  return warnings;
}

/**
 * The client-facing refusal: legal-content-derived CONCLUSIONS may reach a
 * client only when every referenced authority is APPROVED and the snapshot
 * is versioned and fresh. (This build presents NO legal conclusions to
 * clients anywhere; this guard exists so that future code paths cannot,
 * even with the local override on.)
 */
export function assertClientLegalContentAllowed(authorityIds: string[]): void {
  const problems: string[] = [];
  if (!legalContentVersion()) problems.push("snapshot unversioned");
  if (legalContentWarnings().some((w) => w.code === "REVIEW_AGE_EXCEEDED" || w.code === "NO_REVIEWED_DATE")) {
    problems.push("snapshot review stale/missing");
  }
  for (const id of authorityIds) {
    const rec = getAuthority(id);
    if (!rec) problems.push(`unknown authority ${id}`);
    else if (rec.status !== "APPROVED") problems.push(`${id} is ${rec.status}`);
  }
  if (problems.length > 0) {
    throw new Error(
      `LEGAL_CONTENT_GUARD: client-facing legal content refused (${problems.join("; ")})`
    );
  }
}
