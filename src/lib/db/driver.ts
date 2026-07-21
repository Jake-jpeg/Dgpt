/**
 * Storage drivers — the ONE place engine differences live.
 *
 * Two engines, one async interface:
 *
 *   - SQLite (node:sqlite) when DATABASE_URL is absent — local dev and the
 *     entire test suite (`:memory:`). Zero native dependencies, synchronous
 *     under the hood; the async surface resolves immediately.
 *   - PostgreSQL (pg) when DATABASE_URL is present — production. App
 *     Platform containers are EPHEMERAL: a SQLite file dies with every
 *     deploy, which is exactly the "deploy ate my users" failure. Postgres
 *     is the durable store.
 *
 * Repos speak `?` placeholders and TEXT/INTEGER values only (see index.ts
 * header); this file translates placeholders for Postgres and normalizes
 * driver differences (int8 counts, constraint-error messages, run results).
 * NOTHING outside src/lib/db imports this module.
 */

export type SqlParam = string | number | bigint | null;

export interface RunResult {
  changes: number;
}

export interface Db {
  readonly dialect: "sqlite" | "postgres";
  get<T = Record<string, unknown>>(sql: string, ...params: SqlParam[]): Promise<T | undefined>;
  all<T = Record<string, unknown>>(sql: string, ...params: SqlParam[]): Promise<T[]>;
  run(sql: string, ...params: SqlParam[]): Promise<RunResult>;
  /** Multi-statement DDL / migrations. No parameters. */
  exec(sql: string): Promise<void>;
  /**
   * Run `fn` serialized against every other `serialized` call — the audit
   * hash chain appends via read-tail-then-insert, which must not interleave.
   * SQLite: the single synchronous connection already serializes, so this
   * just runs `fn`. Postgres: a transaction holding an advisory xact lock.
   */
  serialized<T>(fn: (tx: Db) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/* ── placeholder translation (? → $1, $2 …) ─────────────────────────── */

const translated = new Map<string, string>();

/** Quote- and comment-aware; a `?` inside '…', "…" or -- comments is untouched. */
export function toDollarPlaceholders(sql: string): string {
  const hit = translated.get(sql);
  if (hit) return hit;
  let out = "";
  let n = 0;
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (ch === "'" || ch === '"') {
      const q = ch;
      out += ch;
      i += 1;
      while (i < sql.length) {
        out += sql[i];
        if (sql[i] === q) {
          if (sql[i + 1] === q) {
            out += sql[i + 1];
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }
    if (ch === "-" && sql[i + 1] === "-") {
      const nl = sql.indexOf("\n", i);
      const end = nl === -1 ? sql.length : nl + 1;
      out += sql.slice(i, end);
      i = end;
      continue;
    }
    if (ch === "?") {
      n += 1;
      out += `$${n}`;
      i += 1;
      continue;
    }
    out += ch;
    i += 1;
  }
  translated.set(sql, out);
  return out;
}

/* ── SQLite ─────────────────────────────────────────────────────────── */

export async function createSqliteDb(databasePath: string): Promise<Db> {
  const [{ DatabaseSync }, path, fs] = await Promise.all([
    import("node:sqlite"),
    import("node:path"),
    import("node:fs"),
  ]);
  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(/* turbopackIgnore: true */ databasePath)), {
      recursive: true,
    });
  }
  const raw = new DatabaseSync(
    databasePath === ":memory:"
      ? databasePath
      : path.resolve(/* turbopackIgnore: true */ databasePath)
  );
  raw.exec("PRAGMA foreign_keys = ON;");

  const db: Db = {
    dialect: "sqlite",
    async get<T>(sql: string, ...params: SqlParam[]) {
      return raw.prepare(sql).get(...params) as T | undefined;
    },
    async all<T>(sql: string, ...params: SqlParam[]) {
      return raw.prepare(sql).all(...params) as T[];
    },
    async run(sql: string, ...params: SqlParam[]) {
      const r = raw.prepare(sql).run(...params);
      return { changes: Number(r.changes) };
    },
    async exec(sql: string) {
      raw.exec(sql);
    },
    async serialized<T>(fn: (tx: Db) => Promise<T>) {
      // Single synchronous connection on a single JS thread: statements
      // inside `fn` cannot interleave with other statements.
      return fn(db);
    },
    async close() {
      try {
        raw.close();
      } catch {
        /* already closed */
      }
    },
  };
  return db;
}

/* ── PostgreSQL ─────────────────────────────────────────────────────── */

/**
 * DO managed Postgres presents a per-cluster CA. Priority:
 *   1. DATABASE_CA_CERT env (full verification) — set it when available;
 *   2. sslmode=require in the URL without a CA → TLS on, chain unverified
 *      (the DO-internal hop; still encrypted);
 *   3. no sslmode (local dev) → plain TCP.
 */
function resolveSsl(url: string): { ca: string } | { rejectUnauthorized: false } | undefined {
  const ca = process.env.DATABASE_CA_CERT?.trim();
  if (ca) return { ca };
  if (/[?&]sslmode=(require|prefer|verify-ca|verify-full)/i.test(url)) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

/** Mimic node:sqlite's message shapes so any upstream matching stays true. */
function normalizePgError(e: unknown): unknown {
  const err = e as { code?: string; table?: string; detail?: string; constraint?: string };
  if (!err || typeof err !== "object" || !err.code) return e;
  if (err.code === "23505") {
    const cols = /Key \(([^)]+)\)=/.exec(err.detail ?? "")?.[1] ?? "";
    const where = [err.table, cols].filter(Boolean).join(".");
    const out = new Error(`UNIQUE constraint failed: ${where || err.constraint || "unique"}`);
    (out as unknown as { code: string }).code = err.code;
    return out;
  }
  if (err.code === "23503") {
    const out = new Error("FOREIGN KEY constraint failed");
    (out as unknown as { code: string }).code = err.code;
    return out;
  }
  if (err.code === "23514") {
    const out = new Error(`CHECK constraint failed: ${err.constraint ?? "check"}`);
    (out as unknown as { code: string }).code = err.code;
    return out;
  }
  return e;
}

/** Advisory-lock key for audit-chain serialization (arbitrary app constant). */
const CHAIN_LOCK_KEY = 428_571;

type PgQueryable = {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
};

function pgOps(q: PgQueryable): Pick<Db, "get" | "all" | "run" | "exec"> {
  return {
    async get<T>(sql: string, ...params: SqlParam[]) {
      try {
        const r = await q.query(toDollarPlaceholders(sql), params);
        return (r.rows[0] as T | undefined) ?? undefined;
      } catch (e) {
        throw normalizePgError(e);
      }
    },
    async all<T>(sql: string, ...params: SqlParam[]) {
      try {
        const r = await q.query(toDollarPlaceholders(sql), params);
        return r.rows as T[];
      } catch (e) {
        throw normalizePgError(e);
      }
    },
    async run(sql: string, ...params: SqlParam[]) {
      try {
        const r = await q.query(toDollarPlaceholders(sql), params);
        return { changes: r.rowCount ?? 0 };
      } catch (e) {
        throw normalizePgError(e);
      }
    },
    async exec(sql: string) {
      try {
        await q.query(sql);
      } catch (e) {
        throw normalizePgError(e);
      }
    },
  };
}

export async function createPostgresDb(databaseUrl: string): Promise<Db> {
  const pg = await import("pg");
  // COUNT(*) and BIGSERIAL come back as int8, which pg returns as strings by
  // default; every count in this app is read as `{ c: number }`. Values here
  // can never exceed Number.MAX_SAFE_INTEGER in this schema.
  pg.types.setTypeParser(20, (v: string) => Number(v));

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: resolveSsl(databaseUrl),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  // A dropped idle connection must not crash the process.
  pool.on("error", () => {});

  const db: Db = {
    dialect: "postgres",
    ...pgOps(pool),
    async serialized<T>(fn: (tx: Db) => Promise<T>) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock($1)", [CHAIN_LOCK_KEY]);
        const tx: Db = {
          dialect: "postgres",
          ...pgOps(client),
          serialized: (inner) => inner(tx), // re-entrant: lock already held
          close: async () => {},
        };
        const result = await fn(tx);
        await client.query("COMMIT");
        return result;
      } catch (e) {
        try {
          await client.query("ROLLBACK");
        } catch {
          /* connection already gone */
        }
        throw e;
      } finally {
        client.release();
      }
    },
    async close() {
      await pool.end().catch(() => {});
    },
  };
  return db;
}
