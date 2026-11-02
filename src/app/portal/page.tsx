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
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, useMe, ErrorNotice, type Me } from "@/components/shell";
import { api } from "@/lib/ui/client-api";
import { useLang, LangToggle } from "@/lib/ui/lang";
import { HERO, SIGNIN, faqFor } from "@/config/door-copy";
import { operatingFirmName } from "@/config/branding";

const HOME: Record<Me["role"], string> = {
  CLIENT: "/portal/matter",
  STAFF: "/firm",
  ATTORNEY: "/firm",
  ADMIN: "/firm/settings",
};


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
  const [lang, setLang] = useLang();
  const firm = operatingFirmName();
  const t = HERO[lang];
  const si = SIGNIN[lang];
  const faq = faqFor(firm)[lang];

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
  // Phone: once the hero's own button scrolls away, a sticky "Start with
  // June" bar keeps the one action within thumb reach (CSS shows it ≤560px).
  const ctaRef = useRef<HTMLDivElement>(null);
  const [ctaAway, setCtaAway] = useState(false);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setCtaAway(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [signedOut]);

  const hero = signedOut ? (
    <div className="door-grid">
      <div>
        <div className="door-topline">
          <p className="eyebrow">{t.eyebrow(firm)}</p>
          <LangToggle lang={lang} onChange={setLang} />
        </div>
        <h1 className="door-h1">
          {t.headline1}
          <br />
          <span className="door-h1-soft">{t.headline2}</span>
        </h1>
        <p className="door-copy">{t.sub}</p>
        <div className="door-actions" ref={ctaRef}>
          <button className="button button-primary door-cta" onClick={() => router.push("/start")}>
            <ProviderIcon kind="june" />
            {t.cta}
            <span aria-hidden="true" className="door-arrow">→</span>
          </button>
          <a className="button button-secondary" href="#signin">
            {t.haveCase}
          </a>
        </div>
        <p className="door-cta-note">{t.ctaNote}</p>
        <p className="door-meta">
          {t.meta.map((m, i) => (
            <span key={m}>
              {i > 0 && <span aria-hidden="true" className="door-dot">·</span>}
              {m}
            </span>
          ))}
        </p>
      </div>

      <aside className="workflow-card door-card" aria-label={t.howTitle}>
        <p className="card-label">{t.howTitle}</p>
        <ol>
          {t.how.map(([title, detail], i) => (
            <li key={title}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <strong>{title}</strong>
                <small>{detail}</small>
              </div>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  ) : null;

  return (
    <Shell hero={hero}>
      <ErrorNotice message={err} />
      {signedOut && ctaAway && (
        <div className="door-sticky" role="region" aria-label={t.cta}>
          <button className="btn btn-primary" onClick={() => router.push("/start")}>
            {t.cta} <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

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
          {/* FAQ — after "How it works" (operator, 2026-10-30). Native
              <details>: an accordion that works without JavaScript. */}
          <section className="door-faq" aria-labelledby="faq-title">
            <h2 id="faq-title" className="door-h2">{faq.title}</h2>
            <div className="faq-list">
              {faq.items.map((item) => (
                <details className="faq-item" key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section id="signin" className="door-signin">
            <div className="door-signin-text">
              <p className="door-kicker">{si.kicker}</p>
              <h2 className="door-h2">{si.title}</h2>
              <p className="panel-sub">{si.sub}</p>
            </div>
            <div className="door-providers">
              {me?.providers.google ? (
                <button className="door-provider" onClick={() => (window.location.href = "/api/auth/login/google")}>
                  <ProviderIcon kind="google" />
                  <span>{si.google}</span>
                </button>
              ) : (
                <p className="text-sm text-slate-500">Google sign-in is not configured in this environment.</p>
              )}
              {me?.providers.msa && (
                <button className="door-provider" onClick={() => (window.location.href = "/api/auth/login/msa")}>
                  <ProviderIcon kind="msa" />
                  <span>{si.msa}</span>
                </button>
              )}
            </div>
          </section>

          <p className="door-staff">
            {si.staff(firm)}{" "}
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
