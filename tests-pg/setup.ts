/**
 * Environment for the real-Postgres parity suite. SYNTHETIC DATA ONLY.
 * Unlike tests/setup.ts (which forces :memory: SQLite), this KEEPS a
 * DATABASE_URL so the driver takes the Postgres path. Never point it at a
 * database whose contents you want to keep — the suite wipes the schema.
 */
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://dgpt:dgpt_local_test@127.0.0.1:5432/dgpt";
delete process.env.DATABASE_PATH;
// Never inherit ambient provider config from the host shell.
delete process.env.ANTHROPIC_BASE_URL;
delete process.env.ANTHROPIC_API_KEY;
delete process.env.ANTHROPIC_MODEL;
process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-1234";
process.env.AUDIT_HASH_SECRET = "test-audit-salt-test-audit-salt";
process.env.APP_URL = "http://localhost:3000";
process.env.ATTORNEY_EMAILS = "attorney@example.test";
