/**
 * Intake service — the single place where the state machine, conflict wall,
 * scope gate, tier routing, and persistence meet. API routes are thin
 * wrappers over these functions; tests exercise them directly AND via the
 * HTTP layer.
 *
 * Every function takes the authenticated user and re-checks ownership and
 * machine state server-side. Nothing here trusts the client.
 */
import { z } from "zod";
import {
  createSession,
  getSession,
  updateSession,
  setIdentity,
  insertAnswer,
  getAnswers,
  purgeSession,
  recordAudit,
  addAttorneyFlag,
  touchSession,
  type SessionRow,
  type PartyName,
} from "@/lib/db/repo";
import { getConflictProvider } from "@/lib/conflict/provider";
import {
  attorneySetConflictDisposition,
  recordScreenStatus,
  setMatterLifecycle,
} from "@/lib/db/matters";
import { recordConflictSubmission, resolveLatestSubmission } from "@/lib/db/conflicts";
import { listSessionsByMatter } from "@/lib/db/repo";
import { hashNameForAudit } from "@/lib/security/audit-hash";
import { HttpError } from "@/lib/auth/rbac";
import type { SessionUser } from "@/lib/auth/session";
import { assertTransition, type MachineState } from "./machine";
import { evaluateGate, isGateState } from "./scope-gate";
import { evaluateBranch, routeAnswer, BRANCH_QUESTIONS } from "./tiers";
import { validateAnswer, missingRequiredFields } from "./validation";
import { GATE_QUESTIONS } from "@/config/gate-questions";
import { getCard, type StaticCard } from "@/config/cards";
import { sectionsForTier } from "@/config/intake-fields";

const partyNameSchema = z.object({
  fullLegalName: z.string().trim().min(2).max(120),
  priorNames: z.array(z.string().trim().min(2).max(120)).max(5).default([]),
});

export interface TerminatedView {
  status: "TERMINATED";
  card: StaticCard;
}

export function isTerminated(v: unknown): v is TerminatedView {
  return typeof v === "object" && v !== null && (v as TerminatedView).status === "TERMINATED";
}

/** Load a session and verify the caller owns it (or 404 — never leak existence). */
export function requireOwnedSession(user: SessionUser, sessionId: string): SessionRow {
  const s = getSession(sessionId);
  if (!s || s.ownerSubject !== user.subject) {
    throw new HttpError(404, "Session not found");
  }
  return s;
}

export function startIntake(user: SessionUser, matterId?: string): SessionRow {
  // Both intake modes pass through the same wall: client-initiated and
  // staff/attorney-initiated sessions start in PRE_GATE, no exceptions.
  // ADMIN does not perform intake (least privilege).
  if (user.role === "ADMIN") {
    throw new HttpError(403, "Admins do not perform intake");
  }
  const s = createSession({
    initiatedBy: user.role,
    ownerSubject: user.subject,
    initialState: "PRE_GATE",
    matterId,
  });
  recordAudit(s.id, "SESSION_STARTED", `initiatedBy=${user.role}`);
  return s;
}

/** Neutral, client-facing pending message — identical for every screen outcome. */
export const CONFLICT_PENDING_MESSAGE =
  "Your information has been submitted for review. The firm will contact you regarding the next step.";

/**
 * Pre-gate identity capture + AUTOMATED CONFLICT SCREENING, one atomic step.
 * The ONLY data collected before the screen: both parties' full legal names,
 * prior/maiden names, and the adversary identity as the tiebreaker.
 *
 * 2.0: automated screening never clears and never declines. It records a
 * retained conflict_submission, assigns one of the four screen statuses to
 * the matter, and parks the session in CONFLICT_REVIEW_PENDING. Only an
 * ATTORNEY disposition (CLEARED) lets intake proceed; the client sees one
 * neutral message either way and never the screen's internal result.
 */
