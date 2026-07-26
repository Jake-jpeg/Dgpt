/**
 * Intake phase — ATTORNEY only.
 *
 * There is NO track. The product is uncontested-only (operator directive,
 * 2026-07-26: "The whole scope is uncontested… We're not doing contested at
 * all."). The former UNCONTESTED/CONTESTED switch, and the contested branch
 * that resolved a matter to the full questionnaire, are gone.
 *
 * PHASE: the intake mirrors NY divorce practice's three phases
 * (1 commencement · 2 settlement · 3 finalization); advancing a matter opens
 * that phase's question set to the client. Rewinding is allowed (it only
 * narrows what is ASKED; saved answers are never touched). Audited.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { setMatterIntakePhase, getMatter } from "@/lib/db/matters";
import { recordAudit } from "@/lib/db/repo";

const schema = z.object({ phase: z.union([z.literal(1), z.literal(2), z.literal(3)]) });

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = await requireMatterAccess(authed, id);
    return Response.json({ phase: matter.intakePhase });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = await requireMatterAccess(authed, id);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      throw new HttpError(400, "VALIDATION: expected phase 1, 2, or 3");
    }

    await setMatterIntakePhase(matter.id, parsed.data.phase);
    await recordAudit(
      matter.id,
      "INTAKE_PHASE_SET",
      `from=${matter.intakePhase} to=${parsed.data.phase}`,
      authed.account.id
    );

    const updated = (await getMatter(matter.id))!;
    return Response.json({ phase: updated.intakePhase });
  } catch (e) {
    return errorResponse(e);
  }
}
