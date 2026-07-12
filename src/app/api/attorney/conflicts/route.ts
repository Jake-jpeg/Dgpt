/**
 * Attorney conflict-review queue — ATTORNEY only, scoped to matters the
 * attorney holds a grant on. Lists matters whose conflict status is a
 * non-terminal screen status, with their latest retained submission.
 */
import { requireUser } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { listMattersForGrantee, SCREEN_STATUSES } from "@/lib/db/matters";
import { listConflictSubmissionsForMatter } from "@/lib/db/conflicts";

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    const { account } = await requireUser(req, ["ATTORNEY"]);
    const pending = listMattersForGrantee(account.id)
      .filter((m) => (SCREEN_STATUSES as readonly string[]).includes(m.conflictStatus))
      .map((m) => {
        const latest = listConflictSubmissionsForMatter(m.id)[0] ?? null;
        return {
          matterId: m.id,
          label: m.label,
          conflictStatus: m.conflictStatus,
          submittedAt: latest?.createdAt ?? null,
          screenResult: latest?.screenResult ?? null,
          clientParty: latest?.clientParty ?? null,
          adverseParty: latest?.adverseParty ?? null,
        };
      });
    return Response.json({ pending });
  } catch (e) {
    return errorResponse(e);
  }
}
