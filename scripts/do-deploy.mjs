/**
 * DigitalOcean staging deployment (Part 7) — HARDENED. SECRET-SAFE:
 * - reads tokens/keys from env files IN-PROCESS at runtime; never prints
 *   any value, length, prefix, suffix, or Authorization header;
 * - inspects existing apps READ-ONLY with FULL pagination (exact-name
 *   matching only — no prefixes, no substrings);
 * - OWNERSHIP GUARD: never updates (and never "adopts") an app on name
 *   alone — the target must match the authorized repo/branch, have
 *   deploy_on_push=false, APP_STAGE=staging, the management marker
 *   DGPT_STAGING_MANAGED_BY=divorcegpt-do-deploy-v1, and no custom domain;
 *   any same-name app failing a check ABORTS the run (fail closed);
 * - creates ONLY dgpt-staging + dgpt-pdf-staging from the two staging
 *   branches, deploy_on_push DISABLED, DO-generated domains only;
 * - generated staging secrets are written ATOMICALLY OUTSIDE the
 *   repository (STAGING_SECRETS_PATH, or the OS user-data default:
 *   %LOCALAPPDATA%\JakeKimLawFirm\DivorceGPT\stage-secrets.json on
 *   Windows, $XDG_DATA_HOME or ~/.local/share/JakeKimLawFirm/DivorceGPT/
 *   stage-secrets.json elsewhere) — never stdout, never the repo. chmod
 *   600 where supported; on Windows, filesystem ACLs remain under
 *   operator control.
 *
 * Usage:
 *   node scripts/do-deploy.mjs all --dry-run   (no network, no secrets)
 *   node scripts/do-deploy.mjs probe           (read-only reachability check:
 *                                               ONE GET /v2/apps?per_page=1&page=1)
 *   node scripts/do-deploy.mjs inspect | create | finalize | status | all
 *
 * Transport (Node 22+/24, Windows PowerShell examples) — every request has a
 * 30s timeout and failures print a SANITIZED diagnostic (error name/message,
 * cause code/message, method, pathname, timeout flag — never tokens, headers,
 * env values, or request bodies). If `probe` fails at the transport layer:
 *   IPv4-first DNS : $env:NODE_OPTIONS="--dns-result-order=ipv4first"
 *   System CA store: $env:NODE_OPTIONS="--use-system-ca"          (corporate
 *                    TLS-inspection roots; combinable with the flag above)
 *   Env proxy      : $env:NODE_USE_ENV_PROXY="1"  (Node 24+: fetch honors
 *                    HTTPS_PROXY/HTTP_PROXY/NO_PROXY when set)
 *
 * Minimum DigitalOcean custom-token scopes: app:read, app:create,
 * app:update. No delete scope is needed; no DELETE request exists.
 */
import { readFileSync, writeFileSync, existsSync, chmodSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://api.digitalocean.com/v2";

export const MARKER_KEY = "DGPT_STAGING_MANAGED_BY";
export const MARKER_VALUE = "divorcegpt-do-deploy-v1";

/** The ONLY authorized apps and sources. Exact equality everywhere. */
export const AUTHORIZED = {
  "dgpt-staging": { repo: "Jake-jpeg/Dgpt", branch: "divorcegpt-2-online-staging" },
  "dgpt-pdf-staging": { repo: "Jake-jpeg/RL", branch: "divorcegpt-2-pdf-staging-auth" },
};

/* ── secrets storage (OUTSIDE the repository) ─────────────────────── */

export function defaultSecretsPath(platform = process.platform, env = process.env) {
  if (platform === "win32") {
    const base = env.LOCALAPPDATA || path.join(homedir(), "AppData", "Local");
    return path.join(base, "JakeKimLawFirm", "DivorceGPT", "stage-secrets.json");
  }
  const base = env.XDG_DATA_HOME || path.join(homedir(), ".local", "share");
  return path.join(base, "JakeKimLawFirm", "DivorceGPT", "stage-secrets.json");
}

export function resolveSecretsPath(env = process.env) {
  return env.STAGING_SECRETS_PATH && env.STAGING_SECRETS_PATH.trim()
    ? env.STAGING_SECRETS_PATH.trim()
    : defaultSecretsPath(process.platform, env);
}

/** Atomic write: tmp file in the same directory, then rename. */
export function writeSecretsAtomic(filePath, obj) {
  const dir = path.dirname(filePath);
  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    throw new Error(`secrets store: could not create directory ${dir}`);
  }
  const tmp = path.join(dir, `.stage-secrets.${process.pid}.${randomBytes(4).toString("hex")}.tmp`);
  try {
    writeFileSync(tmp, JSON.stringify(obj, null, 2));
    try {
      chmodSync(tmp, 0o600);
    } catch {
      /* Windows: NTFS ACLs are operator-controlled; chmod is a no-op */
    }
    renameSync(tmp, filePath);
  } catch {
    try {
      rmSync(tmp, { force: true });
    } catch {
      /* best effort: never leave a partial secrets file */
    }
    throw new Error(`secrets store: atomic write failed for ${filePath}`);
  }
  return filePath;
}

