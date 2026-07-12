/**
 * B15 — OPT-IN live OpenAI Responses-API smoke test.
 *
 * Runs ONLY when RUN_OPENAI_SMOKE=true. Makes exactly one minimal
 * structured-output call using the same request contract as the app's
 * server-only AI layer (strict json_schema, store:false, salted
 * safety_identifier, bounded output tokens, timeout). The prompt is fully
 * synthetic — no matter data, no client data, no documents.
 *
 * SECRETS: the key is read from the environment (or .env.local, loaded
 * in-process) and is NEVER printed, logged, or included in output. This
 * script prints METADATA ONLY: status, model, response id, latency, token
 * counts.
 *
 * Usage:
 *   RUN_OPENAI_SMOKE=true node scripts/openai-smoke.mjs
 *   RUN_OPENAI_SMOKE=true OPENAI_MODEL=gpt-4o-mini node scripts/openai-smoke.mjs
 *
 * Exit codes: 0 PASS · 1 provider/contract failure · 2 not opted in / no key.
 */
import { createHmac } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";

if (process.env.RUN_OPENAI_SMOKE !== "true") {
  console.log("openai-smoke: RUN_OPENAI_SMOKE is not 'true' — refusing to make a live call.");
  console.log("This live smoke test is opt-in by design. Nothing was sent anywhere.");
  process.exit(2);
}

// Load .env.local / .env in-process (values are never printed).
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    const [, k, raw] = m;
    if (process.env[k] === undefined) {
      process.env[k] = raw.replace(/^["']|["']$/g, "");
    }
  }
}

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.log("openai-smoke: OPENAI_API_KEY is not configured (env or .env.local). No call made.");
  process.exit(2);
}

const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
const timeoutMs = Number(process.env.OPENAI_REQUEST_TIMEOUT_MS || "60000") || 60000;

// Same salted-hash construction the app uses — never PII.
const salt = process.env.AUDIT_HASH_SECRET || process.env.SESSION_SECRET || "dgpt";
const safetyIdentifier =
  "m-" + createHmac("sha256", salt).update("openai-smoke-test").digest("hex").slice(0, 24);

// Minimal strict schema in the same shape family as the app's reports.
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "echo", "arithmetic"],
  properties: {
    kind: { type: "string", enum: ["SmokeCheck"] },
    echo: { type: "string" },
    arithmetic: { type: "integer" },
  },
};

const body = JSON.stringify({
  model,
  input: [
    {
      role: "system",
      content:
        "You are a smoke-test responder for a law-firm system integration check. " +
        "This request contains NO client data. Respond only in the required JSON schema.",
    },
    {
      role: "user",
      content:
        'Reply with kind="SmokeCheck", echo="synthetic-ok", and arithmetic = 17 + 25.',
    },
  ],
  text: {
    format: { type: "json_schema", name: "SmokeCheck", strict: true, schema },
  },
  max_output_tokens: 200,
  store: false,
  safety_identifier: safetyIdentifier,
});

const headers = { "content-type": "application/json", authorization: `Bearer ${key}` };
if (process.env.OPENAI_ORG_ID) headers["OpenAI-Organization"] = process.env.OPENAI_ORG_ID;
if (process.env.OPENAI_PROJECT_ID) headers["OpenAI-Project"] = process.env.OPENAI_PROJECT_ID;

console.log("openai-smoke: one live structured call (synthetic prompt, store:false)…");
console.log(`  model requested : ${model}`);

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs);
const started = Date.now();

try {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers,
    body,
    signal: controller.signal,
  });
  clearTimeout(timer);
  const latency = Date.now() - started;

  if (res.status === 401 || res.status === 403) {
    console.log(`  FAIL — provider rejected credentials (HTTP ${res.status}). Check key/org/project.`);
    process.exit(1);
  }
  if (res.status === 404 || res.status === 400) {
    console.log(`  FAIL — provider request invalid (HTTP ${res.status}); the configured model may be unavailable. No fallback is attempted.`);
    process.exit(1);
  }
  if (!res.ok) {
    console.log(`  FAIL — provider error (HTTP ${res.status}).`);
    process.exit(1);
  }

  const data = await res.json();
  const text =
    data.output_text ??
    (data.output ?? [])
      .flatMap((o) => o.content ?? [])
      .filter((c) => c.type === "output_text" || c.type === "text")
      .map((c) => c.text ?? "")
      .join("");

  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.log("  FAIL — response was not valid JSON despite strict json_schema.");
    process.exit(1);
  }

  const structureOk =
    parsed &&
    parsed.kind === "SmokeCheck" &&
    typeof parsed.echo === "string" &&
    Number.isInteger(parsed.arithmetic);
  const arithmeticOk = parsed.arithmetic === 42;

  console.log(`  HTTP            : ${res.status}`);
  console.log(`  model used      : ${data.model ?? "(not reported)"}`);
  console.log(`  response id     : ${data.id ?? "(none)"}`);
  console.log(`  latency         : ${latency} ms`);
  console.log(`  tokens in/out   : ${data.usage?.input_tokens ?? "?"} / ${data.usage?.output_tokens ?? "?"}`);
  console.log(`  strict schema   : ${structureOk ? "conforms" : "VIOLATION"}`);
  console.log(`  arithmetic check: ${arithmeticOk ? "42 ✓" : `unexpected ${parsed.arithmetic}`}`);

  if (structureOk && arithmeticOk) {
    console.log("\nPASS — Responses API structured-output contract verified. Metadata only; nothing stored.");
    process.exit(0);
  }
  console.log("\nFAIL — structure or content check failed (see above).");
  process.exit(1);
} catch (e) {
  clearTimeout(timer);
  const reason = e?.name === "AbortError" ? `timed out after ${timeoutMs} ms` : "network/transport error";
  console.log(`  FAIL — ${reason}. (No secrets are ever printed by this script.)`);
  process.exit(1);
}
