/** Direct DB access for DB-level assertions in tests. */
import { getDb } from "@/lib/db";
export { countRows, getAuditEvents, sweepAbandoned } from "@/lib/db/repo";

/** Backdate a session's last activity by N days (simulates abandonment). */
export async function getDbSessionForTest(sessionId: string, daysAgo: number): Promise<void> {
  const past = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  await getDb().run(`UPDATE intake_session SET last_activity_at = ? WHERE id = ?`, past, sessionId);
}
