/**
 * Advertising-retention log for the reader's guide: the guide's output, its
 * label and the time — NEVER the reader's text (the pre-chat notice tells
 * them not to share details, and nothing they type is written anywhere).
 * Encryption at rest is the managed database's; retention is a config value.
 */
import { getDb, newId, nowIso } from "@/lib/db/index";
import { guideLogRetentionDays } from "@/lib/env";

export async function logGuideOutput(opts: {
  article: string | null;
  label: string;
  decidedBy: string;
  lang: string;
  output: string;
  userId: string | null;
  model: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  latencyMs: number | null;
}): Promise<void> {
  await getDb().run(
    `INSERT INTO guide_log (id, article, label, decided_by, lang, output, user_id, model, tokens_in, tokens_out, latency_ms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    newId(),
    opts.article,
    opts.label,
    opts.decidedBy,
    opts.lang,
    opts.output.slice(0, 4000),
    opts.userId,
    opts.model,
    opts.tokensIn,
    opts.tokensOut,
    opts.latencyMs,
    nowIso()
  );
}

/** Per-reader usage for the operator's admin portal: turns, tokens, estimated cost. */
export interface UsageRow {
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  turns: number;
  tokensIn: number;
  tokensOut: number;
  lastUsedAt: string;
}

export async function usageByReader(): Promise<UsageRow[]> {
  const rows = await getDb().all<Record<string, unknown>>(
    `SELECT g.user_id AS user_id, COALESCE(sp.full_name, u.name, '') AS name, COALESCE(u.email, '') AS email, COALESCE(sp.phone_display, '') AS phone,
            COUNT(*) AS turns, COALESCE(SUM(g.tokens_in), 0) AS tokens_in, COALESCE(SUM(g.tokens_out), 0) AS tokens_out, MAX(g.created_at) AS last_used
     FROM guide_log g
     LEFT JOIN app_user u ON u.id = g.user_id
     LEFT JOIN signup_profile sp ON sp.user_id = g.user_id
     GROUP BY g.user_id, sp.full_name, u.name, u.email, sp.phone_display
     ORDER BY last_used DESC`
  );
  return rows.map((r) => ({
    userId: (r.user_id as string | null) ?? null,
    name: String(r.name ?? ""),
    email: String(r.email ?? ""),
    phone: String(r.phone ?? ""),
    turns: Number(r.turns ?? 0),
    tokensIn: Number(r.tokens_in ?? 0),
    tokensOut: Number(r.tokens_out ?? 0),
    lastUsedAt: String(r.last_used ?? ""),
  }));
}

/** USD per million tokens — set AI_PRICE_INPUT_PER_MTOK / AI_PRICE_OUTPUT_PER_MTOK to the provider's current list price. */
export function aiPrices(): { input: number | null; output: number | null } {
  const i = Number(process.env.AI_PRICE_INPUT_PER_MTOK);
  const o = Number(process.env.AI_PRICE_OUTPUT_PER_MTOK);
  return { input: Number.isFinite(i) && i > 0 ? i : null, output: Number.isFinite(o) && o > 0 ? o : null };
}

export function estimateCostUsd(tokensIn: number, tokensOut: number): number | null {
  const p = aiPrices();
  if (p.input === null || p.output === null) return null;
  return Math.round(((tokensIn * p.input) / 1_000_000 + (tokensOut * p.output) / 1_000_000) * 10000) / 10000;
}

export async function sweepGuideLog(days = guideLogRetentionDays()): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
  const before = await getDb().get<{ n: number }>(`SELECT COUNT(*) AS n FROM guide_log WHERE created_at < ?`, cutoff);
  await getDb().run(`DELETE FROM guide_log WHERE created_at < ?`, cutoff);
  return Number(before?.n ?? 0);
}

export async function listGuideLog(limit = 200): Promise<{ id: string; article: string | null; label: string; decidedBy: string; lang: string; output: string; userId: string | null; tokensIn: number | null; tokensOut: number | null; createdAt: string }[]> {
  const rows = await getDb().all<Record<string, unknown>>(`SELECT * FROM guide_log ORDER BY created_at DESC LIMIT ?`, limit);
  return rows.map((r) => ({ id: r.id as string, article: (r.article as string | null) ?? null, label: r.label as string, decidedBy: r.decided_by as string, lang: r.lang as string, output: r.output as string, userId: (r.user_id as string | null) ?? null, tokensIn: r.tokens_in == null ? null : Number(r.tokens_in), tokensOut: r.tokens_out == null ? null : Number(r.tokens_out), createdAt: r.created_at as string }));
}
