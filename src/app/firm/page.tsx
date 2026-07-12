"use client";

/**
 * Firm matter list — STAFF/ATTORNEY working view. Shows firm reference,
 * client (where authorized by a grant), conflict status, intake status,
 * document-review status, and last activity; supports creating a synthetic
 * local matter. All data is grant-scoped by the server.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Shell, useMe, StatusBadge, ErrorNotice } from "@/components/shell";
import { api, fmtWhen, STATE_LABELS } from "@/lib/ui/client-api";

interface FirmMatterRow {
  id: string;
  label: string;
  lifecycle: string;
  conflictStatus: string;
  legalHold: boolean;
  updatedAt: string;
  client: { name: string; email: string } | null;
  intakeStatus: string;
  documents: { total: number; awaitingReview: number; released: number };
}

export default function FirmMattersPage() {
  const { me, loading } = useMe();
  const [matters, setMatters] = useState<FirmMatterRow[]>([]);
  const [label, setLabel] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const role = me?.user?.role;
  const authorized = role === "STAFF" || role === "ATTORNEY";

  const load = useCallback(async () => {
    if (!authorized) return;
    try {
      const data = (await api.get("/api/matters")) as { matters: FirmMatterRow[] };
      setMatters(data.matters);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load matters");
    }
  }, [authorized]);

  useEffect(() => {
    // Load the grant-scoped matter list once the role is known.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function createMatter() {
    setBusy(true);
    setErr(null);
    try {
      await api.post("/api/matters", { label });
      setLabel("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create the matter");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title="Matters">
      <ErrorNotice message={err} />

      {!loading && !authorized && (
        <div className="notice notice-info">
          This area is for firm staff and attorneys.
        </div>
      )}

      {authorized && (
        <>
          <div className="panel">
            <h2>New matter</h2>
            <p className="panel-sub">
              Use a working reference (e.g. &quot;Prospect 2026-014&quot;) —
              synthetic/local data only in this build.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-64 flex-1 text-sm">
                <span className="field-label">Firm reference</span>
                <input
                  className="text-input"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  maxLength={120}
                  placeholder="Prospect 2026-014 (synthetic)"
                />
              </label>
              <button
                className="btn btn-primary"
                onClick={createMatter}
                disabled={busy || label.trim().length === 0}
              >
                Create matter
              </button>
            </div>
          </div>

          <div className="panel">
            <h2>Your matters</h2>
            <p className="panel-sub">
              Matters you hold access to. Uncontested divorce workflow.
            </p>
            {matters.length === 0 ? (
              <p className="text-sm text-slate-500">No matters yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Client</th>
                      <th>Conflict</th>
                      <th>Intake</th>
                      <th>Documents</th>
                      <th>Last updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matters.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <Link
                            href={`/firm/matters/${m.id}`}
                            className="font-semibold text-[#1f4ca8] hover:underline"
                          >
                            {m.label}
                          </Link>
                          {m.legalHold && (
                            <span className="badge badge-stop ml-2">LEGAL HOLD</span>
                          )}
                          <div className="text-xs text-slate-500">{m.lifecycle}</div>
                        </td>
                        <td>
                          {m.client ? (
                            <>
                              {m.client.name}
                              <div className="text-xs text-slate-500">{m.client.email}</div>
                            </>
                          ) : (
                            <span className="text-slate-400">not yet linked</span>
                          )}
                        </td>
                        <td><StatusBadge value={m.conflictStatus} /></td>
                        <td>{STATE_LABELS[m.intakeStatus] ?? m.intakeStatus}</td>
                        <td>
                          {m.documents.total === 0 ? (
                            <span className="text-slate-400">none</span>
                          ) : (
                            <>
                              {m.documents.awaitingReview > 0 && (
                                <span className="badge badge-warn mr-1">
                                  {m.documents.awaitingReview} to review
                                </span>
                              )}
                              {m.documents.released > 0 && (
                                <span className="badge badge-good">
                                  {m.documents.released} released
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        <td>{fmtWhen(m.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Shell>
  );
}
