/**
 * Salted HMAC for audit records. A conflict-HIT audit event must prove "a
 * check ran and returned a hit" without retaining the parties' names —
 * we store HMAC-SHA256(normalized name, AUDIT_HASH_SECRET) instead.
 */
import { createHmac } from "node:crypto";
import { env } from "@/lib/env";
import { normalizeName } from "@/lib/conflict/provider";

export function hashNameForAudit(name: string): string {
  return createHmac("sha256", env("AUDIT_HASH_SECRET"))
    .update(normalizeName(name))
    .digest("hex")
    .slice(0, 32);
}
