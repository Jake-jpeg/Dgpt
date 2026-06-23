"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { dictionary } from "../lib/ny-dictionary";
import { njDictionary } from "../lib/nj-dictionary";

type Dictionary = typeof dictionary.en;

interface LanguageContextType {
  lang: string;
  setLang: (lang: string) => void;
  t: Dictionary;
  state: string;
  setState: (state: string) => void;
}

// Registry of state dictionaries — English only now
const stateDictionaries: Record<string, Record<string, any>> = {
  ny: dictionary,
  nj: njDictionary,
};

const defaultContext: LanguageContextType = {
  lang: "en",
  setLang: () => {},
  t: dictionary.en,
  state: "ny",
  setState: () => {},
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export function LanguageProvider({ children, initialState }: { children: ReactNode; initialState?: string }) {
  const pathname = usePathname();
  const [lang, setLangState] = useState<string>("en");
  const [state, setStateValue] = useState<string>(initialState || "ny");
  const [mounted, setMounted] = useState(false);

  // Detect state from URL path
  useEffect(() => {
    if (pathname.startsWith("/nj")) {
      setStateValue("nj");
    } else if (pathname.startsWith("/ny")) {
      setStateValue("ny");
    }
    setMounted(true);
  }, [pathname]);

  // Restore saved language preference on mount (Korean + English only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dgpt_lang");
      if (saved === "ko" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  const setLang = (newLang: string) => {
    const next = newLang === "ko" ? "ko" : "en";
    setLangState(next);
    try {
      localStorage.setItem("dgpt_lang", next);
      document.documentElement.lang = next;
    } catch {}
  };

  const setState = (newState: string) => {
    setStateValue(newState);
  };

  // Korean + English only. The toggle drives the static-UI dictionary;
  // the AI chat layer is constrained to Korean + English server-side.
  const currentDict = stateDictionaries[state] || dictionary;
  const t = (lang === "ko" ? currentDict.ko : currentDict.en) || currentDict.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, state, setState }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
