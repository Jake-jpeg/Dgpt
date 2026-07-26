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
  type MatterRow,
} from "@/lib/db/matters";
import { recordAudit, listSessionsByMatter } from "@/lib/db/repo";
import { getUserById } from "@/lib/db/users";
import { listDocumentsForMatter, listVersions } from "@/lib/db/documents";
import { attorneySetJurisdictionAndScope } from "@/lib/db/intake2";
import { matterIntakeTrack, TRACK_CATEGORY } from "@/config/intake/phases";
import type { MatterCategory } from "@/lib/intake2/types";

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

/** Working-list row for STAFF/ATTORNEY with a grant on the matter. */
async function firmMatterRow(m: MatterRow) {
  const client = m.clientUserId ? (await getUserById(m.clientUserId)) : null;
  const latestSession = (await listSessionsByMatter(m.id))[0] ?? null;
  const docs = await listDocumentsForMatter(m.id);
  const versions = (await Promise.all((await docs.map((d) => listVersions(d.id))))).flat();
  const awaitingReview = versions.filter((v) =>
    ["ATTORNEY_REVIEW_REQUIRED", "DRAFT", "CHANGES_REQUESTED"].includes(v.status)
  ).length;
  const released = versions.filter((v) => v.status === "RELEASED").length;
  return {
    ...matterSummary(m),
    track: matterIntakeTrack(m),
    client: client ? { name: client.name || client.email, email: client.email } : null,
    intakeStatus: latestSession?.state ?? "NOT_STARTED",
    documents: { total: versions.length, awaitingReview, released },
  };
}

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["CLIENT", "STAFF", "ATTORNEY", "ADMIN"]);
    const { account } = authed;
    let matters: MatterRow[];
    if (account.role === "CLIENT") {
      matters = (await listMattersForClient(account.id));
      // Clients get plain-language status only — internal conflict machinery
      // is summarized by the matter view endpoint, not enumerated here.
      return Response.json({
        matters: matters.map((m) => ({ id: m.id, updatedAt: m.updatedAt })),
      });
    } else if (account.role === "ADMIN") {
      // Management view: labels + status only, no matter content.
      matters = (await listAllMatters());
      return Response.json({ matters: matters.map(matterSummary) });
    } else {
      // STAFF / ATTORNEY: firm-wide working list — every matter, including
      // ones a client just self-opened, so the lawyer sees every client by
      // identity (name + email) with no invitation step.
      matters = (await listAllMatters());
      return Response.json({ matters: await Promise.all((await matters.map(firmMatterRow))) });
    }
  } catch (e) {
    return errorResponse(e);
  }
}

const createSchema = z.object({
  label: z.string().trim().min(1).max(120),
  // Intake track (2026-07-26): the attorney declares uncontested vs contested
  // at creation. Category assignment is ATTORNEY-only (the guarded setter
  // enforces it), so STAFF create without a track and the attorney sets it
  // on the matter page.
  track: z.enum(["UNCONTESTED", "CONTESTED"]).optional(),
});

export async function POST(req: Request) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const { account } = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid matter payload");
    if (parsed.data.track && account.role !== "ATTORNEY") {
      throw new HttpError(403, "FORBIDDEN: only an attorney may set the intake track");
    }
    const matter = (await createMatter({ label: parsed.data.label, createdBy: account.id }));
    // The creator works this matter: grant access at creation.
    (await grantMatterAccess(matter.id, account.id, account.id));
    (await recordAudit(matter.id, "MATTER_CREATED", parsed.data.track ? `track=${parsed.data.track}` : undefined, account.id));
    if (parsed.data.track) {
      await attorneySetJurisdictionAndScope({
        matterId: matter.id,
        actingUserId: account.id,
        matterCategory: TRACK_CATEGORY[parsed.data.track] as MatterCategory,
      });
      await recordAudit(matter.id, "INTAKE_TRACK_SET", `from=- to=${parsed.data.track}`, account.id);
    }
    return Response.json({ matter: matterSummary(matter) }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
