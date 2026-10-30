"use client";

/**
 * Portal entry (2026-10-30 — the two spouses' door). A new case starts with
 * June (/start); an invited spouse arrives through their /join link; a
 * returning spouse signs back in. The firm's sign-in is a footnote. OAuth
 * buttons render when the provider is configured; the local test sign-in
 * appears only when the server says it is available (dev stub /
 * closed-testing rules are server-enforced).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, useMe, ErrorNotice, type Me } from "@/components/shell";
import { api } from "@/lib/ui/client-api";

const HOME: Record<Me["role"], string> = {
  CLIENT: "/portal/matter",
  STAFF: "/firm",
  ATTORNEY: "/firm",
  ADMIN: "/firm/settings",
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
      // Providers authenticate; the DB authorizes. Invite-only: a client
      // account exists only after invitation acceptance, so route by role.
      router.push(who.user ? HOME[who.user.role] : "/portal/matter");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  const user = me?.user ?? null;

  return (
    <Shell title="DivorceGPT">
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
          <h2>Almost there</h2>
          <p className="panel-sub">
            You are signed in as {me.identity.email}. Continue to your intake
            workspace; firm personnel should contact the administrator.
          </p>
          <button className="btn btn-primary" onClick={() => router.push("/portal/matter")}>
            Continue
          </button>
        </div>
      )}

      {!user && !loading && (
        <>
          {/* 2026-10-30: this page is for the two spouses. June starts a
              case; a spouse with an invitation opens their link; anyone
              who already has a case signs back in. The firm's own door is
              one small line at the bottom — this is not a lawyers' interface. */}
          <div className="panel">
            <h2>Start your divorce case</h2>
            <p className="panel-sub">
              DivorceGPT is a service of Jake Kim Law Firm LLC — an attorney-reviewed uncontested divorce,
              prepared and filed by the firm. June, our set-up assistant, explains how it works and takes a few
              details. Takes about three minutes.
            </p>
            <div className="june-signin">
              <button className="btn btn-primary" onClick={() => router.push("/start")}>
                Start with June
              </button>
            </div>
          </div>

          <div className="panel">
            <h2>Already have a case?</h2>
            <p className="panel-sub">
              Sign in with the Google (Gmail) or Microsoft (Outlook.com / Hotmail) account you used before. If
              your spouse sent you an invitation, open that link instead — it signs you in and seats you on the case.
            </p>
            <div className="june-signin">
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
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            Jake Kim Law Firm staff:{" "}
            {me?.providers.entra && (
              <button className="underline" onClick={() => (window.location.href = "/api/auth/login/entra")}>
                sign in with Microsoft
              </button>
            )}
            {me?.providers.entra && me?.providers.google && " · "}
            {me?.providers.google && (
              <button className="underline" onClick={() => (window.location.href = "/api/auth/login/google")}>
                firm Google account
              </button>
            )}
          </p>

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
