/**
 * ONLINE STAGING ACCEPTANCE ORCHESTRATOR (Parts 11–12).
 *
 * Drives the deployed staging app's /api/staging/acceptance endpoint step
 * by step and writes a metadata-only results JSON. SYNTHETIC DATA ONLY.
 *
 * Usage:
 *   STAGING_URL=https://dgpt-staging-xxxx.ondigitalocean.app \
 *   STAGING_ADMIN_SECRET=<the staging ADMIN_SECRET> \
 *   node scripts/staging-acceptance.mjs [--out docs/evidence/online-staging/acceptance.json]
 *
 * Live-call budget: the "ai" steps are the ONLY steps that spend OpenAI
 * calls (one per step). This orchestrator runs exactly four: NJ memo, NJ
 * inconsistency, NY form-readiness narrative, NY jurisdiction summary.
 * The secret is read from env and NEVER printed.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";

function autoSecret() {
  if (process.env.STAGING_ADMIN_SECRET) return process.env.STAGING_ADMIN_SECRET;
  try {
    if (existsSync("./data/stage-secrets.json")) {
      return JSON.parse(readFileSync("./data/stage-secrets.json", "utf8")).ADMIN_SECRET ?? "";
    }
  } catch { /* fall through */ }
  return "";
}

const BASE = (process.env.STAGING_URL ?? "").replace(/\/+$/, "");
const SECRET = autoSecret();
const OUT = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : "docs/evidence/online-staging/acceptance.json";

if (!BASE || !SECRET) {
  console.error("Set STAGING_URL and STAGING_ADMIN_SECRET (values are never printed).");
  process.exit(2);
}

const results = [];
let aiCalls = 0;
const AI_CAP = 5;

async function step(name, params = {}) {
  const res = await fetch(`${BASE}/api/staging/acceptance`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${SECRET}` },
    body: JSON.stringify({ step: name, params }),
  });
  const data = await res.json().catch(() => ({ error: "non-JSON response" }));
  const ok = res.status === 200 && data.ok !== false;
  results.push({ step: name, params: { ...params }, http: res.status, ...data });
  const failed = (data.checks ?? []).filter((c) => !c.pass);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${failed.length ? " — " + failed.map((f) => f.name).join("; ") : ""}`);
  return data;
}

async function ai(matterId, action) {
  if (aiCalls >= AI_CAP) {
    console.log(`SKIP  ai:${action} — live-call cap (${AI_CAP}) reached`);
    return null;
  }
  aiCalls++;
  return step("ai", { matterId, action });
}

async function main() {
  console.log(`Staging acceptance against ${BASE} (synthetic only; ai cap ${AI_CAP})\n`);

  const health = await fetch(`${BASE}/api/health`).then((r) => r.json()).catch(() => null);
  console.log(`health: ${JSON.stringify(health)}`);
  if (!health || health.stage !== "staging") {
    console.error("Refusing: target is not a staging deployment.");
    process.exit(1);
  }

  // A. New Jersey
  const nj = await step("nj-setup");
  const njMatter = nj?.data?.matterId;
  let njMemo = null;
  let njIncon = null;
  if (njMatter) {
    njMemo = await ai(njMatter, "GENERATE_INTAKE_MEMO");
    njIncon = await ai(njMatter, "GENERATE_INCONSISTENCY_REPORT");
    const render = await step("render", { matterId: njMatter, state: "nj", form: "verification" });
    if (render?.data?.versionId) {
      await step("approve-release", {
        matterId: njMatter,
        versionId: String(render.data.versionId),
        documentId: String(render.data.documentId),
        clientKey: "clientNj",
      });
    }
  }

  // B. New York
  const ny = await step("ny-setup");
  const nyMatter = ny?.data?.matterId;
  if (nyMatter) {
    await ai(nyMatter, "GENERATE_FORM_READINESS_REPORT");
    await ai(nyMatter, "GENERATE_JURISDICTION_FACTS_SUMMARY");
    const render = await step("render", { matterId: nyMatter, state: "ny", form: "ud1" });
    if (render?.data?.versionId) {
      await step("approve-release", {
        matterId: nyMatter,
        versionId: String(render.data.versionId),
        documentId: String(render.data.documentId),
        clientKey: "clientNy",
      });
    }
  }

  // C. Negative battery (uses the NJ matter + its unreleased AI artifact).
  if (njMatter) {
    await step("negative", {
      matterId: njMatter,
      aiVersionId: String(njMemo?.data?.versionId ?? njIncon?.data?.versionId ?? ""),
    });
  }

  const summary = {
    target: BASE,
    ranAt: new Date().toISOString(),
    aiCallsSpent: aiCalls,
    aiCap: AI_CAP,
    steps: results,
    allPassed: results.every((r) => r.ok !== false && (r.checks ?? []).every((c) => c.pass)),
  };
  mkdirSync(OUT.split("/").slice(0, -1).join("/") || ".", { recursive: true });
  writeFileSync(OUT, JSON.stringify(summary, null, 2));
  console.log(`\n${summary.allPassed ? "ALL STEPS PASSED" : "FAILURES PRESENT"} — ${OUT}`);
  console.log(`Live OpenAI calls spent: ${aiCalls}/${AI_CAP}`);
  console.log("SYNTHETIC STAGING PROOF — NOT APPROVED FOR LIVE CLIENT USE.");
  process.exit(summary.allPassed ? 0 : 1);
}

main().catch((e) => {
  console.error(e?.message ?? e);
  process.exit(1);
});
