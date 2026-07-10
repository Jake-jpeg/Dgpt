/**
 * CSRF protection for cookie-authenticated, state-changing endpoints.
 * Defense in depth on top of SameSite=Lax cookies:
 *   1. Custom header requirement (x-dgpt-csrf) — cross-site HTML forms
 *      cannot set custom headers.
 *   2. Origin check against APP_URL when an Origin header is present.
 */
import { appUrl } from "@/lib/env";
import { HttpError } from "@/lib/auth/rbac";

export function assertCsrf(req: Request): void {
  if (req.headers.get("x-dgpt-csrf") !== "1") {
    throw new HttpError(403, "Missing CSRF header");
  }
  const origin = req.headers.get("origin");
  if (origin && origin !== appUrl()) {
    throw new HttpError(403, "Cross-origin request rejected");
  }
}
