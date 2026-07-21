/**
 * Pilot-hardening acceptance:
 *  - exact branding (Jake Kim Law Firm; old name gone; no location language)
 *  - stage-aware status copy + landing footer language
 *  - OAuth invariants: provider authenticates, DATABASE authorizes
 *  - wrong-tenant / multi-tenant-authority denial
 *  - invitation-first Google flow (sign-in creates nothing)
 *  - development login is LOCAL-ONLY
 *  - deactivation blocks the next protected request
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { resetDbForTests } from "@/lib/db/index";
import {
  cookieFor,
  provisionAccount,
  setupClientWithMatter,
  jsonRequest,
  params,
  freshLimits,
  SYNTH_CLIENT,
  SYNTH_ATTORNEY,
} from "./helpers";
import type { SessionUser } from "@/lib/auth/session";
import { operatingFirmName, legalServicesProvider, copyrightOwner, softwareOwner } from "@/config/branding";
import { appStage, stageStatusCopy, isLocalStage } from "@/config/stage";
import {
  assertSingleTenant,
  entraStableSubject,
  assertGoogleEmailVerified,
  providerConfig,
  microsoftTenantId,
} from "@/lib/auth/oauth";
import { getUserByEmail, setUserActive, createUser, findAccountForSession } from "@/lib/db/users";
import { testLoginAllowed } from "@/lib/auth/test-login";
import { GET as meGet } from "@/app/api/auth/me/route";
import { POST as devLogin } from "@/app/api/auth/dev-login/route";
import { GET as mattersGet } from "@/app/api/matters/route";
import { GET as matterGet } from "@/app/api/matters/[id]/route";
import { POST as acceptRoute } from "@/app/api/invitations/accept/route";
import { PATCH as userPatch } from "@/app/api/admin/users/[id]/route";

function walkSrc(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSrc(p, out);
    else if (/\.(ts|tsx|css)$/.test(p)) out.push(p);
  }
  return out;
}

beforeEach(() => {
  resetDbForTests();
  freshLimits();
});

afterEach(() => {
  vi.unstubAllEnvs();
  delete process.env.APP_STAGE;
  delete process.env.MICROSOFT_TENANT_ID;
  delete process.env.ENTRA_TENANT_ID;
});

// ── exact branding ────────────────────────────────────────────────────

describe("exact branding", () => {
  it("the exact firm name is the default everywhere it renders", () => {
    expect(operatingFirmName()).toBe("Jake Kim Law Firm");
    expect(legalServicesProvider()).toBe("Jake Kim Law Firm");
    const landing = fs.readFileSync(path.join(__dirname, "..", "src", "app", "page.tsx"), "utf8");
    expect(landing).toContain("legalServicesProvider");
  });

  it('"J. Kim Law Firm" does not remain anywhere in src/', () => {
    const hits = walkSrc(path.join(__dirname, "..", "src")).filter((p) =>
      fs.readFileSync(p, "utf8").includes("J. Kim Law Firm")
    );
    expect(hits).toEqual([]);
  });

  it("no public office-location language or location variable was added", () => {
    const files = walkSrc(path.join(__dirname, "..", "src"));
    const locationHits = files.filter((p) => {
      const c = fs.readFileSync(p, "utf8");
      return c.includes("Fort Lee") || c.includes("OPERATING_FIRM_LOCATION");
    });
    expect(locationHits).toEqual([]);
  });

  it("ownership facts are never invented: software owner is empty until confirmed", () => {
    delete process.env.NEXT_PUBLIC_SOFTWARE_OWNER;
    expect(softwareOwner()).toBe(""); // [OWNER CONFIRMATION REQUIRED] — omit publicly
    expect(copyrightOwner()).toBe("June Guided Solutions, LLC"); // pre-existing statement
    const files = walkSrc(path.join(__dirname, "..", "src"));
    const tokenHits = files.filter((p) =>
      fs.readFileSync(p, "utf8").match(/\[OWNER CONFIRMATION REQUIRED\][^*/]*(<|render|display)/)
    );
    expect(tokenHits).toEqual([]); // marker never travels into markup
  });
});

