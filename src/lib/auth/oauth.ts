/**
 * OIDC authorization-code flow with PKCE for both providers. Hand-rolled on
 * jose (JWKS-verified ID tokens) — no password storage, no auth frameworks.
 *
 * Pilot-hardening posture:
 *
 *  - PROVIDERS AUTHENTICATE IDENTITY; THE DATABASE DETERMINES AUTHORIZATION.
 *    The role on the returned identity is a session HINT only — every
 *    protected request reloads the CURRENT role from app_user
 *    (src/lib/auth/authz.ts), and firm accounts must already exist there.
 *
 *  - Microsoft Entra (firm personnel: STAFF/ATTORNEY/ADMIN):
 *      · single-tenant authority — `common`, `consumers`, `organizations`,
 *        and empty tenants are refused at configuration time;
 *      · issuer, audience, signature, expiry, nonce, state, and the tid
 *        claim are all validated;
 *      · identity binds to stable claims (tenant id + object id), NOT email;
 *        email is stored only as a display/contact snapshot;
 *      · scopes: openid profile email — no Microsoft Graph permissions.
 *
 *  - Google (invited clients):
 *      · issuer, audience, signature, expiry, nonce, state validated;
 *      · google issuer + subject is the stable identity;
 *      · email_verified is enforced where supplied;
 *      · scopes: openid profile email — no Gmail/Drive/Calendar/Contacts.
 *
 *  - Env naming: MICROSOFT_* is canonical (MICROSOFT_TENANT_ID,
 *    MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_REDIRECT_URI);
 *    the original ENTRA_* names remain honored. GOOGLE_REDIRECT_URI may
 *    override the derived redirect. Redirect URIs are used verbatim (exact
 *    matching — the same configured value is sent on both legs).
 *
 * State + PKCE verifier + nonce ride in a short-lived signed httpOnly cookie.
 */
