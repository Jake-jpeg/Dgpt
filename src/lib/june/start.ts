/**
 * June — the start conversation (2026-10-30).
 *
 * Operator: "AI up front. Its name will be June. Place the intake bot after
 * the gate. Gate has to stay. AI takes basic info upfront. Explains what the
 * product does. Dual login system."
 *
 * June's OPENING is scripted and server-authored — what the product is, how
 * the two interviews work, what it costs — and the basic facts she collects
 * are a fixed list of eight. None of that needs a model. Opus answers the
 * visitor's free-text QUESTIONS (src/lib/june/ask.ts), caged exactly like
 * the intake assistant: kill-switched, rate-limited, no advice.
 *
 * What June collects becomes a START DRAFT, parked by the email the
 * starting spouse says they will sign in with. It is not an account and
 * grants nothing. When that email signs in, the portal offers "Create my
 * case" and finishStart() turns the draft into a matter with two party
 * seats and an invitation link for the other spouse.
 */
import { z } from "zod";
import { ensureDefaultFirm } from "@/lib/db/firms";
import { servesState } from "@/config/service-area";
import { getDb, newId, nowIso } from "@/lib/db/index";
import { createMatter, bindClientToMatter, markConflictsExternal, pinMatterCategoryAtCreation } from "@/lib/db/matters";
import { createParty } from "@/lib/db/parties";
import { createSpouseInvitation } from "@/lib/db/spouse-invites";
import { createSession, listSessionsByMatter, recordAudit } from "@/lib/db/repo";
import { getSchemaForCategory } from "@/config/intake/schemas";
import { NJ_CATEGORY, UNCONTESTED_CATEGORY } from "@/config/intake/phases";
import { quoteFor, type Quote } from "@/config/pricing";
import type { UserRow } from "@/lib/db/users";
import { attachJuneChatToMatter } from "./turn";

export { JUNE_NAME, juneOpening } from "@/config/june-copy";

/** The eight facts June collects, in order. Validated here, not in the UI. */
export const startDraftSchema = z.object({
  yourName: z.string().trim().min(1).max(120),
  yourEmail: z.string().trim().toLowerCase().email().max(320),
  spouseName: z.string().trim().min(1).max(120),
  spouseEmail: z.string().trim().toLowerCase().email().max(320),
  // The front door creates cases in served states only (src/config/service-area.ts).
  state: z.enum(["NY", "NJ"]).refine((v) => servesState(v), "state not served"),
  children: z.boolean(),
  assets: z.boolean(),
  /** The starting spouse confirms they have read how the firm works. */
  understood: z.literal(true),
});
export type StartDraft = z.infer<typeof startDraftSchema>;

export interface StartDraftRow {
  id: string;
  email: string;
  /** The anonymous June conversation this draft grew out of (null for the form fallback). */
  visitorId: string | null;
  draft: StartDraft;
  quote: Quote;
  consumedAt: string | null;
  consumedMatter: string | null;
  createdAt: string;
}

/** Persist (or refresh) the draft parked under the starting spouse's email. */
export async function saveStartDraft(draft: StartDraft): Promise<StartDraftRow> {
  const db = getDb();
  const t = nowIso();
  const quote = quoteFor({ children: draft.children, assets: draft.assets });
  const payload = JSON.stringify({ draft, quote });
  const existing = await db.get<{ id: string }>(
    `SELECT id FROM start_draft WHERE email = ? AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    draft.yourEmail
  );
  if (existing) {
    await db.run(`UPDATE start_draft SET payload = ?, complete = 1, updated_at = ? WHERE id = ?`, payload, t, existing.id);
    return (await getStartDraft(existing.id))!;
  }
  const id = newId();
  await db.run(
    `INSERT INTO start_draft (id, email, complete, payload, created_at, updated_at) VALUES (?, ?, 1, ?, ?, ?)`,
    id,
    draft.yourEmail,
    payload,
    t,
    t
  );
  return (await getStartDraft(id))!;
}

function rowToDraft(r: Record<string, unknown>): StartDraftRow {
  const parsed = JSON.parse(r.payload as string) as { draft: StartDraft; quote: Quote };
  return {
    id: r.id as string,
    email: r.email as string,
    visitorId: (r.visitor_id as string | null) ?? null,
    draft: parsed.draft,
    quote: parsed.quote,
    consumedAt: (r.consumed_at as string | null) ?? null,
    consumedMatter: (r.consumed_matter as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}

export async function getStartDraft(id: string): Promise<StartDraftRow | null> {
  const r = await getDb().get(`SELECT * FROM start_draft WHERE id = ?`, id);
  return r ? rowToDraft(r) : null;
}

/** The unconsumed, COMPLETE draft parked under a signed-in email, if any. */
export async function pendingStartDraftFor(email: string): Promise<StartDraftRow | null> {
  const r = await getDb().get(
    `SELECT * FROM start_draft WHERE email = ? AND complete = 1 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    email.trim().toLowerCase()
  );
  return r ? rowToDraft(r) : null;
}

