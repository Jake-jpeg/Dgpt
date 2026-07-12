/**
 * Current relationship-disclosure text + version. Authenticated users only
 * (the disclosure is part of the client onboarding flow, not public copy).
 */
import { requireUser } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getDisclosure } from "@/config/disclosure";

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    await requireUser(req, ["CLIENT", "STAFF", "ATTORNEY", "ADMIN"]);
    return Response.json({ disclosure: getDisclosure() });
  } catch (e) {
    return errorResponse(e);
  }
}
