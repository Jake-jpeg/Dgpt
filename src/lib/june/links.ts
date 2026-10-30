/** The absolute /join link for an invitation token — APP_URL first, else the request's origin. */
export function joinUrl(req: Request, token: string): string {
  const base = (process.env.APP_URL ?? "").trim().replace(/\/+$/, "") || new URL(req.url).origin;
  return `${base}/join/${encodeURIComponent(token)}`;
}

/** Return-address cookie set by the join page before sign-in; the OAuth callback honours and clears it. */
export const JOIN_RETURN_COOKIE = "dgpt_join_return";
