/**
 * Deployment health check (Part 7) — unauthenticated, booleans/labels only.
 * Confirms: app running, database accessible, AI configuration PRESENT
 * (never values), PDF service reachable, stage. No secrets, no client
 * data, no counts that could leak activity.
 */
import { getDb } from "@/lib/db/index";
import { appStage } from "@/config/stage";
import { pdfServiceHealthy } from "@/lib/pdf-service/client";
import { syntheticEphemeralStorageActive } from "@/lib/storage";
import { intakeChatProvider, intakeChatModel, PROVIDER_KEY_ENV } from "@/config/ai-providers";

// Cache the PDF probe briefly so frequent platform health checks don't
// hammer the RL service.
let pdfCache: { at: number; value: "disabled" | "ok" | "unreachable" } | null = null;

export async function GET() {
  let db = "ok";
  try {
    // A REAL round-trip: on Postgres this crosses the network to the managed
    // database, so db:"ok" means production persistence is actually up.
    await getDb().get("SELECT 1 AS one");
  } catch {
    db = "error";
  }
  if (!pdfCache || Date.now() - pdfCache.at > 30_000) {
    pdfCache = { at: Date.now(), value: await pdfServiceHealthy() };
  }
  const body = {
    status: db === "ok" ? "ok" : "degraded",
    stage: appStage(),
    syntheticDemoOnly: process.env.SYNTHETIC_DEMO_ONLY === "true",
    ephemeralStorage: syntheticEphemeralStorageActive(),
    db,
    dbEngine: getDb().dialect,
    aiConfigured: process.env.AI_FEATURES_ENABLED === "true" && Boolean(process.env.ANTHROPIC_API_KEY),
    // The intake bot resolves its own provider (2026-08-01), so a swap that
    // forgot the key must be visible WITHOUT reading logs. Names and booleans
    // only — never a key, never a fragment of one. A bad provider name is
    // reported here rather than thrown: health must answer even when the
    // intake is misconfigured, because that is exactly when it is read.
    intakeAi: intakeAiHealth(),
    pdfService: pdfCache.value,
  };
  return Response.json(body, { status: db === "ok" ? 200 : 503 });
}

function intakeAiHealth(): { provider: string; model: string; keyConfigured: boolean; error?: string } {
  try {
    const provider = intakeChatProvider();
    const keyEnv = PROVIDER_KEY_ENV[provider];
    return {
      provider,
      model: intakeChatModel(),
      keyConfigured: Boolean(process.env[keyEnv]),
    };
  } catch (e) {
    return {
      provider: "invalid",
      model: "unresolved",
      keyConfigured: false,
      error: e instanceof Error ? e.message : "intake AI configuration is invalid",
    };
  }
}
