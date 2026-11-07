"use client";

/**
 * Shared portal shell — restrained, professional chrome for every 2.0
 * screen. Navigation is shaped by the AUTHORITATIVE role from /api/auth/me
 * (the server re-checks on every API call regardless of what renders here).
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/ui/client-api";
import { nonAffiliationNotice, operatingFirmName, entitySplitNotice } from "@/config/branding";
import { FOOTER, firmAddressLine, firmPhoneLine } from "@/config/door-copy";

export interface Me {
  role: "CLIENT" | "STAFF" | "ATTORNEY" | "ADMIN";
  email: string;
  name: string;
  active: boolean;
}

export interface MeResponse {
  user: Me | null;
  /** Authenticated identity (provider-verified) even when no account exists. */
  identity: { email: string; name: string } | null;
  clientMatterId: string | null;
  devStub: boolean;
  providers: { google: boolean; entra: boolean; msa: boolean };
}

export function useMe(): { me: MeResponse | null; loading: boolean; refresh: () => void } {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    api
      .get("/api/auth/me")
      .then((d) => alive && setMe(d as unknown as MeResponse))
      .catch(() => alive && setMe(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tick]);
  return { me, loading, refresh: () => setTick((t) => t + 1) };
}

const FIRM_NAME = operatingFirmName();

/**
 * Synthetic-staging banner (Part 8): whenever the deployment reports the
 * staging stage with the ephemeral-storage override active, every screen
 * carries a loud, unmissable warning. Driven by the unauthenticated
 * boolean health endpoint — no secrets involved.
 */
function StagingBanner() {
  const [health, setHealth] = useState<{ stage?: string; ephemeralStorage?: boolean; syntheticDemoOnly?: boolean } | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => alive && setHealth(d))
      .catch(() => alive && setHealth(null));
    return () => {
      alive = false;
    };
  }, []);
  if (!health || health.stage !== "staging") return null;
  return (
    <div
      role="alert"
      style={{
        background: "#7c2d12",
        color: "#fff7ed",
        textAlign: "center",
        padding: "6px 12px",
        fontSize: ".8rem",
        fontWeight: 600,
        letterSpacing: ".02em",
      }}
    >
      SYNTHETIC STAGING — {health.ephemeralStorage ? "DATA MAY BE LOST ON REDEPLOYMENT — " : ""}
      SYNTHETIC DATA ONLY — NOT FOR REAL CLIENT USE
    </div>
  );
}

// Two portals: lawyers (/firm) and clients (/portal). The separate admin
// portal is gone (operator, 2026-08-23) — its console lives at
// /firm/settings as "Practice settings", for the attorney and any ADMIN
// account. Hiding/showing here is convenience only; the server re-checks
// the role on every API call.
const NAV: Record<Me["role"], { href: string; label: string }[]> = {
  CLIENT: [{ href: "/portal/matter", label: "My matter" }],
  STAFF: [
    { href: "/firm", label: "Matters" },
    { href: "/firm/june", label: "June" },
  ],
  ATTORNEY: [
    { href: "/firm", label: "Matters" },
    { href: "/firm/signups", label: "Sign-ups" },
    { href: "/firm/june", label: "June" },
    { href: "/firm/settings", label: "Practice settings" },
  ],
  ADMIN: [
    { href: "/firm/signups", label: "Sign-ups" },
    { href: "/firm/usage", label: "Usage" },
    { href: "/firm/settings", label: "Practice settings" },
  ],
};

