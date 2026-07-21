"use client";

/**
 * Invitation landing — the client's front door. The email-bound link arrives
 * as /invite?token=…; this page shows who it's for (masked) and offers
 * sign-in that carries the token through OAuth so the callback auto-accepts
 * it — no code to paste. The single-account rule is enforced on the server
 * (the callback / accept route); this page only guides.
 *
 * ?e=<reason> comes back from the callback when a sign-in didn't match.
 */
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell, useMe, ErrorNotice } from "@/components/shell";
import { api } from "@/lib/ui/client-api";

interface Preview {
  valid: boolean;
  firmName?: string;
  emailMasked?: string;
}

const REASON: Record<string, string> = {
  wrong_email:
    "That sign-in didn't match the email this invitation was issued to. Please sign in with the exact account the firm invited.",
  account_conflict:
    "That email is already linked to a different sign-in. Please contact the firm so they can help.",
  firm_account:
    "This is a client invitation — firm accounts can't accept it. Please use your firm sign-in instead.",
  invalid:
    "This invitation is not available (it may have expired, been used, or been withdrawn). Please contact the firm for a new one.",
};

function InviteInner() {
  const { me, loading } = useMe();
  const router = useRouter();
  const params = useSearchParams();
  const token = (params.get("token") ?? "").trim();
  const errorReason = params.get("e");

  const [preview, setPreview] = useState<Preview | null>(null);
  const [err, setErr] = useState<string | null>(errorReason ? REASON[errorReason] ?? REASON.invalid : null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setPreview({ valid: false });
      return;
    }
    (async () => {
      try {
        const p = (await api.get(`/api/invitations/preview?token=${encodeURIComponent(token)}`)) as unknown as Preview;
        if (!cancelled) setPreview(p);
      } catch {
        if (!cancelled) setPreview({ valid: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const user = me?.user ?? null;
  const identity = me?.identity ?? null;

  // Already signed in with a client identity? Offer a one-click accept.
  async function acceptSignedIn() {
    setBusy(true);
    setErr(null);
    try {
      await api.post("/api/invitations/accept", { token });
      router.push("/portal/intake");
    } catch (e) {
      setErr(e instanceof Error ? e.message : REASON.invalid);
    } finally {
      setBusy(false);
    }
  }

  const providerHref = (provider: "google" | "msa") =>
    `/api/auth/login/${provider}?invite=${encodeURIComponent(token)}`;

  return (
    <Shell title="Your invitation">
      <ErrorNotice message={err} />

      {!token && (
        <div className="panel">
          <h2>An invitation is required</h2>
          <p className="panel-sub">
            Access to this portal is by invitation from the firm. If the firm sent
            you a link, open that link to continue. If you believe you should have
            access, please contact the firm.
          </p>
          <Link className="btn btn-quiet mt-2" href="/portal">
            Back to sign in
          </Link>
        </div>
      )}

      {token && preview && !preview.valid && (
        <div className="panel">
          <h2>This invitation isn&apos;t available</h2>
          <p className="panel-sub">
            It may have expired, already been used, or been withdrawn. Please
            contact the firm for a new invitation.
          </p>
        </div>
      )}

      {token && preview?.valid && (
        <div className="panel">
          <h2>You&apos;ve been invited</h2>
          <p className="panel-sub">
            {preview.firmName} has invited you to begin your intake. This
            invitation is for <strong>{preview.emailMasked}</strong> — sign in
            with that exact account to continue. It can be used once, by that
            account only.
          </p>

          {identity && user && user.role === "CLIENT" ? (
            <button className="btn btn-primary mt-3" disabled={busy} onClick={acceptSignedIn}>
              Continue as {identity.email}
            </button>
          ) : identity && user && user.role !== "CLIENT" ? (
            <p className="notice notice-info mt-3">
              You&apos;re signed in as a firm account ({identity.email}). Client
              invitations are accepted with the client&apos;s own Google or
              Outlook account — sign out first, then open this link again.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-3">
              {me?.providers.google && (
                <button
                  className="btn btn-primary"
                  onClick={() => (window.location.href = providerHref("google"))}
                >
                  Sign in with Google
                </button>
              )}
              {me?.providers.msa && (
                <button
                  className="btn btn-primary"
                  onClick={() => (window.location.href = providerHref("msa"))}
                >
                  Sign in with Outlook / Hotmail
                </button>
              )}
              {!me?.providers.google && !me?.providers.msa && (
                <p className="notice notice-info">
                  Client sign-in isn&apos;t configured yet. Please contact the firm.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {token && !preview && !loading && <p className="text-slate-500">Checking your invitation…</p>}
    </Shell>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InviteInner />
    </Suspense>
  );
}
