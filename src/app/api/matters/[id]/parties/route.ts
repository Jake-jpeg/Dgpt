/**
 * The two spouses on a matter (2026-10-30).
 *
 * GET — status of both seats. A CLIENT sees each party's role and status
 *       and their OWN seat marked, nothing of the other spouse beyond the
 *       first name they gave June and whether they have finished. The firm
 *       additionally gets the live invitation link for an unseated B and,
 *       once both interviews are complete, the meeting-of-the-minds report
 *       (src/lib/compare) — the two answer sets side by side, mismatches
 *       first. The private safety section is never in that report.
 * POST — reissue the invitation for seat B (party A or the firm). Any
 *        earlier link dies.
 */
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { listParties, partyRoleForUser, bothPartiesComplete } from "@/lib/db/parties";
import { createSpouseInvitation, liveInvitationForParty } from "@/lib/db/spouse-invites";
import { getMatterAnswers, schemaForMatter } from "@/lib/db/intake2";
import { compareParties } from "@/lib/compare";
import { joinUrl } from "@/lib/june/links";
import { maskEmail } from "@/lib/db/invitations";
import { recordAudit } from "@/lib/db/repo";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["CLIENT", "STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = await requireMatterAccess(authed, id);
    const parties = await listParties(matter.id);
    const isFirm = authed.account.role !== "CLIENT";
    const mine = isFirm ? null : await partyRoleForUser(matter, authed.account.id);
    const complete = await bothPartiesComplete(matter.id);

    const view = await Promise.all(
      parties.map(async (p) => {
        const base = {
          role: p.role,
          status: p.status,
          firstName: p.displayName.split(/\s+/)[0] ?? "",
          isYou: mine === p.role,
          seated: Boolean(p.userId),
        };
        if (!isFirm) return base;
        const live = p.userId ? null : await liveInvitationForParty(p.id);
        return {
          ...base,
          displayName: p.displayName,
          // The firm sees the real address: it is what the attorney uses to
          // send the Teams invitation for the one-hour meeting (Jake,
          // 2026-10-30: "I need both their emails anyways"). Clients never
          // receive this field.
          email: p.invitedEmail,
          emailMasked: maskEmail(p.invitedEmail),
          noticeAckAt: p.noticeAckAt,
          noticeAckVersion: p.noticeAckVersion,
          inviteUrl: live ? null : null, // the raw token is never re-derivable; reissue to get a link
          inviteExpiresAt: live?.expiresAt ?? null,
        };
      })
    );

    let comparison = null;
    if (isFirm && complete) {
      const schema = schemaForMatter(matter);
      const [a, b] = await Promise.all([getMatterAnswers(matter.id, "A"), getMatterAnswers(matter.id, "B")]);
      comparison = compareParties(schema, a, b);
    }
    return Response.json({ parties: view, bothComplete: complete, comparison });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["CLIENT", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = await requireMatterAccess(authed, id);
    if (authed.account.role === "CLIENT") {
      const mine = await partyRoleForUser(matter, authed.account.id);
      if (mine !== "A") throw new HttpError(403, "Only the spouse who started the case can resend the invitation");
    }
    const b = (await listParties(matter.id)).find((p) => p.role === "B");
    if (!b) throw new HttpError(409, "This case has no second spouse to invite");
    if (b.userId) throw new HttpError(409, "Your spouse has already joined");
    const inv = await createSpouseInvitation({ matterId: matter.id, partyId: b.id, targetEmail: b.invitedEmail, createdBy: authed.account.id });
    await recordAudit(matter.id, "INVITE_REISSUED", "party=B", authed.account.id);
    return Response.json({ inviteUrl: joinUrl(req, inv.token), inviteExpiresAt: inv.expiresAt, emailMasked: maskEmail(b.invitedEmail) });
  } catch (e) {
    return errorResponse(e);
  }
}
