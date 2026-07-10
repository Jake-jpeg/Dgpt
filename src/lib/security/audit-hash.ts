/**
 * Salted HMAC for audit records. A conflict-HIT audit event must prove "a
 * check ran and returned a hit" without retaining the parties' names —
 * we store HMAC-SHA256(normalized name, AUDIT_HASH_SECRET) instead.
 */
import { createHmac } from "node:crypto";
import { env, envOptional } from "@/lib/env";
import { normalizeName } from "@/lib/conflict/provider";

/**
 * Prefer a dedicated AUDIT_HASH_SECRET; when it isn't set, derive a distinct
 * salt from SESSION_SECRET so the conflict-hit audit path never hard-fails
 * on a missing env var. Set AUDIT_HASH_SECRET explicitly in production —
 * a separate salt means a leaked session secret still doesn't help reverse
 * audit hashes.
 */
function auditSalt(): string {
  return envOptional("AUDIT_HASH_SECRET") ?? `${env("SESSION_SECRET")}:audit-salt-v1`;
}

export function hashNameForAudit(name: string): string {
  return createHmac("sha256", auditSalt())
    .update(normalizeName(name))
    .digest("hex")
    .slice(0, 32);
}
