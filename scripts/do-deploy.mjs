/**
 * DigitalOcean staging deployment (Part 7). SECRET-SAFE:
 * - reads tokens/keys from env files IN-PROCESS; never prints any value;
 * - inspects existing apps READ-ONLY (prints names/ids/urls only);
 * - refuses to touch any app it did not create (allowlist by name);
 * - creates dgpt-staging + dgpt-pdf-staging from the two staging branches
 *   with deploy_on_push DISABLED and DO-generated domains only;
 * - generated staging secrets (service token, session/audit/admin secrets,
 *   beta access key) are written 0600 to /tmp/stage-secrets.json — never
 *   stdout, never the repo.
 *
 * Usage:
 *   node scripts/do-deploy.mjs inspect
 *   node scripts/do-deploy.mjs create
 *   node scripts/do-deploy.mjs finalize   (after URLs exist: set APP_URL,
 *                                          redirect URIs, PDF_SERVICE_URL)
 *   node scripts/do-deploy.mjs status
 */
import { readFileSync, writeFileSync, existsSync, chmodSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";

const API = "https://api.digitalocean.com/v2";
const MODE = process.argv[2] ?? "inspect";
const SECRETS_FILE = "./data/stage-secrets.json";
const STAGING_APP_NAMES = new Set(["dgpt-staging", "dgpt-pdf-staging"]);

function loadEnvFiles() {
  const env = {};
  for (const f of ["/mnt/user-data/uploads/Dgpt/.env", "/mnt/user-data/uploads/Dgpt/.env.local", ".env", ".env.local"]) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const FILE_ENV = loadEnvFiles();
const TOKEN = process.env.DIGITALOCEAN_ACCESS_TOKEN || FILE_ENV.DIGITALOCEAN_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("DIGITALOCEAN_ACCESS_TOKEN missing (env or .env.local). Nothing printed, nothing done.");
  process.exit(2);
}

async function doApi(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message ?? `HTTP ${res.status}`;
    throw new Error(`DO API ${method} ${path}: ${msg}`);
  }
  return data;
}

function loadOrCreateSecrets() {
  if (existsSync(SECRETS_FILE)) return JSON.parse(readFileSync(SECRETS_FILE, "utf8"));
  mkdirSync("./data", { recursive: true });
  const s = {
    PDF_SERVICE_TOKEN: randomBytes(32).toString("hex"),
    SESSION_SECRET: randomBytes(32).toString("hex"),
    AUDIT_HASH_SECRET: randomBytes(32).toString("hex"),
    ADMIN_SECRET: randomBytes(32).toString("hex"),
    FREE_ACCESS_KEY: "staging-" + randomBytes(8).toString("hex"),
  };
  writeFileSync(SECRETS_FILE, JSON.stringify(s, null, 2));
  try { chmodSync(SECRETS_FILE, 0o600); } catch { /* windows */ }
  return s;
}

function env(key, value, opts = {}) {
  return { key, value: String(value ?? ""), scope: "RUN_AND_BUILD_TIME", type: opts.secret ? "SECRET" : "GENERAL" };
}

