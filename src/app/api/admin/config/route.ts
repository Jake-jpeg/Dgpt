/**
 * Retention/config management — ADMIN only. Only the allowlisted config
 * keys are settable; attorney-only rules have no configuration surface.
 */
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { listConfig, setConfigValue } from "@/lib/db/config";
import { recordAudit } from "@/lib/db/repo";

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    await requireAdmin(req);
    return Response.json({ config: listConfig() });
  } catch (e) {
    return errorResponse(e);
  }
}

const schema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z.string().trim().min(1).max(200),
});

export async function PUT(req: Request) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const { account } = await requireAdmin(req);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid config payload");
    setConfigValue(parsed.data.key, parsed.data.value, account.id);
    recordAudit(
      "config",
      "CONFIG_CHANGED",
      `key=${parsed.data.key} value=${parsed.data.value}`,
      account.id
    );
    return Response.json({ config: listConfig() });
  } catch (e) {
    return errorResponse(e);
  }
}
