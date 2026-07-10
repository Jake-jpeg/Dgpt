import { requireAnyRole, errorResponse } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { startIntake } from "@/lib/intake/service";
import { getProcessCopy } from "@/config/process-copy";

export async function POST(req: Request) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    // Both roles may start an intake (client-initiated, or attorney/paralegal-
    // initiated for an existing client). BOTH pass through the same conflict
    // wall and scope gate — there is no privileged path around them.
    const user = await requireAnyRole(req);
    const session = startIntake(user);
    return Response.json({
      session: { id: session.id, state: session.state },
      copy: {
        welcome: getProcessCopy("WELCOME"),
        preGate: getProcessCopy("PRE_GATE_EXPLAINER"),
        whyIdentity: getProcessCopy("WHY_IDENTITY"),
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
