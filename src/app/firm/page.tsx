"use client";

/**
 * Firm matter list — STAFF/ATTORNEY working view. Shows firm reference,
 * client (where authorized by a grant), conflict status, intake status,
 * document-review status, and last activity; supports creating a synthetic
 * local matter. All data is grant-scoped by the server.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Shell, useMe, StatusBadge, StateBadge, ErrorNotice } from "@/components/shell";
import { api, fmtWhen, STATE_LABELS } from "@/lib/ui/client-api";

interface FirmMatterRow {
  id: string;
  label: string;
  lifecycle: string;
  jurisdiction: "NY" | "NJ";
  conflictStatus: string;
  legalHold: boolean;
  updatedAt: string;
  client: { name: string; email: string } | null;
  intakeStatus: string;
  documents: { total: number; awaitingReview: number; released: number };
}

/* ── The state picker (2026-08: "pick a state first") ─────────────────
 * Two cards, SITE THEME — the navy/slate of the rest of the portal, no
 * new palette. The choice sets the court, forms, and intake for THIS
 * matter only; jurisdiction is an attorney act and clients never see it. */
const NAVY = "#1f4ca8";

const STATE_CARDS: {
  value: "NY" | "NJ";
  name: string;
  court: string;
  detail: string;
}[] = [
  {
    value: "NY",
    name: "New York",
    court: "Supreme Court · Matrimonial",
    detail: "Uncontested · UD packet · Index number",
  },
  {
    value: "NJ",
    name: "New Jersey",
    court: "Superior Court · Chancery Division, Family Part",
    detail: "Uncontested · Irreconcilable differences · FM docket",
  },
];

function StatePicker({
  value,
  onChange,
}: {
  value: "NY" | "NJ";
  onChange: (v: "NY" | "NJ") => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Jurisdiction for this matter"
      style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}
    >
      {STATE_CARDS.map((s) => {
        const selected = value === s.value;
        return (
          <div
            key={s.value}
            role="radio"
            aria-checked={selected}
            tabIndex={0}
            onClick={() => onChange(s.value)}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                onChange(s.value);
              }
            }}
            style={{
              flex: "1 1 240px",
              minWidth: 220,
              cursor: "pointer",
              borderRadius: 10,
              padding: "14px 16px",
              border: selected ? `2px solid ${NAVY}` : "1px solid #cbd5e1",
              background: selected ? "#eef3fb" : "#ffffff",
              boxShadow: selected ? `0 0 0 1px ${NAVY} inset` : "none",
              outline: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                aria-hidden
                className="badge"
                style={{
                  background: selected ? NAVY : "#e2e8f0",
                  color: selected ? "#fff" : "#334155",
                  fontWeight: 700,
                }}
              >
                {s.value}
              </span>
              <span style={{ fontWeight: 700, letterSpacing: "-.01em" }}>{s.name}</span>
              {selected && (
                <span aria-hidden style={{ marginLeft: "auto", color: NAVY, fontWeight: 700 }}>
                  ✓
                </span>
              )}
            </div>
            <div className="text-xs" style={{ color: NAVY, marginTop: 6, fontWeight: 600, letterSpacing: ".02em", textTransform: "uppercase" }}>
              {s.court}
            </div>
            <div className="text-xs text-slate-500" style={{ marginTop: 4 }}>{s.detail}</div>
          </div>
        );
      })}
    </div>
  );
}


export default function FirmMattersPage() {
  const { me, loading } = useMe();
  const isAttorney = me?.user?.role === "ATTORNEY";
  const [busyDelete, setBusyDelete] = useState<string | null>(null);

  /** Attorney matter deletion from the list (2026-07-26 operator directive).
   *  Typed-label confirmation; cascades the matter and an orphaned client
   *  login; LEGAL HOLD is refused by the server regardless. */
  async function deleteMatter(id: string, label: string) {
    const typed = window.prompt(
      `Permanently delete "${label}" and everything in it (intake, transcript, documents)? ` +
        `If the client has no other case, their login is removed too. This cannot be undone.\n\n` +
        `Type the matter reference to confirm:`
    );
    if (typed === null) return;
    if (typed.trim() !== label.trim()) {
      window.alert("The reference you typed didn't match — nothing was deleted.");
      return;
    }
    setBusyDelete(id);
    try {
      await api.del(`/api/matters/${id}`);
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "The matter could not be deleted");
    } finally {
      setBusyDelete(null);
    }
  }
  const [matters, setMatters] = useState<FirmMatterRow[]>([]);
  const [label, setLabel] = useState("");
  const [jurisdiction, setJurisdiction] = useState<"NY" | "NJ">("NY");
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
      await api.post("/api/matters", { label, jurisdiction });
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
            <p className="text-sm" style={{ margin: "10px 0 0", fontWeight: 600 }}>
              Where will this matter proceed?
            </p>
            <p className="text-xs text-slate-500" style={{ margin: "2px 0 0" }}>
              Sets the court, forms, and intake for this matter only — a New York
              filing and a New Jersey filing can sit side by side on your desk.
            </p>
            <StatePicker value={jurisdiction} onChange={setJurisdiction} />
            <div className="flex flex-wrap items-end gap-3" style={{ marginTop: 14 }}>
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
                {`Create ${jurisdiction === "NJ" ? "New Jersey" : "New York"} matter`}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {jurisdiction === "NJ"
                ? "This matter runs the New Jersey uncontested interview — the facts the Complaint, Summons, and Verification need, and nothing else."
                : "This matter runs the New York uncontested interview — the facts the Summons and Verified Complaint need, and nothing else."}
            </p>
          </div>

          <div className="panel">
            <h2>Your matters</h2>
            <p className="panel-sub">Matters you hold access to.</p>
            {matters.length === 0 ? (
              <p className="text-sm text-slate-500">No matters yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Client</th>
                      <th>Status</th>
                      <th>Intake</th>
                      <th>Documents</th>
                      <th>Last updated</th>
                      <th></th>
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
                          <span className="ml-2">
                            <StateBadge value={m.jurisdiction ?? "NY"} />
                          </span>
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
                        <td>
                          {isAttorney && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: "2px 10px", fontSize: ".75rem" }}
                              disabled={busyDelete === m.id}
                              onClick={() => deleteMatter(m.id, m.label)}
                            >
                              {busyDelete === m.id ? "Deleting…" : "Delete"}
                            </button>
                          )}
                        </td>
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
