/**
 * DigitalOcean deploy-script hardening (offline regression; ZERO network).
 * Covers: ownership guard matrix, fail-closed collisions, exact-name
 * pagination, no-DELETE invariant, dry-run isolation + redaction,
 * out-of-repo atomic secrets, SECRET-typed authorization emails.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  AUTHORIZED,
  MARKER_KEY,
  MARKER_VALUE,
  verifyOwnership,
  CollisionError,
  listAllApps,
  findByName,
  buildDgptSpec,
  buildRlSpec,
  defaultSecretsPath,
  resolveSecretsPath,
  writeSecretsAtomic,
  loadOrCreateSecrets,
  dryRunPlan,
  probe,
  sanitizeNetworkError,
  __setTokenForTests,
} from "../scripts/do-deploy.mjs";

const SECRETS = {
  PDF_SERVICE_TOKEN: "svc-sentinel",
  SESSION_SECRET: "sess-sentinel",
  AUDIT_HASH_SECRET: "audit-sentinel",
  ADMIN_SECRET: "admin-sentinel",
  FREE_ACCESS_KEY: "key-sentinel",
};

interface FakeEnvVar { key: string; value: string; type: string }
interface FakeSpec {
  name: string;
  domains?: { domain: string }[];
  services: { name: string; github: { repo: string; branch: string; deploy_on_push: boolean }; envs: FakeEnvVar[] }[];
}

/** A DO app object that passes every ownership check for `name`. */
function authorizedApp(name: keyof typeof AUTHORIZED, overrides: (spec: FakeSpec) => void = () => {}) {
  const auth = AUTHORIZED[name];
  const spec: FakeSpec = {
    name,
    services: [
      {
        name: "web",
        github: { repo: auth.repo, branch: auth.branch, deploy_on_push: false },
        envs: [
          { key: MARKER_KEY, value: MARKER_VALUE, type: "GENERAL" },
          { key: "APP_STAGE", value: "staging", type: "GENERAL" },
        ],
      },
    ],
  };
  overrides(spec);
  return { id: "app-id-1", spec };
}

afterEach(() => {
  delete process.env.STAGING_SECRETS_PATH;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ownership guard", () => {
  it("authorized existing dgpt-staging app passes", () => {
    const check = verifyOwnership(authorizedApp("dgpt-staging"), "dgpt-staging");
    expect(check).toEqual({ ok: true, failures: [] });
  });

  it("same name but wrong repository is rejected", () => {
    const app = authorizedApp("dgpt-staging", (s) => (s.services[0].github.repo = "Jake-jpeg/SomethingElse"));
    const check = verifyOwnership(app, "dgpt-staging");
    expect(check.ok).toBe(false);
    expect(check.failures).toContain("REPO_MISMATCH");
  });

  it("same name but wrong branch (e.g. main) is rejected", () => {
    const app = authorizedApp("dgpt-staging", (s) => (s.services[0].github.branch = "main"));
    const check = verifyOwnership(app, "dgpt-staging");
    expect(check.failures).toContain("BRANCH_MISMATCH");
  });

  it("same name but missing management marker is rejected", () => {
    const app = authorizedApp("dgpt-staging", (s) => (s.services[0].envs = s.services[0].envs.filter((e) => e.key !== MARKER_KEY)));
    expect(verifyOwnership(app, "dgpt-staging").failures).toContain("MISSING_MANAGEMENT_MARKER");
  });

  it("same name but APP_STAGE not staging is rejected", () => {
    const app = authorizedApp("dgpt-staging", (s) => {
      s.services[0].envs.find((e) => e.key === "APP_STAGE")!.value = "production";
    });
    expect(verifyOwnership(app, "dgpt-staging").failures).toContain("APP_STAGE_NOT_STAGING");
  });

  it("same name with a custom domain attached is rejected", () => {
    const app = authorizedApp("dgpt-staging", (s) => (s.domains = [{ domain: "divorcegpt.com" }]));
    expect(verifyOwnership(app, "dgpt-staging").failures).toContain("CUSTOM_DOMAIN_ATTACHED");
  });

  it("deploy_on_push enabled is rejected", () => {
    const app = authorizedApp("dgpt-staging", (s) => (s.services[0].github.deploy_on_push = true));
    expect(verifyOwnership(app, "dgpt-staging").failures).toContain("DEPLOY_ON_PUSH_ENABLED");
  });

  it("PDF staging app with wrong repository is rejected", () => {
    const app = authorizedApp("dgpt-pdf-staging", (s) => (s.services[0].github.repo = "Jake-jpeg/Dgpt"));
    expect(verifyOwnership(app, "dgpt-pdf-staging").failures).toContain("REPO_MISMATCH");
  });

  it("collision error is sanitized: name + codes only, never env values", () => {
    const err = new CollisionError("dgpt-staging", ["REPO_MISMATCH"]);
    expect(err.message).toContain("dgpt-staging");
    expect(err.message).toContain("REPO_MISMATCH");
    expect(err.message).not.toMatch(/sk-|secret|Bearer/i);
  });
});

