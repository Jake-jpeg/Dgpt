/** The absolute /join link for an invitation token — APP_URL first, else the request's origin. */
export function joinUrl(req: Request, token: string): string {
  const base = (process.env.APP_URL ?? "").trim().replace(/\/+$/, "") || new URL(req.url).origin;
  return `${base}/join/${encodeURIComponent(token)}`;
}

/** Return-address cookie set by the join page before sign-in; the OAuth callback honours and clears it. */
export const JOIN_RETURN_COOKIE = "dgpt_join_return";

/**
 * 2026-11-08: "Start with June" needs an account first. The /start page sets
 * this before sending the visitor to Google/Microsoft; the callback sends a
 * signed-in client back to /start (or to /signup/details?next=start when
 * they have not left a name and number yet), then clears it.
 */
export const START_RETURN_COOKIE = "dgpt_start_return";
