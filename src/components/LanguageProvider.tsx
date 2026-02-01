"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { dictionary, Locale } from "../lib/dictionary";

type Dictionary = typeof dictionary.en;

interface LanguageContextType {
  lang: Locale;
  setLang: (lang: Locale) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
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

  const t = dictionary[lang];

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
