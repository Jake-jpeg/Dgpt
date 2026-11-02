/**
 * The law firm of record (2026-11-02).
 *
 * DivorceGPT is software made by June Guided Solutions LLC. A FIRM on the
 * platform engages the client under its own retainer, sets its own fees,
 * reviews the packet, and — only if it offers the Review-and-file tier — is
 * counsel of record. The platform displays the firm's fee and takes no
 * payment; it is paid by the firm under a flat software license that does
 * not vary with legal fees (see claude/COMPLIANCE memo, RPC 5.4 / 5.7).
 *
 * The default firm is seeded from the operating-firm env so every existing
 * deployment keeps working unchanged: legacy matters and users with no
 * firm_id belong to it. A SUCCESSOR firm can be named; `transferOpenMatters`
 * moves every open matter in one audited action (the continuity plan every
 * retainer names).
 */
import { getDb, newId, nowIso } from "./index";
import { operatingFirmName } from "@/config/branding";
import { PRICING, REVIEW_FEE } from "@/config/pricing";
import { DEFAULT_FIRM_ID, type EngagementTier } from "./matters";
import { recordAudit } from "./repo";

export interface FirmRow {
  id: string;
  name: string;
  legalName: string;
  jurisdictions: string[];
  defaultTier: EngagementTier;
  reviewFee: number;
  fileBaseFee: number;
  fileChildrenFee: number;
  fileAssetsFee: number;
  offersFiling: boolean;
  successorFirmId: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

function rowToFirm(r: Record<string, unknown>): FirmRow {
  return {
    id: r.id as string,
    name: r.name as string,
    legalName: (r.legal_name as string) ?? "",
    jurisdictions: String(r.jurisdictions ?? "NY").split(",").map((s) => s.trim()).filter(Boolean),
    defaultTier: r.default_tier === "REVIEW_AND_FILE" ? "REVIEW_AND_FILE" : "REVIEW",
    reviewFee: Number(r.review_fee ?? REVIEW_FEE),
    fileBaseFee: Number(r.file_base_fee ?? PRICING.base),
    fileChildrenFee: Number(r.file_children_fee ?? PRICING.children),
    fileAssetsFee: Number(r.file_assets_fee ?? PRICING.assets),
    offersFiling: Number(r.offers_filing ?? 0) === 1,
    successorFirmId: (r.successor_firm_id as string | null) ?? null,
    status: r.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

/** Idempotent: the default firm exists after the first call, named from the env. */
export async function ensureDefaultFirm(): Promise<FirmRow> {
  const db = getDb();
  const existing = await db.get(`SELECT * FROM firm WHERE id = ?`, DEFAULT_FIRM_ID);
  if (existing) return rowToFirm(existing);
  const t = nowIso();
  await db.run(
    `INSERT INTO firm (id, name, legal_name, jurisdictions, default_tier, review_fee, file_base_fee, file_children_fee, file_assets_fee, offers_filing, created_at, updated_at)
     VALUES (?, ?, ?, 'NY', 'REVIEW', ?, ?, ?, ?, 0, ?, ?)`,
    DEFAULT_FIRM_ID,
    operatingFirmName(),
    operatingFirmName(),
    REVIEW_FEE,
    PRICING.base,
    PRICING.children,
    PRICING.assets,
    t,
    t
  );
  return rowToFirm((await db.get(`SELECT * FROM firm WHERE id = ?`, DEFAULT_FIRM_ID))!);
}

export async function getFirm(id: string): Promise<FirmRow | null> {
  if (id === DEFAULT_FIRM_ID) return ensureDefaultFirm();
  const r = await getDb().get(`SELECT * FROM firm WHERE id = ?`, id);
  return r ? rowToFirm(r) : null;
}

export async function listFirms(): Promise<FirmRow[]> {
  await ensureDefaultFirm();
  const rows = await getDb().all<Record<string, unknown>>(`SELECT * FROM firm ORDER BY created_at ASC`);
  return rows.map(rowToFirm);
}

export async function createFirm(opts: { name: string; legalName?: string; jurisdictions?: string[] }): Promise<FirmRow> {
  const db = getDb();
  const id = newId();
  const t = nowIso();
  await db.run(
    `INSERT INTO firm (id, name, legal_name, jurisdictions, review_fee, file_base_fee, file_children_fee, file_assets_fee, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    opts.name.trim(),
    (opts.legalName ?? opts.name).trim(),
    (opts.jurisdictions ?? ["NY"]).join(","),
    REVIEW_FEE,
    PRICING.base,
    PRICING.children,
    PRICING.assets,
    t,
    t
  );
  return (await getFirm(id))!;
}

export interface FirmUpdate {
  name?: string;
  legalName?: string;
  defaultTier?: EngagementTier;
  reviewFee?: number;
  fileBaseFee?: number;
  fileChildrenFee?: number;
  fileAssetsFee?: number;
  offersFiling?: boolean;
  successorFirmId?: string | null;
  status?: "ACTIVE" | "INACTIVE";
}

export async function updateFirm(id: string, u: FirmUpdate): Promise<FirmRow> {
  const cur = await getFirm(id);
  if (!cur) throw new Error("VALIDATION: firm not found");
  if (u.successorFirmId && u.successorFirmId === id) throw new Error("VALIDATION: a firm cannot be its own successor");
  if (u.successorFirmId && !(await getFirm(u.successorFirmId))) throw new Error("VALIDATION: successor firm not found");
  const next = { ...cur, ...u, successorFirmId: u.successorFirmId === undefined ? cur.successorFirmId : u.successorFirmId };
  if (next.defaultTier === "REVIEW_AND_FILE" && !next.offersFiling) throw new Error("VALIDATION: enable the Review-and-file tier before making it the default");
  await getDb().run(
    `UPDATE firm SET name = ?, legal_name = ?, default_tier = ?, review_fee = ?, file_base_fee = ?, file_children_fee = ?, file_assets_fee = ?, offers_filing = ?, successor_firm_id = ?, status = ?, updated_at = ? WHERE id = ?`,
    next.name.trim(),
    next.legalName.trim(),
    next.defaultTier,
    Math.max(0, Math.round(next.reviewFee)),
    Math.max(0, Math.round(next.fileBaseFee)),
    Math.max(0, Math.round(next.fileChildrenFee)),
    Math.max(0, Math.round(next.fileAssetsFee)),
    next.offersFiling ? 1 : 0,
    next.successorFirmId,
    next.status,
    nowIso(),
    id
  );
  return (await getFirm(id))!;
}

/** The firm's quote for a matter — the FIRM's fee, displayed by the platform. */
export function firmQuote(firm: FirmRow, opts: { tier: EngagementTier; children: boolean; assets: boolean }): { total: number; lines: { label: string; amount: number }[] } {
  if (opts.tier === "REVIEW") {
    return { total: firm.reviewFee, lines: [{ label: "Attorney review of your divorce papers, corrections, and the meeting with both of you — you file", amount: firm.reviewFee }] };
  }
  const lines = [{ label: "Uncontested divorce — attorney-reviewed, prepared and filed", amount: firm.fileBaseFee }];
  if (opts.children) lines.push({ label: "Minor children (custody, parenting time, child support)", amount: firm.fileChildrenFee });
  if (opts.assets) lines.push({ label: "Assets or debts to divide", amount: firm.fileAssetsFee });
  return { total: lines.reduce((n, l) => n + l.amount, 0), lines };
}

/**
 * Practice continuity: move every OPEN matter of `fromFirmId` to its
 * successor in one audited action. Closed/declined/abandoned matters stay
 * where they are. Returns the ids moved.
 */
export async function transferOpenMatters(fromFirmId: string, toFirmId: string, actingUserId: string): Promise<string[]> {
  if (fromFirmId === toFirmId) throw new Error("VALIDATION: same firm");
  const to = await getFirm(toFirmId);
  if (!to || to.status !== "ACTIVE") throw new Error("VALIDATION: successor firm is not active");
  const db = getDb();
  const rows = await db.all<{ id: string }>(
    fromFirmId === DEFAULT_FIRM_ID
      ? `SELECT id FROM matter WHERE (firm_id = ? OR firm_id IS NULL) AND lifecycle IN ('PROSPECTIVE','ENGAGED')`
      : `SELECT id FROM matter WHERE firm_id = ? AND lifecycle IN ('PROSPECTIVE','ENGAGED')`,
    fromFirmId
  );
  const t = nowIso();
  for (const r of rows) {
    await db.run(`UPDATE matter SET firm_id = ?, updated_at = ? WHERE id = ?`, toFirmId, t, r.id);
    await recordAudit(r.id, "MATTER_TRANSFERRED", `from firm=${fromFirmId} to firm=${toFirmId} (practice continuity)`, actingUserId);
  }
  return rows.map((r) => r.id);
}
