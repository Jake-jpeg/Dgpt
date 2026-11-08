"use client";

/**
 * Sign-ups (2026-11-07): who signed up — name and number — for the firm's
 * conflict check. ATTORNEY/ADMIN.
 *
 * 2026-11-08: the platform administrator (ADMIN — the software company's
 * admin@ account) also sees each account's sign-up and last sign-in address
 * and can Ban / Unban. A ban is immediate: every open session is refused on
 * its next request and the sign-in itself is refused by name. Attorneys see
 * the conflict-check view only.
 */
import { useCallback, useEffect, useState } from "react";
import { Shell, useMe, ErrorNotice } from "@/components/shell";
import { api, fmtWhen } from "@/lib/ui/client-api";

interface Row {
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  status: "NEW" | "CLEARED" | "REJECTED";
  notes: string;
  signedUpAt: string;
  statusAt: string | null;
  banned: boolean;
  signupIp?: string | null;
  lastLoginIp?: string | null;
  lastLoginAt?: string | null;
  banReason?: string | null;
  bannedAt?: string | null;
}

export default function SignupsPage() {
  const { me, loading } = useMe();
  const role = me?.user?.role;
  const ok = role === "ATTORNEY" || role === "ADMIN";
  const [rows, setRows] = useState<Row[]>([]);
  const [admin, setAdmin] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    try {
      const r = (await api.get("/api/firm/signups")) as unknown as { admin: boolean; signups: Row[] };
      setRows(r.signups);
      setAdmin(r.admin);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load");
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  async function ban(userId: string, action: "BAN" | "UNBAN") {
    let reason: string | undefined;
    if (action === "BAN") {
      const r = window.prompt("Reason for the ban (kept in the record; the person does not see it):", "");
      if (r === null) return;
      reason = r;
    }
    setBusy(userId);
    try {
      await api.put("/api/firm/signups", { userId, action, reason });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  const needle = q.trim().toLowerCase();
  const shown = needle
    ? rows.filter((r) => [r.fullName, r.phone, r.email, r.signupIp ?? "", r.lastLoginIp ?? ""].some((v) => v.toLowerCase().includes(needle)))
    : rows;
  const counts = {
    total: rows.length,
    pending: rows.filter((r) => r.status === "NEW").length,
    banned: rows.filter((r) => r.banned).length,
  };

  return (
    <Shell title="Sign-ups">
      <ErrorNotice message={err} />
      {!loading && !ok && <div className="notice notice-info">This area is for the firm&apos;s attorney and administrators.</div>}
      {ok && (
        <div className="panel">
          <p className="panel-sub">
            Everyone who signed up through the public pages, with the name and number they gave. Run the conflict check, then Clear
            or Reject. A rejected sign-up can no longer use the guide or start with June.
            {admin && " As the platform administrator you also see sign-in addresses and can ban an account outright — the ban takes effect on that person's very next request."}
          </p>
          <div className="signups-bar">
            <span className="badge badge-warn">{counts.pending} pending</span>
            {admin && counts.banned > 0 && <span className="badge badge-stop">{counts.banned} banned</span>}
            <span className="text-sm text-slate-500">{counts.total} total</span>
            <input className="text-input signups-search" placeholder={admin ? "Search name, phone, email or IP" : "Search name, phone or email"} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Signed up</th>
                  {admin && <th>Sign-up IP</th>}
                  {admin && <th>Last sign-in</th>}
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.userId} className={r.banned ? "row-banned" : undefined}>
                    <td>
                      <strong>{r.fullName}</strong>
                      {r.banned && <span className="badge badge-stop" style={{ marginLeft: 6 }}>BANNED</span>}
                      {admin && r.banned && r.banReason && <div className="text-xs text-slate-500">{r.banReason}</div>}
                    </td>
                    <td><a className="underline" href={`tel:${r.phone.replace(/\D/g, "")}`}>{r.phone}</a></td>
                    <td><a className="underline" href={`mailto:${r.email}`}>{r.email}</a></td>
                    <td>{fmtWhen(r.signedUpAt)}</td>
                    {admin && <td><code className="mono">{r.signupIp ?? "—"}</code></td>}
                    {admin && (
                      <td>
                        <code className="mono">{r.lastLoginIp ?? "—"}</code>
                        {r.lastLoginAt && <div className="text-xs text-slate-500">{fmtWhen(r.lastLoginAt)}</div>}
                      </td>
                    )}
                    <td><span className={`badge ${r.status === "CLEARED" ? "badge-good" : r.status === "REJECTED" ? "badge-stop" : "badge-warn"}`}>{r.status}</span></td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {r.status !== "CLEARED" && <button className="btn btn-quiet" disabled={busy === r.userId} onClick={() => setStatus(r.userId, "CLEARED")}>Clear</button>}{" "}
                      {r.status !== "REJECTED" && <button className="btn btn-danger" disabled={busy === r.userId} onClick={() => setStatus(r.userId, "REJECTED")}>Reject</button>}
                      {admin && (
                        <>
                          {" "}
                          {r.banned ? (
                            <button className="btn btn-quiet" disabled={busy === r.userId} onClick={() => ban(r.userId, "UNBAN")}>Unban</button>
                          ) : (
                            <button className="btn btn-danger" disabled={busy === r.userId} onClick={() => ban(r.userId, "BAN")}>Ban</button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={admin ? 8 : 6} className="text-slate-500">{rows.length === 0 ? "No sign-ups yet." : "No matches."}</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Passwords: none exist here. Sign-in is by Google or Microsoft account only; the platform never sees or stores a password,
            so there is nothing to reset — account problems are handled with Google or Microsoft.
          </p>
        </div>
      )}
    </Shell>
  );
}
