"use client";

/**
 * The English / 한국어 toggle for the spouse-facing pages (2026-10-30).
 * Per-browser convenience only: remembered in localStorage when available,
 * defaulting to the browser language. Server copy (June) detects language
 * from what the visitor types; this is just for the static pages.
 */
import { useEffect, useState } from "react";
import type { Lang } from "@/config/door-copy";

const KEY = "dgpt_lang";

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved === "ko" || saved === "en") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLangState(saved);
      } else if (navigator.language?.toLowerCase().startsWith("ko")) {
        setLangState("ko");
      }
    } catch {
      /* storage unavailable — stay in English */
    }
  }, []);
  function setLang(l: Lang) {
    setLangState(l);
    try {
      window.localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }
  return [lang, setLang];
}

export function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button type="button" aria-pressed={lang === "en"} onClick={() => onChange("en")}>
        English
      </button>
      <button type="button" aria-pressed={lang === "ko"} onClick={() => onChange("ko")}>
        한국어
      </button>
    </div>
  );
}
