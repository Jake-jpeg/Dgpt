import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Real-PostgreSQL parity suite (npm run test:pg).
 *
 * The main suite runs on in-memory SQLite and must stay engine-blind; THIS
 * config points the same production code at an actual Postgres server and
 * asserts the behaviors that differ between engines (placeholders, upserts,
 * FK cascades, int8 counts, audit-chain serialization, restart persistence).
 *
 * Requires a reachable Postgres; the database is WIPED each run:
 *   DATABASE_URL=postgres://user:pass@host:5432/db npm run test:pg
 * (defaults to the local dev instance in tests-pg/setup.ts)
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests-pg/**/*.test.ts"],
    fileParallelism: false,
    setupFiles: ["tests-pg/setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
