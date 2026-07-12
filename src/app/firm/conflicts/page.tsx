"use client";

/**
 * Attorney conflict-review queue. Disposition controls render for ATTORNEY
 * only; STAFF/ADMIN never see active clearance controls — and the server
 * enforces that independently of anything rendered here.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Shell, useMe, StatusBadge, ErrorNotice } from "@/components/shell";
import { api, fmtWhen } from "@/lib/ui/client-api";

interface PendingRow {
  matterId: string;
  label: string;
  conflictStatus: string;
  submittedAt: string | null;
  screenResult: string | null;
  clientParty: { fullLegalName: string; priorNames: string[] } | null;
  adverseParty: { fullLegalName: string; priorNames: string[] } | null;
}

function names(p: PendingRow["clientParty"]): string {
  if (!p) return "—";
  const prior = p.priorNames?.length ? ` (prior: ${p.priorNames.join(", ")})` : "";
  return `${p.fullLegalName}${prior}`;
}

export default function ConflictQueuePage() {
  const { me, loading } = useMe();
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [note, setNote] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const isAttorney = me?.user?.role === "ATTORNEY";

  const load = useCallback(async () => {
    if (!isAttorney) return;
    try {
      const data = (await api.get("/api/attorney/conflicts")) as { pending: PendingRow[] };
      setRows(data.pending);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load the queue");
    }
  }, [isAttorney]);

  useEffect(() => {
    // Populate the attorney's grant-scoped review queue.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function dispose(
    matterId: string,
    disposition: "CLEARED" | "DECLINED" | "NEEDS_MORE_INFORMATION"
  ) {
    setBusy(matterId);
    setErr(null);
    try {
      await api.post(`/api/matters/${matterId}/conflict`, {
        disposition,
        internalNote: note[matterId]?.trim() || undefined,
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Disposition failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Shell title="Conflict review">
      <ErrorNotice message={err} />

      {!loading && !isAttorney && (
        <div className="notice notice-info">
          Conflict clearance is an attorney determination. Your role does not
          include these controls.
        </div>
      )}

      {isAttorney && rows.length === 0 && (
        <div className="panel">
          <h2>Nothing pending</h2>
          <p className="panel-sub">No matters are awaiting conflict review.</p>
        </div>
      )}

      {isAttorney &&
        rows.map((r) => (
          <div className="panel" key={r.matterId}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2>
                <Link
                  href={`/firm/matters/${r.matterId}`}
                  className="text-[#1f4ca8] hover:underline"
                >
                  {r.label}
                </Link>
              </h2>
              <StatusBadge value={r.conflictStatus} />
            </div>
            <p className="panel-sub">
              Screen result: {r.screenResult?.replaceAll("_", " ").toLowerCase() ?? "—"} ·
              submitted {fmtWhen(r.submittedAt)} (internal — never shown to the client)
            </p>
            <table className="tbl">
              <tbody>
                <tr>
                  <td className="w-40 font-semibold">Prospective client</td>
                  <td>{names(r.clientParty)}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Adverse party</td>
                  <td>{names(r.adverseParty)}</td>
                </tr>
              </tbody>
            </table>
            <label className="mt-3 block text-sm">
              <span className="field-label">Internal note (optional)</span>
              <input
                className="text-input"
                value={note[r.matterId] ?? ""}
                onChange={(e) => setNote((n) => ({ ...n, [r.matterId]: e.target.value }))}
                maxLength={4000}
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="btn btn-primary"
                disabled={busy === r.matterId}
                onClick={() => dispose(r.matterId, "CLEARED")}
              >
                Clear — proceed
              </button>
              <button
                className="btn btn-danger"
                disabled={busy === r.matterId}
                onClick={() => dispose(r.matterId, "DECLINED")}
              >
                Decline representation
              </button>
              <button
                className="btn btn-quiet"
                disabled={busy === r.matterId}
                onClick={() => dispose(r.matterId, "NEEDS_MORE_INFORMATION")}
              >
                Needs more information
              </button>
            </div>
          </div>
        ))}
    </Shell>
  );
}