describe("pagination (exact-name only)", () => {
  it("finds an app on page 2 and terminates when links.pages.next is absent", async () => {
    const page1 = { apps: Array.from({ length: 50 }, (_, i) => ({ spec: { name: `other-app-${i}` } })), links: { pages: { next: "https://api/next" } } };
    const page2 = { apps: [{ id: "target", spec: { name: "dgpt-staging" } }], links: { pages: {} } };
    const apiFn = vi.fn().mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);
    const found = await findByName("dgpt-staging", apiFn);
    expect(found?.id).toBe("target");
    expect(apiFn).toHaveBeenCalledTimes(2);
    expect(apiFn.mock.calls[0][1]).toContain("page=1");
    expect(apiFn.mock.calls[1][1]).toContain("page=2");
  });

  it("no fuzzy matching: a prefixed name never matches", async () => {
    const apiFn = vi.fn().mockResolvedValue({ apps: [{ spec: { name: "dgpt-staging-old" } }, { spec: { name: "dgpt" } }], links: { pages: {} } });
    expect(await findByName("dgpt-staging", apiFn)).toBeNull();
  });

  it("terminates on an empty page", async () => {
    const apiFn = vi.fn().mockResolvedValue({ apps: [], links: { pages: { next: "x" } } });
    expect(await listAllApps(apiFn)).toEqual([]);
    expect(apiFn).toHaveBeenCalledTimes(1);
  });
});

