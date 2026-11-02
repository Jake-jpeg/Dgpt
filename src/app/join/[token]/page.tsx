"use client";

/**
 * /join/<token> — the second spouse's door (2026-10-30).
 *
 * The link in the URL is the invitation. Not signed in → a return-address
 * cookie is set and they sign in; the callback brings them back here. Signed
 * in → one tap seats them (email-bound, single-use) and opens their own
 * questionnaire. Nothing about the other spouse or the case is shown before
 * they are seated — only the firm's name and which address the link is for.
 */
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shell, useMe, ErrorNotice } from "@/components/shell";
import { api } from "@/lib/ui/client-api";
import { useLang, LangToggle } from "@/lib/ui/lang";
import { SPOUSE_NOTICE, SPOUSE_NOTICE_VERSION } from "@/config/door-copy";

interface Preview {
  state: "OPEN" | "EXPIRED" | "USED" | "REVOKED" | "UNKNOWN";
  firm: string;
  invitedEmailMasked: string | null;
}

export default function JoinPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const { me, loading } = useMe();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [lang, setLang] = useLang();
  const notice = SPOUSE_NOTICE[lang];

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setPreview((await api.get(`/api/join/${encodeURIComponent(token)}`)) as unknown as Preview);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not read this link");
      }
    })();
  }, [token]);

  function signIn(provider: "google" | "msa") {
    // Return address for the OAuth callback; the token stays in this URL
    // regardless, so if the cookie is lost the spouse just opens the link again.
    document.cookie = `dgpt_join_return=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=900`;
    window.location.href = `/api/auth/login/${provider}`;
  }

  async function accept() {
    setBusy(true);
    setErr(null);
    try {
      // The server refuses the seat without the acknowledgment (RPC 4.3 notice).
      await api.post(`/api/join/${encodeURIComponent(token)}`, { acknowledgedNotice: SPOUSE_NOTICE_VERSION });
      router.replace("/portal/matter");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not join");
    } finally {
      setBusy(false);
    }
  }

  const signedInClient = me?.user?.role === "CLIENT";
  const firm = preview?.firm ?? "the firm";

  return (
    <Shell>
      <div className="june">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">You&apos;ve been invited</h1>
        <p className="panel-sub">DivorceGPT is software; the law firm is {firm}, an independent firm.</p>
        <ErrorNotice message={err} />

        {preview && preview.state !== "OPEN" && (
          <div className="panel">
            <h2>This link can&apos;t be used</h2>
            <p className="panel-sub">
              {preview.state === "USED" && "It was already used. If that was you, just sign in."}
              {preview.state === "EXPIRED" && "It has expired. Ask your spouse to send a new one from their case page."}
              {preview.state === "REVOKED" && "It was cancelled and replaced. Ask your spouse for the newer link."}
              {preview.state === "UNKNOWN" && "It isn't a link we recognise. Check that you copied the whole address."}
            </p>
            {preview.state === "USED" && (
              <button className="btn btn-primary" onClick={() => router.push("/portal")}>Sign in</button>
            )}
          </div>
        )}

        {preview?.state === "OPEN" && (
          <div className="panel">
            <h2>Your spouse has started an uncontested divorce with {firm}</h2>
            <p className="panel-sub">
              {firm} represents your spouse. You are asked only to confirm the terms of your agreement, in your own
              words and without seeing your spouse&apos;s answers, and to provide the information the court papers
              need about you — nothing more. The attorney compares the two of you before anything is drafted and
              meets you both by video. This link is for <strong>{preview.invitedEmailMasked}</strong>; sign in with
              that address.
            </p>
            <p className="panel-sub">
              You are free to have your own attorney review the agreement before you sign anything.
            </p>
            {!loading && !signedInClient && (
              <div className="june-signin">
                {me?.providers.google && (
                  <button className="btn btn-primary" onClick={() => signIn("google")}>Sign in with Google</button>
                )}
                {me?.providers.msa && (
                  <button className="btn btn-primary" onClick={() => signIn("msa")}>Sign in with Outlook / Hotmail</button>
                )}
                {me?.user && me.user.role !== "CLIENT" && (
                  <p className="text-sm text-slate-600">You are signed in to a firm account. Sign out and use a personal account.</p>
                )}
              </div>
            )}
            {signedInClient && (
              <div className="june-signin">
                <p className="text-sm">Signed in as <strong>{me!.user!.email}</strong>.</p>
                {/* Second-spouse notice (operator, 2026-10-30). Shown at the
                    first sign-in, must be acknowledged before the seat; the
                    server stores the time and the wording version. */}
                <div className="spouse-notice" role="region" aria-labelledby="spouse-notice-title">
                  <div className="flex items-start justify-between gap-3">
                    <h3 id="spouse-notice-title">{notice.title}</h3>
                    <LangToggle lang={lang} onChange={setLang} />
                  </div>
                  <p>{notice.body(firm)}</p>
                  <label>
                    <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
                    <span>{notice.ack}</span>
                  </label>
                </div>
                <button className="btn btn-primary" disabled={busy || !acknowledged} onClick={accept}>
                  {busy ? "…" : notice.cta}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
