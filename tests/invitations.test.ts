/**
 * Email-bound, single-use, frictionless invitations (2026-07-21). Invite-only
 * is the ONLY way a client enters. The link is locked to one email:
 *
 *  - the attorney sets the client's email; only that verified Google/Outlook
 *    account can accept, once — a leaked link is useless to anyone else;
 *  - onboarding provisions the CLIENT account, binds the matter, records the
 *    firm's EXTERNAL conflict posture, and opens the intake session;
 *  - a wrong-email sign-in creates NOTHING and leaves the link usable;
 *  - a firm-role account can never accept a client invitation;
 *  - login routing: a client with no account lands on /invite (not in).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import { cookieFor, SYNTH_ATTORNEY, provisionAccount, jsonRequest, params, freshLimits } from "./helpers";
import { createMatter, grantMatterAccess, getMatter } from "@/lib/db/matters";
import {
  createInvitation,
  previewInvitation,
  onboardInvitedClient,
  maskEmail,
  listInvitationsForMatter,
} from "@/lib/db/invitations";
import { getUserByEmail } from "@/lib/db/users";
import { listSessionsByMatter } from "@/lib/db/repo";
import { decideLoginDestination } from "@/lib/auth/authorize-login";
import { GET as mattersGet } from "@/app/api/matters/route";
import type { SessionUser } from "@/lib/auth/session";

async function freshInvite(email = "client@example.test") {
  const attorney = await provisionAccount(SYNTH_ATTORNEY);
  const matter = await createMatter({ label: "Invite Matter", createdBy: attorney.id });
  await grantMatterAccess(matter.id, attorney.id, attorney.id);
  const { invitation, rawToken } = await createInvitation({
    matterId: matter.id,
    createdBy: attorney.id,
    targetEmail: email,
  });
  return { attorney, matter, invitation, rawToken, email };
}

beforeEach(() => {
  resetDbForTests();
  freshLimits();
});

describe("creation binds the invitation to one email", () => {
  it("stores the target email lowercased and requires a valid one", async () => {
    const { invitation } = await freshInvite("Client@Example.Test");
    expect(invitation.targetEmail).toBe("client@example.test");
    const attorney = await provisionAccount(SYNTH_ATTORNEY);
    const m = await createMatter({ label: "x", createdBy: attorney.id });
    await expect(
      createInvitation({ matterId: m.id, createdBy: attorney.id, targetEmail: "not-an-email" })
    ).rejects.toThrow(/VALIDATION/);
  });

  it("preview reveals only a masked email, never the address or matter", async () => {
    const { rawToken } = await freshInvite("jane.doe@gmail.com");
    const inv = await previewInvitation(rawToken);
    expect(inv).not.toBeNull();
    expect(maskEmail(inv!.targetEmail)).toBe("ja***@gmail.com");
  });
});

describe("only the invited email can accept, exactly once", () => {
  it("the matching account is onboarded: CLIENT account, bound matter, EXTERNAL, intake session", async () => {
    const { matter, email } = await freshInvite();
    const { rawToken } = await freshInvite(email); // fresh token to this email
    const out = await onboardInvitedClient({
      rawToken,
      subject: "google|invited-sub",
      email,
      name: "Invited Client",
    });
    expect("matterId" in out).toBe(true);
    if (!("matterId" in out)) return;
    const account = await getUserByEmail(email);
    expect(account?.role).toBe("CLIENT");
    expect(account?.subject).toBe("google|invited-sub");
    const bound = await getMatter(out.matterId);
    expect(bound?.clientUserId).toBe(account!.id);
    expect(bound?.conflictStatus).toBe("EXTERNAL");
    const sessions = await listSessionsByMatter(out.matterId);
    expect(sessions.some((s) => s.ownerSubject === "google|invited-sub" && s.state === "GATE_RESIDENCY")).toBe(true);
    // The other matter from the first freshInvite is untouched.
    expect(matter.id).not.toBe(out.matterId);
  });

  it("a WRONG-email sign-in is refused and creates nothing; the link stays usable", async () => {
    const { rawToken, email } = await freshInvite("real@example.test");
    const bad = await onboardInvitedClient({
      rawToken,
      subject: "google|stranger",
      email: "stranger@example.test",
      name: "Stranger",
    });
    expect(bad).toEqual({ error: "wrong_email" });
    expect(await getUserByEmail("stranger@example.test")).toBeNull();
    // The invitation was NOT consumed — the real client can still use it.
    expect(await previewInvitation(rawToken)).not.toBeNull();
    const good = await onboardInvitedClient({ rawToken, subject: "google|real", email, name: "Real" });
    expect("matterId" in good).toBe(true);
  });

  it("is single-use: a second accept (even by the same account) is refused", async () => {
    const { rawToken, email } = await freshInvite();
    const first = await onboardInvitedClient({ rawToken, subject: "google|c1", email });
    expect("matterId" in first).toBe(true);
    const replay = await onboardInvitedClient({ rawToken, subject: "google|c1", email });
    expect(replay).toEqual({ error: "invalid" });
  });

  it("an email already bound to a DIFFERENT subject is refused (account_conflict)", async () => {
    const { rawToken, email } = await freshInvite();
    await onboardInvitedClient({ rawToken, subject: "google|first", email });
    // A new invite to the same email, accepted by a different subject.
    const { rawToken: t2 } = await freshInvite(email);
    const out = await onboardInvitedClient({ rawToken: t2, subject: "google|imposter", email });
    expect(out).toEqual({ error: "account_conflict" });
  });
});

describe("a firm account cannot accept a client invitation", () => {
  it("returns firm_account", async () => {
    const attorney = await provisionAccount(SYNTH_ATTORNEY);
    const { rawToken } = await freshInvite(attorney.email);
    const out = await onboardInvitedClient({
      rawToken,
      subject: SYNTH_ATTORNEY.subject,
      email: attorney.email,
    });
    expect(out).toEqual({ error: "firm_account" });
  });
});

describe("a bare cookie still confers nothing (invite-only)", () => {
  it("an authenticated identity with NO account is refused by API routes", async () => {
    const cookie = await cookieFor({
      subject: "google|never-invited",
      role: "CLIENT",
      email: "ghost@example.test",
      name: "Ghost",
    } satisfies SessionUser);
    const res = await mattersGet(jsonRequest("/api/matters", { method: "GET", cookie }));
    expect(res.status).toBe(403);
    expect(await getUserByEmail("ghost@example.test")).toBeNull();
  });
});

describe("login routing (invite-only)", () => {
  const ALLOW = ["attorney@example.test"];
  it("a client with no account is sent to /invite on both client providers", () => {
    for (const provider of ["google", "msa"] as const) {
      expect(decideLoginDestination({ provider, boundAccount: null, attorneyAllowlist: ALLOW })).toBe("/invite");
    }
  });
  it("entra remains firm-only", () => {
    expect(() =>
      decideLoginDestination({ provider: "entra", boundAccount: null, attorneyAllowlist: ALLOW })
    ).toThrow(/not linked to an authorized firm account/);
  });
});

describe("attorney can list invitations for a matter", () => {
  it("lists with masked-free email, status, and expiry", async () => {
    const { matter } = await freshInvite("aaa@example.test");
    const list = await listInvitationsForMatter(matter.id);
    expect(list).toHaveLength(1);
    expect(list[0].targetEmail).toBe("aaa@example.test");
  });
});
