/**
 * Connect a registered client to this matter — ATTORNEY only (2026-07-26:
 * attorney-controlled connection replaces invitation links). The click IS
 * the acceptance: the registration is bound to the matter, the EXTERNAL
 * conflict posture is recorded, and the client's intake session opens.
 * Audited. Disconnecting is not offered here — delete the matter (danger
 * zone) or decline the registration instead.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { connectClientToMatter } from "@/lib/db/invitations";
import { getUserById } from "@/lib/db/users";
import { recordAudit } from "@/lib/db/repo";
import { hashNameForAudit } from "@/lib/security/audit-hash";

const schema = z.object({ userId: z.string().min(1) });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = await requireMatterAccess(authed, id);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: userId is required");

    const result = await connectClientToMatter({ matterId: matter.id, clientUserId: parsed.data.userId });
    if ("error" in result) {
      const msg =
        result.error === "matter_taken"
          ? "This matter already belongs to a different client."
          : result.error === "not_a_client"
            ? "Only client registrations can be connected."
            : result.error === "never_signed_in"
              ? "This client has not signed in yet — ask them to sign in at the site first."
              : "Matter not found.";
      throw new HttpError(409, msg);
    }
    const user = (await getUserById(parsed.data.userId))!;
    await recordAudit(
      matter.id,
      "CLIENT_CONNECTED",
      `subjectHash=${hashNameForAudit(user.email)} session=${result.sessionId}`,
      authed.account.id
    );
    return Response.json({ connected: true, sessionId: result.sessionId });
  } catch (e) {
    return errorResponse(e);
  }
}