export async function submitIdentityAndCheck(
  user: SessionUser,
  sessionId: string,
  body: unknown
): Promise<{ result: "PENDING_REVIEW"; message: string; session: SessionRow }> {
  const s = requireOwnedSession(user, sessionId);
  if (s.state !== "PRE_GATE") {
    throw new HttpError(409, "Identity was already captured for this session");
  }
  if (!s.matterId) {
    throw new HttpError(409, "This intake is not linked to a matter");
  }

  const parsed = z
    .object({ clientParty: partyNameSchema, adverseParty: partyNameSchema })
    .safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, `VALIDATION: ${parsed.error.issues[0]?.message ?? "invalid identity"}`);
  }
  const { clientParty, adverseParty } = parsed.data;

  // Persist bare identity so the screen is auditable while it runs…
  setIdentity(sessionId, clientParty as PartyName, adverseParty as PartyName);
  recordAudit(sessionId, "CONFLICT_SCREEN_RUN", `matter=${s.matterId}`);

  const raw = await getConflictProvider().check(
    clientParty as PartyName,
    adverseParty as PartyName
  );
  // Automated screening maps ONLY onto non-terminal statuses.
  const screenResult = raw === "HIT" ? "POTENTIAL_MATCH" : "NO_APPARENT_MATCH";

  recordConflictSubmission({
    matterRef: s.matterId,
    clientParty: clientParty as PartyName,
    adverseParty: adverseParty as PartyName,
    screenResult,
    submittedBy: user.subject,
  });
  recordScreenStatus(s.matterId, screenResult);

  recordAudit(
    sessionId,
    "CONFLICT_SCREEN_RESULT",
    JSON.stringify({
      result: screenResult,
      clientHash: hashNameForAudit(clientParty.fullLegalName),
      adverseHash: hashNameForAudit(adverseParty.fullLegalName),
    })
  );

  assertTransition("PRE_GATE", "CONFLICT_REVIEW_PENDING");
  updateSession(sessionId, { state: "CONFLICT_REVIEW_PENDING" });
  return {
    result: "PENDING_REVIEW",
    message: CONFLICT_PENDING_MESSAGE,
    session: getSession(sessionId)!,
  };
}

/**
 * Applies an attorney's conflict disposition to a matter AND its parked
 * intake session(s). The structural role guards live in the persistence
 * layer (attorneySetConflictDisposition / resolveLatestSubmission) — this
 * function orchestrates.
 */
export function applyConflictDisposition(opts: {
  matterId: string;
  actingUserId: string;
  disposition: "CLEARED" | "DECLINED" | "NEEDS_MORE_INFORMATION";
  internalNote?: string;
}): void {
  attorneySetConflictDisposition({
    matterId: opts.matterId,
    actingUserId: opts.actingUserId,
    disposition: opts.disposition,
  });
  resolveLatestSubmission({
    matterRef: opts.matterId,
    actingUserId: opts.actingUserId,
    disposition: opts.disposition,
    internalNote: opts.internalNote,
  });
  recordAudit(
    opts.matterId,
    "CONFLICT_DISPOSITION",
    `disposition=${opts.disposition}`,
    opts.actingUserId
  );

  const sessions = listSessionsByMatter(opts.matterId);
  if (opts.disposition === "CLEARED") {
    for (const sess of sessions) {
      if (sess.state === "CONFLICT_REVIEW_PENDING") {
        assertTransition("CONFLICT_REVIEW_PENDING", "GATE_RESIDENCY");
        updateSession(sess.id, { state: "GATE_RESIDENCY", conflictClear: true });
        recordAudit(sess.id, "CONFLICT_CLEARED_BY_ATTORNEY", undefined, opts.actingUserId);
      }
    }
  } else if (opts.disposition === "DECLINED") {
    setMatterLifecycle(opts.matterId, "DECLINED");
    for (const sess of sessions) {
      // Substantive/session data goes; the retained conflict_submission and
      // the audit chain survive (they have no FK to the session or matter).
      purgeSession(sess.id, "CONFLICT_DECLINED_BY_ATTORNEY");
    }
  }
}

/**
 * Answer the CURRENT scope-gate question. The server decides which question
 * is current from the machine state — the client cannot pick or skip.
 */
export function answerGate(
  user: SessionUser,
  sessionId: string,
  rawAnswer: unknown
): { next: MachineState } | TerminatedView {
  const s = requireOwnedSession(user, sessionId);
  if (!s.conflictClear) throw new HttpError(409, "Conflict check has not cleared");
  if (!isGateState(s.state)) {
    throw new HttpError(409, `No gate question pending in state ${s.state}`);
  }

  const evaluation = evaluateGate(s.state, rawAnswer);

  if (evaluation.outcome === "OUT") {
    // Out-of-scope: serve the mapped static card, keep minimal audit, purge
    // everything substantive (including the tripping answer — never stored).
    recordAudit(sessionId, evaluation.auditEvent, `card=${evaluation.card}`);
    purgeSession(sessionId, evaluation.auditEvent);
    return { status: "TERMINATED", card: getCard(evaluation.card) };
  }

  assertTransition(s.state, evaluation.next);
  updateSession(sessionId, {
    state: evaluation.next,
    ...(evaluation.persist?.county ? { county: evaluation.persist.county } : {}),
  });
  recordAudit(sessionId, "GATE_PASSED", s.state);
  return { next: evaluation.next };
}

