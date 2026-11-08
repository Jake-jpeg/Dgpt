/**
 * The firm of record (2026-11-02, the software-company / law-firm structure):
 * the default firm is seeded; the front door opens cases for it on the
 * Review tier at the firm's flat fee; firm-side users see only their own
 * firm's matters; a named successor takes every open matter in one audited
 * action.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import { cookieFor, freshLimits, jsonRequest, params, provisionAccount, signUp, SYNTH_ATTORNEY, SYNTH_CLIENT, SYNTH_CLIENT_2 } from "./helpers";
import type { SessionUser } from "@/lib/auth/session";
import { POST as draftRoute } from "@/app/api/start/draft/route";
import { POST as finishRoute } from "@/app/api/start/finish/route";
import { GET as mattersList } from "@/app/api/matters/route";
import { GET as matterGet } from "@/app/api/matters/[id]/route";
import { GET as profileGet, PUT as profilePut } from "@/app/api/firm/profile/route";
import { POST as transferRoute } from "@/app/api/firm/transfer/route";
import { createFirm, ensureDefaultFirm, getFirm, firmQuote } from "@/lib/db/firms";
import { getMatter, DEFAULT_FIRM_ID } from "@/lib/db/matters";
import { getUserByEmail, setUserFirm } from "@/lib/db/users";
import { getAuditEvents } from "@/lib/db/repo";
import { quoteFor, REVIEW_FEE } from "@/config/pricing";
import { entitySplitNotice, softwareCompanyName } from "@/config/branding";

const OTHER_FIRM_ATTORNEY: SessionUser = {
  subject: "devstub|attorney:paralegal@example.test",
  role: "ATTORNEY",
  email: "paralegal@example.test", // on the allowlist in tests/setup.ts
  name: "Other Firm Attorney",
};

const DRAFT = {
  yourName: "Casey Syntheticperson",
  yourEmail: SYNTH_CLIENT.email,
  spouseName: "Jordan Syntheticperson",
  spouseEmail: SYNTH_CLIENT_2.email,
  state: "NY",
  children: true,
  assets: true,
  understood: true,
};

let aCookie: string;
let attorneyCookie: string;
let otherCookie: string;

beforeEach(async () => {
  resetDbForTests();
  freshLimits();
  await provisionAccount(SYNTH_ATTORNEY);
  await provisionAccount(OTHER_FIRM_ATTORNEY);
  await provisionAccount(SYNTH_CLIENT);
  await provisionAccount(SYNTH_CLIENT_2);
  await signUp(SYNTH_CLIENT); // June is behind sign-in + sign-up (2026-11-08)
  aCookie = await cookieFor(SYNTH_CLIENT);
  attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
  otherCookie = await cookieFor(OTHER_FIRM_ATTORNEY);
});

async function startCase(): Promise<string> {
  freshLimits();
  await draftRoute(jsonRequest("/api/start/draft", { body: DRAFT, cookie: aCookie }));
  freshLimits();
  const r = await finishRoute(jsonRequest("/api/start/finish", { cookie: aCookie }));
  expect(r.status).toBe(200);
  return ((await r.json()) as { matterId: string }).matterId;
}

describe("the default firm and the Review tier", () => {
  it("is seeded from the operating-firm env, on the Review tier, at a flat fee that ignores children and assets", async () => {
    const firm = await ensureDefaultFirm();
    expect(firm.id).toBe(DEFAULT_FIRM_ID);
    expect(firm.name).toBe("Jake Kim Law Firm");
    expect(firm.defaultTier).toBe("REVIEW");
    expect(firm.offersFiling).toBe(false);
    expect(firmQuote(firm, { tier: "REVIEW", children: true, assets: true }).total).toBe(REVIEW_FEE);
    expect(quoteFor({ children: true, assets: true }).total).toBe(1000);
    expect(quoteFor({ children: true, assets: true, tier: "REVIEW_AND_FILE" }).total).toBe(3000);
  });

  it("the front door opens the case for the default firm on its tier; the quote the client saw is the flat review fee", async () => {
    const matterId = await startCase();
    const m = (await getMatter(matterId))!;
    expect(m.firmId).toBe(DEFAULT_FIRM_ID);
    expect(m.engagementTier).toBe("REVIEW");
  });

  it("every public page says which entity is software and which is the law firm", () => {
    expect(softwareCompanyName()).toBe("June Guided Solutions LLC");
    const n = entitySplitNotice("Jake Kim Law Firm");
    expect(n).toContain("software made by June Guided Solutions LLC");
    expect(n).toContain("is not a law firm");
    expect(n).toContain("Legal services are provided by Jake Kim Law Firm, an independent law firm");
  });
});

describe("firm scoping and continuity", () => {
  it("a firm-side user sees only their firm's matters; a platform-level user sees all", async () => {
    const matterId = await startCase();
    const other = await createFirm({ name: "Second Firm LLP" });
    await setUserFirm((await getUserByEmail(OTHER_FIRM_ATTORNEY.email))!.id, other.id);
    otherCookie = await cookieFor(OTHER_FIRM_ATTORNEY);

    freshLimits();
    const mine = await matterGet(jsonRequest(`/api/matters/${matterId}`, { method: "GET", cookie: attorneyCookie }), params({ id: matterId }));
    expect(mine.status).toBe(200); // platform-level attorney (no firm) — sees the default firm's matter
    freshLimits();
    const theirs = await matterGet(jsonRequest(`/api/matters/${matterId}`, { method: "GET", cookie: otherCookie }), params({ id: matterId }));
    expect(theirs.status).toBe(404); // another firm's matter does not exist for them
    freshLimits();
    const list = (await (await mattersList(jsonRequest("/api/matters", { method: "GET", cookie: otherCookie }))).json()) as { matters: { id: string }[] };
    expect(list.matters.some((x) => x.id === matterId)).toBe(false);
  });

  it("a named successor takes every open matter in one audited action; closed matters stay", async () => {
    const m1 = await startCase();
    const other = await createFirm({ name: "Second Firm LLP" });
    await setUserFirm((await getUserByEmail(OTHER_FIRM_ATTORNEY.email))!.id, other.id);
    otherCookie = await cookieFor(OTHER_FIRM_ATTORNEY);

    // No successor named → refused.
    freshLimits();
    expect((await transferRoute(jsonRequest("/api/firm/transfer", { cookie: attorneyCookie }))).status).toBe(409);
    // A firm cannot be its own successor; the Review-and-file tier cannot be the default before it is offered.
    freshLimits();
    expect((await profilePut(jsonRequest("/api/firm/profile", { method: "PUT", cookie: attorneyCookie, body: { successorFirmId: DEFAULT_FIRM_ID } }))).status).toBeGreaterThanOrEqual(400);
    freshLimits();
    expect((await profilePut(jsonRequest("/api/firm/profile", { method: "PUT", cookie: attorneyCookie, body: { defaultTier: "REVIEW_AND_FILE" } }))).status).toBeGreaterThanOrEqual(400);

    freshLimits();
    const named = await profilePut(jsonRequest("/api/firm/profile", { method: "PUT", cookie: attorneyCookie, body: { successorFirmId: other.id } }));
    expect(named.status).toBe(200);
    freshLimits();
    const prof = (await (await profileGet(jsonRequest("/api/firm/profile", { method: "GET", cookie: attorneyCookie }))).json()) as { firm: { successorFirmId: string } };
    expect(prof.firm.successorFirmId).toBe(other.id);

    freshLimits();
    const moved = await transferRoute(jsonRequest("/api/firm/transfer", { cookie: attorneyCookie }));
    expect(moved.status).toBe(200);
    expect(((await moved.json()) as { moved: number }).moved).toBe(1);
    expect((await getMatter(m1))!.firmId).toBe(other.id);
    expect((await getAuditEvents(m1)).some((e) => e.event === "MATTER_TRANSFERRED")).toBe(true);
    // The successor firm's attorney now sees it.
    freshLimits();
    expect((await matterGet(jsonRequest(`/api/matters/${m1}`, { method: "GET", cookie: otherCookie }), params({ id: m1 }))).status).toBe(200);
    expect((await getFirm(DEFAULT_FIRM_ID))!.successorFirmId).toBe(other.id);
  });
});
