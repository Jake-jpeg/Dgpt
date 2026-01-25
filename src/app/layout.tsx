import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DivorceGPT - New York Uncontested Divorce Made Simple",
  description: "Get your New York divorce forms prepared and explained in plain language. No lawyers needed for simple, uncontested cases.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
