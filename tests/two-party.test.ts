/**
 * The two-spouse model (2026-10-30) — route level.
 *
 * June parks a draft → the starting spouse signs in and creates the case →
 * the other spouse joins through a single-use, email-bound link → each
 * answers separately and can never read the other's answers → when both
 * are done the firm gets the meeting-of-the-minds report.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import {
  cookieFor,
  provisionAccount,
  jsonRequest,
  params,
  freshLimits,
  SYNTH_ATTORNEY,
  SYNTH_CLIENT,
  SYNTH_CLIENT_2,
} from "./helpers";
import { POST as draftRoute } from "@/app/api/start/draft/route";
import { GET as pendingRoute } from "@/app/api/start/pending/route";
import { POST as finishRoute } from "@/app/api/start/finish/route";
import { GET as joinPreview, POST as joinAccept } from "@/app/api/join/[token]/route";
import { GET as partiesGet, POST as partiesReissue } from "@/app/api/matters/[id]/parties/route";
import { GET as intake2Get, PUT as intake2Put } from "@/app/api/matters/[id]/intake2/route";
import { getMatterAnswers } from "@/lib/db/intake2";
import { listParties, setPartyStatus } from "@/lib/db/parties";
import { getMatter } from "@/lib/db/matters";
import { listSessionsByMatter } from "@/lib/db/repo";
import { quoteFor } from "@/config/pricing";
import { compareParties } from "@/lib/compare";
import { getSchemaForCategory } from "@/config/intake/schemas";
import { UNCONTESTED_CATEGORY } from "@/config/intake/phases";
import type { SessionUser } from "@/lib/auth/session";

const SPOUSE_B_EMAIL = "otherclient@example.test"; // = SYNTH_CLIENT_2
const STRANGER: SessionUser = { subject: "devstub|client:stranger@example.test", role: "CLIENT", email: "stranger@example.test", name: "Stranger" };

const DRAFT = {
  yourName: "Casey Syntheticperson",
  yourEmail: SYNTH_CLIENT.email,
  spouseName: "Jordan Syntheticperson",
  spouseEmail: SPOUSE_B_EMAIL,
  state: "NY",
  children: true,
  assets: false,
  understood: true,
};

let aCookie: string;
let bCookie: string;
let attorneyCookie: string;

beforeEach(async () => {
  resetDbForTests();
  freshLimits();
  process.env.APP_URL = "https://divorcegpt.test";
  await provisionAccount(SYNTH_ATTORNEY);
  await provisionAccount(SYNTH_CLIENT);
  await provisionAccount(SYNTH_CLIENT_2);
  aCookie = await cookieFor(SYNTH_CLIENT);
  bCookie = await cookieFor(SYNTH_CLIENT_2);
  attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
});

async function startCase(): Promise<{ matterId: string; inviteUrl: string; token: string }> {
  freshLimits();
  const d = await draftRoute(jsonRequest("/api/start/draft", { body: DRAFT }));
  expect(d.status).toBe(200);
  const pending = await pendingRoute(jsonRequest("/api/start/pending", { method: "GET", cookie: aCookie }));
  expect(((await pending.json()) as { pending: { quote: { total: number } } }).pending.quote.total).toBe(quoteFor({ children: true, assets: false }).total);
  const f = await finishRoute(jsonRequest("/api/start/finish", { cookie: aCookie }));
  expect(f.status).toBe(200);
  const body = (await f.json()) as { matterId: string; inviteUrl: string };
  const token = body.inviteUrl.split("/join/")[1];
  return { matterId: body.matterId, inviteUrl: body.inviteUrl, token };
}

describe("June → the first spouse's case", () => {
  it("the quote is the configured flat fee", () => {
    expect(quoteFor({ children: false, assets: false }).total).toBe(1500);
    expect(quoteFor({ children: true, assets: true }).total).toBe(3000);
  });

  it("a draft is parked by email; finishing creates a matter with two seats, A as the firm's client, an open invite for B", async () => {
    const { matterId, inviteUrl } = await startCase();
    const matter = (await getMatter(matterId))!;
    expect(matter.clientUserId).not.toBeNull();
    expect(matter.conflictStatus).toBe("EXTERNAL");
    expect(matter.matterCategory).toBe(UNCONTESTED_CATEGORY);
    expect(matter.jurisdictionCandidate).toBe("NY");
    expect(matter.label).not.toContain("Casey"); // non-identifying label
    const parties = await listParties(matterId);
    expect(parties.map((p) => [p.role, p.status, Boolean(p.userId)])).toEqual([
      ["A", "JOINED", true],
      ["B", "INVITED", false],
    ]);
    expect(inviteUrl).toMatch(/^https:\/\/divorcegpt\.test\/join\/[A-Za-z0-9_-]{20,}$/);
    // A's interview exists; it is seat A.
    const sessions = await listSessionsByMatter(matterId);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].partyId).toBe("A");
    // The draft is consumed: a second finish is refused.
    freshLimits();
    const again = await finishRoute(jsonRequest("/api/start/finish", { cookie: aCookie }));
    expect(again.status).toBe(404);
  });

  it("a draft can only be finished by the account whose verified email it was parked under", async () => {
    freshLimits();
    await draftRoute(jsonRequest("/api/start/draft", { body: DRAFT }));
    const other = await finishRoute(jsonRequest("/api/start/finish", { cookie: bCookie }));
    expect(other.status).toBe(404); // nothing parked for B's email
  });

  it("the same email for both spouses is refused at the door", async () => {
    freshLimits();
    const r = await draftRoute(jsonRequest("/api/start/draft", { body: { ...DRAFT, spouseEmail: DRAFT.yourEmail } }));
    expect(r.status).toBe(400);
  });
});

describe("the second spouse joins", () => {
  it("preview shows state and a masked address, never a name; accept is email-bound and single-use", async () => {
    const { matterId, token } = await startCase();
    freshLimits();
    const prev = await joinPreview(jsonRequest(`/api/join/${token}`, { method: "GET" }), params({ token }));
    const pbody = (await prev.json()) as { state: string; invitedEmailMasked: string };
    expect(pbody.state).toBe("OPEN");
    expect(pbody.invitedEmailMasked).toBe("ot***@example.test");
    expect(JSON.stringify(pbody)).not.toContain("Jordan");
    expect(JSON.stringify(pbody)).not.toContain("Casey");

    // The wrong person (verified email differs) is refused.
    await provisionAccount(STRANGER);
    freshLimits();
    const wrong = await joinAccept(jsonRequest(`/api/join/${token}`, { cookie: await cookieFor(STRANGER) }), params({ token }));
    expect(wrong.status).toBe(409);
    expect(((await wrong.json()) as { error: string }).error).toMatch(/different email/);
    // A cannot be both spouses.
    freshLimits();
    const self = await joinAccept(jsonRequest(`/api/join/${token}`, { cookie: aCookie }), params({ token }));
    expect(self.status).toBe(409);

    // The right person is seated; a session is born on seat B.
    freshLimits();
    const ok = await joinAccept(jsonRequest(`/api/join/${token}`, { cookie: bCookie }), params({ token }));
    expect(ok.status).toBe(200);
    expect((await ok.json()) as object).toMatchObject({ joined: true, matterId });
    const b = (await listParties(matterId)).find((p) => p.role === "B")!;
    expect(b.status).toBe("JOINED");
    const sessions = await listSessionsByMatter(matterId);
    expect(sessions.map((s) => s.partyId).sort()).toEqual(["A", "B"]);

    // Single use.
    freshLimits();
    const twice = await joinAccept(jsonRequest(`/api/join/${token}`, { cookie: bCookie }), params({ token }));
    expect(twice.status).toBe(409);
    expect(((await twice.json()) as { error: string }).error).toMatch(/already used/);
    // And the preview now says so.
    freshLimits();
    const prev2 = await joinPreview(jsonRequest(`/api/join/${token}`, { method: "GET" }), params({ token }));
    expect(((await prev2.json()) as { state: string }).state).toBe("USED");
  });

  it("a garbage token previews as UNKNOWN and cannot be accepted", async () => {
    freshLimits();
    const prev = await joinPreview(jsonRequest(`/api/join/nope`, { method: "GET" }), params({ token: "nope" }));
    expect(((await prev.json()) as { state: string }).state).toBe("UNKNOWN");
    const acc = await joinAccept(jsonRequest(`/api/join/nope`, { cookie: bCookie }), params({ token: "nope" }));
    expect(acc.status).toBe(409);
  });

  it("A (or the firm) can reissue the link; the old one dies", async () => {
    const { matterId, token } = await startCase();
    freshLimits();
    const re = await partiesReissue(jsonRequest(`/api/matters/${matterId}/parties`, { cookie: aCookie }), params({ id: matterId }));
    expect(re.status).toBe(200);
    const { inviteUrl } = (await re.json()) as { inviteUrl: string };
    const token2 = inviteUrl.split("/join/")[1];
    expect(token2).not.toBe(token);
    freshLimits();
    const old = await joinPreview(jsonRequest(`/api/join/${token}`, { method: "GET" }), params({ token }));
    expect(((await old.json()) as { state: string }).state).toBe("REVOKED");
    freshLimits();
    const ok = await joinAccept(jsonRequest(`/api/join/${token2}`, { cookie: bCookie }), params({ token: token2 }));
    expect(ok.status).toBe(200);
  });
});

describe("two interviews, two answer sets, one report", () => {
  async function seatBoth() {
    const { matterId, token } = await startCase();
    freshLimits();
    await joinAccept(jsonRequest(`/api/join/${token}`, { cookie: bCookie }), params({ token }));
    return matterId;
  }

  it("each spouse writes and reads ONLY their own answers; ?party= is ignored for clients", async () => {
    const matterId = await seatBoth();
    freshLimits();
    const putA = await intake2Put(
      jsonRequest(`/api/matters/${matterId}/intake2`, { method: "PUT", cookie: aCookie, body: { answers: [{ questionId: "shared.children.any", value: true }] } }),
      params({ id: matterId })
    );
    expect(putA.status).toBe(200);
    freshLimits();
    const putB = await intake2Put(
      jsonRequest(`/api/matters/${matterId}/intake2`, { method: "PUT", cookie: bCookie, body: { answers: [{ questionId: "shared.children.any", value: false }] } }),
      params({ id: matterId })
    );
    expect(putB.status).toBe(200);
    expect((await getMatterAnswers(matterId, "A"))["shared.children.any"]).toBe(true);
    expect((await getMatterAnswers(matterId, "B"))["shared.children.any"]).toBe(false);

    // A asks for B's answers by URL → still gets A's.
    freshLimits();
    const peek = await intake2Get(jsonRequest(`/api/matters/${matterId}/intake2?party=B`, { method: "GET", cookie: aCookie }), params({ id: matterId }));
    const pbody = (await peek.json()) as { party: string; answers: Record<string, unknown> };
    expect(pbody.party).toBe("A");
    expect(pbody.answers["shared.children.any"]).toBe(true);
    // The firm can read either seat.
    freshLimits();
    const firmB = await intake2Get(jsonRequest(`/api/matters/${matterId}/intake2?party=B`, { method: "GET", cookie: attorneyCookie }), params({ id: matterId }));
    expect(((await firmB.json()) as { party: string; answers: Record<string, unknown> }).answers["shared.children.any"]).toBe(false);
  });

  it("clients see each other's status only; the firm gets the comparison once both are complete", async () => {
    const matterId = await seatBoth();
    freshLimits();
    const asA = await partiesGet(jsonRequest(`/api/matters/${matterId}/parties`, { method: "GET", cookie: aCookie }), params({ id: matterId }));
    const aView = (await asA.json()) as { parties: Record<string, unknown>[]; comparison: unknown; bothComplete: boolean };
    expect(aView.comparison).toBeNull();
    expect(aView.bothComplete).toBe(false);
    expect(aView.parties.find((p) => p.role === "A")).toMatchObject({ isYou: true, status: "JOINED" });
    expect(aView.parties.find((p) => p.role === "B")).toMatchObject({ isYou: false, firstName: "Jordan", seated: true });
    expect(JSON.stringify(aView)).not.toContain("example.test"); // no emails to a client
    // The firm sees both real addresses — that is how the Teams invite goes out.
    freshLimits();
    const firmSeats = await partiesGet(jsonRequest(`/api/matters/${matterId}/parties`, { method: "GET", cookie: attorneyCookie }), params({ id: matterId }));
    const seats = ((await firmSeats.json()) as { parties: { role: string; email: string }[] }).parties;
    expect(seats.find((p) => p.role === "A")?.email).toBe(SYNTH_CLIENT.email);
    expect(seats.find((p) => p.role === "B")?.email).toBe(SPOUSE_B_EMAIL);

    // Answers: agree on the marriage, disagree on children.
    for (const [cookie, kids] of [[aCookie, true], [bCookie, false]] as const) {
      freshLimits();
      await intake2Put(
        jsonRequest(`/api/matters/${matterId}/intake2`, {
          method: "PUT",
          cookie,
          body: { answers: [{ questionId: "shared.relationship.status_kind", value: "MARRIAGE" }, { questionId: "shared.children.any", value: kids }] },
        }),
        params({ id: matterId })
      );
    }
    for (const p of await listParties(matterId)) await setPartyStatus(p.id, "INTAKE_COMPLETE");


    freshLimits();
    const asFirm = await partiesGet(jsonRequest(`/api/matters/${matterId}/parties`, { method: "GET", cookie: attorneyCookie }), params({ id: matterId }));
    const fView = (await asFirm.json()) as { bothComplete: boolean; comparison: { agreed: boolean; counts: Record<string, number>; terms: { questionId: string; status: string }[] } };
    expect(fView.bothComplete).toBe(true);
    expect(fView.comparison.agreed).toBe(false);
    expect(fView.comparison.terms.find((t) => t.questionId === "shared.relationship.status_kind")?.status).toBe("MATCH");
    expect(fView.comparison.terms.find((t) => t.questionId === "shared.children.any")?.status).toBe("MISMATCH");
    // The private safety screen is never in the report.
    expect(fView.comparison.terms.some((t) => t.questionId.startsWith("shared.safety."))).toBe(false);
  });
});

describe("compareParties (pure)", () => {
  const schema = getSchemaForCategory(UNCONTESTED_CATEGORY);
  it("normalizes casing/whitespace/yes-no; narratives are listed, not judged; identity and safety are skipped", () => {
    const a = { "shared.relationship.status_kind": "MARRIAGE", "shared.children.any": true, "shared.relationship.marriage_place": " Brooklyn,  NY ", "shared.goals.desired_outcome": "peace", "shared.safety.immediate_danger": true, "shared.identity.client_name": "Casey" };
    const b = { "shared.relationship.status_kind": "marriage", "shared.children.any": "yes", "shared.relationship.marriage_place": "brooklyn, ny", "shared.goals.desired_outcome": "a fresh start", "shared.safety.immediate_danger": false, "shared.identity.client_name": "Jordan" };
    const r = compareParties(schema, a, b);
    const by = Object.fromEntries(r.terms.map((t) => [t.questionId, t.status]));
    expect(by["shared.relationship.status_kind"]).toBe("MATCH");
    expect(by["shared.children.any"]).toBe("MATCH");
    expect(by["shared.relationship.marriage_place"]).toBe("MATCH");
    expect(by["shared.goals.desired_outcome"]).toBeUndefined(); // goals are personal
    expect(by["shared.safety.immediate_danger"]).toBeUndefined(); // never compared
    expect(by["shared.identity.client_name"]).toBeUndefined();
    expect(r.agreed).toBe(true);
  });
  it("a one-sided answer is ONLY_A/ONLY_B and breaks agreement", () => {
    const r = compareParties(schema, { "shared.children.any": true }, {});
    expect(r.terms[0]).toMatchObject({ questionId: "shared.children.any", status: "ONLY_A" });
    expect(r.agreed).toBe(false);
  });
});

describe("the two spouses' words (grep guard)", () => {
  it("nothing a spouse reads says 'mediation' or 'AI lawyer'", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { FORBIDDEN_CLIENT_WORDS, juneOpening } = await import("@/config/june-copy");
    const { juneTurnConstitution: juneConstitution } = await import("@/lib/june/turn");
    const files = [
      "src/app/start/page.tsx",
      "src/app/join/[token]/page.tsx",
      "src/app/portal/page.tsx",
      "src/app/portal/matter/page.tsx",
    ].map((f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8"));
    const corpus = [...files, ...juneOpening("Firm"), juneConstitution()].join("\n").toLowerCase();
    for (const w of FORBIDDEN_CLIENT_WORDS) {
      // The constitution may NAME the word to forbid it; nothing else may use it.
      const hits = corpus.split(w).length - 1;
      const allowed = juneConstitution().toLowerCase().split(w).length - 1;
      expect(hits, `"${w}" appears in client copy`).toBe(allowed);
    }
  });
});

describe("June is a conversation, not a form (2026-10-30, second cut)", () => {

  function juneTurnPayload(over: Record<string, unknown>) {
    return {
      say: "Thanks — and what email will you sign in with?",
      lang: "en",
      facts: { yourName: null, yourEmail: null, spouseName: null, spouseEmail: null, state: null, children: null, assets: null, understood: null },
      flagged: false,
      ...over,
    };
  }
  function mockJune(...payloads: unknown[]) {
    let i = 0;
    const mock = vi.fn(async () => {
      const payload = payloads[Math.min(i, payloads.length - 1)];
      i += 1;
      return new Response(
        JSON.stringify({ id: `resp_${i}`, model: "claude-test", content: [{ type: "tool_use", id: "t", name: "JUNE_TURN", input: payload }], usage: { input_tokens: 1, output_tokens: 1 } }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    vi.stubGlobal("fetch", mock);
    return mock;
  }
  const VISITOR = "11111111-2222-4333-8444-555555555555";
  const vcookie = `dgpt_june_v=${VISITOR}`;

  beforeEach(() => {
    process.env.INTAKE_CHAT_ENABLED = "true";
    process.env.AI_FEATURES_ENABLED = "true";
    process.env.ANTHROPIC_API_KEY = "sk-synthetic-eval-key-never-real";
  });
  afterEach(() => {
    delete process.env.INTAKE_CHAT_ENABLED;
    delete process.env.AI_FEATURES_ENABLED;
    delete process.env.ANTHROPIC_API_KEY;
    vi.unstubAllGlobals();
  });

  it("GET opens with the scripted opening and mints a visitor cookie; the opening is logged for the firm", async () => {
    const { GET } = await import("@/app/api/start/turn/route");
    freshLimits();
    const r = await GET(jsonRequest("/api/start/turn", { method: "GET" }));
    expect(r.headers.get("set-cookie")).toMatch(/dgpt_june_v=[0-9a-f-]{36}; Path=\/; HttpOnly; SameSite=Lax/);
    const body = (await r.json()) as { transcript: { role: string; content: string }[]; missing: string[]; complete: boolean };
    expect(body.transcript[0].content).toContain("I'm June");
    expect(body.transcript.at(-1)!.content).toContain("full name");
    expect(body.missing[0]).toBe("yourName");
    expect(body.complete).toBe(false);
  });

  it("a Korean question at the name step is NOT recorded as a name; the model answers in Korean; the server records only validated facts", async () => {
    const { GET, POST } = await import("@/app/api/start/turn/route");
    freshLimits();
    await GET(jsonRequest("/api/start/turn", { method: "GET", cookie: vcookie }));
    const mock = mockJune(
      juneTurnPayload({ say: "네, 한국어로 하셔도 됩니다. 성함을 알려 주세요.", lang: "ko" }),
      juneTurnPayload({ say: "감사합니다, 민수님. 로그인에 사용하실 이메일을 알려 주세요.", lang: "ko", facts: { yourName: "김민수", yourEmail: null, spouseName: null, spouseEmail: null, state: null, children: null, assets: null, understood: "nonsense" } })
    );
    freshLimits();
    const r1 = await POST(jsonRequest("/api/start/turn", { body: { message: "한국어로 해도 되나요?" }, cookie: vcookie }));
    const b1 = (await r1.json()) as { say: string; lang: string; facts: Record<string, unknown>; missing: string[] };
    expect(b1.lang).toBe("ko");
    expect(b1.facts.yourName).toBeUndefined(); // the question was not a name
    expect(b1.missing[0]).toBe("yourName");
    // The prompt told the model what is missing and what to ask next.
    const sent = JSON.parse((mock.mock.calls[0] as unknown as [string, { body: string }])[1].body as string) as { messages: { content: string }[] };
    expect(JSON.stringify(sent)).toContain("STILL MISSING");
    expect(JSON.stringify(sent)).toContain("yourName");

    freshLimits();
    const r2 = await POST(jsonRequest("/api/start/turn", { body: { message: "김민수입니다" }, cookie: vcookie }));
    const b2 = (await r2.json()) as { facts: Record<string, unknown>; missing: string[] };
    expect(b2.facts.yourName).toBe("김민수");
    expect(b2.facts.understood).toBeUndefined(); // an invalid proposal is dropped, not saved
    expect(b2.missing[0]).toBe("yourEmail");
  });

  it("the server, not the model, enforces distinct emails and 'understood' only at the end; a complete draft is what sign-in finds", async () => {
    const { POST } = await import("@/app/api/start/turn/route");
    const { pendingStartDraftFor } = await import("@/lib/june/start");
    mockJune(
      juneTurnPayload({ facts: { yourName: "Casey Syntheticperson", yourEmail: SYNTH_CLIENT.email, spouseName: "Jordan", spouseEmail: SYNTH_CLIENT.email, state: "NY", children: true, assets: false, understood: true } })
    );
    freshLimits();
    const r1 = await POST(jsonRequest("/api/start/turn", { body: { message: "everything at once" }, cookie: vcookie }));
    const b1 = (await r1.json()) as { say: string; facts: Record<string, unknown>; missing: string[]; complete: boolean };
    expect(b1.facts.spouseEmail).toBeUndefined(); // same as the visitor's → refused
    expect(b1.say).toContain("different email");
    expect(b1.facts.understood).toBeUndefined(); // cannot be set while a fact is missing
    expect(b1.complete).toBe(false);
    expect(await pendingStartDraftFor(SYNTH_CLIENT.email)).toBeNull(); // incomplete drafts are invisible to sign-in

    mockJune(juneTurnPayload({ facts: { yourName: null, yourEmail: null, spouseName: null, spouseEmail: SPOUSE_B_EMAIL, state: null, children: null, assets: null, understood: null } }));
    freshLimits();
    await POST(jsonRequest("/api/start/turn", { body: { message: SPOUSE_B_EMAIL }, cookie: vcookie }));
    mockJune(juneTurnPayload({ facts: { yourName: null, yourEmail: null, spouseName: null, spouseEmail: null, state: null, children: null, assets: null, understood: true } }));
    freshLimits();
    const r3 = await POST(jsonRequest("/api/start/turn", { body: { message: "yes, I understand" }, cookie: vcookie }));
    const b3 = (await r3.json()) as { complete: boolean; quote: { total: number } };
    expect(b3.complete).toBe(true);
    expect(b3.quote.total).toBe(2250);
    expect((await pendingStartDraftFor(SYNTH_CLIENT.email))?.draft.spouseEmail).toBe(SPOUSE_B_EMAIL);
  });

  it("another language gets the two-language line without a model call; the kill switch falls back to the scripted questions", async () => {
    const { POST } = await import("@/app/api/start/turn/route");
    const boom = vi.fn(() => { throw new Error("no model call expected"); });
    vi.stubGlobal("fetch", boom);
    freshLimits();
    const r = await POST(jsonRequest("/api/start/turn", { body: { message: "Привет, можно по-русски?" }, cookie: vcookie }));
    expect(((await r.json()) as { say: string }).say).toMatch(/English or Korean/);
    expect(boom).not.toHaveBeenCalled();

    delete process.env.INTAKE_CHAT_ENABLED;
    freshLimits();
    const r2 = await POST(jsonRequest("/api/start/turn", { body: { message: "Casey Syntheticperson" }, cookie: vcookie }));
    const b2 = (await r2.json()) as { say: string; facts: Record<string, unknown>; disabled: boolean };
    expect(b2.disabled).toBe(true);
    expect(b2.facts.yourName).toBe("Casey Syntheticperson");
    expect(b2.say).toContain("email");
    expect(boom).not.toHaveBeenCalled();
  });

  it("the firm reads every June conversation; clients cannot; the transcript attaches to the matter it became", async () => {
    const { GET, POST } = await import("@/app/api/start/turn/route");
    const { GET: firmJune } = await import("@/app/api/firm/june/route");
    const { GET: matterJune } = await import("@/app/api/matters/[id]/june/route");
    freshLimits();
    await GET(jsonRequest("/api/start/turn", { method: "GET", cookie: vcookie }));
    mockJune(juneTurnPayload({ facts: { yourName: "Casey Syntheticperson", yourEmail: SYNTH_CLIENT.email, spouseName: "Jordan", spouseEmail: SPOUSE_B_EMAIL, state: "NY", children: false, assets: false, understood: null } }));
    freshLimits();
    await POST(jsonRequest("/api/start/turn", { body: { message: "I'm Casey; everything in one go" }, cookie: vcookie }));
    mockJune(juneTurnPayload({ facts: { yourName: null, yourEmail: null, spouseName: null, spouseEmail: null, state: null, children: null, assets: null, understood: true } }));
    freshLimits();
    await POST(jsonRequest("/api/start/turn", { body: { message: "yes" }, cookie: vcookie }));

    freshLimits();
    const firm = await firmJune(jsonRequest("/api/firm/june", { method: "GET", cookie: attorneyCookie }));
    const list = (await firm.json()) as { conversations: { email: string | null; complete: boolean; matterId: string | null; transcript: { role: string; content: string }[] }[] };
    expect(list.conversations).toHaveLength(1);
    expect(list.conversations[0]).toMatchObject({ email: SYNTH_CLIENT.email, complete: true, matterId: null });
    expect(list.conversations[0].transcript.some((m) => m.role === "VISITOR" && m.content.includes("everything in one go"))).toBe(true);
    freshLimits();
    const asClient = await firmJune(jsonRequest("/api/firm/june", { method: "GET", cookie: aCookie }));
    expect(asClient.status).toBe(403);

    // Sign in + create the case → the conversation now belongs to the matter.
    freshLimits();
    const f = await finishRoute(jsonRequest("/api/start/finish", { cookie: aCookie }));
    const { matterId } = (await f.json()) as { matterId: string };
    freshLimits();
    const mj = await matterJune(jsonRequest(`/api/matters/${matterId}/june`, { method: "GET", cookie: attorneyCookie }), params({ id: matterId }));
    const t = (await mj.json()) as { transcript: { role: string }[] };
    expect(t.transcript.length).toBeGreaterThan(4);
    freshLimits();
    const again = await firmJune(jsonRequest("/api/firm/june", { method: "GET", cookie: attorneyCookie }));
    expect(((await again.json()) as { conversations: { matterId: string | null }[] }).conversations[0].matterId).toBe(matterId);
  });
});
