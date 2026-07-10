import { z } from "zod";
import { requireAnyRole, errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { answerGate, isTerminated } from "@/lib/intake/service";
import { GATE_QUESTIONS } from "@/config/gate-questions";
import { BRANCH_QUESTIONS } from "@/lib/intake/tiers";
import { isGateState } from "@/lib/intake/scope-gate";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const user = await requireAnyRole(req);
    const { id } = await ctx.params;

    const parsed = z.object({ answer: z.unknown() }).safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400, "VALIDATION: missing answer");

    const outcome = answerGate(user, id, parsed.data.answer);
    if (isTerminated(outcome)) return Response.json(outcome);

    return Response.json({
      state: outcome.next,
      ...(isGateState(outcome.next)
        ? { gateQuestion: GATE_QUESTIONS[outcome.next] }
        : { branchQuestions: BRANCH_QUESTIONS }),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
