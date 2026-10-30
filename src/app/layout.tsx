import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DivorceGPT.com | Jake Kim Law Firm",
  description:
    "An attorney-reviewed uncontested divorce for New York and New Jersey — set up in three minutes with June, prepared and filed by Jake Kim Law Firm.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "DivorceGPT.com",
    description:
      "Attorney-supervised matrimonial intake and workflow technology.",
    type: "website",
  },
};

// Phone-first (2026-10-30): the two spouses will do this on their phones.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1f39",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