// ── stage copy ────────────────────────────────────────────────────────

describe("stage-aware status copy", () => {
  it("defaults to local and recognizes the three stages", () => {
    delete process.env.APP_STAGE;
    expect(appStage()).toBe("local");
    process.env.APP_STAGE = "staging";
    expect(appStage()).toBe("staging");
    process.env.APP_STAGE = "closed_pilot";
    expect(appStage()).toBe("closed_pilot");
    process.env.APP_STAGE = "something-weird";
    expect(appStage()).toBe("local"); // unknown ⇒ most restrictive posture
  });

  it("emits the exact stage strings", () => {
    expect(stageStatusCopy("local")).toBe(
      "Local development environment. No real client information may be entered."
    );
    expect(stageStatusCopy("staging")).toBe(
      "Invitation-only test environment. Not available for public use."
    );
    const pilot = stageStatusCopy("closed_pilot");
    expect(pilot).toContain("not available for public self-service");
    expect(pilot).toContain("invited clients of Jake Kim Law Firm");
    expect(pilot).toContain("separate written engagement agreement");
  });

  it("landing footer carries the no-attorney-client-relationship language and the OpenAI statement", () => {
    const landing = fs.readFileSync(path.join(__dirname, "..", "src", "app", "page.tsx"), "utf8");
    expect(landing).toContain("does not\n          create an attorney-client relationship");
    expect(landing).toContain("Portal access does not itself");
    expect(landing).toContain("separate written engagement agreement with");
    expect(landing).toMatch(/not affiliated with,\s*\n?\s*sponsored by, or endorsed by any AI provider/);
    // De-emphasized acquisition + new CTAs.
    expect(landing).toContain("View the workflow");
    expect(landing).not.toMatch(/acquisition/i);
    // No prohibited claims.
    expect(landing).not.toMatch(/ethics approval|carrier|completely secure|guaranteed/i);
  });
});

// ── OAuth invariants ──────────────────────────────────────────────────

