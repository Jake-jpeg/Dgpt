"use client";

/**
 * Invitation acceptance. The token may arrive via ?token= (the local
 * invitation URL) or be pasted. Every failure mode — invalid, expired,
 * revoked, already used — shows the SAME neutral message the server
 * returns; this page adds nothing that could distinguish them.
 */
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell, useMe, ErrorNotice } from "@/components/shell";
import { api } from "@/lib/ui/client-api";

function InviteInner() {
  const { me, loading } = useMe();
  const router = useRouter();
  const params = useSearchParams();
  // The one-time invitation URL carries ?token= — seed the field from it.
  const [token, setToken] = useState(() => params.get("token") ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    setErr(null);
    try {
      await api.post("/api/invitations/accept", { token: token.trim() });
      router.push("/portal/matter");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "This invitation is not available.");
    } finally {
      setBusy(false);
    }
  }

  const user = me?.user ?? null;
  const identity = me?.identity ?? null;
  const isFirmAccount = Boolean(user && user.role !== "CLIENT");
  const canAccept = Boolean(identity) && !isFirmAccount;

  return (
    <Shell title="Enter your invitation">
      <ErrorNotice message={err} />

      {!loading && !identity && (
        <div className="notice notice-info mb-4">
          Please <Link href="/portal" className="underline">sign in</Link> first
          — your invitation is linked to the account you sign in with.
        </div>
      )}

      {isFirmAccount && (
        <div className="notice notice-info mb-4">
          You are signed in as {user!.role}. Invitations are accepted by client
          accounts.
        </div>
      )}

      <div className="panel">
        <h2>Firm invitation</h2>
        <p className="panel-sub">
          Paste the invitation the firm provided. Invitations are single-use
          and expire; if yours does not work, contact the firm for a new one.
        </p>
        {identity && !isFirmAccount && (
          <div className="notice notice-info mb-3">
            This invitation will be permanently linked to the account you are
            signed in with: <strong>{identity.email}</strong>. If that is not
            the account you want to use, sign out and sign in with the right
            one before accepting.
          </div>
        )}
        <label className="text-sm">
          <span className="field-label">Invitation code</span>
          <input
            className="text-input mono"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="paste your invitation code"
            maxLength={200}
          />
        </label>
        <button
          className="btn btn-primary mt-4"
          onClick={accept}
          disabled={busy || token.trim().length < 16 || !canAccept}
        >
          {busy ? "Checking…" : "Accept invitation with this account"}
        </button>
      </div>
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
