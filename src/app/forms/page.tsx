"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RedirectToNY() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const params = searchParams.toString();
    window.location.replace(`/ny/forms${params ? `?${params}` : ""}`);
  }, [searchParams]);
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1a365d] border-t-transparent" />
    </div>
  );
}

export default function FormsRedirect() {
  return <Suspense><RedirectToNY /></Suspense>;
}
