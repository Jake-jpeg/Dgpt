/**
 * Advertising-retention log for the reader's guide: the guide's output, its
 * label and the time — NEVER the reader's text (the pre-chat notice tells
 * them not to share details, and nothing they type is written anywhere).
 * Encryption at rest is the managed database's; retention is a config value.
 */
import { getDb, newId, nowIso } from "@/lib/db/index";
import { guideLogRetentionDays } from "@/lib/env";

export async function logGuideOutput(opts: { article: string | null; label: string; decidedBy: string; lang: string; output: string }): Promise<void> {
  await getDb().run(
    `INSERT INTO guide_log (id, article, label, decided_by, lang, output, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    newId(),
    opts.article,
    opts.label,
    opts.decidedBy,
    opts.lang,
    opts.output.slice(0, 4000),
    nowIso()
  );
}

export async function sweepGuideLog(days = guideLogRetentionDays()): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
  const before = await getDb().get<{ n: number }>(`SELECT COUNT(*) AS n FROM guide_log WHERE created_at < ?`, cutoff);
  await getDb().run(`DELETE FROM guide_log WHERE created_at < ?`, cutoff);
  return Number(before?.n ?? 0);
}

export async function listGuideLog(limit = 200): Promise<{ id: string; article: string | null; label: string; decidedBy: string; lang: string; output: string; createdAt: string }[]> {
  const rows = await getDb().all<Record<string, unknown>>(`SELECT * FROM guide_log ORDER BY created_at DESC LIMIT ?`, limit);
  return rows.map((r) => ({ id: r.id as string, article: (r.article as string | null) ?? null, label: r.label as string, decidedBy: r.decided_by as string, lang: r.lang as string, output: r.output as string, createdAt: r.created_at as string }));
}
