/**
 * Attorney-controlled client connection (2026-07-26) — the successor to
 * invitation links, plus the invite-only guarantees that outlived them:
 *
 *  - a client registers by signing in; the ATTORNEY connects the
 *    registration to a matter (one client per matter, EXTERNAL conflict
 *    posture, intake session opened);
 *  - a bare authenticated cookie still confers nothing — no account, no
 *    access;
 *  - login routing: a client identity with no account lands on /invite
 *    (the help page), never inside; Entra remains firm-only.
 *
 * The invitation-link machinery itself (email-bound single-use tokens,
 * preview/accept/revoke, invited-client onboarding) was retired in
 * production and DELETED 2026-07-27 ("kill redundant code" — operator).
 * Its implementation and its tests live in git history (5041649 and the
 * pre-2026-07-27 revisions of this file).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import { cookieFor, SYNTH_ATTORNEY, provisionAccount, jsonRequest, freshLimits } from "./helpers";
import { createMatter, getMatter } from "@/lib/db/matters";
import { connectClientToMatter, maskEmail } from "@/lib/db/invitations";
import { getUserByEmail } from "@/lib/db/users";
import { listSessionsByMatter } from "@/lib/db/repo";
import { decideLoginDestination } from "@/lib/auth/authorize-login";
import { GET as mattersGet } from "@/app/api/matters/route";
import type { SessionUser } from "@/lib/auth/session";

beforeEach(() => {
  resetDbForTests();
  freshLimits();
});

describe("attorney-controlled connection (2026-07-26 — the invite-link successor)", () => {
  // Live testing killed the link flow twice: first the !boundAccount skip,
  // then the invite cookie failing to survive the OAuth round-trip at all
  // (AUTH_LOGIN account=none with no INVITATION_ACCEPT_FAILED beside it).
  // The replacement has no tokens and no cookies: the client registers by
  // signing in; the ATTORNEY connects the registration to a matter.
  it("registered client + attorney connect → matter bound, session opened", async () => {
    const email = "registered-client@example.test";
    const registered: SessionUser = {
      subject: "devstub|client:registered",
      role: "CLIENT",
      email,
      name: "Registered Client",
    };
    const account = await provisionAccount(registered);
    expect(account.role).toBe("CLIENT");

    const attorney = await provisionAccount(SYNTH_ATTORNEY);
    const matter = await createMatter({ label: "Connect Matter", createdBy: attorney.id });
    const result = await connectClientToMatter({ matterId: matter.id, clientUserId: account.id });
    expect("error" in result).toBe(false);

    expect((await getMatter(matter.id))!.clientUserId).toBe(account.id);
    expect((await getMatter(matter.id))!.conflictStatus).toBe("EXTERNAL");
    expect((await listSessionsByMatter(matter.id)).length).toBe(1);

    // Guards: a taken matter refuses a different client; a firm account and a
    // never-signed-in row are refused.
    const other = await provisionAccount({
      subject: "devstub|client:other",
      role: "CLIENT",
      email: "other@example.test",
      name: "Other",
    });
    expect(await connectClientToMatter({ matterId: matter.id, clientUserId: other.id })).toEqual({
      error: "matter_taken",
    });
    const fresh = await createMatter({ label: "Fresh Matter", createdBy: attorney.id });
    expect(await connectClientToMatter({ matterId: fresh.id, clientUserId: attorney.id })).toEqual({
      error: "not_a_client",
    });
  });

  it("the callback registers clients at sign-in and carries no invite-cookie machinery (source tripwire)", async () => {
    const { readFileSync } = await import("node:fs");
    const cb = readFileSync("src/app/api/auth/callback/[provider]/route.ts", "utf8");
    expect(cb).toMatch(/CLIENT_REGISTERED/);
    expect(cb).toMatch(/provisionClientAccount/);
    expect(cb).not.toMatch(/PENDING_INVITE_COOKIE|pendingInvite/);
    const login = readFileSync("src/app/api/auth/login/[provider]/route.ts", "utf8");
    expect(login).not.toMatch(/PENDING_INVITE_COOKIE|invite/);
  });

  it("the retired invitation-link HTTP surface is gone (source tripwire)", async () => {
    const { existsSync } = await import("node:fs");
    expect(existsSync("src/app/api/invitations")).toBe(false);
    expect(existsSync("src/app/api/matters/[id]/invitations")).toBe(false);
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

describe("maskEmail (firm-facing display)", () => {
  it("fixed three stars — never leaks local-part length", () => {
    expect(maskEmail("jane.doe@gmail.com")).toBe("ja***@gmail.com");
    expect(maskEmail("a@b.co")).toBe("a***@b.co");
    expect(maskEmail("not-an-email")).toBe("***");
  });
});
