/**
 * Rate limiting / abuse protection on login and intake endpoints.
 *
 * In-memory sliding window — correct for a single-instance deployment (the
 * Stage-1 target). For a multi-instance deployment, swap the store for Redis
 * behind this same function signature.
 */
import { HttpError } from "@/lib/auth/rbac";

const buckets = new Map<string, number[]>();

export interface RateLimitRule {
  windowMs: number;
  max: number;
}

export const RULES = {
  login: { windowMs: 60_000, max: 10 },
  intake: { windowMs: 60_000, max: 60 },
  // Conversational intake turns: generous but bounded (spec §2.3).
  "intake-chat": { windowMs: 60_000, max: 20 },
  bot: { windowMs: 60_000, max: 20 },
  // Beta-gate unlock attempts: strict — this is a shared-secret door.
  beta: { windowMs: 60_000, max: 5 },
} as const satisfies Record<string, RateLimitRule>;

export function clientKey(req: Request): string {
  // Behind a proxy, configure it to set x-forwarded-for; first hop wins.
  const xff = req.headers.get("x-forwarded-for");
  return (xff ? xff.split(",")[0].trim() : null) ?? "local";
}

export function assertRateLimit(req: Request, ruleName: keyof typeof RULES): void {
  const rule = RULES[ruleName];
  const key = `${ruleName}:${clientKey(req)}`;
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < rule.windowMs);
  if (hits.length >= rule.max) {
    throw new HttpError(429, "Too many requests — slow down and try again");
  }
  hits.push(now);
  buckets.set(key, hits);
  // Opportunistic cleanup to bound memory.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= rule.windowMs)) buckets.delete(k);
    }
  }
}

/** Test hook. */
export function resetRateLimitsForTests(): void {
  buckets.clear();
}
