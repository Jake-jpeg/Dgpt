import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — DivorceGPT",
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
