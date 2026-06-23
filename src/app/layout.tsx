import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { LanguageProvider } from "../components/LanguageProvider";

export const metadata: Metadata = {
  title: "DivorceGPT by June Guided Solutions, LLC",
  description: "AI-powered divorce form preparation — plain language, no lawyer needed. Korean & English.",
  metadataBase: new URL("https://divorcegpt.com"),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "ko-KR": "/ko",
      "x-default": "/",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Set <html lang> per locale so Korean pages serve lang="ko" to crawlers
  // and browsers (your curated Korean wins over Chrome auto-translate).
  const h = await headers();
  const path = h.get("x-url-path") || "";
  const lang = path === "/ko" || path.startsWith("/ko/") ? "ko" : "en";

  return (
    <html lang={lang}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-18006427996"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18006427996');
            `,
          }}
        />
      </head>
      <body className="antialiased bg-zinc-50">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
