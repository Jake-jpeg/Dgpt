/**
 * Retention + purge for the matter-centered model.
 *
 * Policy (structure in code; final periods are configurable and
 * [COUNSEL REVIEW REQUIRED]):
 *
 *  - Only PROSPECTIVE and ABANDONED matters are ever swept. ENGAGED,
 *    CLOSED, and DECLINED matters are exempt from this prospective-purge
 *    path (DECLINED matters were already reduced to their retained minimum
 *    at disposition).
 *  - LEGAL HOLD is absolute: a matter with legal_hold=1 is skipped by every
 *    automated purge, whatever its lifecycle.
 *  - Purge removes substantive content: intake sessions (answers +
 *    identity), documents/versions and their stored files.
 *  - Purge RETAINS the conflict-review minimum: conflict_submission rows
 *    (identity/aliases, opposing party, entities, screen result,
 *    disposition), disclosure acknowledgments, and the hash-chained audit
 *    trail — none of which carry FKs, so deletion cannot cascade into them.
 */
import { getDb } from "@/lib/db/index";
import { recordAudit, purgeSession, listSessionsByMatter } from "@/lib/db/repo";
import { getMatter, type MatterRow } from "@/lib/db/matters";
import { listDocumentsForMatter, listVersions } from "@/lib/db/documents";
import { getFileStorage } from "@/lib/storage";
import { CONFIG_KEYS, getConfigNumber, getConfigValue } from "@/lib/db/config";

export interface PurgeReport {
  matterId: string;
  sessionsPurged: number;
  documentsPurged: number;
  filesDeleted: number;
}

/**
 * Remove a matter's substantive content. Refuses engaged/closed matters and
 * anything under legal hold — callers do not get to override.
 */
export async function purgeMatterContent(matterId: string, reason: string): Promise<PurgeReport> {
  const matter = getMatter(matterId);
  if (!matter) throw new Error("VALIDATION: matter not found");
  if (matter.legalHold) {
    throw new Error("RETENTION_GUARD: matter is under legal hold — purge refused");
  }
  if (matter.lifecycle !== "PROSPECTIVE" && matter.lifecycle !== "ABANDONED") {
    throw new Error(
      `RETENTION_GUARD: the prospective purge path does not apply to ${matter.lifecycle} matters`
    );
  }

  const db = getDb();
  const sessions = listSessionsByMatter(matterId);
  for (const s of sessions) purgeSession(s.id, reason);

  let filesDeleted = 0;
  const docs = listDocumentsForMatter(matterId);
  for (const d of docs) {
    for (const v of listVersions(d.id)) {
      try {
        await getFileStorage().delete(v.storageKey);
        filesDeleted++;
      } catch {
        /* file already gone */
      }
    }
    // ON DELETE CASCADE removes versions, approvals, releases with the doc.
    db.prepare(`DELETE FROM document WHERE id = ?`).run(d.id);
  }

  recordAudit(
    matterId,
    "RETENTION_PURGE",
    `reason=${reason} sessions=${sessions.length} documents=${docs.length}`
  );
  return {
    matterId,
    sessionsPurged: sessions.length,
    documentsPurged: docs.length,
    filesDeleted,
  };
}

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000);
}

function sweepEligible(m: MatterRow): boolean {
  if (m.legalHold) return false;
  if (m.lifecycle === "PROSPECTIVE") {
    return daysSince(m.lastActivityAt) > getConfigNumber(CONFIG_KEYS.RETENTION_PROSPECTIVE_DAYS);
  }
  if (m.lifecycle === "ABANDONED") {
    return daysSince(m.lastActivityAt) > getConfigNumber(CONFIG_KEYS.RETENTION_ABANDONED_DAYS);
  }
  return false;
}

/** The automated sweep (cron via /api/admin/purge). */
export async function sweepMatters(): Promise<PurgeReport[]> {
  if (getConfigValue(CONFIG_KEYS.RETENTION_SWEEP_ENABLED) !== "true") return [];
  const db = getDb();
  const rows = db
    .prepare(`SELECT id FROM matter WHERE lifecycle IN ('PROSPECTIVE','ABANDONED') AND legal_hold = 0`)
    .all() as { id: string }[];
  const reports: PurgeReport[] = [];
  for (const { id } of rows) {
    const m = getMatter(id)!;
    if (!sweepEligible(m)) continue;
    reports.push(await purgeMatterContent(id, `RETENTION_SWEEP_${m.lifecycle}`));
  }
  return reports;
}
