import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DivorceGPT.com | Attorney-Supervised Family-Law Workflow",
  description:
    "A structured, attorney-supervised family-law intake and case-preparation workflow for New York and New Jersey.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "DivorceGPT.com",
    description:
      "Attorney-supervised family-law intake and workflow technology.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
