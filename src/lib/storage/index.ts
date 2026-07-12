/**
 * FileStorage abstraction.
 *
 * All uploaded/generated files live behind this interface:
 *  - server-side only; nothing is ever written under public/;
 *  - stored names are opaque random UUIDs — the original filename is
 *    metadata in the document_version row, never a path component;
 *  - strict storage-key validation makes path traversal impossible;
 *  - a malware-scanning hook runs before every write (no-op pass-through in
 *    local development; wire a real scanner via setMalwareScanner).
 *
 * Production file storage is [NOT CONFIGURED]: only the local-filesystem
 * implementation exists, and it REFUSES to run when NODE_ENV=production
 * unless the explicit testing override FILE_STORAGE_ALLOW_LOCAL_TEST=true is
 * set. Wire S3/GCS/etc. by implementing FileStorage and extending
 * getFileStorage().
 */
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { isProduction } from "@/lib/env";

export interface StoredFile {
  storageKey: string;
  sha256: string;
  sizeBytes: number;
}

export interface MalwareScanResult {
  clean: boolean;
  detail?: string;
}

export interface MalwareScanner {
  scan(bytes: Uint8Array): Promise<MalwareScanResult>;
}

export interface FileStorage {
  put(bytes: Uint8Array): Promise<StoredFile>;
  get(storageKey: string): Promise<Uint8Array>;
  exists(storageKey: string): Promise<boolean>;
  delete(storageKey: string): Promise<void>;
}

/** Local development: pass-through scanner (a real scanner replaces this). */
class NoopScanner implements MalwareScanner {
  async scan(): Promise<MalwareScanResult> {
    return { clean: true, detail: "no scanner configured (local development)" };
  }
}

let _scanner: MalwareScanner = new NoopScanner();

export function setMalwareScanner(s: MalwareScanner | null): void {
  _scanner = s ?? new NoopScanner();
}

export function getMalwareScanner(): MalwareScanner {
  return _scanner;
}

const KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function assertValidStorageKey(key: string): void {
  if (!KEY_PATTERN.test(key)) {
    throw new Error("STORAGE_GUARD: invalid storage key");
  }
}

export class LocalFileStorage implements FileStorage {
  constructor(private readonly rootDir: string) {
    fs.mkdirSync(this.rootDir, { recursive: true });
  }

  private resolveKey(key: string): string {
    assertValidStorageKey(key);
    const p = path.resolve(this.rootDir, key);
    // Defense in depth: even a validated key must resolve inside the root.
    if (!p.startsWith(path.resolve(this.rootDir) + path.sep)) {
      throw new Error("STORAGE_GUARD: path escapes storage root");
    }
    return p;
  }

  async put(bytes: Uint8Array): Promise<StoredFile> {
    const scan = await getMalwareScanner().scan(bytes);
    if (!scan.clean) {
      throw new Error("STORAGE_GUARD: file rejected by malware scan");
    }
    const storageKey = randomUUID();
    const target = this.resolveKey(storageKey);
    fs.writeFileSync(target, bytes, { mode: 0o600 });
    return {
      storageKey,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      sizeBytes: bytes.byteLength,
    };
  }

  async get(storageKey: string): Promise<Uint8Array> {
    return new Uint8Array(fs.readFileSync(this.resolveKey(storageKey)));
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      return fs.existsSync(this.resolveKey(storageKey));
    } catch {
      return false;
    }
  }

  async delete(storageKey: string): Promise<void> {
    const p = this.resolveKey(storageKey);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

let _storage: FileStorage | null = null;

export function fileStorageDir(): string {
  // Outside public/ by construction; override with FILE_STORAGE_DIR.
  return process.env.FILE_STORAGE_DIR ?? "./data/files";
}

/**
 * SYNTHETIC-STAGING ephemeral-storage override (Part 8).
 * Valid ONLY when ALL THREE hold:
 *   SYNTHETIC_STAGING_EPHEMERAL_STORAGE=true
 *   APP_STAGE=staging
 *   SYNTHETIC_DEMO_ONLY=true
 * It permits local-disk (ephemeral!) storage on an App Platform staging
 * instance for SYNTHETIC data. Redeployment may erase all state; scaling
 * is unsupported; this is NOT persistent storage and is refused in
 * closed_pilot/production by assertEphemeralStorageFlagsValid() at startup
 * and re-checked here. Closed-pilot storage requirements are unchanged:
 * a real client pilot still requires persistent DB + object storage +
 * tested backups/restore + malware scanning.
 */
export function syntheticEphemeralStorageActive(): boolean {
  return (
    process.env.SYNTHETIC_STAGING_EPHEMERAL_STORAGE === "true" &&
    (process.env.APP_STAGE ?? "").trim().toLowerCase() === "staging" &&
    process.env.SYNTHETIC_DEMO_ONLY === "true"
  );
}

/** Startup guard: the override outside its exact conditions kills boot. */
export function assertEphemeralStorageFlagsValid(): void {
  if (process.env.SYNTHETIC_STAGING_EPHEMERAL_STORAGE !== "true") return;
  const stage = (process.env.APP_STAGE ?? "").trim().toLowerCase();
  if (stage !== "staging" || process.env.SYNTHETIC_DEMO_ONLY !== "true") {
    throw new Error(
      "STORAGE_GUARD: SYNTHETIC_STAGING_EPHEMERAL_STORAGE=true is refused unless " +
        "APP_STAGE=staging AND SYNTHETIC_DEMO_ONLY=true. It is a synthetic-data " +
        "staging aid only and is never valid in closed_pilot or production."
    );
  }
  console.warn(
    "⚠ SYNTHETIC STAGING — ephemeral local storage is active. DATA MAY BE LOST ON REDEPLOYMENT. Synthetic data only."
  );
}

export function getFileStorage(): FileStorage {
  if (_storage) return _storage;
  if (isProduction() && process.env.FILE_STORAGE_ALLOW_LOCAL_TEST !== "true") {
    if (syntheticEphemeralStorageActive()) {
      // Loud, deliberate, synthetic-only staging exception (Part 8).
      console.warn(
        "⚠ SYNTHETIC STAGING — serving from ephemeral local storage. DATA MAY BE LOST ON REDEPLOYMENT."
      );
    } else {
      // [NOT CONFIGURED]: production object storage has not been provisioned.
      throw new Error(
        "STORAGE_GUARD: production file storage is not configured. Local disk " +
          "storage is refused in production (set FILE_STORAGE_ALLOW_LOCAL_TEST=true " +
          "only for explicit production testing)."
      );
    }
  }
  _storage = new LocalFileStorage(fileStorageDir());
  return _storage;
}

/** Test hook. */
export function resetFileStorageForTests(): void {
  _storage = null;
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