/** Answer the two tier-branch questions (assets / alimony). */
export function answerBranch(
  user: SessionUser,
  sessionId: string,
  body: unknown
): { tier: "TIER1" | "TIER2" } | TerminatedView {
  const s = requireOwnedSession(user, sessionId);
  if (s.state !== "TIER_BRANCH") {
    throw new HttpError(409, `Tier branching is not pending in state ${s.state}`);
  }
  const parsed = z
    .object({ branch_assets: z.string(), branch_alimony: z.string() })
    .safeParse(body);
  if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid branch answers");

  const outcome = evaluateBranch(parsed.data.branch_assets, parsed.data.branch_alimony);
  if (outcome.outcome === "OUT") {
    recordAudit(sessionId, outcome.auditEvent, `card=${outcome.card}`);
    purgeSession(sessionId, outcome.auditEvent);
    return { status: "TERMINATED", card: getCard(outcome.card) };
  }

  insertAnswer(sessionId, "branch_assets", parsed.data.branch_assets);
  insertAnswer(sessionId, "branch_alimony", parsed.data.branch_alimony);
  assertTransition("TIER_BRANCH", "INTAKE");
  updateSession(sessionId, { state: "INTAKE", tier: outcome.outcome });
  recordAudit(sessionId, "TIER_SELECTED", outcome.outcome);
  return { tier: outcome.outcome };
}

/**
 * Submit a batch of substantive answers for the session's tier. Every field
 * is validated against attorney config; routing rules may flag for the
 * attorney (QDRO → continue) or trip out (valuation / business /
 * disagreement → Bergen Bar card + purge).
 */
export function submitAnswers(
  user: SessionUser,
  sessionId: string,
  body: unknown
): { saved: number; missing: string[] } | TerminatedView {
  const s = requireOwnedSession(user, sessionId);
  if (s.state !== "INTAKE" || !s.tier) {
    throw new HttpError(409, `Answers are not accepted in state ${s.state}`);
  }
  const parsed = z
    .object({
      answers: z.array(z.object({ fieldId: z.string(), value: z.unknown() })).min(1).max(60),
    })
    .safeParse(body);
  if (!parsed.success) throw new HttpError(400, "VALIDATION: invalid answers payload");

  // Validate everything BEFORE persisting anything.
  const validated = parsed.data.answers.map((a) =>
    validateAnswer(s.tier!, a.fieldId, a.value)
  );

  // Route BEFORE persisting: if any answer trips OUT, nothing from this
  // batch is stored and the whole session is purged.
  const flags: string[] = [];
  let qdro = false;
  for (const a of validated) {
    const routing = routeAnswer(a.fieldId, a.value);
    if (routing.outcome === "OUT") {
      recordAudit(sessionId, routing.auditEvent, `card=${routing.card}`);
      purgeSession(sessionId, routing.auditEvent);
      return { status: "TERMINATED", card: getCard(routing.card) };
    }
    if (routing.qdroFlag) qdro = true;
    if (routing.attorneyFlags) flags.push(...routing.attorneyFlags);
  }

  for (const a of validated) insertAnswer(sessionId, a.fieldId, a.value);
  if (qdro) updateSession(sessionId, { qdroFlag: true });
  for (const f of flags) addAttorneyFlag(sessionId, f);
  touchSession(sessionId);

  const missing = missingRequiredFields(s.tier, getAnswers(sessionId));
  return { saved: validated.length, missing };
}

/** Completion: verify every required field is answered → READY_FOR_REVIEW. */
export function completeIntake(
  user: SessionUser,
  sessionId: string
): { state: "READY_FOR_REVIEW" } {
  const s = requireOwnedSession(user, sessionId);
  if (s.state !== "INTAKE" || !s.tier) {
    throw new HttpError(409, `Cannot complete from state ${s.state}`);
  }
  const missing = missingRequiredFields(s.tier, getAnswers(sessionId));
  if (missing.length > 0) {
    throw new HttpError(400, `VALIDATION: intake incomplete: ${missing.join(", ")}`);
  }
  assertTransition("INTAKE", "READY_FOR_REVIEW");
  updateSession(sessionId, { state: "READY_FOR_REVIEW" });
  recordAudit(sessionId, "READY_FOR_REVIEW");
  return { state: "READY_FOR_REVIEW" };
}

/** What the client UI needs to render the current step. Never leaks other sessions. */
export function sessionView(user: SessionUser, sessionId: string) {
  const s = requireOwnedSession(user, sessionId);
  const base = {
    id: s.id,
    state: s.state,
    tier: s.tier,
    initiatedBy: s.initiatedBy,
  };
  if (s.state === "CONFLICT_REVIEW_PENDING") {
    // Neutral status only — never the screen result or internal reasoning.
    return { ...base, message: CONFLICT_PENDING_MESSAGE };
  }
  if (isGateState(s.state)) {
    const q = GATE_QUESTIONS[s.state];
    return { ...base, gateQuestion: q };
  }
  if (s.state === "TIER_BRANCH") {
    return { ...base, branchQuestions: BRANCH_QUESTIONS };
  }
  if (s.state === "INTAKE" && s.tier) {
    return {
      ...base,
      sections: sectionsForTier(s.tier),
      answers: getAnswers(s.id),
      missing: missingRequiredFields(s.tier, getAnswers(s.id)),
    };
  }
  return base;
}
