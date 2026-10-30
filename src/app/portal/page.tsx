"use client";

/**
 * Portal entry (2026-10-30 — the two spouses' door; redesigned the same
 * evening). A new case starts with June (/start); an invited spouse arrives
 * through their /join link; a returning spouse signs back in. The firm's
 * sign-in is a footnote. OAuth buttons render when the provider is
 * configured; the local test sign-in appears only when the server says it is
 * available (dev stub / closed-testing rules are server-enforced).
 *
 * Design: one dark hero shared with the header (the public landing's
 * language — eyebrow, big headline, glass "how it works" card), then a
 * light sign-in section. No "DivorceGPT" title shouting at the top; the
 * brand lives in the header and the headline talks to the reader.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, useMe, ErrorNotice, type Me } from "@/components/shell";
import { api } from "@/lib/ui/client-api";
import { formatUsd, quoteFor } from "@/config/pricing";

const HOME: Record<Me["role"], string> = {
  CLIENT: "/portal/matter",
  STAFF: "/firm",
  ATTORNEY: "/firm",
  ADMIN: "/firm/settings",
};

const FEE_LO = formatUsd(quoteFor({ children: false, assets: false }).total);
const FEE_HI = formatUsd(quoteFor({ children: true, assets: true }).total);

function ProviderIcon({ kind }: { kind: "google" | "msa" | "june" }) {
  // Neutral glyphs, deliberately not vendor logos.
  if (kind === "june") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H9l-5 4V5.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M8 8.5h8M8 11.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
  const signedOut = !user && !loading && !me?.identity;

  const hero = signedOut ? (
    <div className="door-grid">
      <div>
        <p className="eyebrow">Jake Kim Law Firm LLC · New York &amp; New Jersey</p>
        <h1 className="door-h1">
          Your divorce, handled by a lawyer.
          <br />
          <span className="door-h1-soft">Set up in three minutes.</span>
        </h1>
        <p className="door-copy">
          You and your spouse each answer the same questions, separately. An attorney compares the
          answers, meets you both on a video call, and prepares and files everything — for a flat
          fee from {FEE_LO}.
        </p>
        <div className="door-actions">
          <button className="button button-primary door-cta" onClick={() => router.push("/start")}>
            <ProviderIcon kind="june" />
            Start with June
            <span aria-hidden="true" className="door-arrow">→</span>
          </button>
          <a className="button button-secondary" href="#signin">
            I already have a case
          </a>
        </div>
        <p className="door-meta">
          <span>English · 한국어</span>
          <span aria-hidden="true">·</span>
          <span>Attorney-reviewed</span>
          <span aria-hidden="true">·</span>
          <span>
            Flat fee {FEE_LO}–{FEE_HI}
          </span>
        </p>
      </div>

      <aside className="workflow-card door-card" aria-label="How it works">
        <p className="card-label">How it works</p>
        <ol>
          <li>
            <span>01</span>
            <div>
              <strong>Meet June</strong>
              <small>Our set-up assistant takes eight quick details and gives you your exact fee.</small>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Each of you completes the interview</strong>
              <small>Separately, on your own phone. Neither of you sees the other&apos;s answers.</small>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>The attorney compares and meets you</strong>
              <small>A one-hour video meeting with both of you before anything is drafted.</small>
            </div>
          </li>
          <li>
            <span>04</span>
            <div>
              <strong>Prepared and filed by the firm</strong>
              <small>You receive the finished papers from Jake Kim Law Firm.</small>
            </div>
          </li>
        </ol>
      </aside>
    </div>
  ) : null;

  return (
    <Shell hero={hero}>
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

      {signedOut && (
        <>
          <section id="signin" className="door-signin">
            <div className="door-signin-text">
              <p className="door-kicker">Already have a case?</p>
              <h2 className="door-h2">Sign back in.</h2>
              <p className="panel-sub">
                Use the Google (Gmail) or Microsoft (Outlook.com / Hotmail) account you used before.
                If your spouse sent you an invitation, open that link instead — it signs you in and
                seats you on the case.
              </p>
            </div>
            <div className="door-providers">
              {me?.providers.google ? (
                <button className="door-provider" onClick={() => (window.location.href = "/api/auth/login/google")}>
                  <ProviderIcon kind="google" />
                  <span>Continue with Google</span>
                </button>
              ) : (
                <p className="text-sm text-slate-500">Google sign-in is not configured in this environment.</p>
              )}
              {me?.providers.msa && (
                <button className="door-provider" onClick={() => (window.location.href = "/api/auth/login/msa")}>
                  <ProviderIcon kind="msa" />
                  <span>Continue with Outlook / Hotmail</span>
                </button>
              )}
            </div>
          </section>

          <p className="door-staff">
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
