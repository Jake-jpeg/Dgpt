/**
 * Microsoft personal accounts ("msa" — Outlook.com / Hotmail) as a CLIENT
 * door only.
 *
 * Two invariants matter here:
 *   1. msa behaves like the Google client path — invited CLIENT to their
 *      matter, unknown identity to the invitation page — but a firm-role
 *      account is REFUSED. A personal Microsoft account is never a firm login.
 *   2. Adding this provider does not touch the firm's single-tenant `entra`
 *      config. The consumers authority is hard-coded on the msa branch and is
 *      still forbidden as a MICROSOFT_TENANT_ID value.
 */
import { describe, it, expect } from "vitest";
import { decideLoginDestination } from "@/lib/auth/authorize-login";
import {
  providerConfig,
  msaStableSubject,
  assertSingleTenant,
  MSA_CONSUMERS_TENANT,
} from "@/lib/auth/oauth";
import type { UserRow, UserRole } from "@/lib/db/users";
import { HttpError } from "@/lib/auth/rbac";

const ALLOW = ["attorney@firm.test"];

function row(role: UserRole, over: Partial<UserRow> = {}): UserRow {
  return {
    id: "u1",
    subject: "msa|oid-1",
    email: "person@hotmail.com",
    name: "Person",
    role,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

describe("decideLoginDestination — msa is the client door", () => {
  it("routes an invited CLIENT to their matter", () => {
    expect(
      decideLoginDestination({
        provider: "msa",
        boundAccount: row("CLIENT"),
        attorneyAllowlist: ALLOW,
      })
    ).toBe("/portal/matter");
  });

  it("routes an identity with no account to the invitation page", () => {
    expect(
      decideLoginDestination({
        provider: "msa",
        boundAccount: null,
        attorneyAllowlist: ALLOW,
      })
    ).toBe("/invite");
  });

  it("REFUSES a firm-role account arriving on a personal Microsoft account", () => {
    for (const role of ["ATTORNEY", "STAFF", "ADMIN"] as const) {
      expect(() =>
        decideLoginDestination({
          provider: "msa",
          boundAccount: row(role, { email: "attorney@firm.test" }),
          attorneyAllowlist: ALLOW,
        })
      ).toThrow(/Firm accounts must sign in with Microsoft work or firm Google accounts/);
    }
  });

  it("refuses a firm-role msa login even when the account is active and allowlisted", () => {
    // The refusal is about the DOOR, not the account's standing — an
    // otherwise perfectly valid attorney is still turned away here.
    expect(() =>
      decideLoginDestination({
        provider: "msa",
        boundAccount: row("ATTORNEY", { email: "attorney@firm.test", active: true }),
        attorneyAllowlist: ALLOW,
      })
    ).toThrow(HttpError);
  });
});

describe("providerConfig('msa') — consumers authority, identity scopes only", () => {
  it("pins the consumers endpoints, issuer, and client role hint", () => {
    const msa = providerConfig("msa");
    expect(msa.authorizationEndpoint).toBe(
      "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize"
    );
    expect(msa.tokenEndpoint).toBe(
      "https://login.microsoftonline.com/consumers/oauth2/v2.0/token"
    );
    expect(msa.jwksUri).toBe(
      "https://login.microsoftonline.com/consumers/discovery/v2.0/keys"
    );
    expect(msa.issuer).toBe(
      `https://login.microsoftonline.com/${MSA_CONSUMERS_TENANT}/v2.0`
    );
    expect(MSA_CONSUMERS_TENANT).toBe("9188040d-6c67-4c5b-b112-36a304b66dad");
    expect(msa.roleHint).toBe("CLIENT");
  });

  it("requests identity scopes only — no Microsoft Graph permissions", () => {
    const msa = providerConfig("msa");
    expect(msa.scope).toBe("openid email profile");
    for (const forbidden of ["Mail.", "Files.", "Calendars.", "Contacts.", "Chat.", "offline_access"]) {
      expect(msa.scope).not.toContain(forbidden);
    }
  });

  it("binds identity to the consumers tenant and namespaces the subject", () => {
    expect(msaStableSubject({ tid: MSA_CONSUMERS_TENANT, oid: "oid-1", sub: "sub-x" })).toBe(
      "msa|oid-1"
    );
    // oid preferred; sub is the fallback.
    expect(msaStableSubject({ tid: MSA_CONSUMERS_TENANT, sub: "sub-x" })).toBe("msa|sub-x");
    // A work/school token presented on this provider is refused outright.
    expect(() =>
      msaStableSubject({ tid: "11111111-2222-3333-4444-555555555555", oid: "oid-1" })
    ).toThrow(/tenant/);
    expect(() => msaStableSubject({ oid: "oid-1" })).toThrow(/tenant/);
  });
});

describe("the firm entra provider is unchanged by adding msa", () => {
  it("still builds from the configured single tenant, with its own endpoints", () => {
    process.env.MICROSOFT_TENANT_ID = "tenant-abc";
    const entra = providerConfig("entra");
    expect(entra).toEqual({
      roleHint: "STAFF",
      authorizationEndpoint:
        "https://login.microsoftonline.com/tenant-abc/oauth2/v2.0/authorize",
      tokenEndpoint: "https://login.microsoftonline.com/tenant-abc/oauth2/v2.0/token",
      jwksUri: "https://login.microsoftonline.com/tenant-abc/discovery/v2.0/keys",
      issuer: "https://login.microsoftonline.com/tenant-abc/v2.0",
      clientId: entra.clientId,
      clientSecret: entra.clientSecret,
      scope: "openid email profile",
    });
    // Nothing about the msa branch leaked into the firm authority.
    expect(entra.authorizationEndpoint).not.toContain("consumers");
    expect(entra.issuer).not.toContain(MSA_CONSUMERS_TENANT);
  });

  it("still refuses 'consumers' as a configured firm tenant", () => {
    for (const bad of ["common", "consumers", "organizations", "", "COMMON"]) {
      expect(() => assertSingleTenant(bad)).toThrow(/single|not permitted|specific/i);
    }
  });
});
