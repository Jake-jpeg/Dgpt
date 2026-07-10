/**
 * OIDC authorization-code flow with PKCE for both providers. Hand-rolled on
 * jose (JWKS-verified ID tokens) — no password storage, no beta auth
 * frameworks, and the two providers are DISTINCT auth paths mapped to
 * DISTINCT roles:
 *
 *   google → CLIENT
 *   entra  → ATTORNEY (plus per-request email allowlist, see rbac.ts)
 *
 * State + PKCE verifier ride in a short-lived signed httpOnly cookie.
 */
import { SignJWT, jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { appUrl, env } from "@/lib/env";
import type { Role } from "./session";

export type ProviderId = "google" | "entra";

interface ProviderConfig {
  role: Role;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  jwksUri: string;
  issuer: string | ((payload: JWTPayload) => boolean);
  clientIdEnv: string;
  clientSecretEnv: string;
  scope: string;
}

function providerConfig(provider: ProviderId): ProviderConfig {
  if (provider === "google") {
    return {
      role: "CLIENT",
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
      issuer: "https://accounts.google.com",
      clientIdEnv: "GOOGLE_CLIENT_ID",
      clientSecretEnv: "GOOGLE_CLIENT_SECRET",
      scope: "openid email profile",
    };
  }
  const tenant = env("ENTRA_TENANT_ID");
  return {
    role: "ATTORNEY",
    authorizationEndpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    tokenEndpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    jwksUri: `https://login.microsoftonline.com/${tenant}/discovery/v2.0/keys`,
    issuer: `https://login.microsoftonline.com/${tenant}/v2.0`,
    clientIdEnv: "ENTRA_CLIENT_ID",
    clientSecretEnv: "ENTRA_CLIENT_SECRET",
    scope: "openid email profile",
  };
}

export function isProviderConfigured(provider: ProviderId): boolean {
  try {
    const cfg = providerConfig(provider);
    return Boolean(process.env[cfg.clientIdEnv] && process.env[cfg.clientSecretEnv]);
  } catch {
    return false;
  }
}

export const OAUTH_TX_COOKIE = "dgpt_oauth_tx";

function txSecret(): Uint8Array {
  return new TextEncoder().encode(env("SESSION_SECRET") + ":oauth-tx");
}

export async function beginOAuth(provider: ProviderId): Promise<{
  redirectUrl: string;
  txCookie: string;
}> {
  const cfg = providerConfig(provider);
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const tx = await new SignJWT({ provider, state, verifier })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(txSecret());

  const params = new URLSearchParams({
    client_id: env(cfg.clientIdEnv),
    redirect_uri: `${appUrl()}/api/auth/callback/${provider}`,
    response_type: "code",
    scope: cfg.scope,
    state,
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

export async function completeOAuth(
  provider: ProviderId,
  url: URL,
  txCookieValue: string | undefined
): Promise<{ role: Role; subject: string; email: string; name: string }> {
  const cfg = providerConfig(provider);
  if (!txCookieValue) throw new Error("OAUTH: missing transaction cookie");

  const { payload: tx } = await jwtVerify(txCookieValue, txSecret());
  if (tx.provider !== provider) throw new Error("OAUTH: provider mismatch");

  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || state !== tx.state) throw new Error("OAUTH: state mismatch");
  if (!code) throw new Error("OAUTH: missing code");

  const body = new URLSearchParams({
    client_id: env(cfg.clientIdEnv),
    client_secret: env(cfg.clientSecretEnv),
    grant_type: "authorization_code",
    code,
    redirect_uri: `${appUrl()}/api/auth/callback/${provider}`,
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

  const { payload } = await jwtVerify(tokens.id_token, jwks(cfg.jwksUri), {
    audience: env(cfg.clientIdEnv),
    ...(typeof cfg.issuer === "string" ? { issuer: cfg.issuer } : {}),
  });

  const email = typeof payload.email === "string" ? payload.email : "";
  const name =
    typeof payload.name === "string"
      ? payload.name
      : typeof payload.given_name === "string"
        ? `${payload.given_name} ${payload.family_name ?? ""}`.trim()
        : email;
  if (!payload.sub) throw new Error("OAUTH: no subject in id_token");

  return {
    role: cfg.role,
    subject: `${provider}|${payload.sub}`,
    email,
    name,
  };
}
