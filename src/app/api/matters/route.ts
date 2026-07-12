/**
 * Matters — create (STAFF/ATTORNEY) and list (role-scoped).
 *
 * Listing is least-privilege: clients see only matters they are bound to;
 * staff/attorneys see only matters they hold grants on; admins see the
 * management view (labels + status, no substantive content lives here).
 */
import { z } from "zod";
import { requireUser } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import {
  createMatter,
  grantMatterAccess,
  listAllMatters,
  listMattersForClient,
  listMattersForGrantee,
  type MatterRow,
} from "@/lib/db/matters";
import { recordAudit } from "@/lib/db/repo";

function matterSummary(m: MatterRow) {
  return {
    id: m.id,
    label: m.label,
    lifecycle: m.lifecycle,
    conflictStatus: m.conflictStatus,
    legalHold: m.legalHold,
    updatedAt: m.updatedAt,
  };
}

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["CLIENT", "STAFF", "ATTORNEY", "ADMIN"]);
    const { account } = authed;
    let matters: MatterRow[];
    if (account.role === "CLIENT") {
      matters = listMattersForClient(account.id);
      // Clients get plain-language status only — internal conflict machinery
      // is summarized by the matter view endpoint, not enumerated here.
      return Response.json({
        matters: matters.map((m) => ({ id: m.id, updatedAt: m.updatedAt })),
      });
    } else if (account.role === "ADMIN") {
      matters = listAllMatters();
    } else {
      matters = listMattersForGrantee(account.id);
    }
    return Response.json({ matters: matters.map(matterSummary) });
  } catch (e) {
    return errorResponse(e);
  }
}

const createSchema = z.object({
  label: z.string().trim().min(1).max(120),
});

export async function POST(req: Request) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const { account } = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid matter payload");
    const matter = createMatter({ label: parsed.data.label, createdBy: account.id });
    // The creator works this matter: grant access at creation.
    grantMatterAccess(matter.id, account.id, account.id);
    recordAudit(matter.id, "MATTER_CREATED", undefined, account.id);
    return Response.json({ matter: matterSummary(matter) }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
