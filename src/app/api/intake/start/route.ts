/**
 * Start an intake session — invitation-only in the 2.0 workflow.
 *
 * - CLIENT: must already be bound to a matter via an accepted invitation
 *   (public self-registration into intake does not exist), and must have
 *   acknowledged the CURRENT relationship disclosure for that matter.
 * - STAFF/ATTORNEY: may start an intake on a matter they hold a grant for
 *   (e.g. telephone/assisted intake). Same wall, same gate — no privileged
 *   path around conflict screening.
 * - ADMIN does not perform intake.
 */
import { z } from "zod";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { startIntake } from "@/lib/intake/service";
import { getProcessCopy } from "@/config/process-copy";
import { listMattersForClient } from "@/lib/db/matters";
import { hasAcknowledged } from "@/lib/db/disclosure";
import { getDisclosure } from "@/config/disclosure";

const bodySchema = z.object({ matterId: z.string().trim().min(1).optional() }).optional();

export async function POST(req: Request) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["CLIENT", "STAFF", "ATTORNEY"]);
    const { account } = authed;

    const parsed = bodySchema.safeParse(await req.json().catch(() => undefined));
    const requestedMatterId = parsed.success ? parsed.data?.matterId : undefined;

    let matterId: string;
    if (account.role === "CLIENT") {
      const mine = (await listMattersForClient(account.id));
      const matter = requestedMatterId
        ? mine.find((m) => m.id === requestedMatterId)
        : mine[0];
      if (!matter) {
        throw new HttpError(
          403,
          "An invitation from the firm is required before intake can begin"
        );
      }
      if (!(await hasAcknowledged(matter.id, account.id, getDisclosure().version))) {
        throw new HttpError(
          409,
          "Please review and acknowledge the disclosure before continuing"
        );
      }
      matterId = matter.id;
    } else {
      if (!requestedMatterId) {
        throw new HttpError(400, "VALIDATION: matterId is required");
      }
      matterId = (await requireMatterAccess(authed, requestedMatterId)).id;
    }

    const session = (await startIntake(
          { ...authed.session, role: account.role },
          matterId
        ));
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
