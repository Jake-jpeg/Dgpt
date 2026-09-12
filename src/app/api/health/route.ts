/**
 * Deployment health check (Part 7) — unauthenticated, booleans/labels only.
 * Confirms: app running, database accessible, AI configuration PRESENT
 * (never values), document engine, stage. No secrets, no client
 * data, no counts that could leak activity.
 */
import { getDb } from "@/lib/db/index";
import { appStage } from "@/config/stage";
import { ALLOWED_RENDERS } from "@/lib/pdf-service/types";
import { syntheticEphemeralStorageActive } from "@/lib/storage";
import { aiProviderFor, aiModelFor, PROVIDER_KEY_ENV, AI_TIERS, type AiTier } from "@/config/ai-providers";

export async function GET() {
  let db = "ok";
  try {
    // A REAL round-trip: on Postgres this crosses the network to the managed
    // database, so db:"ok" means production persistence is actually up.
    await getDb().get("SELECT 1 AS one");
  } catch {
    db = "error";
  }
  const body = {
    status: db === "ok" ? "ok" : "degraded",
    stage: appStage(),
    syntheticDemoOnly: process.env.SYNTHETIC_DEMO_ONLY === "true",
    ephemeralStorage: syntheticEphemeralStorageActive(),
    db,
    dbEngine: getDb().dialect,
    // Provider-aware since 2026-08-01: this asked for ANTHROPIC_API_KEY
    // specifically, so it would have read false the moment the platform moved
    // to another provider — a green swap reported as broken.
    aiConfigured: process.env.AI_FEATURES_ENABLED === "true" && everyTierKeyed(),
    // Every AI tier reports where it points, so a swap that forgot a key is
    // visible WITHOUT reading logs. Names and booleans only — never a key,
    // never a fragment of one. A bad provider name is REPORTED rather than
    // thrown: health must answer even when the AI is misconfigured, because
    // that is exactly when it gets read.
    ai: aiTierHealth(),
    // 2026-09-12: the ReportLab PDF service is retired; court forms are built
    // in-process as Word documents. Reported as a label, never a URL.
    documents: { engine: "word", forms: ALLOWED_RENDERS.length },
    pdfService: "retired",
  };
  return Response.json(body, { status: db === "ok" ? 200 : 503 });
}

/** True when every configured tier has its own provider's key present. */
function everyTierKeyed(): boolean {
  try {
    return AI_TIERS.every((t) => Boolean(process.env[PROVIDER_KEY_ENV[aiProviderFor(t)]]));
  } catch {
    return false; // an unresolvable provider is not "configured"
  }
}

function aiTierHealth(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const tier of AI_TIERS) {
    out[tier] = tierHealth(tier);
  }
  return out;
}

function tierHealth(tier: AiTier): { provider: string; model: string; keyConfigured: boolean; error?: string } {
  try {
    const provider = aiProviderFor(tier);
    return {
      provider,
      model: aiModelFor(tier),
      keyConfigured: Boolean(process.env[PROVIDER_KEY_ENV[provider]]),
    };
  } catch (e) {
    return {
      provider: "invalid",
      model: "unresolved",
      keyConfigured: false,
      error: e instanceof Error ? e.message : "AI configuration is invalid",
    };
  }
}