export function loadOrCreateSecrets(env = process.env) {
  const file = resolveSecretsPath(env);
  if (existsSync(file)) {
    try {
      return { secrets: JSON.parse(readFileSync(file, "utf8")), file };
    } catch {
      throw new Error(`secrets store: unreadable JSON at ${file} (contents never printed)`);
    }
  }
  const secrets = {
    PDF_SERVICE_TOKEN: randomBytes(32).toString("hex"),
    SESSION_SECRET: randomBytes(32).toString("hex"),
    AUDIT_HASH_SECRET: randomBytes(32).toString("hex"),
    ADMIN_SECRET: randomBytes(32).toString("hex"),
    FREE_ACCESS_KEY: "staging-" + randomBytes(8).toString("hex"),
  };
  writeSecretsAtomic(file, secrets);
  return { secrets, file };
}

/* ── env files (runtime only; values stay in-process) ─────────────── */

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

/* ── app specs ────────────────────────────────────────────────────── */

function env(key, value, opts = {}) {
  return { key, value: String(value ?? ""), scope: "RUN_AND_BUILD_TIME", type: opts.secret ? "SECRET" : "GENERAL" };
}

export function buildDgptSpec(fileEnv, secrets, urls = {}) {
  const stagingUrl = urls.dgpt ?? "https://PENDING.invalid";
  const rlUrl = urls.rl ?? "https://PENDING.invalid";
  const envs = [
    env(MARKER_KEY, MARKER_VALUE),
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
    env("OPENAI_API_KEY", fileEnv.OPENAI_API_KEY ?? "", { secret: true }),
    env("OPENAI_MODEL", fileEnv.OPENAI_MODEL ?? "gpt-4o-mini"),
    ...(fileEnv.OPENAI_REVIEW_MODEL ? [env("OPENAI_REVIEW_MODEL", fileEnv.OPENAI_REVIEW_MODEL)] : []),
    env("OPENAI_REQUEST_TIMEOUT_MS", "120000"),
    env("OPENAI_MAX_OUTPUT_TOKENS", "3000"),
    env("OPENAI_MAX_RETRIES", "1"),
    env("PDF_SERVICE_ENABLED", "true"),
    env("PDF_SERVICE_URL", rlUrl),
    env("PDF_SERVICE_TOKEN", secrets.PDF_SERVICE_TOKEN, { secret: true }),
    env("PDF_SERVICE_TIMEOUT_MS", "60000"),
    env("BETA_GATE_ENABLED", "true"),
    env("FREE_ACCESS_KEYS", secrets.FREE_ACCESS_KEY, { secret: true }),
    // Authorization configuration + personal identifiers: SECRET-typed.
    env("ATTORNEY_EMAILS", ["staging-attorney@example.test", fileEnv.ATTORNEY_EMAILS ?? ""].filter(Boolean).join(","), { secret: true }),
    env("ADMIN_EMAILS", "staging-admin@example.test", { secret: true }),
    env("DEV_AUTH_STUB", "false"),
    ...(fileEnv.MICROSOFT_TENANT_ID ? [env("MICROSOFT_TENANT_ID", fileEnv.MICROSOFT_TENANT_ID, { secret: true })] : []),
    ...(fileEnv.MICROSOFT_CLIENT_ID ? [env("MICROSOFT_CLIENT_ID", fileEnv.MICROSOFT_CLIENT_ID)] : []),
    ...(fileEnv.MICROSOFT_CLIENT_SECRET ? [env("MICROSOFT_CLIENT_SECRET", fileEnv.MICROSOFT_CLIENT_SECRET, { secret: true })] : []),
    env("MICROSOFT_REDIRECT_URI", `${stagingUrl}/api/auth/callback/microsoft`),
    ...(fileEnv.GOOGLE_CLIENT_ID ? [env("GOOGLE_CLIENT_ID", fileEnv.GOOGLE_CLIENT_ID)] : []),
    ...(fileEnv.GOOGLE_CLIENT_SECRET ? [env("GOOGLE_CLIENT_SECRET", fileEnv.GOOGLE_CLIENT_SECRET, { secret: true })] : []),
    env("GOOGLE_REDIRECT_URI", `${stagingUrl}/api/auth/callback/google`),
  ];
  return {
    name: "dgpt-staging",
    region: "nyc",
    services: [
      {
        name: "web",
        github: { repo: AUTHORIZED["dgpt-staging"].repo, branch: AUTHORIZED["dgpt-staging"].branch, deploy_on_push: false },
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

export function buildRlSpec(secrets) {
  return {
    name: "dgpt-pdf-staging",
    region: "nyc",
    services: [
      {
        name: "pdf",
        github: { repo: AUTHORIZED["dgpt-pdf-staging"].repo, branch: AUTHORIZED["dgpt-pdf-staging"].branch, deploy_on_push: false },
        dockerfile_path: "Dockerfile",
        instance_count: 1,
        instance_size_slug: "apps-s-1vcpu-1gb",
        http_port: 8080,
        health_check: { http_path: "/health", initial_delay_seconds: 20, period_seconds: 30, failure_threshold: 6 },
        envs: [
          env(MARKER_KEY, MARKER_VALUE),
          env("PDF_SERVICE_TOKEN", secrets.PDF_SERVICE_TOKEN, { secret: true }),
          env("APP_STAGE", "staging"),
        ],
      },
    ],
  };
}

/* ── ownership guard ──────────────────────────────────────────────── */

/**
 * Never trust a name. An existing app may be updated/continued ONLY when
 * every check passes. Returns sanitized failure codes — never env values.
 */
export function verifyOwnership(app, name) {
  const failures = [];
  const authorized = AUTHORIZED[name];
  const spec = app?.spec ?? {};
  if (!authorized) failures.push("UNAUTHORIZED_NAME");
  if (spec.name !== name) failures.push("NAME_MISMATCH");

  const services = spec.services ?? [];
  if (services.length === 0) failures.push("NO_SERVICES");
  for (const svc of services) {
    const gh = svc.github ?? {};
    if (gh.repo !== authorized?.repo) failures.push("REPO_MISMATCH");
    if (gh.branch !== authorized?.branch) failures.push("BRANCH_MISMATCH");
    if (gh.deploy_on_push !== false) failures.push("DEPLOY_ON_PUSH_ENABLED");
    const envs = svc.envs ?? [];
    const get = (k) => envs.find((e) => e.key === k);
    if (get("APP_STAGE")?.value !== "staging") failures.push("APP_STAGE_NOT_STAGING");
    if (get(MARKER_KEY)?.value !== MARKER_VALUE) failures.push("MISSING_MANAGEMENT_MARKER");
  }
  if (Array.isArray(spec.domains) && spec.domains.length > 0) failures.push("CUSTOM_DOMAIN_ATTACHED");
  return { ok: failures.length === 0, failures: [...new Set(failures)] };
}

export class CollisionError extends Error {
  constructor(name, failures) {
    // Sanitized: app name + check codes only. Never spec or env contents.
    super(
      `COLLISION: an app named "${name}" exists but FAILED ownership verification (${failures.join(", ")}). ` +
        `Aborting without modifying it. No similarly named app will be created. ` +
        `Resolve manually in the DigitalOcean dashboard.`
    );
    this.name = "CollisionError";
  }
}

/* ── DO API (single funnel; GET/POST/PUT only — no DELETE exists) ─── */

let TOKEN = "";

/** Test hook only — lets regression tests exercise doApi with a sentinel. */
export function __setTokenForTests(value) {
  TOKEN = value;
}

export const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Sanitized transport diagnostic. Contains ONLY: error name, error message,
 * cause code, cause message, request method, request pathname, timeout flag.
 * Never tokens, Authorization headers, env values, or request bodies —
 * and any accidental token occurrence is scrubbed defensively.
 */
export function sanitizeNetworkError(e, method, pathname) {
  const timedOut =
    e?.name === "TimeoutError" ||
    e?.name === "AbortError" ||
    e?.cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
    e?.cause?.code === "UND_ERR_HEADERS_TIMEOUT";
  const scrub = (v) => {
    let out = String(v ?? "-").slice(0, 200);
    if (TOKEN) out = out.split(TOKEN).join("«redacted»");
    return out.replace(/Bearer\s+\S+/gi, "Bearer «redacted»");
  };
  return [
    `TRANSPORT FAILURE during ${method} ${pathname}`,
    `  errorName    = ${scrub(e?.name ?? "?")}`,
    `  errorMessage = ${scrub(e?.message ?? "?")}`,
    `  causeCode    = ${scrub(e?.cause?.code ?? "-")}`,
    `  causeMessage = ${scrub(e?.cause?.message ?? "-")}`,
    `  timedOut     = ${timedOut}`,
    ``,
    `Hints (PowerShell): $env:NODE_OPTIONS="--dns-result-order=ipv4first" (IPv6/DNS issues);`,
    `$env:NODE_OPTIONS="--use-system-ca" (corporate TLS-inspection CA);`,
    `$env:NODE_USE_ENV_PROXY="1" with $env:HTTPS_PROXY set (Node 24+ env-proxy support).`,
    `Then re-run: node scripts/do-deploy.mjs probe`,
  ].join("\n");
}

async function doApi(method, apiPath, body) {
  const pathname = apiPath.split("?")[0];
  let res;
  try {
    res = await fetch(`${API}${apiPath}`, {
      method,
      headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (e) {
    throw new Error(sanitizeNetworkError(e, method, pathname));
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`DO API ${method} ${pathname}: ${data?.message ?? `HTTP ${res.status}`}`);
  }
  return data;
}

/** Full pagination; exact-name lookups only ever use this list. */
export async function listAllApps(apiFn = doApi) {
  const apps = [];
  let page = 1;
  for (;;) {
    const data = await apiFn("GET", `/apps?per_page=50&page=${page}`);
    const batch = data.apps ?? [];
    apps.push(...batch);
    const next = data?.links?.pages?.next;
    if (!next || batch.length === 0) break;
    page += 1;
    if (page > 200) throw new Error("pagination: exceeded 200 pages — aborting");
  }
  return apps;
}

/** EXACT app-name equality only. No prefixes, no substrings, no fuzz. */
export async function findByName(name, apiFn = doApi) {
  const apps = await listAllApps(apiFn);
  return apps.find((a) => a.spec?.name === name) ?? null;
}

/* ── modes ────────────────────────────────────────────────────────── */

/** Read-only reachability probe: exactly ONE GET, nothing else. */
export async function probe(apiFn = doApi) {
  const data = await apiFn("GET", "/apps?per_page=1&page=1");
  const visible = (data.apps ?? []).length;
  console.log(`probe OK — DigitalOcean API reachable and authorized (page 1 returned ${visible} app record${visible === 1 ? "" : "s"}).`);
  return true;
}

async function inspect() {
  const apps = await listAllApps();
  console.log(`Existing apps (${apps.length}) — READ-ONLY inspection:`);
  for (const a of apps) {
    console.log(`  - ${a.spec?.name}  id=${a.id}  url=${a.default_ingress ?? a.live_url ?? "(none)"}`);
  }
  for (const name of Object.keys(AUTHORIZED)) {
    const existing = apps.find((a) => a.spec?.name === name);
    if (existing) {
      const check = verifyOwnership(existing, name);
      console.log(
        `NOTE: ${name} already exists — ownership ${check.ok ? "VERIFIED (idempotent continuation allowed)" : `FAILED: ${check.failures.join(", ")}`}`
      );
    }
  }
  return apps;
}

/**
 * Fail-closed create:
 *  - absent            → create the authorized staging app (with marker);
 *  - present + verified → idempotent continuation (no changes);
 *  - present + FAILED   → CollisionError, abort everything.
 */
async function create() {
  const fileEnv = loadEnvFiles();
  const { secrets, file } = loadOrCreateSecrets();
  const plan = [
    ["dgpt-pdf-staging", buildRlSpec(secrets)],
    ["dgpt-staging", buildDgptSpec(fileEnv, secrets)],
  ];
  for (const [name, spec] of plan) {
    const existing = await findByName(name);
    if (existing) {
      const check = verifyOwnership(existing, name);
      if (!check.ok) throw new CollisionError(name, check.failures);
      console.log(`continue: ${name} exists and passed ownership verification (id=${existing.id})`);
      continue;
    }
    const { app } = await doApi("POST", "/apps", { spec });
    console.log(`created ${name}: id=${app.id}`);
  }
  console.log(`Staging secrets stored OUTSIDE the repository (path only, contents never printed): ${file}`);
}

async function finalize() {
  const fileEnv = loadEnvFiles();
  const { secrets } = loadOrCreateSecrets();
  const dgpt = await findByName("dgpt-staging");
  const rl = await findByName("dgpt-pdf-staging");
  if (!dgpt || !rl) throw new Error("finalize: apps not found — run create first");

  // OWNERSHIP GUARD before ANY update — a name is not authority.
  for (const [name, app] of [["dgpt-staging", dgpt], ["dgpt-pdf-staging", rl]]) {
    const check = verifyOwnership(app, name);
    if (!check.ok) throw new CollisionError(name, check.failures);
  }

  const urls = {
    dgpt: (dgpt.default_ingress ?? dgpt.live_url ?? "").replace(/\/+$/, ""),
    rl: (rl.default_ingress ?? rl.live_url ?? "").replace(/\/+$/, ""),
  };
  if (!urls.dgpt || !urls.rl) throw new Error("finalize: DO has not assigned URLs yet — retry shortly");
  await doApi("PUT", `/apps/${dgpt.id}`, { spec: buildDgptSpec(fileEnv, secrets, urls) });
  console.log(`finalized dgpt-staging env (APP_URL, redirect URIs, PDF_SERVICE_URL) → redeploying`);
  console.log(`dgpt-staging URL: ${urls.dgpt}`);
  console.log(`dgpt-pdf-staging URL: ${urls.rl}`);
  console.log(`Microsoft redirect URI: ${urls.dgpt}/api/auth/callback/microsoft`);
  console.log(`Google redirect URI:    ${urls.dgpt}/api/auth/callback/google`);
}

async function status() {
  for (const name of Object.keys(AUTHORIZED)) {
    const app = await findByName(name);
    if (!app) {
      console.log(`${name}: absent`);
      continue;
    }
    const { deployments = [] } = await doApi("GET", `/apps/${app.id}/deployments?per_page=3`);
    const d = deployments[0];
    console.log(`${name}: url=${app.default_ingress ?? "?"} deployment=${d?.id ?? "none"} phase=${d?.phase ?? "?"}`);
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
    const phase = async (app) => {
      const { deployments = [] } = await doApi("GET", `/apps/${app.id}/deployments?per_page=1`);
      return deployments[0]?.phase;
    };
    const a = await findByName("dgpt-staging");
    const b = await findByName("dgpt-pdf-staging");
    const [pa, pb] = [await phase(a), await phase(b)];
    console.log(`  deploy phases: dgpt-staging=${pa} dgpt-pdf-staging=${pb}`);
    if (pa === "ERROR" || pb === "ERROR") throw new Error("a deployment entered ERROR — check the DO build logs");
    return pa === "ACTIVE" && pb === "ACTIVE" ? true : null;
  }, "both deployments to become ACTIVE", 80, 20000);
  await status();
  console.log("\nDone. Next: add the two OAuth redirect URIs printed above, then run the acceptance script.");
}

/* ── dry-run (NO network, NO token, NO env-file read, NO secrets) ──── */

export function dryRunPlan() {
  const redact = (spec) =>
    spec.services.map((svc) => ({
      component: svc.name,
      source: `${svc.github.repo} @ ${svc.github.branch}`,
      deploy_on_push: svc.github.deploy_on_push,
      region: spec.region,
      instance: `${svc.instance_count}× ${svc.instance_size_slug}`,
      health_check: svc.health_check.http_path,
      envs: svc.envs.map((e) => `${e.key}=${e.type === "SECRET" ? "«redacted (SECRET, encrypted at DO)»" : e.value}`),
    }));
  const placeholder = {
    PDF_SERVICE_TOKEN: "x", SESSION_SECRET: "x", AUDIT_HASH_SECRET: "x", ADMIN_SECRET: "x", FREE_ACCESS_KEY: "x",
  };
  const lines = [];
  lines.push("DRY RUN — no DigitalOcean API call, no app created/updated, no secrets file written, no env file read.");
  lines.push("");
  for (const [name, spec] of [
    ["dgpt-pdf-staging", buildRlSpec(placeholder)],
    ["dgpt-staging", buildDgptSpec({}, placeholder)],
  ]) {
    lines.push(`APP ${name} (create-or-continue; decided at run time against DigitalOcean):`);
    for (const c of redact(spec)) {
      lines.push(`  component=${c.component}  source=${c.source}  deploy_on_push=${c.deploy_on_push}`);
      lines.push(`  region=${c.region}  instance=${c.instance}  health_check=${c.health_check}`);
      for (const e of c.envs) lines.push(`    env ${e}`);
    }
    lines.push("  conditional envs (included only when configured in the operator env): OPENAI_REVIEW_MODEL, MICROSOFT_TENANT_ID/CLIENT_ID/CLIENT_SECRET, GOOGLE_CLIENT_ID/CLIENT_SECRET");
    lines.push("");
  }
  lines.push("Intended HTTP operations (only these method/endpoint families exist; no DELETE anywhere):");
  lines.push("  GET  /v2/apps?per_page=50&page=N       (paginated, read-only inspection + exact-name lookup)");
  lines.push("  POST /v2/apps                           (create — only if the authorized name is absent)");
  lines.push("  PUT  /v2/apps/{id}                      (update — ONLY dgpt-staging, ONLY after ownership verification)");
  lines.push("  GET  /v2/apps/{id}/deployments?...      (status polling)");
  lines.push("");
  lines.push("Ownership verification happens LIVE against DigitalOcean before any update:");
  lines.push(`  exact name · repo/branch exactly as authorized · deploy_on_push=false · APP_STAGE=staging · ${MARKER_KEY}=${MARKER_VALUE} · no custom domain.`);
  lines.push("A same-name app failing ANY check aborts the run: nothing is updated and no duplicate is created.");
  return lines;
}

/* ── entrypoint (skipped when imported by tests) ──────────────────── */

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const MODE = args.find((a) => !a.startsWith("--")) ?? "inspect";

  if (dryRun) {
    // No network, no token requirement, no env-file read, no secrets file.
    for (const line of dryRunPlan()) console.log(line);
    process.exit(0);
  }

  const actions = { probe, inspect, create, finalize, status, all };
  if (!actions[MODE]) {
    console.error(`unknown mode ${MODE}`);
    process.exit(2);
  }
  // Token: process.env is primary; .env.local storage is optional.
  TOKEN = process.env.DIGITALOCEAN_ACCESS_TOKEN || loadEnvFiles().DIGITALOCEAN_ACCESS_TOKEN || "";
  if (!TOKEN) {
    console.error("DIGITALOCEAN_ACCESS_TOKEN missing (process.env or .env.local). Nothing printed, nothing done.");
    process.exit(2);
  }
  actions[MODE]().catch((e) => {
    console.error(String(e.message ?? e));
    process.exit(1);
  });
}
