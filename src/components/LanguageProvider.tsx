"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { dictionary, Locale } from "../lib/dictionary";

type Dictionary = typeof dictionary.en;

interface LanguageContextType {
  lang: Locale;
  setLang: (lang: Locale) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Locale>("en");
  const t = dictionary[lang];

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
