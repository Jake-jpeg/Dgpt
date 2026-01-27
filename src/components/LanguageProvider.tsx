"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
// We use a relative path to ensure VS Code finds the dictionary file reliably
import { dictionary, Locale } from "../lib/dictionary";

type LanguageContextType = {
  lang: Locale;
  setLang: (lang: Locale) => void;
  // This tells TypeScript: "t will always look exactly like the English dictionary"
  t: typeof dictionary["en"];
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Locale>("en");

  useEffect(() => {
    // Load saved language from local storage on mount
    const saved = localStorage.getItem("divorcegpt-lang");
    if (saved && Object.keys(dictionary).includes(saved)) {
      setLangState(saved as Locale);
    }
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang: (l: Locale) => {
          setLangState(l);
          localStorage.setItem("divorcegpt-lang", l);
        },
        // THE FIX: Force TypeScript to trust that all languages match the English structure
        t: (dictionary as any)[lang] as typeof dictionary["en"],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}