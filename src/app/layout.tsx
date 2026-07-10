import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DivorceGPT — Intake",
  description:
    "Structured intake for uncontested New Jersey divorces. Not legal advice.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
