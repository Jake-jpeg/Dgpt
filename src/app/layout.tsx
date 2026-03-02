import type { Metadata } from "next";
// 1. This imports your Tailwind styles so the site looks good
import "./globals.css"; 
// 2. This imports the engine we just built
import { LanguageProvider } from "../components/LanguageProvider"; 

export const metadata: Metadata = {
  title: "DivorceGPT by June Guided Solutions, LLC",
  description: "Get your New York divorce forms prepared and explained in plain language.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-zinc-50">
        {/* 3. We wrap the whole app here so every page can access the dictionary */}
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}