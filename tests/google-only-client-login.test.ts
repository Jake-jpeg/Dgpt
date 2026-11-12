/**
 * Google is the ONLY client sign-in (2026-11-12). The personal-Microsoft
 * door ("msa" — Outlook.com / Hotmail) was removed: Google requires a phone
 * number to open an account, Microsoft's personal sign-up does not, and the
 * sign-up gate should not be one throwaway mailbox away. The firm's
 * single-tenant Microsoft door (entra) is unrelated and stays.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import { freshLimits, jsonRequest, params } from "./helpers";
import { GET as loginRoute } from "@/app/api/auth/login/[provider]/route";
import { GET as callbackRoute } from "@/app/api/auth/callback/[provider]/route";
import { GET as meRoute } from "@/app/api/auth/me/route";
import { decideLoginDestination } from "@/lib/auth/authorize-login";
import { SIGNUP_COPY, NO_PASSWORD_LINE } from "@/config/signup-copy";
import { HERO, SIGNIN, faqFor } from "@/config/door-copy";

beforeEach(() => {
  resetDbForTests();
  freshLimits();
});

describe("Google-only client sign-in", () => {
  it("the msa login and callback routes no longer exist (404), whatever env is set", async () => {
    process.env.MSA_CLIENT_ID = "leftover-id";
    process.env.MSA_CLIENT_SECRET = "leftover-secret";
    try {
      const login = await loginRoute(jsonRequest("/api/auth/login/msa", { method: "GET" }), params({ provider: "msa" }));
      expect(login.status).toBe(404);
      freshLimits();
      const cb = await callbackRoute(jsonRequest("/api/auth/callback/msa?code=x&state=y", { method: "GET" }), params({ provider: "msa" }));
      expect(cb.status).toBe(404);
    } finally {
      delete process.env.MSA_CLIENT_ID;
      delete process.env.MSA_CLIENT_SECRET;
    }
  });

  it("/api/auth/me advertises google and entra only", async () => {
    const me = (await (await meRoute(jsonRequest("/api/auth/me", { method: "GET" }))).json()) as { providers: Record<string, boolean> };
    expect(Object.keys(me.providers).sort()).toEqual(["entra", "google"]);
  });

  it("a new Google identity goes to /invite; Microsoft stays firm-only", () => {
    expect(decideLoginDestination({ provider: "google", boundAccount: null, attorneyAllowlist: [] })).toBe("/invite");
    expect(() => decideLoginDestination({ provider: "entra", boundAccount: null, attorneyAllowlist: [] })).toThrow(/not linked to an authorized firm account/);
  });

  it("nothing a client reads offers Microsoft, Outlook or Hotmail as a way in", () => {
    const firm = "Firm";
    const corpus = [
      ...(["en", "ko"] as const).flatMap((l) => [
        SIGNUP_COPY[l].lede(firm),
        ...SIGNUP_COPY[l].disclaimers(firm),
        NO_PASSWORD_LINE[l],
        HERO[l].sub(firm),
        ...HERO[l].how.flat(),
        SIGNIN[l].sub,
        SIGNIN[l].lock,
        ...faqFor(firm)[l].items.flatMap((i) => [i.q, i.a]),
      ]),
    ].join("\n");
    expect(corpus).not.toMatch(/Microsoft|Outlook|Hotmail/i);
    expect(corpus).toMatch(/Google/);
  });
});