describe("OAuth: provider authenticates, database authorizes", () => {
  it("multi-tenant Microsoft authorities are refused", () => {
    for (const bad of ["common", "consumers", "organizations", "", "COMMON"]) {
      expect(() => assertSingleTenant(bad)).toThrow(/single|not permitted|specific/i);
    }
    expect(assertSingleTenant("11111111-2222-3333-4444-555555555555")).toBe(
      "11111111-2222-3333-4444-555555555555"
    );
    process.env.MICROSOFT_TENANT_ID = "tenant-abc";
    expect(microsoftTenantId()).toBe("tenant-abc");
  });

  it("a wrong-tenant id_token is denied; identity binds to tid+oid", () => {
    const tenant = "11111111-2222-3333-4444-555555555555";
    expect(() =>
      entraStableSubject({ tid: "99999999-8888-7777-6666-555555555555", oid: "oid-1" }, tenant)
    ).toThrow(/tenant/);
    expect(() => entraStableSubject({ oid: "oid-1" }, tenant)).toThrow(/tenant/);
    expect(entraStableSubject({ tid: tenant, oid: "oid-1", sub: "sub-x" }, tenant)).toBe(
      `entra|${tenant}:oid-1`
    );
    // oid preferred; sub is the fallback.
    expect(entraStableSubject({ tid: tenant, sub: "sub-x" }, tenant)).toBe(
      `entra|${tenant}:sub-x`
    );
  });

  it("google email_verified=false is refused; only identity scopes are requested", () => {
    expect(() =>
      assertGoogleEmailVerified({ email: "x@example.test", email_verified: false })
    ).toThrow(/verified/);
    expect(() =>
      assertGoogleEmailVerified({ email: "x@example.test", email_verified: true })
    ).not.toThrow();
    expect(providerConfig("google").scope).toBe("openid email profile");
    process.env.MICROSOFT_TENANT_ID = "tenant-abc";
    const entra = providerConfig("entra");
    expect(entra.scope).toBe("openid email profile");
    for (const forbidden of ["Mail.", "Files.", "Calendars.", "Contacts.", "Chat.", "offline_access"]) {
      expect(entra.scope).not.toContain(forbidden);
    }
    expect(entra.issuer).toBe("https://login.microsoftonline.com/tenant-abc/v2.0");
  });

  it("Microsoft sign-in does NOT confer ATTORNEY: no DB account ⇒ denied", async () => {
    // Simulate the post-callback state: a session whose role hint claims
    // ATTORNEY and whose email IS allowlisted — but no app account exists.
    const cookie = await cookieFor({
      subject: "entra|tenant-abc:oid-fresh",
      role: "ATTORNEY",
      email: "attorney@example.test", // allowlisted in tests/setup.ts
      name: "Fresh Entra User",
    });
    freshLimits();
    const res = await mattersGet(jsonRequest("/api/matters", { method: "GET", cookie }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain("not linked to an authorized account");
    expect((await getUserByEmail("attorney@example.test"))).toBeNull(); // nothing created
  });

  it("Google sign-in without a valid invitation is denied and creates nothing", async () => {
    const cookie = await cookieFor({
      subject: "google|fresh-sub-123",
      role: "CLIENT",
      email: "freshclient@example.test",
      name: "Fresh Client",
    });
    const res = await mattersGet(jsonRequest("/api/matters", { method: "GET", cookie }));
    expect(res.status).toBe(403);
    expect((await getUserByEmail("freshclient@example.test"))).toBeNull();

    // /api/auth/me reports identity but no user.
    freshLimits();
    const me = await meGet(jsonRequest("/api/auth/me", { method: "GET", cookie }));
    const body = await me.json();
    expect(body.user).toBeNull();
    expect(body.identity.email).toBe("freshclient@example.test");
  });

  it("an invalid invitation creates NO account (validated before provisioning)", async () => {
    const cookie = await cookieFor({
      subject: "google|fresh-sub-456",
      role: "CLIENT",
      email: "neverclient@example.test",
      name: "Never Client",
    });
    const res = await acceptRoute(
      jsonRequest("/api/invitations/accept", {
        cookie,
        body: { token: "definitely-not-a-real-invitation-token" },
      })
    );
    expect(res.status).toBe(400);
    expect((await getUserByEmail("neverclient@example.test"))).toBeNull();
  });

  it("a valid invitation binds the stable identity and creates the CLIENT account", async () => {
    const ctx = await setupClientWithMatter(); // uses the real accept route
    expect(ctx.matterId).toBeTruthy();
    const account = (await getUserByEmail(SYNTH_CLIENT.email));
    expect(account?.role).toBe("CLIENT");
    expect(account?.subject).toBe(SYNTH_CLIENT.subject);
  });

  it("an email match with a DIFFERENT stable subject is never silently relinked", async () => {
    await setupClientWithMatter(); // binds SYNTH_CLIENT.subject
    const imposter: SessionUser = {
      subject: "google|different-sub-entirely",
      role: "CLIENT",
      email: SYNTH_CLIENT.email, // same email, different identity
      name: "Imposter",
    };
    const cookie = await cookieFor(imposter);
    const res = await mattersGet(jsonRequest("/api/matters", { method: "GET", cookie }));
    expect(res.status).toBe(403); // refused — manual recovery only
  });

  it("admin-authorized relink clears the subject and audits it", async () => {
    const ctx = await setupClientWithMatter();
    const admin: SessionUser = {
      subject: "devstub|admin:relinkadmin@example.test",
      role: "ADMIN",
      email: "relinkadmin@example.test",
      name: "Relink Admin",
    };
    (await provisionAccount(admin));
    freshLimits();
    const res = await userPatch(
      jsonRequest(`/api/admin/users/${ctx.clientUserId}`, {
        method: "PATCH",
        cookie: await cookieFor(admin),
        body: { clearSubject: true },
      }),
      params({ id: ctx.clientUserId })
    );
    expect(res.status).toBe(200);
    const { getUserById } = await import("@/lib/db/users");
    expect((await getUserById(ctx.clientUserId))!.subject).toBeNull();
    const { getAuditEvents } = await import("@/lib/db/repo");
    expect((await getAuditEvents(ctx.clientUserId)).map((e) => e.event)).toContain(
      "USER_RELINK_AUTHORIZED"
    );
  });

  it("deactivating a user blocks the very next protected request", async () => {
    const ctx = await setupClientWithMatter();
    const cookie = await cookieFor(SYNTH_CLIENT);
    freshLimits();
    const before = await matterGet(
      jsonRequest(`/api/matters/${ctx.matterId}`, { method: "GET", cookie }),
      params({ id: ctx.matterId })
    );
    expect(before.status).toBe(200);

    (await setUserActive(ctx.clientUserId, false));
    freshLimits();
    const after = await matterGet(
      jsonRequest(`/api/matters/${ctx.matterId}`, { method: "GET", cookie }),
      params({ id: ctx.matterId })
    );
    expect(after.status).toBe(403);
  });
});

// ── development login is LOCAL-ONLY ───────────────────────────────────

describe("development login shutdown outside local", () => {
  const attempt = () =>
    devLogin(
      jsonRequest("/api/auth/dev-login", {
        body: { role: "CLIENT", email: "stagetester@example.test", name: "Stage Tester" },
      })
    );

  it("works in local development (baseline)", async () => {
    delete process.env.APP_STAGE;
    expect(isLocalStage()).toBe(true);
    expect(testLoginAllowed()).toBe(true);
    expect((await attempt()).status).toBe(200);
  });

  it("APP_STAGE=staging ⇒ neutral 404 even with DEV_AUTH_STUB=true", async () => {
    process.env.APP_STAGE = "staging";
    expect(testLoginAllowed()).toBe(false);
    expect((await attempt()).status).toBe(404);
  });

  it("APP_STAGE=closed_pilot ⇒ neutral 404 even with DEV_AUTH_STUB=true", async () => {
    process.env.APP_STAGE = "closed_pilot";
    expect(testLoginAllowed()).toBe(false);
    expect((await attempt()).status).toBe(404);
  });

  it("NODE_ENV=production ⇒ 404 regardless of every flag", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_AUTH_STUB", "true");
    vi.stubEnv("BETA_TEST_LOGIN", "true");
    vi.stubEnv("FREE_ACCESS_KEYS", "synthetic-key");
    vi.stubEnv("BETA_GATE_ENABLED", "true");
    expect((await attempt()).status).toBe(404);
  });

  it("the UI signal (devStub in /api/auth/me) is off outside local", async () => {
    process.env.APP_STAGE = "closed_pilot";
    const res = await meGet(jsonRequest("/api/auth/me", { method: "GET" }));
    expect((await res.json()).devStub).toBe(false);
  });
});

// ── firm accounts still work end-to-end after the model change ────────

describe("firm accounts (regression)", () => {
  it("a pre-created ATTORNEY account binds by email at first login and works", async () => {
    (await createUser({ email: SYNTH_ATTORNEY.email, role: "ATTORNEY" }));
    const account = (await findAccountForSession({
          subject: SYNTH_ATTORNEY.subject,
          email: SYNTH_ATTORNEY.email,
          adminBootstrapEmails: [],
        }));
    expect(account?.role).toBe("ATTORNEY");
    expect(account?.subject).toBe(SYNTH_ATTORNEY.subject);
    freshLimits();
    const res = await mattersGet(
      jsonRequest("/api/matters", { method: "GET", cookie: await cookieFor(SYNTH_ATTORNEY) })
    );
    expect(res.status).toBe(200);
  });
});
