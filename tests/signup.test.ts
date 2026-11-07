/** Sign-up (2026-11-07): identity + name + phone + acknowledged disclaimers; the firm's list; clear/reject; usage view. */
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
});
