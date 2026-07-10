"use client";

/**
 * Attorney dashboard. Server-side RBAC guards every API call this page makes;
 * the page itself is also coarsely gated in middleware. A client role sees
 * nothing here even if they load the JS.
 */
import { useEffect, useState } from "react";
import Link from "next/link";

interface ReadyRow {
  id: string;
  tier: string | null;
  county: string | null;
  initiatedBy: string;
  qdroFlag: boolean;
  attorneyFlags: string[];
  updatedAt: string;
  clientName: string;
}
interface ProgressRow {
  id: string;
  state: string;
  tier: string | null;
  updatedAt: string;
}

export default function AttorneyDashboard() {
  const [ready, setReady] = useState<ReadyRow[]>([]);
  const [inProgress, setInProgress] = useState<ProgressRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/attorney/sessions")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Failed to load");
        setReady(data.ready);
        setInProgress(data.inProgress);
      })
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attorney dashboard</h1>
        <div className="flex gap-3">
          <a
            href="/intake"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Start intake for a client
          </a>
          <Link href="/" className="self-center text-sm text-blue-600 hover:underline">Home</Link>
        </div>
      </div>
      <p className="mb-6 text-sm text-slate-600">
        Attorney-initiated intakes pass through the same conflict wall and scope
        gate as client-initiated ones — there is no way around either.
      </p>

      {err && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <h2 className="mb-2 font-semibold">Ready for review</h2>
      {ready.length === 0 ? (
        <p className="mb-8 text-sm text-slate-500">No intakes are ready for review.</p>
      ) : (
        <div className="mb-8 overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Tier</th>
                <th className="px-4 py-2">County</th>
                <th className="px-4 py-2">Initiated by</th>
                <th className="px-4 py-2">Flags</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {ready.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{r.clientName}</td>
                  <td className="px-4 py-2">{r.tier}</td>
                  <td className="px-4 py-2">{r.county}</td>
                  <td className="px-4 py-2">{r.initiatedBy}</td>
                  <td className="px-4 py-2">
                    {r.qdroFlag && (
                      <span className="mr-1 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">QDRO</span>
                    )}
                    {r.attorneyFlags.map((f) => (
                      <span key={f} className="mr-1 rounded bg-slate-100 px-2 py-0.5 text-xs">{f}</span>
                    ))}
                  </td>
                  <td className="px-4 py-2">
                    <a href={`/attorney/session/${r.id}`} className="text-blue-600 hover:underline">
                      Review
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mb-2 font-semibold">My in-progress intakes</h2>
      {inProgress.length === 0 ? (
        <p className="text-sm text-slate-500">None.</p>
      ) : (
        <ul className="space-y-2">
          {inProgress.map((p) => (
            <li key={p.id} className="rounded-lg border bg-white px-4 py-2 text-sm">
              <span className="font-mono text-xs text-slate-400">{p.id.slice(0, 8)}</span>{" "}
              — {p.state} {p.tier ? `(${p.tier})` : ""} —{" "}
              <a href="/intake" className="text-blue-600 hover:underline">continue in intake</a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
