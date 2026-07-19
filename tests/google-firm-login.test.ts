/**
 * Google-as-firm-login authorization (B-followup).
 *
 * A firm-role account (STAFF/ATTORNEY/ADMIN) must be treated as a firm login
 * on EITHER provider, passing the same active + attorney-allowlist gate and
 * landing in /firm or /admin — while Microsoft stays firm-only and a Google
 * client/new identity keeps the invitation path. These assert the exact
 * decision the OAuth callback delegates to decideLoginDestination().
 */
import { describe, it, expect } from "vitest";
import { decideLoginDestination } from "@/lib/auth/authorize-login";
import type { UserRow, UserRole } from "@/lib/db/users";
import { HttpError } from "@/lib/auth/rbac";

const ALLOW = ["attorney@firm.test", "admin@juneguidedsolutions.com"];

function row(role: UserRole, over: Partial<UserRow> = {}): UserRow {
  return {
    id: "u1",
    subject: "google|sub-1",
    email: "person@firm.test",
    name: "Person",
    role,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

describe("decideLoginDestination — Google as a firm login", () => {
  it("routes a Google Workspace ATTORNEY (allowlisted, active) to /firm", () => {
    const dest = decideLoginDestination({
      provider: "google",
      boundAccount: row("ATTORNEY", { email: "admin@juneguidedsolutions.com" }),
      attorneyAllowlist: ALLOW,
    });
    expect(dest).toBe("/firm");
  });

  it("routes a Google ADMIN to /admin and STAFF to /firm", () => {
    expect(
      decideLoginDestination({
        provider: "google",
        boundAccount: row("ADMIN"),
        attorneyAllowlist: ALLOW,
      })
    ).toBe("/admin");
    expect(
      decideLoginDestination({
        provider: "google",
        boundAccount: row("STAFF"),
        attorneyAllowlist: ALLOW,
      })
    ).toBe("/firm");
  });

  it("refuses a Google ATTORNEY NOT on the allowlist (same gate as Microsoft)", () => {
    expect(() =>
      decideLoginDestination({
        provider: "google",
        boundAccount: row("ATTORNEY", { email: "stranger@firm.test" }),
        attorneyAllowlist: ALLOW,
      })
    ).toThrow(HttpError);
  });

  it("refuses an inactive firm account on Google", () => {
    expect(() =>
      decideLoginDestination({
        provider: "google",
        boundAccount: row("ATTORNEY", {
          email: "admin@juneguidedsolutions.com",
          active: false,
        }),
        attorneyAllowlist: ALLOW,
      })
    ).toThrow(/not active/);
  });

  it("keeps the client path: Google CLIENT → /portal/matter, no account → /invite", () => {
    expect(
      decideLoginDestination({
        provider: "google",
        boundAccount: row("CLIENT"),
        attorneyAllowlist: ALLOW,
      })
    ).toBe("/portal/matter");
    expect(
      decideLoginDestination({
        provider: "google",
        boundAccount: null,
        attorneyAllowlist: ALLOW,
      })
    ).toBe("/invite");
  });
});

describe("decideLoginDestination — Microsoft stays firm-only (regression)", () => {
  it("routes an Entra ATTORNEY (allowlisted) to /firm and ADMIN to /admin", () => {
    expect(
      decideLoginDestination({
        provider: "entra",
        boundAccount: row("ATTORNEY", { email: "attorney@firm.test", subject: "entra|t:o" }),
        attorneyAllowlist: ALLOW,
      })
    ).toBe("/firm");
    expect(
      decideLoginDestination({
        provider: "entra",
        boundAccount: row("ADMIN", { subject: "entra|t:o" }),
        attorneyAllowlist: ALLOW,
      })
    ).toBe("/admin");
  });

  it("refuses Microsoft auth that is not a firm account (client or none)", () => {
    expect(() =>
      decideLoginDestination({
        provider: "entra",
        boundAccount: row("CLIENT", { subject: "entra|t:o" }),
        attorneyAllowlist: ALLOW,
      })
    ).toThrow(/authorized firm account/);
    expect(() =>
      decideLoginDestination({
        provider: "entra",
        boundAccount: null,
        attorneyAllowlist: ALLOW,
      })
    ).toThrow(HttpError);
  });
});
