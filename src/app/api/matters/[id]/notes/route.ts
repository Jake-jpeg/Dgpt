/**
 * Internal notes + escalations — STAFF/ATTORNEY only. Internal work
 * product: there is no client-facing code path to this data.
 */
import { z } from "zod";
import { requireUser, requireMatterAccess } from "@/lib/auth/authz";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { createInternalNote, listInternalNotes, resolveInternalNote } from "@/lib/db/notes";
import { recordAudit } from "@/lib/db/repo";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    return Response.json({ notes: (await listInternalNotes(matter.id)) });
  } catch (e) {
    return errorResponse(e);
  }
}

const createSchema = z.object({
  kind: z.enum(["NOTE", "ESCALATION"]).default("NOTE"),
  body: z.string().trim().min(1).max(8000),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid note payload");
    const note = (await createInternalNote({
          matterId: matter.id,
          author: authed.account.id,
          kind: parsed.data.kind,
          body: parsed.data.body,
        }));
    (await recordAudit(
            matter.id,
            parsed.data.kind === "ESCALATION" ? "ISSUE_ESCALATED" : "INTERNAL_NOTE_ADDED",
            `note=${note.id}`,
            authed.account.id
          ));
    return Response.json({ note }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

const patchSchema = z.object({ noteId: z.string().trim().min(1) });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRateLimit(req, "intake");
    assertCsrf(req);
    const authed = await requireUser(req, ["STAFF", "ATTORNEY"]);
    const { id } = await ctx.params;
    const matter = (await requireMatterAccess(authed, id));
    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid payload");
    const target = (await listInternalNotes(matter.id)).find((n) => n.id === parsed.data.noteId);
    if (!target) throw new HttpError(404, "Note not found");
    (await resolveInternalNote(target.id));
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
