"use client";

/**
 * Practice settings — the administration console, folded into the lawyer
 * portal (operator, 2026-08-23: "get rid of the admin portal and just have
 * one for lawyers and clients"). Users & roles, retention configuration,
 * disclosure version, audit review. Visible to ATTORNEY and ADMIN; the
 * server re-checks on every call. Deliberately restrained: there is no
 * control here (or anywhere) that can weaken attorney-only rules — the
 * config API accepts an allowlist of retention keys and nothing else, and
 * conflict/approval/release guards re-read roles inside the persistence
 * layer.
 */
import { useCallback, useEffect, useState } from "react";
import { Shell, useMe, StatusBadge, ErrorNotice } from "@/components/shell";
import { api, fmtWhen } from "@/lib/ui/client-api";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
  caseData: number;
}
interface ConfigRow {
  key: string;
  value: string;
}
interface AuditRow {
  ref: string;
  event: string;
  detail: string | null;
  actor: string | null;
  at: string;
}

const ROLES = ["CLIENT", "STAFF", "ATTORNEY", "ADMIN"] as const;
// Client accounts are born only via invitation acceptance — never offered here.
const CREATE_ROLES = ["STAFF", "ATTORNEY", "ADMIN"] as const;

export default function PracticeSettingsPage() {
  const { me, loading } = useMe();
  const role = me?.user?.role;
  const isAdmin = role === "ADMIN" || role === "ATTORNEY";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [config, setConfig] = useState<ConfigRow[]>([]);
  const [disclosureVersion, setDisclosureVersion] = useState<string>("");
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [chainIntact, setChainIntact] = useState<boolean | null>(null);
  const [auditRef, setAuditRef] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("STAFF");
  const [configDraft, setConfigDraft] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setErr(null);
    try {
      const [u, c, d, a] = await Promise.all([
        api.get("/api/admin/users"),
        api.get("/api/admin/config"),
        api.get("/api/disclosure"),
        api.get("/api/admin/audit?limit=100"),
      ]);
      setUsers((u as { users: AdminUser[] }).users);
      setConfig((c as { config: ConfigRow[] }).config);
      setDisclosureVersion(
        (d as { disclosure: { version: string } }).disclosure.version
      );
      const auditData = a as unknown as {
        events: AuditRow[];
        chainIntact: boolean;
      };
      setAudit(auditData.events);
      setChainIntact(auditData.chainIntact);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load admin data");
    }
  }, [isAdmin]);

  useEffect(() => {
    // Hydrate the admin console once the role is known.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function act(fn: () => Promise<void>, done?: string) {
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      await fn();
      if (done) setInfo(done);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The action failed");
    } finally {
      setBusy(false);
    }
  }

  async function filterAudit() {
    const q = auditRef.trim()
      ? `/api/admin/audit?limit=100&ref=${encodeURIComponent(auditRef.trim())}`
      : "/api/admin/audit?limit=100";
    const a = (await api.get(q)) as unknown as { events: AuditRow[]; chainIntact: boolean };
    setAudit(a.events);
    setChainIntact(a.chainIntact);
  }

  return (
    <Shell title="Practice settings">
      <ErrorNotice message={err} />
      {info && <div className="notice notice-good mb-4">{info}</div>}
      {!loading && !isAdmin && (
        <div className="notice notice-info">This area is for the firm&apos;s attorney and administrators.</div>
      )}

      {isAdmin && (
        <>
          <div className="panel">
            <h2>Users &amp; roles</h2>
            <p className="panel-sub">
              Roles are stored in the database and re-checked on every request.
              Administrators cannot clear conflicts or approve/release documents
              — those remain attorney-only regardless of anything set here.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-64 flex-1 text-sm">
                <span className="field-label">Email</span>
                <input
                  className="text-input"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="staff@example.test"
                />
              </label>
              <label className="text-sm">
                <span className="field-label">Role</span>
                <select
                  className="text-input"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  {CREATE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="btn btn-primary"
                disabled={busy || !newEmail.includes("@")}
                onClick={() =>
                  act(async () => {
                    await api.post("/api/admin/users", { email: newEmail, role: newRole });
                    setNewEmail("");
                  }, "User created.")
                }
              >
                Create user
              </button>
            </div>
            <table className="tbl mt-4">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.email}
                      {u.name && <div className="text-xs text-slate-500">{u.name}</div>}
                    </td>
                    <td>
                      <select
                        className="text-input"
                        style={{ width: "auto", padding: "4px 8px" }}
                        value={u.role}
                        disabled={busy}
                        onChange={(e) =>
                          act(async () => {
                            await api.patch(`/api/admin/users/${u.id}`, {
                              role: e.target.value,
                            });
                          }, "Role updated.")
                        }
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <StatusBadge value={u.active ? "ACTIVE" : "DEACTIVATED"} />
                    </td>
                    <td>{fmtWhen(u.createdAt)}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={u.active ? "btn btn-danger" : "btn btn-quiet"}
                          style={{ padding: "4px 12px", fontSize: ".8rem" }}
                          disabled={busy}
                          onClick={() =>
                            act(async () => {
                              await api.patch(`/api/admin/users/${u.id}`, {
                                active: !u.active,
                              });
                            })
                          }
                        >
                          {u.active ? "Deactivate" : "Reactivate"}
                        </button>
                        {/* Delete is available on every account and CASCADES:
                            it removes the account and all case data it owns.
                            Guarded by a typed-email confirmation; the server
                            also blocks self-deletion and removing the last
                            active admin/attorney. */}
                        <button
                          className="btn btn-danger"
                          style={{ padding: "4px 12px", fontSize: ".8rem" }}
                          disabled={busy}
                          onClick={() => {
                            const warn =
                              u.caseData > 0
                                ? `This permanently deletes ${u.email} AND ${u.caseData} linked case record${
                                    u.caseData === 1 ? "" : "s"
                                  } (matters, intake sessions, documents). This cannot be undone.`
                                : `This permanently deletes ${u.email}. This cannot be undone.`;
                            const typed = window.prompt(
                              `${warn}\n\nType the email address to confirm:`
                            );
                            if (typed === null) return;
                            if (typed.trim().toLowerCase() !== u.email.toLowerCase()) {
                              setErr("The email you typed didn't match — deletion cancelled.");
                              return;
                            }
                            act(async () => {
                              await api.del(`/api/admin/users/${u.id}`);
                            }, "User deleted.");
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <h2>Disclosure</h2>
            <p className="panel-sub">
              Current relationship-disclosure version shown to clients before
              conflict screening. The text itself is source-controlled and
              subject to attorney approval before live use.
            </p>
            <p>
              Active version: <span className="badge">{disclosureVersion || "—"}</span>
            </p>
          </div>

          <div className="panel">
            <h2>Retention settings</h2>
            <p className="panel-sub">
              Structure is fixed in code (engaged matters exempt; legal hold
              blocks purge; conflict history survives). Only these thresholds
              are configurable. Final policy values require attorney sign-off.
            </p>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Setting</th>
                  <th>Value</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {config.map((c) => (
                  <tr key={c.key}>
                    <td className="mono">{c.key}</td>
                    <td>
                      <input
                        className="text-input"
                        style={{ maxWidth: 140 }}
                        value={configDraft[c.key] ?? c.value}
                        onChange={(e) =>
                          setConfigDraft((d) => ({ ...d, [c.key]: e.target.value }))
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-quiet"
                        style={{ padding: "4px 12px", fontSize: ".8rem" }}
                        disabled={busy || (configDraft[c.key] ?? c.value) === c.value}
                        onClick={() =>
                          act(async () => {
                            await api.put("/api/admin/config", {
                              key: c.key,
                              value: configDraft[c.key],
                            });
                          }, "Setting saved.")
                        }
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <h2>Audit records</h2>
            <p className="panel-sub">
              Hash-chained event trail. Chain status:{" "}
              {chainIntact === null ? (
                "—"
              ) : chainIntact ? (
                <span className="badge badge-good">INTACT</span>
              ) : (
                <span className="badge badge-stop">BROKEN — investigate</span>
              )}
            </p>
            <div className="flex items-end gap-2">
              <label className="min-w-64 text-sm">
                <span className="field-label">Filter by reference (matter/session/user id)</span>
                <input
                  className="text-input mono"
                  value={auditRef}
                  onChange={(e) => setAuditRef(e.target.value)}
                />
              </label>
              <button className="btn btn-quiet" onClick={filterAudit} disabled={busy}>
                Filter
              </button>
            </div>
            <div className="mt-3 max-h-96 overflow-y-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Event</th>
                    <th>Reference</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((e, i) => (
                    <tr key={i}>
                      <td className="whitespace-nowrap">{fmtWhen(e.at)}</td>
                      <td className="mono">{e.event}</td>
                      <td className="mono text-xs">{e.ref.slice(0, 8)}…</td>
                      <td className="mono break-all text-xs">{e.detail ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}
