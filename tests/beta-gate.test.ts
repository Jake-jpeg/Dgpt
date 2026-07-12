/**
 * Beta access gate: whole-site gating via middleware, unlock endpoint
 * hardened like a login, instant revocation by removing a key from
 * FREE_ACCESS_KEYS (the cookie stores the key and is re-checked every
 * request).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as unlockRoute } from "@/app/api/beta/unlock/route";
import { GET as configRoute } from "@/app/api/beta/config/route";
import { proxy as middleware } from "@/proxy";
import { betaGateEnabled, isValidBetaKey, betaGateExempt, BETA_COOKIE } from "@/lib/beta";
import { assertCriticalCopyReady } from "@/lib/config-guard";
import { jsonRequest, freshLimits } from "./helpers";

const KEYS = "synthetic-beta-key-1,synthetic-beta-key-2";

beforeEach(() => {
  freshLimits();
  // 2.0: the gate is LEGACY — it requires the explicit enable flag AND keys.
  process.env.BETA_GATE_ENABLED = "true";
  process.env.FREE_ACCESS_KEYS = KEYS;
});

afterEach(() => {
  process.env.BETA_GATE_ENABLED = "false";
  process.env.FREE_ACCESS_KEYS = "";
  vi.unstubAllEnvs();
});

function pageReq(path: string, cookie?: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

describe("gate configuration", () => {
  it("gate is active only with BETA_GATE_ENABLED=true AND keys (legacy, off by default)", () => {
    expect(betaGateEnabled()).toBe(true);
    process.env.FREE_ACCESS_KEYS = "  ";
    expect(betaGateEnabled()).toBe(false); // flag alone is not enough
    process.env.FREE_ACCESS_KEYS = KEYS;
    process.env.BETA_GATE_ENABLED = "false";
    expect(betaGateEnabled()).toBe(false); // keys alone are not enough either
    delete process.env.BETA_GATE_ENABLED;
    expect(betaGateEnabled()).toBe(false); // default: gate is NOT the entry point
  });

  it("keys are comma-separated and individually revocable", () => {
    expect(isValidBetaKey("synthetic-beta-key-1")).toBe(true);
    expect(isValidBetaKey("synthetic-beta-key-2")).toBe(true);
    // Revoke key 1 from the env → instantly invalid; key 2 still works.
    process.env.FREE_ACCESS_KEYS = "synthetic-beta-key-2";
    expect(isValidBetaKey("synthetic-beta-key-1")).toBe(false);
    expect(isValidBetaKey("synthetic-beta-key-2")).toBe(true);
  });

  it("config endpoint never leaks keys or the turnstile secret", async () => {
    vi.stubEnv("TURNSTILE_SITE_KEY", "site-key-public");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-key-never-leak");
    const res = await configRoute();
    const body = JSON.stringify(await res.json());
    expect(body).not.toContain("synthetic-beta-key");
    expect(body).not.toContain("secret-key-never-leak");
    expect(body).toContain("site-key-public"); // site key is public by design
  });
});

describe("middleware enforcement (whole site)", () => {
  it("gated pages without the cookie redirect to /beta (landing page stays public)", async () => {
    for (const path of ["/intake", "/attorney"]) {
      const res = await middleware(pageReq(path));
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.headers.get("location")).toContain("/beta");
    }
    const landing = await middleware(pageReq("/"));
    expect(landing.status).toBe(200); // informational landing is ungated
  });

  it("API calls without the cookie get 403, not a redirect", async () => {
    const res = await middleware(pageReq("/api/intake/start"));
    expect(res.status).toBe(403);
  });

  it("a valid key cookie passes the gate", async () => {
    const res = await middleware(pageReq("/", `${BETA_COOKIE}=synthetic-beta-key-1`));
    expect(res.headers.get("location")).toBeNull();
    expect(res.status).toBe(200);
  });

  it("REVOCATION: nuking the key from the env locks holders out on the next request", async () => {
    const cookie = `${BETA_COOKIE}=synthetic-beta-key-1`;
    const before = await middleware(pageReq("/intake", cookie));
    expect(before.headers.get("location")).toBeNull();
    process.env.FREE_ACCESS_KEYS = "synthetic-beta-key-2"; // key 1 nuked
    const after = await middleware(pageReq("/intake", cookie));
    expect(after.headers.get("location")).toContain("/beta");
  });

  it("exempt paths: /beta, /api/beta/*, and the bearer-authed purge cron", () => {
    expect(betaGateExempt("/beta")).toBe(true);
    expect(betaGateExempt("/api/beta/unlock")).toBe(true);
    expect(betaGateExempt("/api/admin/purge")).toBe(true);
    expect(betaGateExempt("/")).toBe(false);
    expect(betaGateExempt("/intake")).toBe(false);
    expect(betaGateExempt("/api/intake/start")).toBe(false);
  });

  it("gate off (no keys) → site is open as before", async () => {
    process.env.FREE_ACCESS_KEYS = "";
    const res = await middleware(pageReq("/intake"));
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("unlock endpoint", () => {
  it("valid code sets the key cookie", async () => {
    const res = await unlockRoute(
      jsonRequest("/api/beta/unlock", { body: { code: "synthetic-beta-key-1" } })
    );
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie")!;
    expect(cookie).toContain(`${BETA_COOKIE}=synthetic-beta-key-1`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Max-Age=31536000"); // perpetual; revocation is via env
  });

  it("wrong code → 403, no cookie", async () => {
    const res = await unlockRoute(
      jsonRequest("/api/beta/unlock", { body: { code: "wrong-code" } })
    );
    expect(res.status).toBe(403);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("missing CSRF header → 403", async () => {
    const req = new Request("http://localhost:3000/api/beta/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: "synthetic-beta-key-1" }),
    });
    const res = await unlockRoute(req);
    expect(res.status).toBe(403);
  });

  it("gate disabled → endpoint is a 404", async () => {
    process.env.FREE_ACCESS_KEYS = "";
    const res = await unlockRoute(
      jsonRequest("/api/beta/unlock", { body: { code: "anything" } })
    );
    expect(res.status).toBe(404);
  });

  it("brute-force attempts trip the strict rate limit", async () => {
    let limited = false;
    for (let i = 0; i < 10; i++) {
      const res = await unlockRoute(
        jsonRequest("/api/beta/unlock", { body: { code: `guess-${i}` } })
      );
      if (res.status === 429) {
        limited = true;
        break;
      }
    }
    expect(limited).toBe(true);
  });

  it("when Turnstile is configured, a missing captcha token is rejected before the code is checked", async () => {
    vi.stubEnv("TURNSTILE_SITE_KEY", "x");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "y");
    const res = await unlockRoute(
      jsonRequest("/api/beta/unlock", { body: { code: "synthetic-beta-key-1" } })
    );
    expect(res.status).toBe(400);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("beta test login (production, closed testing only)", () => {
  const devLogin = async (cookie?: string) => {
    const { POST } = await import("@/app/api/auth/dev-login/route");
    freshLimits();
    return POST(
      jsonRequest("/api/auth/dev-login", {
        body: { role: "CLIENT", email: "betatester@example.test", name: "Beta Tester" },
        cookie,
      })
    );
  };

  it("is fully retired: production NEVER exposes a test sign-in, whatever the flags", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_AUTH_STUB", "false");

    // Flag off → 404 even with gate + cookie.
    vi.stubEnv("BETA_TEST_LOGIN", "false");
    expect((await devLogin(`${BETA_COOKIE}=synthetic-beta-key-1`)).status).toBe(404);

    // Pilot hardening: even the old triple-lock combination (flag on + gate
    // up + valid beta cookie) is DEAD in production.
    vi.stubEnv("BETA_TEST_LOGIN", "true");
    expect((await devLogin()).status).toBe(404);
    expect((await devLogin(`${BETA_COOKIE}=revoked-key`)).status).toBe(404);
    expect((await devLogin(`${BETA_COOKIE}=synthetic-beta-key-1`)).status).toBe(404);
  });

  it("production with the gate OFF never exposes test login, regardless of flags", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_AUTH_STUB", "true"); // even trying to force the dev stub
    vi.stubEnv("BETA_TEST_LOGIN", "true");
    process.env.FREE_ACCESS_KEYS = ""; // gate down = public site
    expect((await devLogin(`${BETA_COOKIE}=synthetic-beta-key-1`)).status).toBe(404);
  });
});

describe("DV ship-blocker interplay", () => {
  it("beta-gated production boots (warn only) — closed testing is not shipping", () => {
    vi.stubEnv("NODE_ENV", "production");
    // FREE_ACCESS_KEYS is set in beforeEach → gate on → warn, no throw.
    expect(() => assertCriticalCopyReady()).not.toThrow();
  });

  it("PUBLIC production (gate off) still refuses to boot with the unfilled DV card", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.FREE_ACCESS_KEYS = "";
    expect(() => assertCriticalCopyReady()).toThrowError(/SHIP_BLOCKER/);
  });
});
