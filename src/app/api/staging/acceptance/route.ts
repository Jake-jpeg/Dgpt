/**
 * ONLINE SYNTHETIC STAGING ACCEPTANCE ENDPOINT (Parts 11–12).
 *
 * Machine endpoint (bearer ADMIN_SECRET, like the retention purge) that is
 * a NEUTRAL 404 unless BOTH:
 *   APP_STAGE=staging AND SYNTHETIC_DEMO_ONLY=true
 * It exists only on the synthetic staging branch, provisions only
 * @example.test identities, and returns metadata-only results (step names,
 * booleans, IDs, hashes, token counts — never prompts, bytes, or secrets).
 */
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { appStage } from "@/config/stage";
import { runAcceptanceStep } from "@/lib/staging/acceptance";

const schema = z.object({
  step: z.enum(["nj-setup", "ny-setup", "ai", "render", "approve-release", "negative"]),
  params: z.record(z.string(), z.string()).default({}),
});

function authorized(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET ?? "";
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (appStage() !== "staging" || process.env.SYNTHETIC_DEMO_ONLY !== "true") {
    return new Response(null, { status: 404 });
  }
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "VALIDATION: invalid acceptance request" }, { status: 400 });
  }
  const origin = process.env.APP_URL?.replace(/\/+$/, "") || new URL(req.url).origin;
  try {
    const result = await runAcceptanceStep(origin, parsed.data.step, parsed.data.params);
    return Response.json(result, { status: result.ok ? 200 : 207 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "acceptance step failed";
    return Response.json({ error: message.slice(0, 300) }, { status: 500 });
  }
}
