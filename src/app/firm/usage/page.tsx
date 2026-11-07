"use client";

/** Usage (2026-11-07): who uses the guide, turns, tokens, estimated cost. ADMIN (the operator) only. */
import { useEffect, useState } from "react";
import { Shell, useMe, ErrorNotice } from "@/components/shell";
import { api, fmtWhen } from "@/lib/ui/client-api";

interface Reader { userId: string | null; name: string; email: string; phone: string; turns: number; tokensIn: number; tokensOut: number; lastUsedAt: string; estCostUsd: number | null }
interface Usage { prices: { input: number | null; output: number | null }; totals: { turns: number; tokensIn: number; tokensOut: number; estCostUsd: number | null }; readers: Reader[]; recent: { at: string; article: string | null; label: string; decidedBy: string; userId: string | null; tokensIn: number | null; tokensOut: number | null; output: string }[] }

const usd = (n: number | null) => (n === null ? "set AI_PRICE_*" : `$${n.toFixed(2)}`);

export default function UsagePage() {
  const { me, loading } = useMe();
  const ok = me?.user?.role === "ADMIN";
  const [u, setU] = useState<Usage | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!ok) return;
    api.get("/api/admin/usage").then((r) => setU(r as unknown as Usage)).catch((e) => setErr(e instanceof Error ? e.message : "Could not load"));
  }, [ok]);

  return (
    <Shell title="Guide usage">
      <ErrorNotice message={err} />
      {!loading && !ok && <div className="notice notice-info">This area is for the operator (admin) only.</div>}
      {ok && u && (
        <>
          <div className="panel">
            <h2>Totals</h2>
            <p className="panel-sub">
              {u.totals.turns} turns · {u.totals.tokensIn.toLocaleString()} input tokens · {u.totals.tokensOut.toLocaleString()} output tokens · est. {usd(u.totals.estCostUsd)}
              {u.prices.input === null && <> — set <code>AI_PRICE_INPUT_PER_MTOK</code> / <code>AI_PRICE_OUTPUT_PER_MTOK</code> (USD per million tokens) to see dollars.</>}
            </p>
          </div>
          <div className="panel">
            <h2>By reader</h2>
            <table className="tbl">
              <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Turns</th><th>In</th><th>Out</th><th>Est. cost</th><th>Last used</th></tr></thead>
              <tbody>
                {u.readers.map((r) => (
                  <tr key={r.userId ?? "anon"}>
                    <td><strong>{r.name || "—"}</strong></td><td>{r.phone}</td><td>{r.email}</td><td>{r.turns}</td><td>{r.tokensIn.toLocaleString()}</td><td>{r.tokensOut.toLocaleString()}</td><td>{usd(r.estCostUsd)}</td><td>{fmtWhen(r.lastUsedAt)}</td>
                  </tr>
                ))}
                {u.readers.length === 0 && <tr><td colSpan={8} className="text-slate-500">No usage yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="panel">
            <h2>Recent guide output</h2>
            <p className="panel-sub">The guide&apos;s words only — nothing a reader typed is stored.</p>
            <table className="tbl">
              <thead><tr><th>When</th><th>Article</th><th>Label</th><th>Decided by</th><th>Output</th></tr></thead>
              <tbody>
                {u.recent.map((l, i) => (
                  <tr key={i}><td>{fmtWhen(l.at)}</td><td>{l.article ?? "—"}</td><td>{l.label}</td><td>{l.decidedBy}</td><td>{l.output}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Shell>
  );
}
