/**
 * Open client signup (2026-07-21 directive) — replaces the retired
 * invitation wall. The firm directs clients to the site and runs conflicts
 * in its own system.
 *
 *  - a Google/MSA identity becomes a CLIENT account at LOGIN TIME via
 *    provisionClientAccount, storing the absolute minimum (subject, email,
 *    display name);
 *  - provisioning is idempotent per subject;
 *  - an email already bound to a DIFFERENT subject is never silently
 *    rebound — provisioning refuses;
 *  - a bare session cookie whose subject has no account still confers
 *    NOTHING on API routes (accounts are made only by the OAuth callback);
 *  - login routing: clients land on /portal/matter on both client
 *    providers; Entra stays firm-only.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import { cookieFor, jsonRequest, freshLimits } from "./helpers";
import { provisionClientAccount, getUserByEmail } from "@/lib/db/users";
import { decideLoginDestination } from "@/lib/auth/authorize-login";
import { GET as mattersGet } from "@/app/api/matters/route";

beforeEach(() => {
  resetDbForTests();
  freshLimits();
});

describe("client self-provisioning", () => {
  it("creates a CLIENT account with only subject, email, and name", async () => {
    const account = await provisionClientAccount({
      subject: "google|open-signup-1",
      email: "NewClient@Example.Test",
      name: "New Client",
    });
    expect(account.role).toBe("CLIENT");
    expect(account.active).toBe(true);
    expect(account.email).toBe("newclient@example.test"); // normalized
    expect(account.subject).toBe("google|open-signup-1");
    expect(account.name).toBe("New Client");
  });

  it("is idempotent for the same subject", async () => {
    const a = await provisionClientAccount({
      subject: "google|open-signup-2",
      email: "twice@example.test",
      name: "Twice",
    });
    const b = await provisionClientAccount({
      subject: "google|open-signup-2",
      email: "twice@example.test",
      name: "Twice",
    });
    expect(b.id).toBe(a.id);
  });

  it("binds a pre-created unbound row by email (admin-created user, first login)", async () => {
    // Simulates admin pre-creating a user; the first login binds the subject.
    const { createUser } = await import("@/lib/db/users");
    await createUser({ email: "prebound@example.test", role: "CLIENT", name: "Pre Bound" });
    const account = await provisionClientAccount({
      subject: "msa|prebound-sub",
      email: "prebound@example.test",
    });
    expect(account.subject).toBe("msa|prebound-sub");
  });

  it("REFUSES to rebind an email already bound to a different subject", async () => {
    await provisionClientAccount({
      subject: "google|original-sub",
      email: "victim@example.test",
      name: "Original",
    });
    await expect(
      provisionClientAccount({
        subject: "google|imposter-sub",
        email: "victim@example.test",
        name: "Imposter",
      })
    ).rejects.toThrow(/ACCOUNT_CONFLICT/);
    const row = await getUserByEmail("victim@example.test");
    expect(row?.subject).toBe("google|original-sub");
  });
});

describe("a cookie alone still confers nothing", () => {
  it("an authenticated identity with NO account is refused by API routes", async () => {
    const cookie = await cookieFor({
      subject: "google|never-provisioned",
      role: "CLIENT",
      email: "ghost@example.test",
      name: "Ghost",
    });
    const res = await mattersGet(jsonRequest("/api/matters", { method: "GET", cookie }));
    expect(res.status).toBe(403);
    expect(await getUserByEmail("ghost@example.test")).toBeNull();
  });
});

describe("login routing (open signup)", () => {
  const ALLOW = ["attorney@example.test"];
  it("google and msa clients land on their matter", () => {
    for (const provider of ["google", "msa"] as const) {
      expect(
        decideLoginDestination({ provider, boundAccount: null, attorneyAllowlist: ALLOW })
      ).toBe("/portal/matter");
    }
  });
  it("entra remains firm-only", () => {
    expect(() =>
      decideLoginDestination({ provider: "entra", boundAccount: null, attorneyAllowlist: ALLOW })
    ).toThrow(/not linked to an authorized firm account/);
  });
});
