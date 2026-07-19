"use client";

/**
 * Shared portal shell — restrained, professional chrome for every 2.0
 * screen. Navigation is shaped by the AUTHORITATIVE role from /api/auth/me
 * (the server re-checks on every API call regardless of what renders here).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/ui/client-api";

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

const FIRM_NAME = process.env.NEXT_PUBLIC_OPERATING_FIRM_NAME || "Jake Kim Law Firm";

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

const NAV: Record<Me["role"], { href: string; label: string }[]> = {
  CLIENT: [{ href: "/portal/matter", label: "My matter" }],
  STAFF: [{ href: "/firm", label: "Matters" }],
  ATTORNEY: [
    { href: "/firm", label: "Matters" },
    { href: "/firm/conflicts", label: "Conflict review" },
    { href: "/attorney", label: "Intake review" },
  ],
  ADMIN: [{ href: "/admin", label: "Administration" }],
};

export function Shell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const { me, loading } = useMe();
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* cookie may already be gone */
    }
    router.push("/portal");
    router.refresh();
  }

  const user = me?.user ?? null;
  const nav = user ? NAV[user.role] ?? [] : [];

  return (
    <div>
      <StagingBanner />
      <header className="portal-header">
        <div className="portal-header-inner">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="brand">
              DivorceGPT<span className="brand-dot">.com</span>
            </Link>
            <span className="text-xs text-slate-300">
              Workflow portal · {FIRM_NAME}
            </span>
          </div>
          <nav className="portal-nav" aria-label="Portal navigation">
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
      <main className="portal-main">
        {title && (
          <h1 className="mb-6 text-2xl font-bold tracking-tight">{title}</h1>
        )}
        {children}
      </main>
      <footer className="portal-footer">
        <p>
          DivorceGPT is workflow software used by {FIRM_NAME}. It does not
          provide legal advice; legal services are provided by the firm and
          its attorneys. If something is urgent, contact the firm directly —
          do not rely on this portal alone.
        </p>
      </footer>
    </div>
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
