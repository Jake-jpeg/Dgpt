"use client";

/**
 * Firm matter working view — STAFF/ATTORNEY (grant-scoped by the server).
 *
 * Attorney-only controls (conflict disposition, lifecycle/legal hold,
 * approve / release / request changes / withdraw) render only for the
 * ATTORNEY role. Hiding is convenience: every control calls the protected
 * API, which re-checks the CURRENT role and the structural guards
 * regardless of what this page shows.
 */
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shell, useMe, StatusBadge, ErrorNotice, AccordionPanel, type PanelOpenSignal } from "@/components/shell";
import { api, fmtWhen } from "@/lib/ui/client-api";
import { IntakeTranscriptPanel } from "./workbench";
import FormsRail from "./rail";

interface MatterDetail {
  id: string;
  label: string;
  lifecycle: string;
  conflictStatus: string;
  legalHold: boolean;
  clientUserId: string | null;
  createdAt: string;
  updatedAt: string;
  sessions: { id: string; state: string; tier: string | null; updatedAt: string }[];
}
interface Approval {
  id: string;
  approvalType: string;
  destination: string;
  sha256: string;
  approvedBy: string;
  revoked: boolean;
  createdAt: string;
}
interface Version {
  id: string;
  versionNo: number;
  status: string;
  sha256: string;
  mime: string;
  sizeBytes: number;
  originalFilename: string | null;
  source: string;
  createdAt: string;
  approvals: Approval[];
}
interface Doc {
  id: string;
  title: string;
  docKind: string;
  createdAt: string;
  versions: Version[];
}
export default function FirmMatterDetail() {
  const params = useParams<{ id: string }>();
  const matterId = params.id;
  const { me, loading } = useMe();
  const role = me?.user?.role;
  const authorized = role === "STAFF" || role === "ATTORNEY";
  const isAttorney = role === "ATTORNEY";

  const [matter, setMatter] = useState<MatterDetail | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  // An attention-item click asks a specific panel to open + scroll. The nonce
  // makes a repeat click on the same target re-fire.
  const [openSignal, setOpenSignal] = useState<PanelOpenSignal | null>(null);
  const requestOpen = (id: string) =>
    setOpenSignal((s) => ({ id, nonce: (s?.nonce ?? 0) + 1 }));

  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!authorized || !matterId) return;
    setErr(null);
    try {
      const m = (await api.get(`/api/matters/${matterId}`)) as { matter: MatterDetail };
      setMatter(m.matter);
      const d = await api.get(`/api/matters/${matterId}/documents`);
      setDocs((d as unknown as { documents: Doc[] }).documents);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load the matter");
    }
  }, [authorized, matterId]);

  useEffect(() => {
    // Hydrate the working view once the role is known.
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

  // ── Triage derivations (all from already-loaded data; no extra calls) ──
  const readySessions = (matter?.sessions ?? []).filter((s) => s.state === "READY_FOR_REVIEW");
  const generatedForms = new Set(
    docs
      .filter((d) => d.docKind === "RENDERED_FORM")
      .map((d) => d.title)
  );

  // "Needs your attention" — exactly the items awaiting attorney action.
  const attention: {
    key: string;
    text: string;
    link: string;
    panel?: string;
    href?: string;
  }[] = [];
  if (isAttorney) {
    for (const s of readySessions) {
      attention.push({
        key: `ready-${s.id}`,
        text: "Client intake is complete — transcript and answers ready for your review",
        panel: "transcript",
        link: "Open transcript",
      });
    }
  }

  const chips: { label: string; value: string; sub?: string; alert?: boolean }[] = [
    {
      label: "Intake",
      value: readySessions.length > 0 ? "Ready" : String((matter?.sessions ?? []).length || 0),
      sub:
        readySessions.length > 0
          ? `${readySessions.length} ready for review`
          : `${(matter?.sessions ?? []).length} session(s)`,
    },
    {
      label: "Forms generated",
      value: String(generatedForms.size),
      sub: "see the rail →",
    },
  ];

  return (
    <Shell title={matter ? matter.label : "Matter"}>
      <ErrorNotice message={err} />
      {info && <div className="notice notice-good mb-4">{info}</div>}
      {!loading && !authorized && (
        <div className="notice notice-info">This area is for firm staff and attorneys.</div>
      )}

      {authorized && matter && (
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 560px", minWidth: 0 }}>
          {/* ── Status board (triage-first, always visible) ──────── */}
          <div className="panel board">
            <div className="board-head">
              <p className="board-title">{matter.label}</p>
              <StatusBadge value={matter.lifecycle} />
              {matter.legalHold && <span className="badge badge-stop">LEGAL HOLD</span>}
            </div>
            <p className="board-sub">
              Uncontested divorce workflow · created {fmtWhen(matter.createdAt)} · last
              updated {fmtWhen(matter.updatedAt)}
            </p>

            <div className="chips">
              {chips.map((c) => (
                <div className="chip" key={c.label}>
                  <span className="chip-label">{c.label}</span>
                  <span className={`chip-value${c.alert ? " chip-alert" : ""}`}>{c.value}</span>
                  {c.sub && <span className="chip-sub">{c.sub}</span>}
                </div>
              ))}
            </div>

            <div className="attention">
              <p className="attention-h">Needs your attention</p>
              {attention.length === 0 ? (
                <p className="attention-clear">✓ Nothing needs attention right now.</p>
              ) : (
                <ul className="attention-list">
                  {attention.map((a) => (
                    <li className="attention-item" key={a.key}>
                      <span className="attention-text">{a.text}</span>
                      <button
                        type="button"
                        className="attention-link"
                        onClick={() => requestOpen(a.panel!)}
                      >
                        {a.link}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Lifecycle marks + legal hold — compact, in the board (the
                old "Matter status & lifecycle" accordion is gone; the rail
                shows where the case is, these buttons set what it is). */}
            {isAttorney && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(["PROSPECTIVE", "ENGAGED", "ABANDONED", "CLOSED"] as const)
                  .filter((l) => l !== matter.lifecycle)
                  .map((l) => (
                    <button
                      key={l}
                      className="btn btn-quiet"
                      style={{ padding: "4px 12px", fontSize: ".8rem" }}
                      disabled={busy}
                      onClick={() =>
                        act(async () => {
                          await api.post(`/api/matters/${matterId}/lifecycle`, { lifecycle: l });
                        })
                      }
                    >
                      Mark {l.toLowerCase()}
                    </button>
                  ))}
                <button
                  className={matter.legalHold ? "btn btn-quiet" : "btn btn-danger"}
                  style={{ padding: "4px 12px", fontSize: ".8rem" }}
                  disabled={busy}
                  onClick={() =>
                    act(async () => {
                      await api.post(`/api/matters/${matterId}/lifecycle`, {
                        legalHold: !matter.legalHold,
                        legalHoldReason: matter.legalHold ? undefined : "Set from matter view",
                      });
                    })
                  }
                >
                  {matter.legalHold ? "Release legal hold" : "Place legal hold"}
                </button>
              </div>
            )}
          </div>

          {/* ── Invite the client ────────────────────────────────── */}
          <ConnectClientPanel matterId={matterId} isAttorney={isAttorney} onLinked={load} />

          {/* ── Intake transcript — the one review surface that stays
                 (operator, 2026-07-27: "Lawyer should be able to review and
                 audit the convo."). Audit LOGGING continues server-side;
                 only the viewer panel was removed. ── */}
          <IntakeTranscriptPanel matterId={matterId} openSignal={openSignal} />
          </div>

          {/* ── The forms rail — TurboTax-style; the one control surface
                 for phases and court forms. ── */}
          <div style={{ flex: "0 1 340px", minWidth: 300 }}>
            <FormsRail matterId={matterId} isAttorney={isAttorney} docs={docs} onChanged={load} />
          </div>
        </div>
      )}
    </Shell>
  );
}

/**
 * Invite the client — email-bound, single-use, frictionless. The attorney
 * enters the client's email; the returned link works ONLY for that account,
 * exactly once. The raw link is shown once at creation (never stored).
 */
/**
 * Attorney-controlled client connection (2026-07-26 — replaces invitation
 * links). The client registers by signing in at the site; every registration
 * appears here and the ATTORNEY makes the call: connect it to this matter,
 * or decline it. No links, no tokens, nothing for a client to lose.
 */
function ConnectClientPanel({
  matterId,
  isAttorney,
  onLinked,
}: {
  matterId: string;
  isAttorney: boolean;
  onLinked: () => void | Promise<void>;
}) {
  const [clients, setClients] = useState<
    { id: string; email: string; name: string; createdAt: string; registered: boolean; linked: boolean }[]
  >([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    try {
      const r = (await api.get(`/api/clients`)) as { clients: typeof clients };
      setClients(r.clients);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load registrations");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClients();
  }, [loadClients]);

  const unlinked = clients.filter((c) => !c.linked && c.registered);

  async function connect(userId: string, email: string) {
    setBusy(userId);
    setErr(null);
    setInfo(null);
    try {
      await api.post(`/api/matters/${matterId}/client`, { userId });
      setInfo(`${email} is connected — their intake is open.`);
      await loadClients();
      await onLinked();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not connect the client");
    } finally {
      setBusy(null);
    }
  }

  async function decline(userId: string, email: string) {
    if (!window.confirm(`Decline and remove the registration for ${email}?`)) return;
    setBusy(userId);
    setErr(null);
    setInfo(null);
    try {
      await api.del(`/api/clients/${userId}`);
      setInfo(`${email} declined and removed.`);
      await loadClients();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not decline the registration");
    } finally {
      setBusy(null);
    }
  }

  // ONE language per email, chosen by the button the lawyer clicks
  // (operator, Claude 3.05: "You add a function, when it sending an email.
  // LANGUAGE. ... Whichever the lawyer clicks, it will send the above email
  // in either English, Korean, or Spanish (beta)."). The English body is the
  // operator's own wording. NO signature block is appended by the app — the
  // lawyer's mail client adds their real signature, so this software never
  // prints a firm address of its own.
  const INVITE_MAIL: { key: string; label: string; subject: string; body: string }[] = [
    {
      key: "en",
      label: "\u2709 English",
      subject: "Getting started with your case \u2014 Jake Kim Law Firm",
      body:
        "Hello,\n\nGetting started with your case takes one minute:\n\n" +
        "1. Go to https://divorcegpt.com\n" +
        "2. Log in as Client \u2014 you can log in with your Gmail, Outlook, or Hotmail account.\n\n" +
        "That's it. Once you've logged in, I'll connect your case on my end, and your " +
        "questionnaire will be ready the next time you log in.\n\n" +
        "If you have questions, please feel free to contact me.",
    },
    {
      key: "ko",
      label: "\u2709 \uD55C\uAD6D\uC5B4",
      subject: "\uC0AC\uAC74 \uC2DC\uC791 \uC548\uB0B4 \u2014 Jake Kim Law Firm",
      body:
        "\uC548\uB155\uD558\uC138\uC694,\n\n" +
        "\uC0AC\uAC74\uC744 \uC2DC\uC791\uD558\uB294 \uB370 1\uBD84\uC774\uBA74 \uCDA9\uBD84\uD569\uB2C8\uB2E4:\n\n" +
        "1. https://divorcegpt.com \uC5D0 \uC811\uC18D\uD558\uC138\uC694\n" +
        "2. Client(\uC758\uB8B0\uC778)\uB85C \uB85C\uADF8\uC778\uD558\uC138\uC694 \u2014 Gmail, Outlook \uB610\uB294 Hotmail \uACC4\uC815\uC73C\uB85C \uB85C\uADF8\uC778\uD558\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.\n\n" +
        "\uADF8\uAC8C \uC804\uBD80\uC785\uB2C8\uB2E4. \uB85C\uADF8\uC778\uD558\uC2DC\uBA74 \uC81C\uAC00 \uC0AC\uAC74\uC744 \uC5F0\uACB0\uD574 \uB4DC\uB9AC\uACE0, " +
        "\uB2E4\uC74C \uB85C\uADF8\uC778 \uC2DC \uC9C8\uBB38\uC9C0\uAC00 \uC900\uBE44\uB418\uC5B4 \uC788\uC744 \uAC81\uB2C8\uB2E4.\n\n" +
        "\uAD81\uAE08\uD558\uC2E0 \uC810\uC774 \uC788\uC73C\uC2DC\uBA74 \uC5B8\uC81C\uB4E0\uC9C0 \uC5F0\uB77D \uC8FC\uC138\uC694.",
    },
    {
      key: "es",
      label: "\u2709 Espa\u00F1ol (beta)",
      subject: "Primeros pasos con su caso \u2014 Jake Kim Law Firm",
      body:
        "Hola:\n\nComenzar con su caso toma un minuto:\n\n" +
        "1. Visite https://divorcegpt.com\n" +
        "2. Inicie sesi\u00F3n como Cliente \u2014 puede usar su cuenta de Gmail, Outlook o Hotmail.\n\n" +
        "Eso es todo. Una vez que inicie sesi\u00F3n, yo conectar\u00E9 su caso y su " +
        "cuestionario estar\u00E1 listo la pr\u00F3xima vez que entre.\n\n" +
        "Si tiene preguntas, no dude en contactarme.",
    },
  ];

  return (
    <AccordionPanel
      title="Connect the client"
      defaultOpen
      summary={unlinked.length > 0 ? `${unlinked.length} waiting` : "none waiting"}
    >
      <p className="panel-sub">
        Clients register by logging in at divorcegpt.com with their Gmail, Outlook, or Hotmail account — no links,
        no codes. Every registration shows up here, and you decide: connect it to this
        matter, or decline it. Nothing is visible to a client until you connect them.
      </p>
      <div className="mt-1">
        <p className="text-sm" style={{ marginBottom: 6 }}>
          Email sign-in instructions to the client — the button you click sets the
          email&apos;s language:
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {INVITE_MAIL.map((m) => (
            <a
              key={m.key}
              className="btn btn-quiet"
              href={`mailto:?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`}
            >
              {m.label}
            </a>
          ))}
        </div>
      </div>
      {unlinked.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">
          No registrations waiting. When your client signs in, they&apos;ll appear here —
          refresh the page.
        </p>
      )}
      {unlinked.length > 0 && (
        <table className="tbl mt-3">
          <thead>
            <tr>
              <th>Registered client</th>
              <th>Signed up</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {unlinked.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.email}
                  {c.name && <div className="text-xs text-slate-500">{c.name}</div>}
                </td>
                <td>{fmtWhen(c.createdAt)}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {isAttorney ? (
                      <>
                        <button
                          className="btn btn-primary"
                          style={{ padding: "4px 12px", fontSize: ".8rem" }}
                          disabled={busy !== null}
                          onClick={() => connect(c.id, c.email)}
                        >
                          {busy === c.id ? "Connecting…" : "Connect to this matter"}
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: "4px 12px", fontSize: ".8rem" }}
                          disabled={busy !== null}
                          onClick={() => decline(c.id, c.email)}
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">attorney decides</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {info && <div className="notice notice-good mt-3">{info}</div>}
      {err && <ErrorNotice message={err} />}
    </AccordionPanel>
  );
}
