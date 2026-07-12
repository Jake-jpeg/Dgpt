/**
 * Session cookies — signed JWTs (HS256, jose) in httpOnly cookies. No
 * passwords are ever stored; identity comes from Google (clients) or
 * Microsoft Entra ID (attorney side), or the dev stub in non-production.
 *
 * Role separation is carried in the token and re-verified server-side on
 * every request (src/lib/auth/rbac.ts) — the client is never trusted.
 */
import { SignJWT, jwtVerify } from "jose";
import { env, isProduction } from "@/lib/env";

export type Role = "CLIENT" | "STAFF" | "ATTORNEY" | "ADMIN";

const ROLES: readonly string[] = ["CLIENT", "STAFF", "ATTORNEY", "ADMIN"];

export interface SessionUser {
  /** Opaque stable subject: `${provider}|${providerSubject}` */
  subject: string;
  role: Role;
  email: string;
  name: string;
}

export const SESSION_COOKIE = "dgpt_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function secretKey(): Uint8Array {
  const s = env("SESSION_SECRET");
  if (s.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return new TextEncoder().encode(s);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    role: user.role,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.subject)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setIssuer("dgpt2")
    .setAudience("dgpt2")
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: "dgpt2",
      audience: "dgpt2",
      algorithms: ["HS256"],
    });
    const role = payload.role;
    if (typeof role !== "string" || !ROLES.includes(role)) return null;
    if (typeof payload.sub !== "string") return null;
    return {
      subject: payload.sub,
      role: role as Role,
      email: typeof payload.email === "string" ? payload.email : "",
      name: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}

export function sessionCookieHeader(token: string): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (isProduction()) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.get("cookie") ?? "";
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  return verifySessionToken(token);
}
