/**
 * Intake phase & track — ATTORNEY only.
 *
 * TRACK (2026-07-26 operator directive): the attorney declares, per matter,
 * "This is for an uncontested case" or "This is for a contested case".
 * Uncontested runs the lean phased interview; contested opens the FULL
 * questionnaire (SNW facts included) by resolving the phase to "ALL".
 * The track is stored as the matter category through the one guarded
 * setter (`attorneySetJurisdictionAndScope`) — no second code path.
 *
 * PHASE (uncontested track only): the intake mirrors NY divorce practice's
 * three phases (1 commencement · 2 settlement · 3 finalization); advancing a
 * matter opens that phase's question set to the client. Rewinding is allowed
 * (it only narrows what is ASKED; saved answers are never touched). Audited.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { setMatterIntakePhase, getMatter } from "@/lib/db/matters";
import { attorneySetJurisdictionAndScope } from "@/lib/db/intake2";
import { matterIntakeTrack, TRACK_CATEGORY, type IntakeTrack } from "@/config/intake/phases";
import type { MatterCategory } from "@/lib/intake2/types";
import { recordAudit } from "@/lib/db/repo";

const schema = z.union([
  z.object({ phase: z.union([z.literal(1), z.literal(2), z.literal(3)]) }),
  z.object({ track: z.enum(["UNCONTESTED", "CONTESTED"]) }),
]);

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = await requireMatterAccess(authed, id);
    return Response.json({ phase: matter.intakePhase, track: matterIntakeTrack(matter) });
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
      throw new HttpError(400, "VALIDATION: expected phase 1/2/3 or track UNCONTESTED/CONTESTED");
    }

    if ("track" in parsed.data) {
      const track: IntakeTrack = parsed.data.track;
      const from = matterIntakeTrack(matter);
      await attorneySetJurisdictionAndScope({
        matterId: matter.id,
        actingUserId: authed.account.id,
        matterCategory: TRACK_CATEGORY[track] as MatterCategory,
      });
      await recordAudit(
        matter.id,
        "INTAKE_TRACK_SET",
        `from=${from} to=${track}`,
        authed.account.id
      );
    } else {
      await setMatterIntakePhase(matter.id, parsed.data.phase);
      await recordAudit(
        matter.id,
        "INTAKE_PHASE_SET",
        `from=${matter.intakePhase} to=${parsed.data.phase}`,
        authed.account.id
      );
    }

    const updated = (await getMatter(matter.id))!;
    return Response.json({ phase: updated.intakePhase, track: matterIntakeTrack(updated) });
  } catch (e) {
    return errorResponse(e);
  }
}
