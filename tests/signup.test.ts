/** Sign-up (2026-11-07): identity + name + phone + acknowledged disclaimers; the firm's list; clear/reject; usage view. 2026-11-08: IPs, ban/unban (ADMIN), no-password notice. */
import { describe, it, expect, beforeEach } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import { cookieFor, freshLimits, jsonRequest, provisionAccount, SYNTH_ATTORNEY, SYNTH_CLIENT, SYNTH_CLIENT_2 } from "./helpers";
import { GET as signupGet, POST as signupPost } from "@/app/api/signup/route";
import { GET as signupsGet, PUT as signupsPut } from "@/app/api/firm/signups/route";
import { GET as usageGet } from "@/app/api/admin/usage/route";
import { SIGNUP_DISCLAIMER_VERSION, normalizeUsPhone } from "@/config/signup-copy";
import { getUserByEmail } from "@/lib/db/users";
import { getAuditEvents } from "@/lib/db/repo";
import { logGuideOutput } from "@/lib/guide/log";

let aCookie: string;
let attorneyCookie: string;

beforeEach(async () => {
  resetDbForTests();
  freshLimits();
  await provisionAccount(SYNTH_ATTORNEY);
  await provisionAccount(SYNTH_CLIENT);
  await provisionAccount(SYNTH_CLIENT_2);
  aCookie = await cookieFor(SYNTH_CLIENT);
  attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
});

