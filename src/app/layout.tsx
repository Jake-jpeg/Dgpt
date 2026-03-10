import type { Metadata, Viewport } from "next";
// 1. This imports your Tailwind styles so the site looks good
import "./globals.css"; 
// 2. This imports the engine we just built
import { LanguageProvider } from "../components/LanguageProvider"; 

export const metadata: Metadata = {
  title: "DivorceGPT by June Guided Solutions, LLC",
  description: "Get your New York divorce forms prepared and explained in plain language.",
};

export const viewport: Viewport = {
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
        {/* 3. We wrap the whole app here so every page can access the dictionary */}
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}