"use client";

/**
 * /firm/june — what happened in June's conversations (2026-10-30).
 * Operator: "I need to see what happened during these chats." Firm-side,
 * verbatim, newest first; each one shows whether it became a case.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell, useMe, ErrorNotice } from "@/components/shell";
import { api, fmtWhen } from "@/lib/ui/client-api";

interface Row {
  visitorId: string;
  startedAt: string;
  lastAt: string;
  visitorTurns: number;
  email: string | null;
  complete: boolean;
  matterId: string | null;
  transcript: { id: string; role: "VISITOR" | "JUNE" | "SYSTEM"; content: string; lang: string; createdAt: string }[];
}

export default function FirmJunePage() {
  const { me, loading } = useMe();
  const authorized = me?.user?.role === "STAFF" || me?.user?.role === "ATTORNEY";
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!authorized) return;
    (async () => {
      try {
        const r = (await api.get("/api/firm/june?limit=50")) as unknown as { conversations: Row[] };
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRows(r.conversations);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not load");
      }
    })();
  }, [authorized]);

  return (
    <Shell title="June conversations">
      <ErrorNotice message={err} />
      {!loading && !authorized && <div className="notice notice-info">This area is for firm staff and attorneys.</div>}
      {authorized && (
        <div className="panel">
          <p className="panel-sub">
            Every visitor who talked to June, newest first. Verbatim, firm-side only. A row with a case opens the matter.
          </p>
          {rows.length === 0 && <p className="text-sm text-slate-500">No conversations yet.</p>}
          {rows.map((r) => (
            <div key={r.visitorId} style={{ borderTop: "1px solid var(--line)", padding: "12px 0" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <strong className="text-sm">{r.email || "no email yet"}</strong>
                <span className={`badge ${r.matterId ? "badge-good" : r.complete ? "" : "badge-warn"}`}>
                  {r.matterId ? "became a case" : r.complete ? "complete — not signed in yet" : `${r.visitorTurns} message(s), not finished`}
                </span>
                <span className="text-xs text-slate-500">
                  {fmtWhen(r.startedAt)} → {fmtWhen(r.lastAt)}
                </span>
                {r.matterId && (
                  <Link className="text-sm underline" href={`/firm/matters/${r.matterId}`}>
                    Open matter
                  </Link>
                )}
                <button
                  className="btn btn-quiet"
                  style={{ padding: "3px 10px", fontSize: ".75rem", marginLeft: "auto" }}
                  onClick={() => setOpen(open === r.visitorId ? null : r.visitorId)}
                >
                  {open === r.visitorId ? "Hide" : "Read"}
                </button>
              </div>
              {open === r.visitorId && (
                <div className="june-thread mt-3">
                  {r.transcript.map((m) => (
                    <div key={m.id}>
                      <p className="june-who">
                        {m.role === "JUNE" ? "June" : m.role === "VISITOR" ? "Visitor" : "System"} · {fmtWhen(m.createdAt)}
                      </p>
                      <div className={`june-msg june-msg-${m.role === "JUNE" ? "june" : "you"}`} style={m.role === "SYSTEM" ? { background: "#fdf3e2", color: "#8a5d13" } : undefined}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