describe("sign-up", () => {
  it("normalizes US phone numbers and rejects what isn't one", () => {
    expect(normalizeUsPhone("(201) 555-0123")).toEqual({ digits: "2015550123", display: "(201) 555-0123" });
    expect(normalizeUsPhone("+1 201 555 0123")?.digits).toBe("2015550123");
    // Any format, no exchange rule (2026-11-08: "(201) 123-1234", "201-123-1234", "2011231234" all pass).
    expect(normalizeUsPhone("(201) 123-1234")?.digits).toBe("2011231234");
    expect(normalizeUsPhone("201-123-1234")?.digits).toBe("2011231234");
    expect(normalizeUsPhone("201.123.1234")?.digits).toBe("2011231234");
    expect(normalizeUsPhone("2011231234")).toEqual({ digits: "2011231234", display: "(201) 123-1234" });
    expect(normalizeUsPhone("12345")).toBeNull();
    expect(normalizeUsPhone("011-82-10-1234-5678")).toBeNull();
  });

  it("a signed-in client gives name + phone + acknowledges the CURRENT disclaimers; it is audited; the firm sees name and number", async () => {
    const anon = (await (await signupGet(jsonRequest("/api/signup", { method: "GET" }))).json()) as { signedIn: boolean };
    expect(anon.signedIn).toBe(false);
    // Stale disclaimer version → refused.
    freshLimits();
    const stale = await signupPost(jsonRequest("/api/signup", { cookie: aCookie, body: { fullName: "Casey Syntheticperson", phone: "2015550123", acknowledgedVersion: "2000-01-01.0" } }));
    expect(stale.status).toBe(400);
    freshLimits();
    const bad = await signupPost(jsonRequest("/api/signup", { cookie: aCookie, body: { fullName: "Casey Syntheticperson", phone: "12", acknowledgedVersion: SIGNUP_DISCLAIMER_VERSION } }));
    expect(bad.status).toBe(400);
    freshLimits();
    const ok = await signupPost(jsonRequest("/api/signup", { cookie: aCookie, body: { fullName: "Casey Syntheticperson", phone: "201-555-0123", acknowledgedVersion: SIGNUP_DISCLAIMER_VERSION } }));
    expect(ok.status).toBe(200);
    const uid = (await getUserByEmail(SYNTH_CLIENT.email))!.id;
    expect((await getAuditEvents("auth")).some((e) => e.event === "SIGNUP_COMPLETED")).toBe(true);
    freshLimits();
    const mine = (await (await signupGet(jsonRequest("/api/signup", { method: "GET", cookie: aCookie }))).json()) as { signup: { status: string; phoneDisplay: string } };
    expect(mine.signup.status).toBe("NEW");
    expect(mine.signup.phoneDisplay).toBe("(201) 555-0123");

    // A client cannot see the list; the attorney sees name and number.
    freshLimits();
    expect((await signupsGet(jsonRequest("/api/firm/signups", { method: "GET", cookie: aCookie }))).status).toBe(403);
    freshLimits();
    const list = (await (await signupsGet(jsonRequest("/api/firm/signups", { method: "GET", cookie: attorneyCookie }))).json()) as { signups: { userId: string; fullName: string; phone: string; status: string }[] };
    expect(list.signups).toHaveLength(1);
    expect(list.signups[0]).toMatchObject({ userId: uid, fullName: "Casey Syntheticperson", phone: "(201) 555-0123", status: "NEW" });

    // Reject after the conflict check → audited, visible to the reader as rejected.
    freshLimits();
    const rej = await signupsPut(jsonRequest("/api/firm/signups", { method: "PUT", cookie: attorneyCookie, body: { userId: uid, status: "REJECTED", notes: "conflict" } }));
    expect(rej.status).toBe(200);
    expect((await getAuditEvents("auth")).some((e) => e.event === "SIGNUP_REJECTED")).toBe(true);
    freshLimits();
    const after = (await (await signupGet(jsonRequest("/api/signup", { method: "GET", cookie: aCookie }))).json()) as { signup: { status: string } };
    expect(after.signup.status).toBe("REJECTED");
  });

  it("the usage view is ADMIN-only and sums tokens per reader", async () => {
    const uid = (await getUserByEmail(SYNTH_CLIENT.email))!.id;
    await logGuideOutput({ article: "x", label: "PERMITTED_1", decidedBy: "MODEL", lang: "en", output: "a", userId: uid, model: "m", tokensIn: 100, tokensOut: 20, latencyMs: 5 });
    await logGuideOutput({ article: "x", label: "PERMITTED_2", decidedBy: "MODEL", lang: "en", output: "b", userId: uid, model: "m", tokensIn: 50, tokensOut: 10, latencyMs: 5 });
    freshLimits();
    expect((await usageGet(jsonRequest("/api/admin/usage", { method: "GET", cookie: attorneyCookie }))).status).toBe(403);
    const { getDb } = await import("@/lib/db/index");
    await getDb().run(`UPDATE app_user SET role = 'ADMIN' WHERE email = ?`, SYNTH_CLIENT_2.email);
    const adminCookie = await cookieFor({ ...SYNTH_CLIENT_2, role: "ADMIN" });
    freshLimits();
    const res = await usageGet(jsonRequest("/api/admin/usage", { method: "GET", cookie: adminCookie }));
    expect(res.status).toBe(200);
    const u = (await res.json()) as { totals: { turns: number; tokensIn: number; tokensOut: number }; readers: { userId: string; turns: number; tokensIn: number }[] };
    expect(u.totals).toMatchObject({ turns: 2, tokensIn: 150, tokensOut: 30 });
    expect(u.readers.find((r) => r.userId === uid)).toMatchObject({ turns: 2, tokensIn: 150 });
  });

  it("THE ADMIN PORTAL (2026-11-08): sign-up and sign-in IPs are recorded and shown to ADMIN only; ADMIN can BAN — the account is refused on its very next request — and UNBAN; an attorney cannot ban", async () => {
    const { getDb } = await import("@/lib/db/index");
    const { recordLogin, getUserById } = await import("@/lib/db/users");
    const { requireUser } = await import("@/lib/auth/authz");
    const uid = (await getUserByEmail(SYNTH_CLIENT.email))!.id;

    // Sign-up records the address the proxy reports.
    freshLimits();
    const ok = await signupPost(jsonRequest("/api/signup", { cookie: aCookie, headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" }, body: { fullName: "Casey Syntheticperson", phone: "2011231234", acknowledgedVersion: SIGNUP_DISCLAIMER_VERSION } }));
    expect(ok.status).toBe(200);
    await recordLogin(uid, "198.51.100.9"); // what the login callback stamps

    // The attorney's list carries no addresses; the admin's does.
    freshLimits();
    const forAttorney = (await (await signupsGet(jsonRequest("/api/firm/signups", { method: "GET", cookie: attorneyCookie }))).json()) as { admin: boolean; signups: Record<string, unknown>[] };
    expect(forAttorney.admin).toBe(false);
    expect(forAttorney.signups[0]).not.toHaveProperty("signupIp");
    expect(forAttorney.signups[0]).not.toHaveProperty("lastLoginIp");
    expect(forAttorney.signups[0]).toMatchObject({ banned: false });

    await getDb().run(`UPDATE app_user SET role = 'ADMIN' WHERE email = ?`, SYNTH_CLIENT_2.email);
    const adminCookie = await cookieFor({ ...SYNTH_CLIENT_2, role: "ADMIN" });
    freshLimits();
    const forAdmin = (await (await signupsGet(jsonRequest("/api/firm/signups", { method: "GET", cookie: adminCookie }))).json()) as { admin: boolean; signups: Record<string, unknown>[] };
    expect(forAdmin.admin).toBe(true);
    expect(forAdmin.signups[0]).toMatchObject({ signupIp: "203.0.113.7", lastLoginIp: "198.51.100.9", banned: false });

    // An attorney may not ban.
    freshLimits();
    expect((await signupsPut(jsonRequest("/api/firm/signups", { method: "PUT", cookie: attorneyCookie, body: { userId: uid, action: "BAN", reason: "x" } }))).status).toBe(403);

    // The admin bans → active=0 with a reason; the next request on the open session is refused; audited.
    freshLimits();
    const ban = await signupsPut(jsonRequest("/api/firm/signups", { method: "PUT", cookie: adminCookie, body: { userId: uid, action: "BAN", reason: "abuse of the guide" } }));
    expect(ban.status).toBe(200);
    const banned = (await getUserById(uid))!;
    expect(banned.active).toBe(false);
    expect(banned.banReason).toBe("abuse of the guide");
    expect(banned.bannedAt).not.toBeNull();
    await expect(requireUser(jsonRequest("/api/signup", { method: "GET", cookie: aCookie }), ["CLIENT"])).rejects.toThrow(/suspended/);
    freshLimits();
    expect((await signupPost(jsonRequest("/api/signup", { cookie: aCookie, body: { fullName: "Casey Syntheticperson", phone: "2011231234", acknowledgedVersion: SIGNUP_DISCLAIMER_VERSION } }))).status).toBe(403);
    expect((await getAuditEvents("auth")).some((e) => e.event === "ACCOUNT_BANNED")).toBe(true);
    freshLimits();
    const listed = (await (await signupsGet(jsonRequest("/api/firm/signups", { method: "GET", cookie: adminCookie }))).json()) as { signups: Record<string, unknown>[] };
    expect(listed.signups[0]).toMatchObject({ banned: true, banReason: "abuse of the guide" });

    // Nobody bans themselves; firm accounts are not bannable here.
    freshLimits();
    const adminId = (await getUserByEmail(SYNTH_CLIENT_2.email))!.id;
    expect((await signupsPut(jsonRequest("/api/firm/signups", { method: "PUT", cookie: adminCookie, body: { userId: adminId, action: "BAN" } }))).status).toBe(400);
    freshLimits();
    const attorneyId = (await getUserByEmail(SYNTH_ATTORNEY.email))!.id;
    expect((await signupsPut(jsonRequest("/api/firm/signups", { method: "PUT", cookie: adminCookie, body: { userId: attorneyId, action: "BAN" } }))).status).toBe(400);

    // Unban restores the account.
    freshLimits();
    expect((await signupsPut(jsonRequest("/api/firm/signups", { method: "PUT", cookie: adminCookie, body: { userId: uid, action: "UNBAN" } }))).status).toBe(200);
    const restored = (await getUserById(uid))!;
    expect(restored.active).toBe(true);
    expect(restored.bannedAt).toBeNull();
    freshLimits();
    expect((await signupGet(jsonRequest("/api/signup", { method: "GET", cookie: aCookie }))).status).toBe(200);
  });

  it("the no-password notice and the IP notice are in the acknowledged disclaimers, and the version was bumped for them", async () => {
    const { SIGNUP_COPY, NO_PASSWORD_LINE } = await import("@/config/signup-copy");
    expect(SIGNUP_DISCLAIMER_VERSION >= "2026-11-08.1").toBe(true);
    for (const lang of ["en", "ko"] as const) {
      const text = SIGNUP_COPY[lang].disclaimers("Firm").join(" ");
      expect(text).toMatch(lang === "en" ? /never see or store/ : /비밀번호/);
      expect(text).toMatch(lang === "en" ? /IP\) address/ : /IP\) 주소/);
      expect(NO_PASSWORD_LINE[lang].length).toBeGreaterThan(20);
    }
  });

  it("ACCOUNTS (2026-11-12): the admin's list has every client account, signed up or not; the attorney's has only sign-ups", async () => {
    const { getDb } = await import("@/lib/db/index");
    const { createUser } = await import("@/lib/db/users");
    // SYNTH_CLIENT signs up; a third client only ever signed in.
    freshLimits();
    await signupPost(jsonRequest("/api/signup", { cookie: aCookie, body: { fullName: "Casey Syntheticperson", phone: "2011231234", acknowledgedVersion: SIGNUP_DISCLAIMER_VERSION } }));
    await createUser({ email: "lurker@example.test", role: "CLIENT", name: "Lurker Syntheticperson" });
    await getDb().run(`UPDATE app_user SET role = 'ADMIN' WHERE email = ?`, SYNTH_CLIENT_2.email);
    const adminCookie = await cookieFor({ ...SYNTH_CLIENT_2, role: "ADMIN" });

    freshLimits();
    const admin = (await (await signupsGet(jsonRequest("/api/firm/signups", { method: "GET", cookie: adminCookie }))).json()) as { signups: { email: string; signedUp: boolean; status: string; fullName: string }[] };
    const lurker = admin.signups.find((r) => r.email === "lurker@example.test");
    expect(lurker).toMatchObject({ signedUp: false, status: "NONE", fullName: "Lurker Syntheticperson" });
    expect(admin.signups.find((r) => r.email === SYNTH_CLIENT.email)).toMatchObject({ signedUp: true, status: "NEW" });
    expect(admin.signups.some((r) => r.email === SYNTH_ATTORNEY.email)).toBe(false); // firm accounts are not listed here

    freshLimits();
    const atty = (await (await signupsGet(jsonRequest("/api/firm/signups", { method: "GET", cookie: attorneyCookie }))).json()) as { signups: { email: string }[] };
    expect(atty.signups.map((r) => r.email)).toEqual([SYNTH_CLIENT.email]);
  });
});
