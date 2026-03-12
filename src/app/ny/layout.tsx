import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New York Uncontested Divorce — DivorceGPT",
  description: "Get your New York divorce forms prepared and explained in plain language.",
  alternates: {
    canonical: '/ny',
  },
};

export default function NYLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
