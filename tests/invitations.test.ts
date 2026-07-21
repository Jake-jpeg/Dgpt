/**
 * Batch 2/10 acceptance: invitation-only access.
 *  - public registration into intake is disabled (no matter → no intake)
 *  - expired / revoked / used invitations are rejected with ONE neutral
 *    response, indistinguishable from an invalid token
 *  - tokens are stored hashed; acceptance binds the authenticated client
 *  - disclosure acknowledgment is required (and never preselected)
 */
import { describe, it, expect, beforeEach } from "vitest";
import { resetDbForTests, getDb } from "@/lib/db/index";
import {
  cookieFor,
  SYNTH_CLIENT,
  SYNTH_ATTORNEY,
  provisionAccount,
  jsonRequest,
  params,
  freshLimits,
} from "./helpers";
import { createMatter, grantMatterAccess, getMatter } from "@/lib/db/matters";
import { createInvitation, revokeInvitation } from "@/lib/db/invitations";
import { POST as acceptRoute } from "@/app/api/invitations/accept/route";
import { POST as startRoute } from "@/app/api/intake/start/route";
import { POST as consentRoute } from "@/app/api/matters/[id]/consent/route";
import { POST as invitationsPost } from "@/app/api/matters/[id]/invitations/route";
import { DISCLOSURE_VERSION } from "@/config/disclosure";

let clientCookie: string;

async function newInvite(ttlHours?: number) {
  const attorney = (await provisionAccount(SYNTH_ATTORNEY));
  const matter = (await createMatter({ label: "Invite Matter", createdBy: attorney.id }));
  (await grantMatterAccess(matter.id, attorney.id, attorney.id));
  const { invitation, rawToken } = (await createInvitation({
      matterId: matter.id,
      createdBy: attorney.id,
      ttlHours,
    }));
  return { matter, invitation, rawToken, attorney };
}

async function accept(token: string, cookie = clientCookie) {
  freshLimits();
  const res = await acceptRoute(
    jsonRequest("/api/invitations/accept", { cookie, body: { token } })
  );
  return { status: res.status, data: await res.json() };
}

beforeEach(async () => {
  resetDbForTests();
  freshLimits();
  clientCookie = await cookieFor(SYNTH_CLIENT);
  (await provisionAccount(SYNTH_CLIENT));
});

describe("public registration is disabled", () => {
  it("a signed-in client with no invitation cannot start intake", async () => {
    const res = await startRoute(
      jsonRequest("/api/intake/start", { cookie: clientCookie, body: {} })
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain("invitation");
  });

  it("there is no public registration route in the API surface", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const apiDir = path.join(__dirname, "..", "src", "app", "api");
    const routes: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else routes.push(p);
      }
    };
    walk(apiDir);
    expect(routes.filter((r) => /register|signup|sign-up/i.test(r))).toEqual([]);
  });
});

