import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nevada Divorce — DivorceGPT",
  description: "Get your Nevada divorce forms prepared and explained in plain language.",
  alternates: {
    canonical: '/nv',
  },
};

export default function NVLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