/**
 * The draft becomes a case. Called only for the signed-in user whose
 * VERIFIED email matches the draft — the route enforces that; this
 * function re-checks it. One transaction's worth of writes:
 *   matter (label is a non-identifying case number) → EXTERNAL conflict
 *   posture (the firm runs conflicts itself, as for every client-connected
 *   matter) → state + schema pinned → party A seated as the firm's client,
 *   party B invited → A's interview opened → audit.
 * Returns the raw invitation token ONCE; only its hash is stored.
 */
export async function finishStart(
  draftRow: StartDraftRow,
  user: UserRow
): Promise<{ matterId: string; inviteToken: string; inviteExpiresAt: string }> {
  if (user.role !== "CLIENT") throw new Error("START_GUARD: only a client account can start a case");
  if (!user.subject) throw new Error("START_GUARD: the account has never signed in");
  if (user.email.toLowerCase() !== draftRow.email) throw new Error("START_GUARD: this draft belongs to a different email");
  if (draftRow.consumedAt) throw new Error("START_GUARD: this draft was already used");
  if (!startDraftSchema.safeParse(draftRow.draft).success) throw new Error("START_GUARD: June has not finished collecting the details");
  if (draftRow.draft.spouseEmail === draftRow.email) throw new Error("VALIDATION: the two spouses need two different email addresses");

  const d = draftRow.draft;
  const label = `Case ${newId().slice(0, 8).toUpperCase()}`;
  // The front door opens cases for the default firm, on that firm's default tier (2026-11-02).
  const firm = await ensureDefaultFirm();
  const matter = await createMatter({ label, createdBy: user.id, jurisdictionCandidate: d.state, firmId: firm.id, engagementTier: firm.defaultTier });
  const category = d.state === "NJ" ? NJ_CATEGORY : UNCONTESTED_CATEGORY;
  await pinMatterCategoryAtCreation(matter.id, d.state, category, getSchemaForCategory(category).version);
  await bindClientToMatter(matter.id, user.id);
  await markConflictsExternal(matter.id);

  await createParty({ matterId: matter.id, role: "A", userId: user.id, invitedEmail: d.yourEmail, displayName: d.yourName });
  const partyB = await createParty({ matterId: matter.id, role: "B", invitedEmail: d.spouseEmail, displayName: d.spouseName });
  const invite = await createSpouseInvitation({ matterId: matter.id, partyId: partyB.id, targetEmail: d.spouseEmail, createdBy: user.id });

  const existing = (await listSessionsByMatter(matter.id)).find((s) => s.ownerSubject === user.subject);
  if (!existing) {
    const sess = await createSession({
      initiatedBy: "CLIENT",
      ownerSubject: user.subject,
      initialState: "GATE_RESIDENCY",
      matterId: matter.id,
      partyId: "A",
      conflictClear: true,
    });
    await recordAudit(sess.id, "SESSION_STARTED", "initiatedBy=CLIENT party=A");
  }

  const t = nowIso();
  await getDb().run(
    `UPDATE start_draft SET consumed_at = ?, consumed_matter = ?, updated_at = ? WHERE id = ?`,
    t,
    matter.id,
    t,
    draftRow.id
  );
  await recordAudit(
    matter.id,
    "CASE_STARTED_WITH_JUNE",
    `state=${d.state} children=${d.children} assets=${d.assets} quote=${draftRow.quote.total}`,
    user.id
  );
  await recordAudit(matter.id, "INVITE_SENT", "party=B", user.id);
  // The June conversation that produced this case now belongs to the matter
  // (firm-side reading only).
  if (draftRow.visitorId) await attachJuneChatToMatter(draftRow.visitorId, matter.id);
  return { matterId: matter.id, inviteToken: invite.token, inviteExpiresAt: invite.expiresAt };
}