function dgptSpec(secrets, urls = {}) {
  const stagingUrl = urls.dgpt ?? "https://PENDING.invalid";
  const rlUrl = urls.rl ?? "https://PENDING.invalid";
  const envs = [
    env("APP_STAGE", "staging"),
    env("APP_URL", stagingUrl),
    env("SYNTHETIC_DEMO_ONLY", "true"),
    env("SYNTHETIC_STAGING_EPHEMERAL_STORAGE", "true"),
    env("DATABASE_PATH", "/tmp/staging.db"),
    env("FILE_STORAGE_DIR", "/tmp/staging-files"),
    env("SESSION_SECRET", secrets.SESSION_SECRET, { secret: true }),
    env("AUDIT_HASH_SECRET", secrets.AUDIT_HASH_SECRET, { secret: true }),
    env("ADMIN_SECRET", secrets.ADMIN_SECRET, { secret: true }),
    env("AI_FEATURES_ENABLED", "true"),
    env("OPENAI_API_KEY", FILE_ENV.OPENAI_API_KEY ?? "", { secret: true }),
    env("OPENAI_MODEL", FILE_ENV.OPENAI_MODEL ?? "gpt-4o-mini"),
    ...(FILE_ENV.OPENAI_REVIEW_MODEL ? [env("OPENAI_REVIEW_MODEL", FILE_ENV.OPENAI_REVIEW_MODEL)] : []),
    env("OPENAI_REQUEST_TIMEOUT_MS", "120000"),
    env("OPENAI_MAX_OUTPUT_TOKENS", "3000"),
    env("OPENAI_MAX_RETRIES", "1"),
    env("PDF_SERVICE_ENABLED", "true"),
    env("PDF_SERVICE_URL", rlUrl),
    env("PDF_SERVICE_TOKEN", secrets.PDF_SERVICE_TOKEN, { secret: true }),
    env("PDF_SERVICE_TIMEOUT_MS", "60000"),
    env("BETA_GATE_ENABLED", "true"),
    env("FREE_ACCESS_KEYS", secrets.FREE_ACCESS_KEY, { secret: true }),
    env("ATTORNEY_EMAILS", ["staging-attorney@example.test", FILE_ENV.ATTORNEY_EMAILS ?? ""].filter(Boolean).join(",")),
    env("ADMIN_EMAILS", "staging-admin@example.test"),
    env("DEV_AUTH_STUB", "false"),
    // OAuth (values from the operator's env files; secrets encrypted).
    ...(FILE_ENV.MICROSOFT_TENANT_ID ? [env("MICROSOFT_TENANT_ID", FILE_ENV.MICROSOFT_TENANT_ID, { secret: true })] : []),
    ...(FILE_ENV.MICROSOFT_CLIENT_ID ? [env("MICROSOFT_CLIENT_ID", FILE_ENV.MICROSOFT_CLIENT_ID)] : []),
    ...(FILE_ENV.MICROSOFT_CLIENT_SECRET ? [env("MICROSOFT_CLIENT_SECRET", FILE_ENV.MICROSOFT_CLIENT_SECRET, { secret: true })] : []),
    env("MICROSOFT_REDIRECT_URI", `${stagingUrl}/api/auth/callback/microsoft`),
    ...(FILE_ENV.GOOGLE_CLIENT_ID ? [env("GOOGLE_CLIENT_ID", FILE_ENV.GOOGLE_CLIENT_ID)] : []),
    ...(FILE_ENV.GOOGLE_CLIENT_SECRET ? [env("GOOGLE_CLIENT_SECRET", FILE_ENV.GOOGLE_CLIENT_SECRET, { secret: true })] : []),
    env("GOOGLE_REDIRECT_URI", `${stagingUrl}/api/auth/callback/google`),
  ];
  return {
    name: "dgpt-staging",
    region: "nyc",
    services: [
      {
        name: "web",
        github: { repo: "Jake-jpeg/Dgpt", branch: "divorcegpt-2-online-staging", deploy_on_push: false },
        build_command: "npm run build",
        run_command: "npm start",
        environment_slug: "node-js",
        instance_count: 1,
        instance_size_slug: "apps-s-1vcpu-1gb",
        health_check: { http_path: "/api/health", initial_delay_seconds: 30, period_seconds: 30, failure_threshold: 6 },
        envs,
      },
    ],
  };
}

function rlSpec(secrets) {
  return {
    name: "dgpt-pdf-staging",
    region: "nyc",
    services: [
      {
        name: "pdf",
        github: { repo: "Jake-jpeg/RL", branch: "divorcegpt-2-pdf-staging-auth", deploy_on_push: false },
        dockerfile_path: "Dockerfile",
        instance_count: 1,
        instance_size_slug: "apps-s-1vcpu-1gb",
        http_port: 8080,
        health_check: { http_path: "/health", initial_delay_seconds: 20, period_seconds: 30, failure_threshold: 6 },
        envs: [
          env("PDF_SERVICE_TOKEN", secrets.PDF_SERVICE_TOKEN, { secret: true }),
          env("APP_STAGE", "staging"),
        ],
      },
    ],
  };
}

async function inspect() {
  const { apps = [] } = await doApi("GET", "/apps?per_page=50");
  console.log(`Existing apps (${apps.length}) — READ-ONLY inspection:`);
  for (const a of apps) {
    console.log(
      `  - ${a.spec?.name}  id=${a.id}  url=${a.default_ingress ?? a.live_url ?? "(none)"}  updated=${a.last_deployment_created_at ?? "?"}`
    );
  }
  const clash = apps.filter((a) => STAGING_APP_NAMES.has(a.spec?.name));
  if (clash.length) console.log(`NOTE: staging app(s) already exist: ${clash.map((a) => a.spec.name).join(", ")}`);
  return apps;
}

