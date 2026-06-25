import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DivorceGPT — Under Construction",
  description: "DivorceGPT is currently offline.",
  metadataBase: new URL("https://divorcegpt.com"),
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-zinc-50">{children}</body>
    </html>
  );
}
