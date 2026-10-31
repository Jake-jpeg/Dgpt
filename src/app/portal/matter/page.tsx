"use client";

/**
 * Client matter hub — everything a client can see, in plain language:
 * status, the disclosure step, intake entry, requested items, uploads,
 * released documents, and the help option. Internal machinery (conflict
 * reasoning, drafts, notes) never appears here; the server would refuse it
 * anyway.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Shell, useMe, ErrorNotice } from "@/components/shell";
import { api, fmtWhen } from "@/lib/ui/client-api";
import { inquiryEmail, operatingFirmName } from "@/config/branding";

interface Disclosure {
  version: string;
  title: string;
  paragraphs: string[];
  acknowledgeLabel: string;
}

interface ClientMatter {
  id: string;
  status: string;
  canProceed: boolean;
  requestedItems: { id: string; label: string; createdAt: string }[];
  helpAvailable: boolean;
  helpLabel: string;
}


interface PendingDraft {
  id: string;
  yourName: string;
  spouseName: string;
  spouseEmailMasked: string;
  state: "NY" | "NJ";
  children: boolean;
  assets: boolean;
  quote: { total: number; lines: { label: string; amount: number }[] };
}
interface PartyView {
  role: "A" | "B";
  status: "INVITED" | "JOINED" | "INTAKE_IN_PROGRESS" | "INTAKE_COMPLETE" | "WITHDRAWN";
  firstName: string;
  isYou: boolean;
  seated: boolean;
}

const PARTY_STATUS_TEXT: Record<PartyView["status"], string> = {
  INVITED: "hasn't joined yet",
  JOINED: "has joined — questionnaire not started",
  INTAKE_IN_PROGRESS: "is answering the questionnaire",
  INTAKE_COMPLETE: "has finished the questionnaire",
  WITHDRAWN: "has withdrawn",
};

export default function ClientMatterPage() {
  const { me, loading } = useMe();
  const [matter, setMatter] = useState<ClientMatter | null>(null);
  // 2026-10-30 two-spouse model: a June draft waiting to become a case, and
  // the two seats on the case once it exists (status only — never answers).
  const [pending, setPending] = useState<PendingDraft | null>(null);
  const [parties, setParties] = useState<PartyView[] | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [ackDone, setAckDone] = useState<boolean | null>(null);
  const [disclosure, setDisclosure] = useState<Disclosure | null>(null);
  const [agree, setAgree] = useState(false); // never preselected
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const matterId = me?.clientMatterId ?? null;

  const load = useCallback(async () => {
    if (!matterId) return;
    setErr(null);
    try {
      const m = (await api.get(`/api/matters/${matterId}`)) as { matter: ClientMatter };
      setMatter(m.matter);
      const consent = (await api.get(`/api/matters/${matterId}/consent`)) as {
        acknowledged: boolean;
      };
      setAckDone(consent.acknowledged);
      if (!consent.acknowledged) {
        const d = (await api.get("/api/disclosure")) as { disclosure: Disclosure };
        setDisclosure(d.disclosure);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load your matter");
    }
  }, [matterId]);

  useEffect(() => {
    // Mount-time load of the client's matter once identity resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // The June draft parked under this account's email (no matter yet).
  useEffect(() => {
    if (loading || me?.user?.role !== "CLIENT" || matterId) return;
    (async () => {
      try {
        const r = (await api.get("/api/start/pending")) as unknown as { pending: PendingDraft | null };
        setPending(r.pending);
      } catch {
        /* no draft is the normal case */
      }
    })();
  }, [loading, me, matterId]);

  // Both seats' status, refreshed every 20s while the other spouse is still outstanding.
  const loadParties = useCallback(async () => {
    if (!matterId) return;
    try {
      const r = (await api.get(`/api/matters/${matterId}/parties`)) as unknown as { parties: PartyView[] };
      setParties(r.parties);
    } catch {
      /* legacy single-party matter: no seats */
    }
  }, [matterId]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadParties();
  }, [loadParties]);
  useEffect(() => {
    if (!parties || parties.every((p) => p.status === "INTAKE_COMPLETE")) return;
    const t = setInterval(loadParties, 20_000);
    return () => clearInterval(t);
  }, [parties, loadParties]);

  async function createCase() {
    setBusy(true);
    setErr(null);
    try {
      const r = (await api.post("/api/start/finish")) as unknown as { matterId: string; inviteUrl: string };
      setInviteUrl(r.inviteUrl);
      setPending(null);
      // Hard reload: useMe() resolves clientMatterId once per mount.
      window.sessionStorage.setItem("dgpt_invite_url", r.inviteUrl);
      window.location.replace("/portal/matter");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create the case");
      setBusy(false);
    }
  }

  async function resendInvite() {
    setBusy(true);
    setErr(null);
    try {
      const r = (await api.post(`/api/matters/${matterId}/parties`)) as unknown as { inviteUrl: string };
      setInviteUrl(r.inviteUrl);
      setInfo("A new link is ready — the old one no longer works.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not make a new link");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    try {
      const u = window.sessionStorage.getItem("dgpt_invite_url");
      if (u) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInviteUrl(u);
        window.sessionStorage.removeItem("dgpt_invite_url");
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  async function copyInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the link is visible to select by hand */
    }
  }

  async function acknowledge() {
    if (!matterId || !disclosure) return;
    setBusy(true);
    setErr(null);
    try {
      await api.post(`/api/matters/${matterId}/consent`, {
        version: disclosure.version,
        acknowledge: true,
      });
      setAckDone(true);
      setInfo("Thank you — your acknowledgment has been recorded.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not record acknowledgment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title="My matter">
      <ErrorNotice message={err} />
      {info && <div className="notice notice-good mb-4">{info}</div>}

      {/* Signed in, but no account behind the session: the attorney declined
          this registration (or an admin removed the account) while the
          browser still carried a valid session. Signing in again re-registers
          them — the button does it. (Matter deletion no longer removes the
          client's login — 2026-09-13 — so this panel is now rare.) The old
          copy told them to "open the invitation link the firm sent", a flow
          retired 2026-07-26, and sent the live run of 2026-09-12 nowhere.
          Deliberately NOT self-healed server-side: re-creating the account
          from the session would undo an attorney's Decline on the client's
          next reload. */}
      {!loading && !me?.user && me?.identity && (
        <div className="panel">
          <h2>Please sign in again</h2>
          <p className="panel-sub">
            {`You are signed in as ${me.identity.email}, but this sign-in is not registered with ${operatingFirmName()} right now. Sign out and sign back in with the email address the firm has for you — that registers you. If it still does not work, contact the firm.`}
          </p>
          <button
            className="btn btn-primary mt-2"
            onClick={async () => {
              try {
                await api.post("/api/auth/logout");
              } catch {
                /* cookie may already be gone */
              }
              window.location.replace("/portal");
            }}
          >
            Sign out and start over
          </button>
        </div>
      )}

      {!loading && me?.user && me.user.role !== "CLIENT" && (
        <div className="notice notice-info">This page is for client accounts.</div>
      )}

      {!loading && me?.user?.role === "CLIENT" && !matterId && pending && (
        <div className="panel">
          <h2>Your case is ready to create, {pending.yourName.split(" ")[0]}</h2>
          <p className="panel-sub">
            {pending.state === "NJ" ? "New Jersey" : "New York"} · {pending.children ? "children" : "no children"} ·{" "}
            {pending.assets ? "assets or debts to divide" : "no assets or debts to divide"} · flat fee $
            {pending.quote.total.toLocaleString("en-US")}. Your spouse, {pending.spouseName}, will be invited at{" "}
            {pending.spouseEmailMasked}.
          </p>
          <div className="june-signin">
            <button className="btn btn-primary" disabled={busy} onClick={createCase}>
              {busy ? "Creating…" : "Create my case"}
            </button>
          </div>
        </div>
      )}

      {!loading && me?.user?.role === "CLIENT" && !matterId && !pending && (
        <WaitingRoom email={me.user.email} />
      )}

      {matterId && matter && parties && parties.length === 2 && (
        <div className="panel">
          <h2>Both of you</h2>
          <p className="panel-sub">
            The firm&apos;s client completes the interview; the other spouse separately confirms the terms of the
            agreement. Neither of you can see the other&apos;s answers; the attorney compares them when you have
            both finished.
          </p>
          <ul className="space-y-2 text-[.95rem]">
            {parties.map((p) => (
              <li key={p.role}>
                <strong>{p.isYou ? "You" : p.firstName || "Your spouse"}</strong> {PARTY_STATUS_TEXT[p.status]}
                {p.status === "INTAKE_COMPLETE" && " ✓"}
              </li>
            ))}
          </ul>
          {parties.every((p) => p.status === "INTAKE_COMPLETE") && (
            <div className="notice notice-good mt-3">
              Both questionnaires are complete. The firm will review them and reach out to schedule your meeting.
            </div>
          )}
          {parties.some((p) => p.role === "B" && !p.seated) && parties.find((p) => p.isYou)?.role === "A" && (
            <div className="mt-3">
              <p className="text-sm">
                Send {parties.find((p) => p.role === "B")?.firstName || "your spouse"} their private link. It only
                works for the email address you gave June, and it expires in 14 days.
              </p>
              {inviteUrl ? (
                <div className="mt-2">
                  <input className="text-input" readOnly value={inviteUrl} onFocus={(e) => e.currentTarget.select()} />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button className="btn btn-primary" onClick={copyInvite}>{copied ? "Copied" : "Copy link"}</button>
                    <a
                      className="btn btn-quiet"
                      href={`mailto:?subject=${encodeURIComponent("Our divorce case — your private link")}&body=${encodeURIComponent(
                        `Here is your private link to answer the questionnaire for our uncontested divorce with Jake Kim Law Firm. It only works for your email address.\n\n${inviteUrl}`
                      )}`}
                    >
                      Email it
                    </a>
                  </div>
                </div>
              ) : (
                <button className="btn btn-quiet mt-2" disabled={busy} onClick={resendInvite}>
                  Get a new link
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {matterId && matter && (
        <>
          <div className="panel">
            <h2>Status</h2>
            <p className="text-[.95rem]">{matter.status}</p>
            {ackDone && matter.canProceed && (
              <div className="mt-3 flex flex-wrap gap-3">
                <Link className="btn btn-primary" href="/portal/intake">
                  Open my questionnaire
                </Link>
              </div>
            )}
            {ackDone && !matter.canProceed && (
              <Link className="btn btn-quiet mt-3" href="/intake">
                Provide initial information
              </Link>
            )}
          </div>

          {ackDone === false && disclosure && (
            <div className="panel">
              <h2>{disclosure.title}</h2>
              <p className="panel-sub">
                Please read the following before continuing. Version{" "}
                {disclosure.version}.
              </p>
              <div className="space-y-3 text-[.93rem] leading-relaxed">
                {disclosure.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <label className="mt-4 flex items-start gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1"
                />
                {disclosure.acknowledgeLabel}
              </label>
              <button
                className="btn btn-primary mt-4"
                onClick={acknowledge}
                disabled={!agree || busy}
              >
                Record my acknowledgment
              </button>
            </div>
          )}

          {matter.requestedItems.length > 0 && (
            <div className="panel">
              <h2>Items the firm has asked for</h2>
              <ul className="list-disc space-y-1 pl-5 text-[.93rem]">
                {matter.requestedItems.map((r) => (
                  <li key={r.id}>
                    {r.label}{" "}
                    <span className="text-xs text-slate-500">
                      requested {fmtWhen(r.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Document exchange and help requests happen OVER EMAIL, directly
              with the firm (2026-07-26 operator directive): this portal does
              not carry client correspondence or file uploads — what it never
              holds, it can never leak or make discoverable. */}
        </>
      )}
    </Shell>
  );
}

/**
 * The waiting room — a registered client whose account the attorney has not
 * connected to a matter yet.
 *
 * OPERATOR DIRECTIVE (2026-07-26): "INSTRUCT THE CLIENT TO EMAIL THE LAWYER
 * AFTER THEY LOG IN. OTHERWISE THE LAWYER WILL NOT KNOW AND HAVE TO CHECK
 * MANUALLY. That causes problems for an LAS attorney handling a 20 case
 * docket."
 *
 * So the notification travels the only way that costs nothing and needs no
 * credential anywhere: the CLIENT sends it, from their own mailbox, and it
 * lands in the attorney's inbox like any other client email. The server
 * sends no mail and holds no mail credential.
 *
 * The address comes from the EXISTING NEXT_PUBLIC_INQUIRY_EMAIL branding
 * row. Unset, the page still gives the instruction but renders no mailto —
 * per branding.ts, an address is never invented.
 */
function WaitingRoom({ email }: { email: string }) {
  const firm = operatingFirmName();
  const to = inquiryEmail();
  const subject = `Registered on DivorceGPT — please connect my case (${email})`;
  const body =
    `Hello,\n\n` +
    `I've registered at divorcegpt.com and signed in with this email address ` +
    `(${email}). Please connect my case so I can start my questionnaire.\n\n` +
    `Thank you.`;

  return (
    <div className="panel">
      <h2>You&apos;re signed in — now start your case with June</h2>
      <div className="june-signin" style={{ marginBottom: 16 }}>
        <Link className="btn btn-primary" href="/start">
          Start with June
        </Link>
        <p className="text-xs text-slate-500">
          Two minutes: June explains how it works, takes a few details, and gives you the flat fee. If your spouse
          already started the case, open the invitation link they sent you instead.
        </p>
      </div>
      <h2 style={{ fontSize: ".95rem" }}>Or, if the firm told you to register and wait</h2>
      {/* Spaces around the firm name and after </strong> are explicit
          strings: a JSX line break next to an expression or a closing tag
          swallows the space ("Jake Kim Law Firmto", "registered— your"),
          which is what shipped (operator, 2026-09-12). */}
      <p className="panel-sub">
        {"Your sign-in worked. "}
        <strong>{`Now email ${firm} to let them know you've registered`}</strong>
        {" — your attorney connects your case by hand, and your email is what tells them you're ready. Once they connect it, your questionnaire will be waiting the next time you log in."}
      </p>
      {to ? (
        <a
          className="btn btn-primary mt-2"
          href={`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
            subject
          )}&body=${encodeURIComponent(body)}`}
        >
          ✉ Email the firm now
        </a>
      ) : (
        <p className="mt-2 text-sm text-slate-600">
          Send it to the email address the firm gave you, and mention that you
          signed in as {email}.
        </p>
      )}

      {/* useMe() resolves once on mount, so a client who is already sitting on
          this screen when the attorney connects them would stay here forever —
          the page has no way to learn it. A full reload is the honest fix
          (2026-07-30). */}
      <p className="mt-4 text-sm text-slate-600">
        Already heard back from the firm?{" "}
        <button
          type="button"
          className="btn btn-quiet"
          style={{ padding: "3px 10px", fontSize: ".8rem" }}
          onClick={() => window.location.reload()}
        >
          Check again
        </button>
      </p>
    </div>
  );
}
