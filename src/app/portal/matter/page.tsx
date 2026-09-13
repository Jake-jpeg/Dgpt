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


export default function ClientMatterPage() {
  const { me, loading } = useMe();
  const [matter, setMatter] = useState<ClientMatter | null>(null);
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

      {!loading && me?.user?.role === "CLIENT" && !matterId && (
        <WaitingRoom email={me.user.email} />
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
      <h2>You&apos;re registered — one last step</h2>
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