describe("static invariants", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "scripts", "do-deploy.mjs"), "utf8");

  it("no DELETE request exists anywhere in the script", () => {
    expect(source).not.toMatch(/["']DELETE["']/);
    expect(source).not.toMatch(/method:\s*["']DELETE/i);
  });

  it("only the two authorized names and source pairs are referenced", () => {
    expect(AUTHORIZED).toEqual({
      "dgpt-staging": { repo: "Jake-jpeg/Dgpt", branch: "divorcegpt-2-online-staging" },
      "dgpt-pdf-staging": { repo: "Jake-jpeg/RL", branch: "divorcegpt-2-pdf-staging-auth" },
    });
    expect(source).not.toMatch(/branch:\s*["']main["']/);
    expect(source).not.toContain("divorcegpt.com");
  });
});

describe("dry-run", () => {
  it("performs zero network requests and redacts every SECRET value", () => {
    const tripwire = vi.fn(() => {
      throw new Error("network must never be touched in dry-run");
    });
    vi.stubGlobal("fetch", tripwire);
    const lines: string[] = dryRunPlan();
    expect(tripwire).not.toHaveBeenCalled();
    const text = lines.join("\n");
    expect(text).toContain("dgpt-staging");
    expect(text).toContain("Jake-jpeg/Dgpt @ divorcegpt-2-online-staging");
    expect(text).toContain("Jake-jpeg/RL @ divorcegpt-2-pdf-staging-auth");
    expect(text).toContain("deploy_on_push=false");
    expect(text).toContain("«redacted (SECRET, encrypted at DO)»");
    expect(text).toContain("ownership verification");
    // The placeholder secret value must never leak into plan output.
    expect(text).not.toMatch(/OPENAI_API_KEY=(?!«)/);
    expect(text).not.toMatch(/ADMIN_SECRET=(?!«)/);
    // Method/endpoint families identified; no DELETE.
    expect(text).toContain("POST /v2/apps");
    expect(text).toContain("PUT  /v2/apps/{id}");
    expect(text).not.toMatch(/DELETE\s+\/v2/); // no DELETE endpoint is planned
  });
});

describe("secrets storage (outside the repository)", () => {
  it("default path is under the OS user-data dir, never the repo", () => {
    const linux = defaultSecretsPath("linux", { XDG_DATA_HOME: "" } as unknown as NodeJS.ProcessEnv);
    expect(linux).toContain(path.join(os.homedir(), ".local", "share", "JakeKimLawFirm"));
    const win = defaultSecretsPath("win32", { LOCALAPPDATA: "C:\\Users\\op\\AppData\\Local" } as unknown as NodeJS.ProcessEnv);
    expect(win).toContain("JakeKimLawFirm");
    expect(defaultSecretsPath()).not.toContain(process.cwd());
  });

  it("STAGING_SECRETS_PATH override wins", () => {
    process.env.STAGING_SECRETS_PATH = "/tmp/custom-secrets.json";
    expect(resolveSecretsPath()).toBe("/tmp/custom-secrets.json");
  });

  it("writes atomically, applies restrictive permissions, and never logs contents", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stage-secrets-test-"));
    const file = path.join(dir, "nested", "stage-secrets.json");
    const logSpy = vi.spyOn(console, "log");
    const errSpy = vi.spyOn(console, "error");
    writeSecretsAtomic(file, SECRETS);
    expect(JSON.parse(fs.readFileSync(file, "utf8")).ADMIN_SECRET).toBe("admin-sentinel");
    // No partial temp file remains.
    expect(fs.readdirSync(path.dirname(file)).filter((f) => f.endsWith(".tmp"))).toEqual([]);
    if (process.platform !== "win32") {
      expect(fs.statSync(file).mode & 0o777).toBe(0o600);
    }
    const logged = [...logSpy.mock.calls, ...errSpy.mock.calls].flat().join(" ");
    expect(logged).not.toContain("admin-sentinel");
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("loadOrCreateSecrets uses the override path and returns it without printing values", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stage-secrets-test2-"));
    process.env.STAGING_SECRETS_PATH = path.join(dir, "s.json");
    const { secrets, file } = loadOrCreateSecrets(process.env);
    expect(file).toBe(process.env.STAGING_SECRETS_PATH);
    expect(secrets.ADMIN_SECRET).toHaveLength(64);
    const again = loadOrCreateSecrets(process.env);
    expect(again.secrets.ADMIN_SECRET).toBe(secrets.ADMIN_SECRET); // idempotent
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("spec construction", () => {
  it("ATTORNEY_EMAILS and ADMIN_EMAILS are SECRET-typed; marker present on both apps", () => {
    const dgpt = buildDgptSpec({ ATTORNEY_EMAILS: "real-attorney@example.test" }, SECRETS);
    const envs = dgpt.services[0].envs as { key: string; type: string; value: string }[];
    const byKey = Object.fromEntries(envs.map((e) => [e.key, e]));
    expect(byKey.ATTORNEY_EMAILS.type).toBe("SECRET");
    expect(byKey.ADMIN_EMAILS.type).toBe("SECRET");
    expect(byKey[MARKER_KEY].value).toBe(MARKER_VALUE);
    for (const k of ["SESSION_SECRET", "AUDIT_HASH_SECRET", "ADMIN_SECRET", "OPENAI_API_KEY", "PDF_SERVICE_TOKEN", "FREE_ACCESS_KEYS"]) {
      expect(byKey[k].type, k).toBe("SECRET");
    }
    const rl = buildRlSpec(SECRETS);
    const rlByKey = Object.fromEntries(rl.services[0].envs.map((e: { key: string; value: string; type: string }) => [e.key, e]));
    expect(rlByKey[MARKER_KEY].value).toBe(MARKER_VALUE);
    expect(rlByKey.PDF_SERVICE_TOKEN.type).toBe("SECRET");
    expect(dgpt.services[0].github.deploy_on_push).toBe(false);
    expect(rl.services[0].github.deploy_on_push).toBe(false);
  });
});

describe("transport repair (sanitized diagnostics + probe)", () => {
  const SENTINEL_TOKEN = "dop_v1_sentinel_token_never_real_0123456789abcdef";

  it("a transport failure exposes its sanitized cause code — never the token or Authorization header", async () => {
    __setTokenForTests(SENTINEL_TOKEN);
    const transportError = Object.assign(new TypeError("fetch failed"), {
      cause: { code: "ENOTFOUND", message: `getaddrinfo ENOTFOUND api.digitalocean.com Bearer ${SENTINEL_TOKEN}` },
    });
    const boom = vi.fn(async () => {
      throw transportError;
    });
    vi.stubGlobal("fetch", boom);
    let caught = "";
    try {
      await probe(); // uses the real doApi → real sanitizer
    } catch (e) {
      caught = String((e as Error).message);
    } finally {
      __setTokenForTests("");
    }
    expect(caught).toContain("TRANSPORT FAILURE during GET /apps");
    expect(caught).toContain("errorName    = TypeError");
    expect(caught).toContain("causeCode    = ENOTFOUND");
    expect(caught).toContain("timedOut     = false");
    expect(caught).not.toContain(SENTINEL_TOKEN);
    expect(caught).not.toMatch(/Bearer\s+(?!«redacted»)\S/);
  });

  it("timeout aborts are flagged and sanitized", () => {
    __setTokenForTests(SENTINEL_TOKEN);
    const msg = sanitizeNetworkError(
      Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" }),
      "GET",
      "/apps"
    );
    __setTokenForTests("");
    expect(msg).toContain("timedOut     = true");
    expect(msg).not.toContain(SENTINEL_TOKEN);
  });

  it("probe mode performs exactly one GET — no POST/PUT/PATCH/DELETE", async () => {
    const seen: string[] = [];
    const apiFn = vi.fn(async (method: string, p: string) => {
      seen.push(`${method} ${p}`);
      return { apps: [{ spec: { name: "whatever" } }] };
    });
    await probe(apiFn);
    expect(seen).toEqual(["GET /apps?per_page=1&page=1"]);
    expect(seen.join(" ")).not.toMatch(/POST|PUT|PATCH|DELETE/);
  });
});
