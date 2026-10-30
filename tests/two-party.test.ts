/**
 * The two-spouse model (2026-10-30) — route level.
 *
 * June parks a draft → the starting spouse signs in and creates the case →
 * the other spouse joins through a single-use, email-bound link → each
 * answers separately and can never read the other's answers → when both
 * are done the firm gets the meeting-of-the-minds report.
 */
import { describe, it, expect, beforeEach } from "vitest";
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
    const { juneConstitution } = await import("@/lib/june/ask");
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
