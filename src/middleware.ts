/**
 * Edge middleware: security headers on every response + coarse page-level
 * gating for /attorney pages. This is convenience only — the REAL enforcement
 * is server-side in every API handler (requireRole) and in the persistence
 * guards; nothing here is trusted as the sole control.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  BETA_COOKIE,
  betaGateEnabled,
  betaGateExempt,
  isValidBetaKey,
} from "@/lib/beta";

const SESSION_COOKIE = "dgpt_session";

function securityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      // challenges.cloudflare.com = Cloudflare Turnstile (beta-gate CAPTCHA)
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "connect-src 'self' https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "form-action 'self' https://accounts.google.com https://login.microsoftonline.com",
      "base-uri 'self'",
    ].join("; ")
  );
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  }
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Beta access gate (active whenever FREE_ACCESS_KEYS is set) ──
  // The cookie stores the access key itself and is re-validated against the
  // env var on EVERY request: removing a key from FREE_ACCESS_KEYS locks its
  // holders out on their next request, regardless of cookie lifetime.
  if (pathname !== "/" && betaGateEnabled() && !betaGateExempt(pathname)) {
    const key = request.cookies.get(BETA_COOKIE)?.value;
    if (!isValidBetaKey(key ? decodeURIComponent(key) : key)) {
      if (pathname.startsWith("/api/")) {
        return securityHeaders(
          new NextResponse(JSON.stringify({ error: "Beta access required" }), {
            status: 403,
            headers: { "content-type": "application/json" },
          }) as NextResponse
        );
      }
      return securityHeaders(NextResponse.redirect(new URL("/beta", request.url)));
    }
  }

  // Coarse gate for attorney PAGES (APIs enforce their own auth fully).
  if (pathname.startsWith("/attorney")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    let ok = false;
    if (token && process.env.SESSION_SECRET) {
      try {
        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(process.env.SESSION_SECRET),
          { issuer: "dgpt2", audience: "dgpt2", algorithms: ["HS256"] }
        );
        ok = payload.role === "ATTORNEY";
      } catch {
        ok = false;
      }
    }
    if (!ok) {
      return securityHeaders(
        NextResponse.redirect(new URL("/?denied=attorney", request.url))
      );
    }
  }

  return securityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