import { SignJWT, jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { appUrl, envOptional } from "@/lib/env";
import type { Role } from "./session";

export type ProviderId = "google" | "entra";

/** Multi-tenant authorities are forbidden — the firm tenant is single. */
const FORBIDDEN_TENANTS = new Set(["", "common", "consumers", "organizations"]);

export function microsoftTenantId(): string {
  return (
    envOptional("MICROSOFT_TENANT_ID") ??
    envOptional("ENTRA_TENANT_ID") ??
    ""
  ).trim();
}

/** Throws unless the configured tenant is a specific, single-tenant id. */
export function assertSingleTenant(tenant: string = microsoftTenantId()): string {
  if (FORBIDDEN_TENANTS.has(tenant.toLowerCase())) {
    throw new Error(
      "OAUTH: MICROSOFT_TENANT_ID must be the firm's specific tenant id — " +
        "'common', 'consumers', 'organizations', and empty are not permitted"
    );
  }
  return tenant;
}

function microsoftClientId(): string | undefined {
  return envOptional("MICROSOFT_CLIENT_ID") ?? envOptional("ENTRA_CLIENT_ID");
}
function microsoftClientSecret(): string | undefined {
  return envOptional("MICROSOFT_CLIENT_SECRET") ?? envOptional("ENTRA_CLIENT_SECRET");
}

export function redirectUri(provider: ProviderId): string {
  if (provider === "entra") {
    return envOptional("MICROSOFT_REDIRECT_URI") ?? `${appUrl()}/api/auth/callback/entra`;
  }
  return envOptional("GOOGLE_REDIRECT_URI") ?? `${appUrl()}/api/auth/callback/google`;
}

interface ProviderConfig {
  /** Session-role HINT only; the DB decides authorization. */
  roleHint: Role;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  jwksUri: string;
  issuer: string;
  clientId: string;
  clientSecret: string;
  scope: string;
}

export function providerConfig(provider: ProviderId): ProviderConfig {
  if (provider === "google") {
    return {
      roleHint: "CLIENT",
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
      issuer: "https://accounts.google.com",
      clientId: envOptional("GOOGLE_CLIENT_ID") ?? "",
      clientSecret: envOptional("GOOGLE_CLIENT_SECRET") ?? "",
      // Only identity scopes — never Gmail/Drive/Calendar/Contacts.
      scope: "openid email profile",
    };
  }
  const tenant = assertSingleTenant();
  return {
    roleHint: "STAFF", // hint only; actual firm role comes from app_user
    authorizationEndpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    tokenEndpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    jwksUri: `https://login.microsoftonline.com/${tenant}/discovery/v2.0/keys`,
    issuer: `https://login.microsoftonline.com/${tenant}/v2.0`,
    clientId: microsoftClientId() ?? "",
    clientSecret: microsoftClientSecret() ?? "",
    // Only identity scopes — never Microsoft Graph mail/files/calendar/Teams.
    scope: "openid email profile",
  };
}

export function isProviderConfigured(provider: ProviderId): boolean {
  try {
    const cfg = providerConfig(provider);
    return Boolean(cfg.clientId && cfg.clientSecret);
  } catch {
    return false;
  }
}

export const OAUTH_TX_COOKIE = "dgpt_oauth_tx";

function txSecret(): Uint8Array {
  const s = process.env.SESSION_SECRET ?? "";
  if (!s) throw new Error("Missing required environment variable: SESSION_SECRET");
  return new TextEncoder().encode(s + ":oauth-tx");
}

export async function beginOAuth(provider: ProviderId): Promise<{
  redirectUrl: string;
  txCookie: string;
}> {
  const cfg = providerConfig(provider);
  const state = randomBytes(24).toString("base64url");
  const nonce = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const tx = await new SignJWT({ provider, state, nonce, verifier })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(txSecret());

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri(provider),
    response_type: "code",
    scope: cfg.scope,
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  return {
    redirectUrl: `${cfg.authorizationEndpoint}?${params}`,
    txCookie: `${OAUTH_TX_COOKIE}=${tx}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
  };
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwks(uri: string) {
  let j = jwksCache.get(uri);
  if (!j) {
    j = createRemoteJWKSet(new URL(uri));
    jwksCache.set(uri, j);
  }
  return j;
}

/**
 * Entra identity binding: stable Microsoft claims. Validates the tid claim
 * against the configured single tenant and prefers tenant-id + object-id.
 * Exported for direct testing (wrong-tenant denial).
 */
export function entraStableSubject(payload: JWTPayload, tenant: string): string {
  const tid = typeof payload.tid === "string" ? payload.tid : "";
  if (!tid || tid.toLowerCase() !== tenant.toLowerCase()) {
    throw new Error("OAUTH: id_token tenant (tid) does not match the configured firm tenant");
  }
  const oid = typeof payload.oid === "string" ? payload.oid : "";
  const stable = oid || (typeof payload.sub === "string" ? payload.sub : "");
  if (!stable) throw new Error("OAUTH: no stable subject claim in id_token");
  return `entra|${tid}:${stable}`;
}

/**
 * Google email_verified enforcement — where the claim is supplied it must
 * be true. Exported for direct testing.
 */
export function assertGoogleEmailVerified(payload: JWTPayload): void {
  if (payload.email !== undefined && payload.email_verified === false) {
    throw new Error("OAUTH: Google account email is not verified");
  }
}

export interface OAuthIdentity {
  provider: ProviderId;
  /** Session-role HINT only — authorization is decided by app_user. */
  roleHint: Role;
  /** Stable identity: entra|{tid}:{oid} or google|{sub}. */
  subject: string;
  /** Display/contact snapshot only — never an identity key. */
  email: string;
  name: string;
}

export async function completeOAuth(
  provider: ProviderId,
  url: URL,
  txCookieValue: string | undefined
): Promise<OAuthIdentity> {
  const cfg = providerConfig(provider);
  if (!txCookieValue) throw new Error("OAUTH: missing transaction cookie");

  const { payload: tx } = await jwtVerify(txCookieValue, txSecret());
  if (tx.provider !== provider) throw new Error("OAUTH: provider mismatch");

  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || state !== tx.state) throw new Error("OAUTH: state mismatch");
  if (!code) throw new Error("OAUTH: missing code");

  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(provider), // exact configured value, both legs
    code_verifier: String(tx.verifier),
  });

  const tokenRes = await fetch(cfg.tokenEndpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) throw new Error(`OAUTH: token exchange failed (${tokenRes.status})`);
  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) throw new Error("OAUTH: no id_token in response");

  // Signature, issuer, audience, and expiry are all enforced here.
  const { payload } = await jwtVerify(tokens.id_token, jwks(cfg.jwksUri), {
    audience: cfg.clientId,
    issuer: cfg.issuer,
  });

  // Nonce: the id_token must echo the nonce minted for THIS transaction.
  if (typeof payload.nonce !== "string" || payload.nonce !== tx.nonce) {
    throw new Error("OAUTH: nonce mismatch");
  }

  const email = typeof payload.email === "string" ? payload.email : "";
  const name =
    typeof payload.name === "string"
      ? payload.name
      : typeof payload.given_name === "string"
        ? `${payload.given_name} ${payload.family_name ?? ""}`.trim()
        : email;

  let subject: string;
  if (provider === "entra") {
    subject = entraStableSubject(payload, assertSingleTenant());
  } else {
    assertGoogleEmailVerified(payload);
    if (!payload.sub) throw new Error("OAUTH: no subject in id_token");
    subject = `google|${payload.sub}`;
  }

  return { provider, roleHint: cfg.roleHint, subject, email, name };
}