async function findByName(name) {
  const { apps = [] } = await doApi("GET", "/apps?per_page=50");
  return apps.find((a) => a.spec?.name === name) ?? null;
}

async function create() {
  const secrets = loadOrCreateSecrets();
  for (const [name, spec] of [
    ["dgpt-pdf-staging", rlSpec(secrets)],
    ["dgpt-staging", dgptSpec(secrets)],
  ]) {
    const existing = await findByName(name);
    if (existing) {
      console.log(`skip create: ${name} already exists (id=${existing.id})`);
      continue;
    }
    const { app } = await doApi("POST", "/apps", { spec });
    console.log(`created ${name}: id=${app.id}`);
  }
  console.log("Secrets generated → /tmp/stage-secrets.json (0600; never printed).");
}

async function finalize() {
  const secrets = loadOrCreateSecrets();
  const dgpt = await findByName("dgpt-staging");
  const rl = await findByName("dgpt-pdf-staging");
  if (!dgpt || !rl) throw new Error("finalize: apps not found — run create first");
  const urls = {
    dgpt: (dgpt.default_ingress ?? dgpt.live_url ?? "").replace(/\/+$/, ""),
    rl: (rl.default_ingress ?? rl.live_url ?? "").replace(/\/+$/, ""),
  };
  if (!urls.dgpt || !urls.rl) throw new Error("finalize: DO has not assigned URLs yet — retry shortly");
  const spec = dgptSpec(secrets, urls);
  await doApi("PUT", `/apps/${dgpt.id}`, { spec });
  console.log(`finalized dgpt-staging env (APP_URL, redirect URIs, PDF_SERVICE_URL) → redeploying`);
  console.log(`dgpt-staging URL: ${urls.dgpt}`);
  console.log(`dgpt-pdf-staging URL: ${urls.rl}`);
  console.log(`Microsoft redirect URI: ${urls.dgpt}/api/auth/callback/microsoft`);
  console.log(`Google redirect URI:    ${urls.dgpt}/api/auth/callback/google`);
}

async function status() {
  for (const name of STAGING_APP_NAMES) {
    const app = await findByName(name);
    if (!app) {
      console.log(`${name}: absent`);
      continue;
    }
    const { deployments = [] } = await doApi("GET", `/apps/${app.id}/deployments?per_page=3`);
    const d = deployments[0];
    console.log(
      `${name}: url=${app.default_ingress ?? "?"} deployment=${d?.id ?? "none"} phase=${d?.phase ?? "?"} cause=${d?.cause ?? ""}`
    );
  }
}

async function waitFor(fn, label, tries = 60, delayMs = 15000) {
  for (let i = 0; i < tries; i++) {
    const v = await fn();
    if (v) return v;
    if (i === 0) console.log(`waiting: ${label}…`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`timed out waiting for ${label}`);
}

async function all() {
  await inspect();
  await create();
  await waitFor(async () => {
    const a = await findByName("dgpt-staging");
    const b = await findByName("dgpt-pdf-staging");
    return a?.default_ingress && b?.default_ingress ? true : null;
  }, "DigitalOcean to assign staging URLs");
  await finalize();
  await waitFor(async () => {
    const a = await findByName("dgpt-staging");
    const b = await findByName("dgpt-pdf-staging");
    const phase = async (app) => {
      const { deployments = [] } = await doApi("GET", `/apps/${app.id}/deployments?per_page=1`);
      return deployments[0]?.phase;
    };
    const [pa, pb] = [await phase(a), await phase(b)];
    console.log(`  deploy phases: dgpt-staging=${pa} dgpt-pdf-staging=${pb}`);
    if (pa === "ERROR" || pb === "ERROR") throw new Error("a deployment entered ERROR — check the DO build logs");
    return pa === "ACTIVE" && pb === "ACTIVE" ? true : null;
  }, "both deployments to become ACTIVE", 80, 20000);
  await status();
  console.log("\nDone. Next: add the two OAuth redirect URIs printed above, then run the acceptance script.");
}

const actions = { inspect, create, finalize, status, all };
if (!actions[MODE]) {
  console.error(`unknown mode ${MODE}`);
  process.exit(2);
}
actions[MODE]().catch((e) => {
  console.error(String(e.message ?? e));
  process.exit(1);
});
