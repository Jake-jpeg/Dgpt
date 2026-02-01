"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { dictionary, Locale } from "../lib/dictionary";

type Dictionary = typeof dictionary.en;

interface LanguageContextType {
  lang: Locale;
  setLang: (lang: Locale) => void;
  t: Dictionary;
}

const defaultContext: LanguageContextType = {
  lang: "en",
  setLang: () => {},
  t: dictionary.en,
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

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

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
