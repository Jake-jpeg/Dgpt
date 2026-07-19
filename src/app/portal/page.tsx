"use client";

/**
 * Portal entry — sign-in paths for all four roles. There is NO public
 * self-registration: clients get in only through a firm invitation after
 * signing in. OAuth buttons render when the provider is configured; the
 * local test sign-in appears only when the server says it is available
 * (dev stub / closed-testing rules are server-enforced).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, useMe, ErrorNotice, type Me } from "@/components/shell";
import { api } from "@/lib/ui/client-api";

const HOME: Record<Me["role"], string> = {
  CLIENT: "/portal/matter",
  STAFF: "/firm",
  ATTORNEY: "/firm",
  ADMIN: "/admin",
};

export default function PortalEntry() {
  const { me, loading, refresh } = useMe();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("CLIENT");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function testSignIn() {
    setBusy(true);
    setErr(null);
    try {
      await api.post("/api/auth/dev-login", {
        role,
        email,
        name: email.split("@")[0] || "Test User",
      });
      const who = (await api.get("/api/auth/me")) as { user: Me | null };
      refresh();
      // Providers authenticate; the DB authorizes. An identity with no
      // account yet belongs on the invitation page.
      router.push(who.user ? HOME[who.user.role] : "/invite");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  const user = me?.user ?? null;

  return (
    <Shell title="Portal sign in">
      <ErrorNotice message={err} />

      {user && (
        <div className="panel">
          <h2>You are signed in</h2>
          <p className="panel-sub">
            {user.name || user.email} · role {user.role}
          </p>
          <button className="btn btn-primary" onClick={() => router.push(HOME[user.role])}>
            Continue to your workspace
          </button>
        </div>
      )}

      {!user && me?.identity && (
        <div className="panel">
          <h2>Signed in — invitation needed</h2>
          <p className="panel-sub">
            You are signed in as {me.identity.email}, but this sign-in is not
            linked to an account yet. Clients continue by entering the firm&apos;s
            invitation; firm personnel should contact the administrator.
          </p>
          <button className="btn btn-primary" onClick={() => router.push("/invite")}>
            Enter my invitation
          </button>
        </div>
      )}

      {!user && !loading && (
        <>
          <div className="panel">
            <h2>Clients</h2>
            <p className="panel-sub">
              Access is by firm invitation only. Sign in with the email account
              you already use — Google (Gmail) or Microsoft (Outlook.com or
              Hotmail email addresses) — then enter the invitation the firm
              sent you.
            </p>
            <div className="flex flex-wrap gap-3">
              {me?.providers.google ? (
                <button
                  className="btn btn-primary"
                  onClick={() => (window.location.href = "/api/auth/login/google")}
                >
                  Sign in with Google
                </button>
              ) : (
                <p className="text-sm text-slate-500">
                  Google sign-in is not configured in this environment.
                </p>
              )}
              {me?.providers.msa && (
                <button
                  className="btn btn-primary"
                  onClick={() => (window.location.href = "/api/auth/login/msa")}
                >
                  Sign in with Outlook / Hotmail
                </button>
              )}
            </div>
            {me?.providers.msa && (
              <p className="mt-2 text-sm text-slate-500">
                Outlook and Hotmail addresses are Microsoft accounts — this
                uses your regular email password.
              </p>
            )}
          </div>

          <div className="panel">
            <h2>Firm — staff, attorneys, administration</h2>
            <p className="panel-sub">
              Firm accounts sign in with Microsoft or with a firm Google
              Workspace account. Access and permissions are controlled by the
              firm&apos;s account records, not by this page.
            </p>
            <div className="flex flex-wrap gap-3">
              {me?.providers.entra ? (
                <button
                  className="btn btn-primary"
                  onClick={() => (window.location.href = "/api/auth/login/entra")}
                >
                  Sign in with Microsoft
                </button>
              ) : (
                <p className="text-sm text-slate-500">
                  Microsoft sign-in is not configured in this environment.
                </p>
              )}
              {me?.providers.google && (
                <button
                  className="btn btn-primary"
                  onClick={() => (window.location.href = "/api/auth/login/google")}
                >
                  Sign in with Google
                </button>
              )}
            </div>
          </div>

          {me?.devStub && (
            <div className="panel">
              <h2>Local test sign-in</h2>
              <p className="panel-sub">
                Available in local development only. Synthetic identities —
                never real client data. Server-side rules still decide the
                actual role and permissions.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-sm sm:col-span-2">
                  <span className="field-label">Email</span>
                  <input
                    className="text-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@example.test"
                  />
                </label>
                <label className="text-sm">
                  <span className="field-label">Sign in as</span>
                  <select
                    className="text-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="CLIENT">Client</option>
                    <option value="STAFF">Staff</option>
                    <option value="ATTORNEY">Attorney</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </label>
              </div>
              <button
                className="btn btn-primary mt-4"
                onClick={testSignIn}
                disabled={busy || !email.includes("@")}
              >
                {busy ? "Signing in…" : "Test sign in"}
              </button>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}
