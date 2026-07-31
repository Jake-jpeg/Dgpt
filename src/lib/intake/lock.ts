/**
 * Intake lock / attorney reopen (operator directive 2026-07-31).
 *
 *   "Still lock the account (client) with the option for the lawyer to
 *    reopen it after review. If this wastes time? It will be a violation of
 *    the retainer agreement between the firm and the user."
 *
 * WHAT WAS BROKEN
 * ---------------
 * A scope gate that returned OUT (domestic violence; and in Phase 1, ANY
 * unemancipated children) appended a `stopped:` SYSTEM_EVENT and that was
 * the end of the matter, permanently, for everyone:
 *
 *   - `loadConversation` derived `stopped` from the FIRST `stopped:` event
 *     in an append-only transcript, so nothing could ever clear it;
 *   - the client's portal only calls /api/intake/start when
 *     `intakeSessionId` is null, and the stopped session is never null;
 *   - NO firm page called /api/intake/start at all;
 *   - and had one existed, `startIntake` stamps the CALLER's subject as
 *     `ownerSubject`, while /api/matters/[id] resolves the client's session
 *     by `ownerSubject === client.subject` — so an attorney-started session
 *     would have been invisible to the client anyway.
 *
 * Meanwhile the client read "This intake is paused — please contact the firm
 * to continue," which promised a path that did not exist in the codebase.
 *
 * THE DESIGN
 * ----------
 * The transcript stays append-only — a stop is never erased. The unlock is a
 * LATER event, and the lock state is whichever came last (see
 * `loadConversation`). So the full lock/unlock history stays readable in
 * order, every transition is audited, and there is no schema change.
 *
 * Reopening ADVANCES the session past the gate it tripped on, because the
 * attorney has now taken personal responsibility for that gate. Dropping the
 * client back onto the same question would re-lock instantly.
 *
 * WHAT THIS IS NOT: it is not a safety override. The DV card was still shown
 * and the resources were still given. Reopening records that a licensed
 * attorney reviewed the stop and chose to proceed — under their own name, in
 * the audit trail, with the reason they typed.
 */
import { HttpError } from "@/lib/auth/rbac";
import { getMatter } from "@/lib/db/matters";
import { getUserById } from "@/lib/db/users";
import {
  createSession,
  listSessionsByMatter,
  updateSession,
  addAttorneyFlag,
  recordAudit,
} from "@/lib/db/repo";
import { appendSystemEvent, listChatMessages } from "@/lib/db/intake-chat";
import { soleSuccessor, type MachineState } from "@/lib/intake/machine";
import { EV_LOCKED_PREFIX, EV_REOPENED_PREFIX } from "@/lib/intake-chat/orchestrator";

export interface IntakeLockState {
  sessionId: string | null;
  locked: boolean;
  /** "dv" | "scope" | "locked by attorney" — the trailing text of the stop event. */
  reason: string | null;
  /** When the current lock (or unlock) was written. */
  since: string | null;
  state: MachineState | null;
}

/**
 * The client's OWN session on this matter — the same resolution
 * /api/matters/[id] uses, so the firm and the client can never disagree
 * about which session is live.
 */
async function clientSession(matterId: string) {
  const matter = await getMatter(matterId);
  if (!matter) throw new HttpError(404, "Matter not found");
  if (!matter.clientUserId) return { matter, client: null, session: null };
  const client = await getUserById(matter.clientUserId);
  if (!client?.subject) return { matter, client, session: null };
  const session =
    (await listSessionsByMatter(matterId)).find((s) => s.ownerSubject === client.subject) ?? null;
  return { matter, client, session };
}

/** Read-only lock state for the firm matter page. */
export async function readIntakeLock(matterId: string): Promise<IntakeLockState> {
  const { session } = await clientSession(matterId);
  if (!session) return { sessionId: null, locked: false, reason: null, since: null, state: null };

  const events = (await listChatMessages(session.id)).filter((m) => m.role === "SYSTEM_EVENT");
  const last = [...events]
    .reverse()
    .find((m) => m.content.startsWith("stopped:") || m.content.startsWith(EV_REOPENED_PREFIX));

  const locked = !!last && last.content.startsWith("stopped:");
  return {
    sessionId: session.id,
    locked,
    reason: locked ? last!.content.slice("stopped:".length).trim() : null,
    since: last?.createdAt ?? null,
    state: session.state as MachineState,
  };
}

/**
 * Attorney locks the client out — threats, abuse of the terms, anything the
 * firm wants stopped while a human looks at it.
 */
export async function lockIntake(opts: {
  matterId: string;
  actingUserId: string;
  note?: string;
}): Promise<IntakeLockState> {
  const { session } = await clientSession(opts.matterId);
  if (!session) throw new HttpError(409, "This matter has no client intake session to lock");

  const current = await readIntakeLock(opts.matterId);
  if (current.locked) return current;

  await appendSystemEvent(session.id, EV_LOCKED_PREFIX);
  await addAttorneyFlag(session.id, "INTAKE_LOCKED_BY_ATTORNEY");
  await recordAudit(
    session.id,
    "INTAKE_LOCKED_BY_ATTORNEY",
    // The note is the attorney's own words about their own decision. It is
    // NOT client content, so the audit trail is still free of client free
    // text (see the data-class table in README).
    opts.note?.trim() ? `note=${opts.note.trim().slice(0, 300)}` : "note=(none)",
    opts.actingUserId
  );
  return readIntakeLock(opts.matterId);
}

/**
 * Attorney reopens after review. Advances past the tripped gate and, if the
 * client's session was purged out from under them, mints a fresh one owned
 * by the CLIENT's subject (never the attorney's — that was the trap).
 */
export async function reopenIntake(opts: {
  matterId: string;
  actingUserId: string;
  note?: string;
}): Promise<IntakeLockState> {
  const { matter, client, session } = await clientSession(opts.matterId);
  if (!client?.subject) {
    throw new HttpError(409, "Connect the client to this matter before reopening intake");
  }
  const detail = opts.note?.trim() ? `note=${opts.note.trim().slice(0, 300)}` : "note=(none)";

  if (!session) {
    // Nothing to reopen — start one the client can actually see. ownerSubject
    // is the CLIENT's, which is the whole point.
    const fresh = await createSession({
      initiatedBy: "ATTORNEY",
      ownerSubject: client.subject,
      initialState: "GATE_RESIDENCY",
      matterId: matter.id,
      conflictClear: true,
    });
    await recordAudit(fresh.id, "INTAKE_REOPENED_BY_ATTORNEY", `fresh=1 ${detail}`, opts.actingUserId);
    return readIntakeLock(opts.matterId);
  }

  const before = session.state as MachineState;
  // Carry past the gate that stopped them. If the state has no single legal
  // successor (already past the gates, or a branch), leave it — clearing the
  // stop is enough.
  const next = soleSuccessor(before);
  if (next) await updateSession(session.id, { state: next });

  await appendSystemEvent(session.id, EV_REOPENED_PREFIX);
  await addAttorneyFlag(session.id, "INTAKE_REOPENED_BY_ATTORNEY");
  await recordAudit(
    session.id,
    "INTAKE_REOPENED_BY_ATTORNEY",
    `from=${before} to=${next ?? before} ${detail}`,
    opts.actingUserId
  );
  return readIntakeLock(opts.matterId);
}
