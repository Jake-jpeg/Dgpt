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

/**
 * THE REASON VOCABULARY (operator directive 2026-07-31: "cite the reason for
 * the lock. E.g., made terroristic threats. refused instructions multiple
 * times, DV, etc. Or if it's a 988 situation… I'll call them and ask what
 * happened — and that the system flagged this or that").
 *
 * A closed set of CODES. Never the client's words: the attorney calls the
 * client and asks, and a code is what you can say out loud on that call
 * without reading someone's disclosure back to them.
 *
 * `auto` marks the codes the SYSTEM can raise on its own. Today that is
 * exactly two — the DV gate and the scope gates — because there is no
 * free-text classifier anywhere in this codebase. THREATS, CRISIS_988 and
 * NONCOMPLIANCE are attorney-selected on a manual lock; nothing detects them
 * yet, and this catalog does not pretend otherwise.
 */
export const LOCK_REASONS = {
  DV: {
    auto: true,
    label: "Domestic violence",
    forAttorney:
      "The client answered yes to the domestic-violence question. They were shown the DV resource card and the intake stopped.",
  },
  SCOPE_CHILDREN: {
    auto: true,
    label: "Children — outside the Phase 1 lane",
    forAttorney:
      "The client has unemancipated children. Phase 1 is the no-children lane, so the intake stopped for counsel.",
  },
  SCOPE_COMPLEXITY: {
    auto: true,
    label: "Not fully agreed — outside the Phase 1 lane",
    forAttorney:
      "The parties are not in full agreement, so this is not an uncontested Phase 1 matter.",
  },
  SCOPE: {
    auto: true,
    label: "Scope",
    forAttorney: "The intake stopped on a scope question.",
  },
  THREATS: {
    auto: false,
    label: "Threats of violence",
    forAttorney: "You locked this after threats of violence.",
  },
  CRISIS_988: {
    auto: false,
    label: "988 / crisis situation",
    forAttorney:
      "You locked this as a crisis (988) situation. Call the client; 988 is the Suicide & Crisis Lifeline.",
  },
  NONCOMPLIANCE: {
    auto: false,
    label: "Refused instructions repeatedly",
    forAttorney: "You locked this after the client repeatedly refused to follow the intake.",
  },
  TERMS_ABUSE: {
    auto: false,
    label: "Abuse of the terms of service",
    forAttorney: "You locked this for abuse of the terms of service.",
  },
  ATTORNEY: {
    auto: false,
    label: "Attorney judgment (unspecified)",
    forAttorney: "You locked this intake.",
  },
} as const;

export type LockReason = keyof typeof LOCK_REASONS;
export const ATTORNEY_LOCK_REASONS = (Object.keys(LOCK_REASONS) as LockReason[]).filter(
  (r) => !LOCK_REASONS[r].auto
);

export function isLockReason(v: string): v is LockReason {
  return Object.prototype.hasOwnProperty.call(LOCK_REASONS, v);
}

/**
 * Legacy events written before the vocabulary existed said "dv" / "scope".
 * Normalise so an old lock still reads correctly on the panel.
 */
export function normaliseReason(raw: string | null): LockReason | null {
  if (!raw) return null;
  const t = raw.trim();
  const upper = t.toUpperCase().replace(/[\s-]+/g, "_");
  if (isLockReason(upper)) return upper;
  if (t.toLowerCase() === "locked by attorney") return "ATTORNEY";
  return null;
}

export interface IntakeLockState {
  sessionId: string | null;
  locked: boolean;
  /** A LOCK_REASONS code — never the client's words. */
  reason: LockReason | null;
  /** The sentence the attorney reads on the panel. */
  reasonText: string | null;
  /** True when the SYSTEM raised it; false when the attorney locked by hand. */
  auto: boolean;
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
  if (!session) {
    return {
      sessionId: null,
      locked: false,
      reason: null,
      reasonText: null,
      auto: false,
      since: null,
      state: null,
    };
  }

  const events = (await listChatMessages(session.id)).filter((m) => m.role === "SYSTEM_EVENT");
  const last = [...events]
    .reverse()
    .find((m) => m.content.startsWith("stopped:") || m.content.startsWith(EV_REOPENED_PREFIX));

  const locked = !!last && last.content.startsWith("stopped:");
  const reason = locked ? normaliseReason(last!.content.slice("stopped:".length)) : null;
  return {
    sessionId: session.id,
    locked,
    reason,
    reasonText: reason ? LOCK_REASONS[reason].forAttorney : locked ? "The intake stopped." : null,
    auto: reason ? LOCK_REASONS[reason].auto : false,
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
  /** One of ATTORNEY_LOCK_REASONS — an attorney cannot claim an auto code. */
  reason: LockReason;
  note?: string;
}): Promise<IntakeLockState> {
  if (LOCK_REASONS[opts.reason]?.auto) {
    throw new HttpError(400, "VALIDATION: that reason is raised by the system, not by hand");
  }
  const { session } = await clientSession(opts.matterId);
  if (!session) throw new HttpError(409, "This matter has no client intake session to lock");

  const current = await readIntakeLock(opts.matterId);
  if (current.locked) return current;

  await appendSystemEvent(session.id, `${EV_LOCKED_PREFIX}${opts.reason}`);
  await addAttorneyFlag(session.id, `INTAKE_LOCKED_${opts.reason}`);
  await recordAudit(
    session.id,
    "INTAKE_LOCKED_BY_ATTORNEY",
    // The note is the attorney's own words about their own decision. It is
    // NOT client content, so the audit trail is still free of client free
    // text (see the data-class table in README).
    `reason=${opts.reason} ` +
      (opts.note?.trim() ? `note=${opts.note.trim().slice(0, 300)}` : "note=(none)"),
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
