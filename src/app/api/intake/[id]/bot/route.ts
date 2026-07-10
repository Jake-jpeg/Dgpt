/**
 * The intake bot endpoint. Free text goes in; ONLY one of the four approved
 * response surfaces comes out (see src/lib/bot/responder.ts). There is no
 * generative path behind this endpoint.
 */
import { z } from "zod";
import { requireAnyRole, errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { requireOwnedSession } from "@/lib/intake/service";
import { respondToUserText } from "@/lib/bot/responder";
import { BOT_ACTIVE_STATES } from "@/lib/intake/machine";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "bot");
    assertCsrf(req);
    const user = await requireAnyRole(req);
    const { id } = await ctx.params;

    const session = requireOwnedSession(user, id);
    if (!BOT_ACTIVE_STATES.includes(session.state)) {
      throw new HttpError(409, "The intake assistant is not available at this step");
    }

    const parsed = z
      .object({ text: z.string().trim().min(1).max(500) })
      .safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid question");

    return Response.json({ response: respondToUserText(id, parsed.data.text) });
  } catch (e) {
    return errorResponse(e);
  }
}
