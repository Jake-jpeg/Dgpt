"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { dictionary, Locale } from "../lib/ny-dictionary";
import { njDictionary } from "../lib/nj-dictionary";

type Dictionary = typeof dictionary.en;

interface LanguageContextType {
  lang: Locale;
  setLang: (lang: Locale) => void;
  t: Dictionary;
  state: string;
  setState: (state: string) => void;
}

const defaultContext: LanguageContextType = {
  lang: "en",
  setLang: () => {},
  t: dictionary.en,
  state: "ny",
  setState: () => {},
};

// Registry of state dictionaries
const stateDictionaries: Record<string, Record<Locale, any>> = {
  ny: dictionary,
  nj: njDictionary,
  // nv: nvDictionary, // Add when ready
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export function LanguageProvider({ children, initialState }: { children: ReactNode; initialState?: string }) {
  const [lang, setLangState] = useState<Locale>("en");
  const [state, setStateValue] = useState<string>(initialState || "ny");
  const [mounted, setMounted] = useState(false);

  // Detect state from URL path on mount
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/nj")) {
      setStateValue("nj");
    } else if (path.startsWith("/nv")) {
      setStateValue("nv");
    } else if (path.startsWith("/ny")) {
      setStateValue("ny");
    }

    const savedLang = localStorage.getItem("divorcegpt-lang") as Locale | null;
    if (savedLang && ["en", "es", "zh", "ko", "ru", "ht"].includes(savedLang)) {
      setLangState(savedLang);
    }
    setMounted(true);
  }, []);

  // Persist language to localStorage
  const setLang = (newLang: Locale) => {
    setLangState(newLang);
    localStorage.setItem("divorcegpt-lang", newLang);
  };

  const setState = (newState: string) => {
    setStateValue(newState);
  };

  // Pick the right dictionary: state-specific if available, fallback to NY
  const currentDict = stateDictionaries[state] || dictionary;
  const t = currentDict[lang] || currentDict.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, state, setState }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
