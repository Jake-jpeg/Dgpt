import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Jersey Divorce — DivorceGPT",
  description: "Get your New Jersey divorce forms prepared and explained in plain language.",
  alternates: {
    canonical: '/nj',
    languages: { 'en-US': '/nj', 'ko-KR': '/ko/nj', 'x-default': '/nj' },
  },
};

export default function NJLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
