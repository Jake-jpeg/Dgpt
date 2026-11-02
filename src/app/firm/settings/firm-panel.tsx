"use client";

/**
 * The firm of record's profile (2026-11-02): the law firm's own name, its
 * engagement tiers and fees, and its successor firm. These are the FIRM's
 * business terms — DivorceGPT (the software, by June Guided Solutions)
 * displays them and takes no payment. The "Transfer every open matter"
 * action is the practice-continuity plan each retainer names.
 */
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/ui/client-api";

interface Firm {
  id: string;
  name: string;
  legalName: string;
  jurisdictions: string[];
  defaultTier: "REVIEW" | "REVIEW_AND_FILE";
  reviewFee: number;
  fileBaseFee: number;
  fileChildrenFee: number;
  fileAssetsFee: number;
  offersFiling: boolean;
  successorFirmId: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export function FirmPanel({ canEdit, onInfo, onError }: { canEdit: boolean; onInfo: (m: string) => void; onError: (m: string) => void }) {
  const [firm, setFirm] = useState<Firm | null>(null);
  const [choices, setChoices] = useState<{ id: string; name: string }[]>([]);
  const [draft, setDraft] = useState<Partial<Firm>>({});
  const [busy, setBusy] = useState(false);
  const [confirmTransfer, setConfirmTransfer] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = (await api.get("/api/firm/profile")) as unknown as { firm: Firm; successorChoices: { id: string; name: string }[] };
      setFirm(r.firm);
      setChoices(r.successorChoices);
      setDraft({});
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not load the firm profile");
    }
  }, [onError]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (!firm) return null;
  const v = { ...firm, ...draft };
  const field = (k: keyof Firm, label: string, type: "text" | "number" = "text") => (
    <label className="text-sm">
      <span className="field-label">{label}</span>
      <input
        className="text-input"
        type={type}
        value={String(v[k] ?? "")}
        disabled={!canEdit}
        onChange={(e) => setDraft((d) => ({ ...d, [k]: type === "number" ? Number(e.target.value) : e.target.value }))}
      />
    </label>
  );

  async function save() {
    setBusy(true);
    try {
      const body: Record<string, unknown> = {};
      for (const k of Object.keys(draft) as (keyof Firm)[]) body[k] = draft[k];
      const r = (await api.put("/api/firm/profile", body)) as unknown as { firm: Firm };
      setFirm(r.firm);
      setDraft({});
      onInfo("Firm profile saved.");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function transfer() {
    setBusy(true);
    try {
      const r = (await api.post("/api/firm/transfer")) as unknown as { moved: number };
      onInfo(`${r.moved} open matter(s) transferred to the successor firm.`);
      setConfirmTransfer(false);
      await load();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setBusy(false);
    }
  }

  const successorName = choices.find((c) => c.id === v.successorFirmId)?.name ?? null;

  return (
    <div className="panel">
      <h2>The firm of record</h2>
      <p className="panel-sub">
        DivorceGPT is software made by June Guided Solutions. The firm below is the law firm clients retain: it sets its own
        fees, reviews every packet, and — only if it offers the Review-and-file tier — is counsel of record. Nothing here is
        paid through the platform.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("name", "Firm name (as clients see it)")}
        {field("legalName", "Legal name (retainers and papers)")}
      </div>
      <h3 className="mt-4 text-sm font-semibold">Engagement tiers and fees (USD)</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("reviewFee", "Review — attorney review, corrections, the meeting; the client files", "number")}
        <label className="text-sm">
          <span className="field-label">Default tier for new cases</span>
          <select
            className="text-input"
            value={v.defaultTier}
            disabled={!canEdit}
            onChange={(e) => setDraft((d) => ({ ...d, defaultTier: e.target.value as Firm["defaultTier"] }))}
          >
            <option value="REVIEW">Review (the client files)</option>
            <option value="REVIEW_AND_FILE" disabled={!v.offersFiling}>
              Review and file (the firm is counsel of record)
            </option>
          </select>
        </label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={Boolean(v.offersFiling)} disabled={!canEdit} onChange={(e) => setDraft((d) => ({ ...d, offersFiling: e.target.checked }))} />
        <span>This firm also offers the Review-and-file tier (counsel of record; Part 1400 applies at $3,000 and above)</span>
      </label>
      {v.offersFiling && (
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {field("fileBaseFee", "Review and file — base", "number")}
          {field("fileChildrenFee", "+ minor children", "number")}
          {field("fileAssetsFee", "+ assets or debts", "number")}
        </div>
      )}
      <h3 className="mt-4 text-sm font-semibold">Practice continuity</h3>
      <p className="panel-sub">
        Name the firm that takes over every open matter if this one cannot continue. It is written into each retainer.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="field-label">Successor firm</span>
          <select
            className="text-input"
            value={v.successorFirmId ?? ""}
            disabled={!canEdit}
            onChange={(e) => setDraft((d) => ({ ...d, successorFirmId: e.target.value || null }))}
          >
            <option value="">— none named —</option>
            {choices.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {canEdit && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn btn-primary" disabled={busy || Object.keys(draft).length === 0} onClick={save}>
            {busy ? "Saving…" : "Save firm profile"}
          </button>
          {firm.successorFirmId && !confirmTransfer && (
            <button className="btn btn-danger" disabled={busy} onClick={() => setConfirmTransfer(true)}>
              Transfer every open matter to {successorName ?? "the successor"}…
            </button>
          )}
          {confirmTransfer && (
            <>
              <span className="text-sm text-slate-700">This moves every open matter to {successorName}. It is audited and the clients are not notified automatically — send the notices.</span>
              <button className="btn btn-danger" disabled={busy} onClick={transfer}>
                Yes, transfer now
              </button>
              <button className="btn btn-quiet" disabled={busy} onClick={() => setConfirmTransfer(false)}>
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
