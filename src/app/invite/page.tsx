"use client";

/**
 * Getting-started page (2026-07-26 — invitation links are retired).
 *
 * Clients no longer need a link, a token, or a code: they sign in at the
 * home page with Google or Microsoft, a registration is created on the
 * spot, and the ATTORNEY connects it to their case from the firm portal.
 * This page remains for two reasons: old bookmarked /invite URLs land
 * somewhere helpful, and the callback sends account-conflict sign-ins here
 * with ?e=account_conflict.
 */
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/shell";

const REASON: Record<string, string> = {
  account_conflict:
    "That email address is already linked to a different sign-in method. Please sign in the same way you did the first time, or contact the firm so they can help.",
};

function InviteInner() {
  const params = useSearchParams();
  const errorReason = params.get("e");

  return (
    <Shell title="Getting started">
      <div className="panel">
        {errorReason && REASON[errorReason] && (
          <div className="notice notice-info mb-4">{REASON[errorReason]}</div>
        )}
        <h2>No invitation link needed</h2>
        <p className="panel-sub">
          Getting started takes one step: sign in with the email address the firm
          has for you, using Google or Microsoft (Outlook / Hotmail). That&apos;s
          it — your attorney will connect your case, and your questionnaire will
          be waiting the next time you log in.
        </p>
        <Link href="/portal" className="btn btn-primary">
          Sign in to get started
        </Link>
      </div>
    </Shell>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InviteInner />
    </Suspense>
  );
}
