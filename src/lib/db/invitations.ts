/**
 * Attorney-controlled client connection (2026-07-26 — the successor to
 * invitation links): the client registers by signing in; the ATTORNEY
 * connects that registration to a matter from the firm portal.
 *
 * HISTORY. This module used to carry the whole invitation-link machinery —
 * hashed single-use email-bound tokens, preview/accept/revoke, and the
 * invited-client onboarding pipeline. That flow was retired in production
 * (the invite cookie did not reliably survive the OAuth round-trip, and the
 * attorney could not see or control any of it) and its HTTP routes carried
 * no UI callers, so the whole apparatus was deleted on 2026-07-27
 * ("kill redundant code" — operator). The full implementation remains in
 * git history (see 5041649 and the pre-2026-07-27 revisions of this file)
 * if it is ever wanted again. The `invitation` DB table is left in place —
 * dropping tables is a data migration, not code cleanup.
 */
import { bindClientToMatter, getMatter, markConflictsExternal } from "./matters";
import { createSession, listSessionsByMatter, recordAudit } from "./repo";

/**
 * "jane.doe@gmail.com" → "ja***@gmail.com". A FIXED three stars, so the mask
 * doesn't even leak the local-part length — just enough for a client to
 * recognize their own address in firm-facing UI.
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}***@${domain}`;
}

/**
 * ATTORNEY-CONTROLLED CONNECTION: same guarantees invitation acceptance
 * gave, minus the token — one client per matter, EXTERNAL conflict posture
 * recorded, intake session opened, everything audited by the caller.
 */
export async function connectClientToMatter(opts: {
  matterId: string;
  clientUserId: string;
}): Promise<
  | { sessionId: string }
  | { error: "matter_not_found" | "matter_taken" | "not_a_client" | "never_signed_in" }
> {
  const { getUserById } = await import("./users");
  const matter = await getMatter(opts.matterId);
  if (!matter) return { error: "matter_not_found" };
  if (matter.clientUserId && matter.clientUserId !== opts.clientUserId) {
    return { error: "matter_taken" };
  }
  const user = await getUserById(opts.clientUserId);
  if (!user || user.role !== "CLIENT") return { error: "not_a_client" };
  if (!user.subject) return { error: "never_signed_in" };

  await bindClientToMatter(opts.matterId, user.id);
  await markConflictsExternal(opts.matterId);

  const existing = (await listSessionsByMatter(opts.matterId)).find(
    (s) => s.ownerSubject === user.subject
  );
  const sess =
    existing ??
    (await createSession({
      initiatedBy: "CLIENT",
      ownerSubject: user.subject,
      initialState: "GATE_RESIDENCY",
      matterId: opts.matterId,
      conflictClear: true,
    }));
  if (!existing) await recordAudit(sess.id, "SESSION_STARTED", "initiatedBy=CLIENT");
  return { sessionId: sess.id };
}
