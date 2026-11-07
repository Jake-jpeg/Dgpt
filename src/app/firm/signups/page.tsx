"use client";

/** Sign-ups (2026-11-07): who signed up — name and number — for the firm's conflict check. ATTORNEY/ADMIN. */
import { useCallback, useEffect, useState } from "react";
import { Shell, useMe, ErrorNotice } from "@/components/shell";
import { api, fmtWhen } from "@/lib/ui/client-api";

interface Row { userId: string; fullName: string; phone: string; email: string; status: "NEW" | "CLEARED" | "REJECTED"; notes: string; signedUpAt: string; statusAt: string | null }

export default function SignupsPage() {
  const { me, loading } = useMe();
  const role = me?.user?.role;
  const ok = role === "ATTORNEY" || role === "ADMIN";
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = (await api.get("/api/firm/signups")) as unknown as { signups: Row[] };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRows(r.signups);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load");
    }
  }, []);
  useEffect(() => {
    if (ok) void load();
  }, [ok, load]);

  async function setStatus(userId: string, status: Row["status"]) {
    setBusy(userId);
    try {
      await api.put("/api/firm/signups", { userId, status });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Shell title="Sign-ups">
      <ErrorNotice message={err} />
      {!loading && !ok && <div className="notice notice-info">This area is for the firm&apos;s attorney and administrators.</div>}
      {ok && (
        <div className="panel">
          <p className="panel-sub">
            Everyone who signed up through the public pages, with the name and number they gave. Run the conflict check, then
            Clear or Reject. A rejected sign-up can no longer use the guide. Nothing else was collected.
          </p>
          <table className="tbl">
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Signed up</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.userId}>
                  <td><strong>{r.fullName}</strong></td>
                  <td><a className="underline" href={`tel:${r.phone.replace(/\D/g, "")}`}>{r.phone}</a></td>
                  <td><a className="underline" href={`mailto:${r.email}`}>{r.email}</a></td>
                  <td>{fmtWhen(r.signedUpAt)}</td>
                  <td><span className={`badge ${r.status === "CLEARED" ? "badge-good" : r.status === "REJECTED" ? "badge-stop" : "badge-warn"}`}>{r.status}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {r.status !== "CLEARED" && <button className="btn btn-quiet" disabled={busy === r.userId} onClick={() => setStatus(r.userId, "CLEARED")}>Clear</button>}{" "}
                    {r.status !== "REJECTED" && <button className="btn btn-danger" disabled={busy === r.userId} onClick={() => setStatus(r.userId, "REJECTED")}>Reject</button>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="text-slate-500">No sign-ups yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}