describe("invitation lifecycle — one neutral failure for every mode", () => {
  it("valid invitation binds the authenticated client to the matter", async () => {
    const { matter, rawToken } = (await newInvite());
    const ok = await accept(rawToken);
    expect(ok.status).toBe(200);
    expect(ok.data.matterId).toBe(matter.id);
    const client = (await provisionAccount(SYNTH_CLIENT));
    expect((await getMatter(matter.id))!.clientUserId).toBe(client.id);
  });

  it("invalid, expired, revoked, and used tokens return identical neutral responses", async () => {
    const responses: { status: number; data: unknown }[] = [];

    // invalid
    responses.push(await accept("totally-invalid-token-thats-long-enough"));

    // expired: backdate expires_at directly
    const expired = (await newInvite());
    await getDb().run(
      `UPDATE invitation SET expires_at = ? WHERE id = ?`,
      new Date(Date.now() - 60_000).toISOString(),
      expired.invitation.id
    );
    responses.push(await accept(expired.rawToken));

    // revoked
    const revoked = (await newInvite());
    (await revokeInvitation(revoked.invitation.id));
    responses.push(await accept(revoked.rawToken));

    // used (accepted once by this client, then replayed)
    const used = (await newInvite());
    const first = await accept(used.rawToken);
    expect(first.status).toBe(200);
    responses.push(await accept(used.rawToken));

    for (const r of responses) {
      expect(r.status).toBe(responses[0].status);
      expect(r.data).toEqual(responses[0].data); // byte-identical body
    }
    expect(JSON.stringify(responses[0].data)).not.toMatch(/expired|revoked|used/i);
  });

  it("raw tokens are never stored — only hashes", async () => {
    const { rawToken } = (await newInvite());
    const rows = (await getDb().all<{ token_hash: string }>(`SELECT token_hash FROM invitation`));
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.token_hash).not.toBe(rawToken);
      expect(r.token_hash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("an invitation cannot rebind a matter that belongs to another client", async () => {
    const { rawToken, matter, attorney } = (await newInvite());
    await accept(rawToken);
    // Second invitation on the same matter, different client.
    const { rawToken: second } = (await createInvitation({ matterId: matter.id, createdBy: attorney.id }));
    const other = await cookieFor({
      subject: "devstub|client:intruder@example.test",
      role: "CLIENT",
      email: "intruder@example.test",
      name: "Intruder",
    });
    const res = await accept(second, other);
    expect(res.status).toBe(400); // same neutral failure
    const client = (await provisionAccount(SYNTH_CLIENT));
    expect((await getMatter(matter.id))!.clientUserId).toBe(client.id); // unchanged
  });

  it("only staff/attorney with a grant can mint invitations", async () => {
    const { matter } = (await newInvite());
    freshLimits();
    const res = await invitationsPost(
      jsonRequest(`/api/matters/${matter.id}/invitations`, { cookie: clientCookie, body: {} }),
      params({ id: matter.id })
    );
    expect(res.status).toBe(403);
  });
});

describe("disclosure before intake", () => {
  it("accepted client still cannot start intake until acknowledging the CURRENT disclosure", async () => {
    const { matter, rawToken } = (await newInvite());
    await accept(rawToken);

    freshLimits();
    const blocked = await startRoute(
      jsonRequest("/api/intake/start", { cookie: clientCookie, body: { matterId: matter.id } })
    );
    expect(blocked.status).toBe(409);
    expect((await blocked.json()).error).toContain("disclosure");

    // acknowledge=false (or missing) is rejected — consent is never presumed.
    freshLimits();
    const notAffirmative = await consentRoute(
      jsonRequest(`/api/matters/${matter.id}/consent`, {
        cookie: clientCookie,
        body: { version: DISCLOSURE_VERSION, acknowledge: false },
      }),
      params({ id: matter.id })
    );
    expect(notAffirmative.status).toBe(400);

    // stale version is rejected.
    freshLimits();
    const stale = await consentRoute(
      jsonRequest(`/api/matters/${matter.id}/consent`, {
        cookie: clientCookie,
        body: { version: "1999-01.0", acknowledge: true },
      }),
      params({ id: matter.id })
    );
    expect(stale.status).toBe(409);

    // real acknowledgment unblocks intake; IP/UA are NOT captured by default.
    freshLimits();
    const ok = await consentRoute(
      jsonRequest(`/api/matters/${matter.id}/consent`, {
        cookie: clientCookie,
        body: { version: DISCLOSURE_VERSION, acknowledge: true },
      }),
      params({ id: matter.id })
    );
    expect(ok.status).toBe(200);
    const ack = (await getDb().get<{ ip: string | null; user_agent: string | null }>(
      `SELECT ip, user_agent FROM disclosure_ack WHERE matter_ref = ?`,
      matter.id
    ))!;
    expect(ack.ip).toBeNull();
    expect(ack.user_agent).toBeNull();

    freshLimits();
    const started = await startRoute(
      jsonRequest("/api/intake/start", { cookie: clientCookie, body: { matterId: matter.id } })
    );
    expect(started.status).toBe(200);
  });
});
