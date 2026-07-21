/**
 * Test environment. SYNTHETIC DATA ONLY — no real client data appears
 * anywhere in fixtures (see src/config/synthetic/conflict-matchlist.json).
 */
import os from "node:os";
import path from "node:path";

process.env.DATABASE_PATH = ":memory:";
// The suite always runs on in-memory SQLite: a DATABASE_URL inherited from
// the host shell must never point tests at a real Postgres.
delete process.env.DATABASE_URL;
// Tests must never inherit ambient provider config from the host shell.
delete process.env.ANTHROPIC_BASE_URL;
delete process.env.ANTHROPIC_API_KEY;
delete process.env.ANTHROPIC_MODEL;
process.env.FILE_STORAGE_DIR = path.join(os.tmpdir(), `dgpt-test-files-${process.pid}`);
process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-1234";
process.env.AUDIT_HASH_SECRET = "test-audit-salt-test-audit-salt";
process.env.APP_URL = "http://localhost:3000";
process.env.ADMIN_SECRET = "test-admin-secret";
process.env.ATTORNEY_EMAILS = "attorney@example.test,paralegal@example.test";
process.env.DEV_AUTH_STUB = "true";
process.env.RETENTION_ABANDONED_DAYS = "14";
