import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Texas Divorce — DivorceGPT",
  description: "Get your Texas divorce forms prepared and explained in plain language.",
  alternates: {
    canonical: '/tx',
  },
};

export default function TXLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