export function Shell({
  children,
  title,
  hero,
  compact,
}: {
  children: React.ReactNode;
  title?: string;
  /**
   * Optional hero rendered INSIDE the dark band with the header (2026-10-30
   * redesign): the header and the hero share one gradient, the way the
   * public landing does, instead of a thin navy bar over a white page.
   */
  hero?: React.ReactNode;
  /**
   * App-like chrome for the phone (2026-10-30): on small screens the footer
   * disclaimers are hidden and the main padding is tightened so a chat
   * screen behaves like a messaging app (header, thread, input — nothing
   * else). The copy that matters legally is in June's first message.
   */
  compact?: boolean;
}) {
  const { me, loading } = useMe();
  const pathname = usePathname();

  async function signOut() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* cookie may already be gone */
    }
    // HARD navigation, deliberately not router.push. Every page mounts its
    // own <Shell>, so a push to "/portal" from /portal is a no-op: no
    // remount, no refetch, and the screen keeps saying "You are signed in"
    // with the cookie already cleared (operator bug report, 2026-07-26:
    // "Why can't I sign out?"). A full page load drops all client state and
    // re-reads the real cookie state.
    window.location.replace("/portal");
  }

  const user = me?.user ?? null;
  const nav = user ? NAV[user.role] ?? [] : [];

  return (
    <div className={compact ? "portal-compact" : undefined}>
      <StagingBanner />
      <div className={hero ? "portal-top portal-top-hero" : "portal-top"}>
      <header className="portal-header">
        <div className="portal-header-inner">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="brand">
              DivorceGPT<span className="brand-dot">.com</span>
            </Link>
            {user && user.role !== "CLIENT" && (
              <span className="text-xs text-slate-300">{FIRM_NAME}</span>
            )}
          </div>
          <nav className="portal-nav" aria-label="Portal navigation">
            <Link href="/blog" aria-current={pathname?.startsWith("/blog") ? "page" : undefined}>
              Articles
            </Link>
            <Link href="/forms" aria-current={pathname === "/forms" ? "page" : undefined}>
              Forms
            </Link>
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={pathname === n.href ? "page" : undefined}
              >
                {n.label}
              </Link>
            ))}
            {user || me?.identity ? (
              <>
                <span className="text-xs text-slate-300">
                  {user
                    ? `${user.name || user.email} · ${user.role}`
                    : `${me!.identity!.email} · not yet linked`}
                </span>
                <button
                  onClick={signOut}
                  className="btn btn-quiet"
                  style={{ padding: "4px 12px", fontSize: ".8rem" }}
                >
                  Sign out
                </button>
              </>
            ) : loading ? null : (
              <Link href="/portal">Sign in</Link>
            )}
          </nav>
        </div>
      </header>
      {hero && <div className="portal-hero">{hero}</div>}
      </div>
      <main className="portal-main">
        {title && (
          <h1 className="mb-6 text-2xl font-bold tracking-tight">{title}</h1>
        )}
        {children}
      </main>
      <footer className="portal-footer">
        {/* NY RPC 7.1(f) label + 7.1(h) principal office address and phone
            (2026-10-30). Address/phone come from NEXT_PUBLIC_FIRM_ADDRESS /
            NEXT_PUBLIC_FIRM_PHONE; the bracketed placeholders show until set. */}
        <p className="footer-ad">
          <strong>{FOOTER.en.attorneyAdvertising}</strong> · {FIRM_NAME} · {firmAddressLine()} · {firmPhoneLine()}
        </p>
        <p>
          {entitySplitNotice(FIRM_NAME)} If something is urgent, contact the firm directly — do not rely on this
          portal alone.
        </p>
        <p>
          Using this site or speaking with June does not create an attorney-client relationship. Portal access does
          not itself create or expand representation; any representation is governed solely by a separate written
          engagement agreement with {FIRM_NAME}. This site does not provide legal advice.
        </p>
        <p>{nonAffiliationNotice()}</p>
      </footer>
    </div>
  );
}

/** Small navy state tag — which state's playbook a matter runs under. */
export function StateBadge({ value }: { value: "NY" | "NJ" }) {
  return (
    <span
      className="badge"
      title={
        value === "NJ"
          ? "New Jersey — Superior Court, Chancery Division, Family Part"
          : "New York — Supreme Court, Matrimonial"
      }
      style={{
        background: "#eef3fb",
        color: "#1f4ca8",
        border: "1px solid #1f4ca833",
        fontWeight: 700,
      }}
    >
      {value}
    </span>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const good = ["CLEARED", "RELEASED", "ENGAGED", "READY_FOR_REVIEW", "RESOLVED"];
  const stop = ["DECLINED", "WITHDRAWN", "SUPERSEDED"];
  const cls = good.includes(value)
    ? "badge badge-good"
    : stop.includes(value)
      ? "badge badge-stop"
      : "badge badge-warn";
  return <span className={cls}>{value.replaceAll("_", " ")}</span>;
}

export function ErrorNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="notice notice-error mb-4" role="alert">
      {message}
    </div>
  );
}

/**
 * A request to open a specific panel — an id plus a monotonic nonce so the
 * SAME target clicked twice still re-fires (the object identity changes even
 * when the id repeats). Panels compare against their own `panelId`.
 */
export interface PanelOpenSignal {
  id: string;
  nonce: number;
}

/**
 * Collapsible section. `summary` is a one-line state string shown in the
 * header so the reader knows what's inside without opening it. When `empty`
 * is true the panel renders as a muted one-liner and cannot be expanded —
 * an empty table is never shown.
 *
 * Native <details> throughout: the summary stays a real toggle (mouse and
 * keyboard), and user toggles sync back through `onToggle`. When a matching
 * `openSignal` arrives the panel opens itself and scrolls into view — that
 * is the ONLY thing that forces it open; it never forces it closed, so a
 * click-to-open never fights the attorney's own collapse.
 */
export function AccordionPanel({
  panelId,
  openSignal,
  title,
  summary,
  defaultOpen = false,
  empty = false,
  emptyText,
  children,
}: {
  panelId?: string;
  openSignal?: PanelOpenSignal | null;
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  empty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!panelId || !openSignal || openSignal.id !== panelId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openSignal, panelId]);

  if (empty) {
    return (
      <div className="panel accordion" aria-disabled="true">
        <div style={{ padding: "16px 20px", display: "flex", gap: 12, alignItems: "baseline" }}>
          <span className="accordion-title" style={{ fontWeight: 600, letterSpacing: "-.01em" }}>
            {title}
          </span>
          <span className="accordion-state" style={{ marginLeft: "auto" }}>
            {emptyText ?? "Nothing here"}
          </span>
        </div>
      </div>
    );
  }
  return (
    <details
      ref={ref}
      className="panel accordion"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        <span className="accordion-title">{title}</span>
        {summary && <span className="accordion-state">{summary}</span>}
      </summary>
      <div className="accordion-body">{children}</div>
    </details>
  );
}
