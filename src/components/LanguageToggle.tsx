"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { koHref, enHref } from "../lib/i18n";

/**
 * Route-aware Korean / English switch.
 * English lives at the root; Korean lives under /ko. Each button links to
 * the counterpart page (falling back to the locale home when a page has no
 * counterpart yet). This is a real navigation — the served HTML changes, so
 * Google indexes each language separately and your curated Korean wins over
 * Chrome's auto-translate.
 */
export default function LanguageToggle({ className = "" }: { className?: string }) {
  const pathname = usePathname() || "/";
  const isKo = pathname === "/ko" || pathname.startsWith("/ko/");

  const koTarget = isKo ? pathname : koHref(pathname);
  const enTarget = isKo ? enHref(pathname) : pathname;

  const base = "rounded-full px-3.5 py-1.5 text-sm font-bold transition-all";
  const active = "bg-[#c59d5f] text-white shadow";
  const idle = "text-zinc-200 hover:text-white";

  return (
    <div
      className={`inline-flex items-center rounded-full bg-[#1a365d] p-0.5 shadow-md ring-1 ring-[#c59d5f]/40 ${className}`}
      role="group"
      aria-label="Language / 언어"
    >
      <Link
        href={koTarget}
        aria-current={isKo ? "true" : undefined}
        className={`${base} ${isKo ? active : idle}`}
        lang="ko"
      >
        한국어
      </Link>
      <Link
        href={enTarget}
        aria-current={!isKo ? "true" : undefined}
        className={`${base} ${!isKo ? active : idle}`}
        lang="en"
        translate="no"
      >
        EN
      </Link>
    </div>
  );
}
