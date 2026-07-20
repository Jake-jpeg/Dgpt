import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DivorceGPT.com | Attorney-Supervised Matrimonial Workflow",
  description:
    "A structured, attorney-supervised matrimonial intake and case-preparation workflow for New York.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "DivorceGPT.com",
    description:
      "Attorney-supervised matrimonial intake and workflow technology.",
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
