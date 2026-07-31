/**
 * Conversational-intake orchestrator — owns the loop (spec §2.2).
 *
 * Per client message: load session + pinned schema + progress → build the
 * system prompt (constitution + current step context + glossary slice) →
 * call the provider via the EXISTING callStructured with the forced
 * INTAKE_TURN tool → validate and apply the tool results transactionally →
 * persist transcript rows → return assistant text + UI state.
 *
 * THE MODEL PROPOSES; THE SERVER DISPOSES. Every answer is validated by
 * saveMatterAnswers against the pinned schema; every gate answer runs
 * through the REAL machine (evaluateGate + assertTransition); checklist ids
 * are validated against the derived list. A rejected proposal produces a
 * corrective retry, never a saved lie.
 *
 * Stops: a gate trip in chat serves the mapped card content and PAUSES the
 * session (SYSTEM_EVENT "stopped: …"); the transcript remains for the
 * attorney and is purged by the same retention rules as the session. The
 * audit trail records event codes only — transcript content never leaves
 * the transcript table.
 */
import { getSession, updateSession, recordAudit, addAttorneyFlag, touchSession, type SessionRow } from "@/lib/db/repo";
import { getMatter, type MatterRow } from "@/lib/db/matters";
import { getMatterAnswers, saveMatterAnswers, schemaForMatter } from "@/lib/db/intake2";
import { deriveChecklist, isAnswered, itemVisible, type ChecklistEntry } from "@/lib/intake2/engine";
import { deriveImpliedAnswers } from "./derive";
import { getConfigChecklistState } from "@/lib/db/checklist";
import { evaluateGate, isGateState } from "@/lib/intake/scope-gate";
import { assertTransition, type MachineState } from "@/lib/intake/machine";
import { getCard, type CardId } from "@/config/cards";
import { GLOSSARY } from "@/config/glossary";
import { operatingFirmName } from "@/config/branding";
import { clientItemInPhase, matterIntakePhase, activeIntakePhase, type IntakePhase } from "@/config/intake/phases";
import { callStructured } from "@/lib/ai/responses";
import { AiDisabledError } from "@/lib/ai/types";
import { envOptional } from "@/lib/env";
import {
  appendChatMessage,
  appendSystemEvent,
  listChatMessages,
  MAX_CHAT_MESSAGE_CHARS,
  type ChatLang,
  type ChatMessageRow,
} from "@/lib/db/intake-chat";
import {
  buildConstitution,
  constitutionEventText,
  intakeTone,
} from "./constitution";
import {
  askableItems,
  nextStep,
  progress,
  type SequencerState,
  type Step,
} from "./sequencer";
import { getDb } from "@/lib/db/index";

/* ── configuration ──────────────────────────────────────────────────── */

export function intakeChatEnabled(): boolean {
  return envOptional("INTAKE_CHAT_ENABLED") === "true";
}

/**
 * The intake chat's model. Operator decision (2026-07-26): Haiku — the
 * fastest current model — because the intake turn is a NARROW job: the
 * sequencer owns question order, the machine owns the gates, the server
 * disposes every proposal; the model only phrases the given step warmly
 * and interprets the reply through the forced INTAKE_TURN schema. Verified
 * current API alias: claude-haiku-4-5 (docs, 2026-07-26).
 * ANTHROPIC_INTAKE_MODEL overrides without a deploy (DO env), then
 * ANTHROPIC_MODEL, then the Haiku default.
 */
export function intakeChatModel(): string {
  return (
    envOptional("ANTHROPIC_INTAKE_MODEL") ||
    envOptional("ANTHROPIC_MODEL") ||
    "claude-haiku-4-5"
  );
}

function firmContact(): string {
  return envOptional("FIRM_CONTACT") || "the office";
}

function expectedHours(): string {
  return envOptional("INTAKE_EXPECTED_HOURS") || "2";
}

/* ── the forced tool (spec §2.2) ────────────────────────────────────── */

export const INTAKE_TURN_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["say", "lang", "control"],
  properties: {
    say: { type: "string", description: "Your message to the client, in their language." },
    lang: { type: "string", enum: ["en", "ko"] },
    record_answers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["questionId", "value"],
        properties: {
          questionId: { type: "string" },
          value: {},
        },
      },
    },
    gate_response: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["gateId", "value"],
      properties: {
        gateId: { type: "string" },
        value: {},
      },
    },
    flag_for_attorney: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["reason"],
      properties: { reason: { type: "string", maxLength: 500 } },
    },
    control: {
      type: "string",
      enum: [
        "CONTINUE",
        "STOPPED_SCOPE",
        "STOPPED_DV",
        "SECTION_COMPLETE",
        "INTAKE_COMPLETE",
      ],
    },
  },
};

interface IntakeTurn {
  say: string;
  lang: ChatLang;
  record_answers?: { questionId: string; value: unknown }[];
  gate_response?: { gateId: string; value: unknown } | null;
  flag_for_attorney?: { reason: string } | null;
  control: "CONTINUE" | "STOPPED_SCOPE" | "STOPPED_DV" | "SECTION_COMPLETE" | "INTAKE_COMPLETE";
}

/* ── transcript-derived conversation state ──────────────────────────── */

const EV_READBACK = "read-back summary shown";
const EV_CONFIRMED = "client confirmed the read-back";
const EV_STOPPED_PREFIX = "stopped:";
/** The welcome is an ASSISTANT turn and ASSISTANT turns are no longer
 *  persisted (2026-07-31), so the "already greeted" fact needs its own
 *  machine marker or every page load would re-greet the client. */
const EV_WELCOMED = "welcome delivered";
/**
 * The attorney's unlock (operator directive 2026-07-31: "lock the account
 * (client) with the option for the lawyer to reopen it after review").
 *
 * The transcript is append-only by design — nothing deletes a SYSTEM_EVENT,
 * so a stop can never be erased. The unlock is therefore a LATER event, and
 * the lock state is whichever of the two came last. That keeps the whole
 * lock/unlock history readable in order and needs no schema change.
 */
export const EV_REOPENED_PREFIX = "reopened by attorney";
/** An attorney-initiated lock — same family as a gate stop. The reason CODE
 *  (never the client's words) is appended: "stopped: THREATS". */
export const EV_LOCKED_PREFIX = "stopped: ";
interface ConversationContext {
  session: SessionRow;
  matter: MatterRow;
  schema: ReturnType<typeof schemaForMatter>;
  answers: Awaited<ReturnType<typeof getMatterAnswers>>;
  checklist: ChecklistEntry[];
  transcript: ChatMessageRow[];
  seqState: SequencerState;
  step: Step;
}

export async function loadConversation(sessionId: string): Promise<ConversationContext> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("VALIDATION: session not found");
  if (!session.matterId) throw new Error("VALIDATION: session has no matter");
  const matter = await getMatter(session.matterId);
  if (!matter) throw new Error("VALIDATION: matter not found");
  const schema = schemaForMatter(matter);
  const answers = await getMatterAnswers(matter.id);
  const checklistState = await getConfigChecklistState(matter.id);
  const checklist = deriveChecklist(schema, answers, checklistState, matterIntakePhase(matter));
  const transcript = await listChatMessages(sessionId);

  // LAST word wins: scan backwards for the most recent stop-or-reopen. A
  // reopen after a stop clears it; a later stop locks it again. (Before
  // 2026-07-31 this was a forward .find() for a stop only, which made every
  // stop permanent and unappealable — the client could not restart, no firm
  // page called /api/intake/start, and a session started by the attorney
  // carried the ATTORNEY's ownerSubject so the client never saw it.)
  const lockEvent = [...transcript]
    .reverse()
    .find(
      (m) =>
        m.role === "SYSTEM_EVENT" &&
        (m.content.startsWith(EV_STOPPED_PREFIX) || m.content.startsWith(EV_REOPENED_PREFIX))
    );
  const stoppedEvent =
    lockEvent && lockEvent.content.startsWith(EV_STOPPED_PREFIX) ? lockEvent : undefined;
  const seqState: SequencerState = {
    schema,
    answers,
    phase: matterIntakePhase(matter),
    machineState: session.state as MachineState,
    checklist,
    welcomed: transcript.some((m) => m.role === "SYSTEM_EVENT" && m.content === EV_WELCOMED),
    readBackShown: transcript.some((m) => m.role === "SYSTEM_EVENT" && m.content === EV_READBACK),
    confirmed: transcript.some((m) => m.role === "SYSTEM_EVENT" && m.content === EV_CONFIRMED),
    // Case-insensitive: the reason vocabulary writes CODES ("stopped: DV"),
    // while pre-2026-07-31 events wrote lowercase words ("stopped: dv").
    stopped: stoppedEvent
      ? /\bdv\b/i.test(stoppedEvent.content)
        ? "DV"
        : "SCOPE"
      : null,
  };
  return { session, matter, schema, answers, checklist, transcript, seqState, step: nextStep(seqState) };
}

/* ── the scripted opening (server-side, never model-generated) ──────── */

/**
 * A round, honest estimate of how many questions to expect. Counts the
 * client-answerable items in the pinned schema plus the handful of scope
 * questions. Conditions mean some won't apply, so the copy says "up to about."
 */
export function estimateQuestionCount(
  schema: ReturnType<typeof schemaForMatter>,
  phase: IntakePhase = activeIntakePhase()
): number {
  // Count what a fresh client will actually SEE: initially-visible items
  // (conditionals only ever ADD later, and gate prefills SUBTRACT) plus the
  // scope gates. The welcome frames this as "up to about N, often fewer" —
  // a ceiling the interview then under-runs, never overruns.
  const clientItems = schema.items.filter(
    (i) =>
      i.audience === "CLIENT" &&
      i.type !== "document_request" &&
      i.type !== "attorney_determination" &&
      clientItemInPhase(i, phase) &&
      itemVisible(i, {})
  ).length;
  const SCOPE_QUESTIONS = 5; // residency + venue + DV + children + complexity
  const raw = clientItems + SCOPE_QUESTIONS;
  return Math.max(5, Math.round(raw / 5) * 5); // round to nearest 5
}

export function scriptedWelcome(questionEstimate: number): string {
  return (
    `Hello — I'm the intake assistant for ${operatingFirmName()}. I'm not a lawyer and I ` +
    `can't give legal advice; a licensed attorney reviews everything we go ` +
    `through here.\n\n` +
    `Here's what to expect: I'll ask you up to about ${questionEstimate} questions, ` +
    `one at a time, and I'll keep us moving — after each answer I'll go straight ` +
    `to the next question, so you won't need to prompt me. Some questions may not ` +
    `apply to you, so it's often fewer. ${
      questionEstimate <= 30
        ? `Most people finish in about 15–30 minutes`
        : `It can take up to ${expectedHours()} hours in total`
    }, and you can pause and come back anytime — nothing is lost. At any ` +
    `point you can ask me how many are left, why I'm asking something, or what a ` +
    `question means, and I'll explain.\n\n` +
    `You can answer in English or Korean (한국어로 답하셔도 됩니다). If you'd ` +
    `rather fill out a form instead of chatting, use the "Prefer a form?" ` +
    `link — your progress carries over either way.\n\n` +
    `Ready? First question: have you or your spouse lived in New York State ` +
    `continuously for at least the past 2 years?`
  );
}

/** Ensure the transcript opens with the constitution marker + scripted welcome. */
export async function ensureWelcomed(sessionId: string): Promise<void> {
  const transcript = await listChatMessages(sessionId);
  if (transcript.some((m) => m.role === "SYSTEM_EVENT" && m.content === EV_WELCOMED)) return;
  if (!transcript.some((m) => m.role === "SYSTEM_EVENT" && m.content.startsWith("intake assistant started"))) {
    await appendSystemEvent(sessionId, constitutionEventText(intakeTone()));
  }
  const ctx = await loadConversation(sessionId);
  await appendSystemEvent(sessionId, EV_WELCOMED);
}

/* ── prompt assembly ────────────────────────────────────────────────── */

function glossarySlice(): string {
  const entries = GLOSSARY.filter((t) => !t.definition.startsWith("[ATTORNEY TO SUPPLY"));
  if (entries.length === 0) return "No approved glossary entries are available yet.";
  return entries
    .map((t) => `- ${t.term}: ${t.definition}`)
    .join("\n");
}

/**
 * The other questions still waiting to be asked, offered to the model so a
 * client who answers three things in one sentence is not asked all three.
 * Capped and id-explicit: the model may only record ids it sees here, and the
 * server re-validates every one of them against the pinned schema anyway.
 */
function pendingRoster(ctx: ConversationContext, currentId: string): string {
  const pending = askableItems(ctx.schema, ctx.answers, ctx.seqState.phase ?? activeIntakePhase())
    .filter((i) => i.id !== currentId && !isAnswered(i, ctx.answers))
    .slice(0, 12);
  if (pending.length === 0) return "(none — this is the last question)";
  return pending
    .map(
      (i) =>
        `- ${i.id}: "${i.prompt}"` +
        (i.options ? ` [valid values: ${i.options.map((o) => o.value).join(", ")}]` : "")
    )
    .join("\n");
}

function describeStep(step: Step, ctx: ConversationContext): string {
  switch (step.kind) {
    case "GATE":
      return (
        `CURRENT STEP — SCOPE QUESTION (id ${step.id}).\n` +
        `Ask exactly this, in your own warm words, without changing its meaning:\n` +
        `"${step.gate!.prompt}"\n` +
        (step.gate!.options
          ? `Valid answers (record the VALUE): ${step.gate!.options.map((o) => `${o.value} ("${o.label}")`).join(", ")}\n`
          : `Valid answers: yes / no.\n`) +
        `When the client answers, set gate_response {gateId: "${step.id}", value: <their answer>}.`
      );
    case "QUESTION": {
      const item = step.item!;
      return (
        `CURRENT STEP — INTAKE QUESTION ${step.sectionIndex ?? "?"} of section "${step.sectionTitle ?? item.section}" ` +
        `(question id ${item.id}, type ${item.type}${item.required ? ", required" : ""}).\n` +
        `Ask exactly this, in your own warm words, without changing its meaning:\n` +
        `"${item.prompt}"\n` +
        (item.helpText ? `Approved help text you may use: "${item.helpText}"\n` : "") +
        (item.options
          ? `Valid values: ${item.options.map((o) => o.value).join(", ")}.\n`
          : "") +
        `When the client answers, set record_answers [{questionId: "${item.id}", value: <canonical value in English>}]. ` +
        `"I don't know" / "prefer not to say" is recorded honestly as the string "UNSURE" for selects or as their words for text.\n` +
        `NEVER ASK WHAT THEY ALREADY TOLD YOU. If their reply also answers one or ` +
        `more of the STILL-PENDING questions listed below, record those in the SAME ` +
        `record_answers array — one entry per question id — and they will be skipped. ` +
        `Only record a pending question when the client's own words plainly answer it; ` +
        `never infer, never fill it in for them.\n` +
        `STILL-PENDING QUESTIONS YOU MAY ALSO RECORD:\n${pendingRoster(ctx, item.id)}`
      );
    }
    case "READBACK":
      return (
        `CURRENT STEP — READ-BACK. Summarize, briefly and in plain words, the key ` +
        `answers collected (marriage, residence, agreement posture, assets/debts ` +
        `themes — NOT a full recitation), then ask the client to confirm ` +
        `everything is accurate or tell you what to correct. Do not record anything this turn.`
      );
    case "CONFIRM":
      return (
        `CURRENT STEP — FINAL CONFIRMATION. If the client's message confirms the ` +
        `read-back is accurate, set control INTAKE_COMPLETE and thank them: the ` +
        `attorney will take it from here. If they correct something, set ` +
        `record_answers with the corrected value(s) and control CONTINUE.`
      );
    case "COMPLETE":
      return `The intake is COMPLETE. Thank the client warmly; the attorney reviews everything next. control INTAKE_COMPLETE.`;
    case "STOPPED":
      return `The intake is STOPPED (${step.id}). Remind the client gently to contact ${firmContact()}; do not ask further questions.`;
    default:
      return "";
  }
}

/**
 * FACTS ON FILE — every answer already saved for this matter, shown to the
 * model on every turn.
 *
 * Root cause (operator, Claude 3.05, with transcript): the model was given
 * only a trailing transcript window, so it could not resolve "with me",
 * "same as mine", or "read above — what does it say?" against what the
 * client had already provided, and it re-confirmed things the client had
 * typed into the form. The saved answers are the system's actual memory —
 * so hand them to the model verbatim, every turn.
 *
 * The server still disposes: anything the model records from these facts is
 * re-validated by saveMatterAnswers like any other proposal.
 */
function factsOnFile(ctx: ConversationContext): string {
  const phase = ctx.seqState.phase ?? activeIntakePhase();
  const lines = ctx.schema.items
    .filter(
      (i) =>
        i.audience === "CLIENT" &&
        i.type !== "attorney_determination" &&
        clientItemInPhase(i, phase) &&
        isAnswered(i, ctx.answers)
    )
    .map((i) => {
      let v: string;
      try {
        v = JSON.stringify(ctx.answers[i.id]);
      } catch {
        v = String(ctx.answers[i.id]);
      }
      if (v.length > 220) v = v.slice(0, 220) + "…";
      return `- ${i.id} ("${i.prompt}"): ${v}`;
    });
  if (lines.length === 0) return "(nothing recorded yet)";
  return lines.join("\n");
}

const FACTS_RULES =
  `RULES FOR THE FACTS ON FILE:\n` +
  `- NEVER ask for, or re-confirm, anything already listed there. It is saved. Move on.\n` +
  `- When the client refers to something they already said ("same as mine", "with me", ` +
  `"read above", "I already told you"), resolve it FROM the facts on file. Example: if the ` +
  `spouse "lives with me", record the other party's address as a copy of the client's ` +
  `saved address value.\n` +
  `- When the client asks what they said earlier, answer directly from the facts on file — ` +
  `never say you can't see it or ask them to repeat it.\n` +
  `- If a fact on file already plainly answers the CURRENT question, do not ask it: record ` +
  `that value and briefly note it in passing ("you mentioned X earlier, so I've noted that").`;

/**
 * What the model is shown of the conversation so far.
 *
 * Since 2026-07-31 the verbatim transcript is not retained, so this is
 * MACHINE MARKERS ONLY — the gates passed, the answers recorded, the stops.
 * The model's memory of the client comes from FACTS ON FILE (factsOnFile
 * below: the saved, validated answers) and from the pending step, which is
 * what "yes" or "the second one" resolves against. That was already the
 * load-bearing fix for the "read above" defect (c171d74); the trailing
 * window was never what made it work.
 */
function transcriptWindow(transcript: ChatMessageRow[], n = 24): string {
  const events = transcript.filter((m) => m.role === "SYSTEM_EVENT").slice(-n);
  if (events.length === 0) return "(nothing recorded yet)";
  return events.map((m) => `[system: ${m.content}]`).join("\n");
}

function buildUserPrompt(ctx: ConversationContext, clientMessage: string, correction?: string): string {
  const prog = progress(ctx.seqState);
  // HONEST COUNTS ONLY (2026-07-26 — the first live interview misquoted its
  // own length): the model is given the SAME live numbers the header and the
  // progress rail show, and nothing else. No padded estimates, no arithmetic
  // of its own. Conditionals can only SHRINK what remains, so "about R more,
  // possibly fewer" is a promise the system always keeps.
  const remaining = Math.max(0, prog.total - prog.answered);
  const inGates = ctx.step.kind === "GATE" || ctx.step.kind === "WELCOME";
  const progressLine = inGates
    ? `PROGRESS (live — quote ONLY these numbers, Rule 13): you are in the short eligibility check (a handful of yes/no questions). The main questions come after it — currently about ${prog.total}, possibly fewer as answers rule things out. Never state an exact total.`
    : `PROGRESS (live — quote ONLY these numbers, Rule 13): ${prog.answered} main question(s) answered, about ${remaining} remaining — possibly fewer as answers rule things out. Never state an exact total, never invent your own count.`;
  return (
    progressLine +
    (prog.sectionTitle ? ` · current section "${prog.sectionTitle}" (${prog.sectionIndex}/${prog.sectionCount})` : "") +
    `\n\n` +
    `${describeStep(ctx.step, ctx)}\n\n` +
    `HOW TO REPLY:\n` +
    `- If the client ANSWERED the current question: record it (per above), then in the SAME reply ` +
    `briefly acknowledge and let them know you're moving on. Do NOT wait for them to prompt you (Rule 12).\n` +
    `- If the client instead ASKED you something (what a question means, why you're asking it, how many are left): ` +
    `answer it warmly (define terms / give a neutral example / explain the PURPOSE using any approved help text above / ` +
    `give the progress count), record nothing, and keep them on the current question (Rules 3, 13, 14).\n` +
    `- If their answer is genuinely unclear: ask them to clarify; record nothing yet.\n\n` +
    `APPROVED GLOSSARY (use verbatim on a hit; plain language otherwise):\n${glossarySlice()}\n\n` +
    `FACTS ON FILE (already saved — the client's answers so far):\n${factsOnFile(ctx)}\n\n` +
    `${FACTS_RULES}\n\n` +
    `RECENT CONVERSATION:\n${transcriptWindow(ctx.transcript)}\n\n` +
    (correction ? `SERVER CORRECTION (your previous proposal was rejected): ${correction}\n\n` : "") +
    `CLIENT'S NEW MESSAGE:\n${clientMessage}`
  );
}

/**
 * Phase-2 prompt (see runIntakeTurn): the client's answer is already recorded
 * and the intake advanced. The assistant now DRIVES to the next step — a
 * brief acknowledgment plus the next question — in a single message, so the
 * client never has to prompt it forward (Rule 12).
 */
function buildAdvancePrompt(ctx: ConversationContext, nextStepToAsk: Step): string {
  const prog = progress(ctx.seqState);
  const estimate = estimateQuestionCount(ctx.schema, ctx.seqState.phase);
  return (
    `You just recorded the client's previous answer — it is saved. Now MOVE THE ` +
    `CONVERSATION FORWARD (Rule 12): in ONE short reply, give a brief warm ` +
    `acknowledgment of what they just shared, then ask the next question below. ` +
    `Do NOT wait for the client to prompt you. Record NOTHING this turn (leave ` +
    `record_answers and gate_response empty) — you are only ` +
    `asking. control: CONTINUE.\n\n` +
    `PROGRESS: about question ${prog.answered + 1} of ~${estimate}.\n\n` +
    `NEXT ${describeStep(nextStepToAsk, ctx)}\n\n` +
    `APPROVED GLOSSARY (use verbatim on a hit; plain language otherwise):\n${glossarySlice()}\n\n` +
    `FACTS ON FILE (already saved — never re-ask or re-confirm any of it):\n${factsOnFile(ctx)}\n\n` +
    `RECENT CONVERSATION:\n${transcriptWindow(ctx.transcript)}`
  );
}

/* ── applying a validated turn ──────────────────────────────────────── */

// Reason CODES from LOCK_REASONS — what the attorney reads on the lock panel
// and says out loud when they call the client (operator, 2026-07-31).
const GATE_CARD_EVENT: Record<string, string> = {
  DV_RESOURCES: "stopped: DV",
  NY_BAR_REFERRAL: "stopped: SCOPE_COMPLEXITY",
  PHASE1_ATTORNEY_REVIEW: "stopped: SCOPE_CHILDREN",
};

export interface TurnResult {
  say: string;
  lang: ChatLang;
  stopped: "SCOPE" | "DV" | null;
  complete: boolean;
  card: { title: string; body: string; resources?: { label: string; value: string }[] } | null;
  progress: ReturnType<typeof progress>;
}

/**
 * Write every answer the server can DERIVE from what is already on file, so
 * the sequencer never asks a question the client has effectively answered.
 * Deterministic (see lib/intake-chat/derive.ts) and never overwrites a real
 * answer. A derivation failure is silent: it is a convenience, and must never
 * break a turn — the question simply gets asked.
 */
async function applyDerivations(ctx: ConversationContext, actingUserId: string): Promise<void> {
  const derived = deriveImpliedAnswers(ctx.answers);
  if (derived.length === 0) return;
  try {
    await saveMatterAnswers({
      matterId: ctx.matter.id,
      actingUserId,
      answers: derived.map((d) => ({ questionId: d.questionId, value: d.value })),
    });
  } catch {
    return;
  }
  for (const d of derived) {
    await appendSystemEvent(
      ctx.session.id,
      `answer derived q=${d.questionId} (${d.because})`
    );
  }
  ctx.answers = await getMatterAnswers(ctx.matter.id);
  ctx.seqState.answers = ctx.answers;
}

/**
 * Validate + apply one INTAKE_TURN proposal. Returns null when the proposal
 * is invalid (caller retries with the correction), or the applied result.
 */
async function applyTurn(
  ctx: ConversationContext,
  turn: IntakeTurn,
  actingUserId: string
): Promise<{ result: TurnResult; advanced: boolean } | { correction: string }> {
  const sessionId = ctx.session.id;
  // Did this turn move the intake forward (record an answer or pass a gate)?
  // If so, runIntakeTurn drives straight to the next question (Rule 12). If
  // not (the client asked a question / gave an unclear answer), we stay put
  // and the model's own reply is what the client sees.
  let advanced = false;

  // 1. Gate response — through the REAL machine. Never trust gateId blindly:
  //    only the machine's current gate is answerable.
  if (turn.gate_response) {
    const current = ctx.session.state as MachineState;
    if (!isGateState(current) || turn.gate_response.gateId !== current) {
      return { correction: `The current scope question is ${current}; you proposed ${turn.gate_response.gateId}. Re-ask the current question.` };
    }
    let evaluation;
    try {
      evaluation = evaluateGate(current, turn.gate_response.value);
    } catch (e) {
      return { correction: `That gate answer was rejected: ${e instanceof Error ? e.message : "invalid"}. Ask the client to answer the question directly.` };
    }
    if (evaluation.outcome === "OUT") {
      // Chat stop: serve the card, PAUSE (transcript retained for the
      // attorney; retention purges it with the session).
      const card = getCard(evaluation.card as CardId);
      await recordAudit(sessionId, evaluation.auditEvent, `card=${evaluation.card}`);
      await appendSystemEvent(sessionId, GATE_CARD_EVENT[evaluation.card] ?? "stopped: scope");
      await addAttorneyFlag(sessionId, `INTAKE_STOPPED_${evaluation.auditEvent}`);
      const say = turn.say?.trim() || card.body;
      return {
        advanced: false,
        result: {
          say,
          lang: turn.lang,
          stopped: evaluation.card === "DV_RESOURCES" ? "DV" : "SCOPE",
          complete: false,
          card,
          progress: progress(ctx.seqState),
        },
      };
    }
    assertTransition(current, evaluation.next);
    await updateSession(sessionId, {
      state: evaluation.next,
      ...(evaluation.persist?.county ? { county: evaluation.persist.county } : {}),
    });
    // PREFILL (2026-07-26 — never re-ask what a gate already collected):
    // unambiguous gate facts are written straight into the intake answers,
    // so the question phase silently skips them. County = the venue gate's
    // county; a YES on either residency-duration gate = lives in NY now.
    const prefill: { questionId: string; value: unknown }[] = [];
    if (evaluation.persist?.county) {
      prefill.push({ questionId: "ny.case.county", value: evaluation.persist.county });
    }
    if (
      (current === "GATE_RESIDENCY" || current === "GATE_RESIDENCY_1YR") &&
      (turn.gate_response!.value === true || turn.gate_response!.value === "yes")
    ) {
      prefill.push({ questionId: "ny.case.resident_now", value: true });
    }
    if (prefill.length > 0) {
      try {
        await saveMatterAnswers({ matterId: ctx.matter.id, actingUserId, answers: prefill });
      } catch {
        /* prefill is a convenience — a schema mismatch must never break a gate pass */
      }
      ctx.answers = await getMatterAnswers(ctx.matter.id);
      ctx.seqState.answers = ctx.answers;
    }
    for (const flag of evaluation.reviewFlags ?? []) {
      await addAttorneyFlag(sessionId, flag);
      await recordAudit(sessionId, "GATE_FLAGGED_FOR_ATTORNEY", `${current}:${flag}`);
    }
    await recordAudit(sessionId, "GATE_PASSED", current);
    await appendSystemEvent(sessionId, `gate ${current} answered`);
    ctx.session = (await getSession(sessionId))!;
    ctx.seqState.machineState = ctx.session.state as MachineState;
    advanced = true;
  }

  // 2. Answers — validated by the SAME store the form writes (audience,
  //    types, schema membership). All-or-nothing per proposal.
  if (turn.record_answers && turn.record_answers.length > 0) {
    try {
      await saveMatterAnswers({
        matterId: ctx.matter.id,
        actingUserId,
        answers: turn.record_answers.map((a) => ({ questionId: a.questionId, value: a.value })),
      });
    } catch (e) {
      return {
        correction:
          `record_answers was rejected (${e instanceof Error ? e.message : "invalid"}). ` +
          `Propose values only for the current question or for a question id listed ` +
          `under STILL-PENDING QUESTIONS, and match each question's type exactly.`,
      };
    }
    for (const a of turn.record_answers) {
      await appendSystemEvent(sessionId, `answer recorded q=${a.questionId}`);
    }
    ctx.answers = await getMatterAnswers(ctx.matter.id);
    ctx.seqState.answers = ctx.answers;
    advanced = true;
    await applyDerivations(ctx, actingUserId);
  }

  // 3. Attorney flag.
  if (turn.flag_for_attorney?.reason) {
    await addAttorneyFlag(sessionId, `CHAT_FLAG: ${turn.flag_for_attorney.reason.slice(0, 200)}`);
    await recordAudit(sessionId, "CHAT_FLAGGED_FOR_ATTORNEY");
    await appendSystemEvent(sessionId, "flagged for attorney");
  }

  // 4. Read-back / confirmation / completion bookkeeping. The SEQUENCER —
  //    not the model — decides whether completion is actually available.
  const stepNow = nextStep(ctx.seqState);
  if (ctx.step.kind === "READBACK" && stepNow.kind === "READBACK") {
    await appendSystemEvent(sessionId, EV_READBACK);
    ctx.seqState.readBackShown = true;
  }
  let complete = false;
  if (turn.control === "INTAKE_COMPLETE") {
    const after = nextStep(ctx.seqState);
    if (after.kind === "CONFIRM" || after.kind === "COMPLETE") {
      await appendSystemEvent(sessionId, EV_CONFIRMED);
      ctx.seqState.confirmed = true;
      if ((ctx.session.state as MachineState) !== "READY_FOR_REVIEW") {
        assertTransition(ctx.session.state as MachineState, "READY_FOR_REVIEW");
        await updateSession(sessionId, { state: "READY_FOR_REVIEW" });
        await recordAudit(sessionId, "READY_FOR_REVIEW", "via conversational intake");
        await appendSystemEvent(sessionId, "intake complete — packet ready for attorney review");
      }
      complete = true;
    }
    // A premature INTAKE_COMPLETE is simply ignored — the sequencer still
    // has questions, and the next turn's step context re-anchors the model.
  }

  const say = turn.say?.trim() || "Could you tell me a bit more?";
  await touchSession(sessionId);

  // Note: the assistant message is appended by runIntakeTurn — either this
  // `say` (clarification / completion / non-advancing turn) or, when the
  // intake advanced, the phase-2 "ask the next question" reply (Rule 12).
  return {
    advanced,
    result: {
      say,
      lang: turn.lang,
      stopped: null,
      complete,
      card: null,
      progress: progress({ ...ctx.seqState }),
    },
  };
}

/* ── the public turn entrypoint ─────────────────────────────────────── */

function detectLang(text: string): ChatLang {
  return /[가-힯]/.test(text) ? "ko" : "en";
}

export async function runIntakeTurn(opts: {
  sessionId: string;
  actingUserId: string;
  message: string;
}): Promise<TurnResult> {
  if (!intakeChatEnabled()) {
    throw new AiDisabledError();
  }
  const message = opts.message.trim();
  if (!message) throw new Error("VALIDATION: empty message");
  if (message.length > MAX_CHAT_MESSAGE_CHARS) throw new Error("VALIDATION: message too long");

  await ensureWelcomed(opts.sessionId);
  let ctx = await loadConversation(opts.sessionId);

  if (ctx.seqState.stopped) {
    // Paused conversation stays paused — no provider call, one gentle line.
    const say = `This intake is paused. Please contact ${firmContact()} to continue.`;
    return {
      say,
      lang: "en",
      stopped: ctx.seqState.stopped,
      complete: false,
      card: null,
      progress: progress(ctx.seqState),
    };
  }

  await appendChatMessage({
    sessionId: opts.sessionId,
    role: "CLIENT",
    content: message,
    lang: detectLang(message),
  });
  ctx = await loadConversation(opts.sessionId);

  const system = buildConstitution({ firmName: operatingFirmName(), firmContact: firmContact() });

  // One corrective retry: the model proposes, the server disposes.
  let correction: string | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    const call = await callStructured({
      model: intakeChatModel(),
      system,
      user: buildUserPrompt(ctx, message, correction),
      schemaName: "INTAKE_TURN",
      jsonSchema: INTAKE_TURN_SCHEMA,
      matterId: ctx.matter.id,
    });
    const turn = call.parsed as unknown as IntakeTurn;
    const applied = await applyTurn(ctx, turn, opts.actingUserId);
    if ("correction" in applied) {
      correction = applied.correction;
      ctx = await loadConversation(opts.sessionId);
      continue;
    }
    const { result, advanced } = applied;

    // Terminal (stop/complete) or non-advancing (the client asked a question,
    // or the answer was unclear): the model's own reply IS the message.
    if (result.stopped || result.complete || !advanced) {
      await appendChatMessage({ sessionId: opts.sessionId, role: "ASSISTANT", content: result.say, lang: result.lang });
      return result;
    }

    // The intake advanced → drive straight to the next question (Rule 12):
    // one reply that acknowledges and asks what's next, no client prompt.
    return await driveToNextQuestion(opts.sessionId, system, result);
  }

  // Both proposals rejected: honest fallback, nothing persisted from them.
  const fallback =
    "I want to make sure I record that correctly and I'm having trouble — could you say it once more, plainly?";
  await appendChatMessage({ sessionId: opts.sessionId, role: "ASSISTANT", content: fallback, lang: "en" });
  return {
    say: fallback,
    lang: "en",
    stopped: null,
    complete: false,
    card: null,
    progress: progress(ctx.seqState),
  };
}

/**
 * Phase 2 of a turn: the client's answer is saved and the intake moved on.
 * The assistant now asks the NEXT question in a single reply (Rule 12). A
 * separate provider call is used so the question is generated against the
 * real, freshly-advanced state (gates branch; conditional items open) rather
 * than guessed before the answer was recorded. If the next step isn't a
 * question, or the call fails, we fall back to the phase-1 acknowledgment.
 */
async function driveToNextQuestion(
  sessionId: string,
  system: string,
  phase1: TurnResult
): Promise<TurnResult> {
  const ctx = await loadConversation(sessionId);
  const ASKABLE = new Set(["QUESTION", "GATE", "READBACK", "CONFIRM"]);
  const showPhase1 = async (): Promise<TurnResult> => {
    await appendChatMessage({ sessionId, role: "ASSISTANT", content: phase1.say, lang: phase1.lang });
    return { ...phase1, progress: progress(ctx.seqState) };
  };
  if (!ASKABLE.has(ctx.step.kind)) return showPhase1();
  try {
    const call = await callStructured({
      model: intakeChatModel(),
      system,
      user: buildAdvancePrompt(ctx, ctx.step),
      schemaName: "INTAKE_TURN",
      jsonSchema: INTAKE_TURN_SCHEMA,
      matterId: ctx.matter.id,
    });
    const turn = call.parsed as unknown as IntakeTurn;
    const say = (turn.say ?? "").trim();
    if (!say) return showPhase1();
    // Phase 2 only ASKS — any record_* the model proposes here is ignored;
    // nothing is persisted until the client actually answers next turn.
    await appendChatMessage({ sessionId, role: "ASSISTANT", content: say, lang: turn.lang ?? phase1.lang });
    return {
      say,
      lang: turn.lang ?? phase1.lang,
      stopped: null,
      complete: false,
      card: null,
      progress: progress(ctx.seqState),
    };
  } catch {
    return showPhase1();
  }
}

/* ── read view (client pane + attorney transcript panel) ────────────── */

export async function conversationView(sessionId: string): Promise<{
  transcript: ChatMessageRow[];
  progress: ReturnType<typeof progress>;
  stopped: "SCOPE" | "DV" | null;
  complete: boolean;
  state: string;
}> {
  const ctx = await loadConversation(sessionId);
  return {
    // SYNTHESIZED, not stored. The verbatim transcript is not retained
    // (2026-07-31), so a reload cannot replay what was said — and shouldn't:
    // a scrollback of someone's disclosures sitting on a shared or borrowed
    // computer is its own leak. What the client gets back is where they ARE:
    // the scripted welcome, then the question that is pending. Both are
    // server-deterministic, so this is a re-render, not a recollection.
    transcript: rehydrateView(ctx),
    progress: progress(ctx.seqState),
    stopped: ctx.seqState.stopped ?? null,
    complete: ctx.session.state === "READY_FOR_REVIEW",
    state: ctx.session.state,
  };
}

/** Ephemeral ASSISTANT turns rebuilt from server state — never persisted. */
function rehydrateView(ctx: ConversationContext): ChatMessageRow[] {
  const at = ctx.session.updatedAt;
  const msg = (n: number, content: string): ChatMessageRow => ({
    id: `view-${n}`,
    sessionId: ctx.session.id,
    seq: -1,
    role: "ASSISTANT",
    content,
    lang: "en",
    createdAt: at,
  });
  const out: ChatMessageRow[] = [];
  if (ctx.seqState.welcomed) {
    out.push(msg(1, scriptedWelcome(estimateQuestionCount(ctx.schema, ctx.seqState.phase))));
  }
  if (ctx.seqState.stopped) {
    out.push(msg(2, `This intake is paused. Please contact ${firmContact()} to continue.`));
  } else if (ctx.step.kind === "GATE") {
    const prompt = ctx.step.gate?.prompt;
    if (prompt) out.push(msg(2, `Where we left off — ${prompt}`));
  } else if (ctx.step.kind === "QUESTION") {
    const prompt = ctx.step.item?.prompt;
    if (prompt) out.push(msg(2, `Where we left off — ${prompt}`));
  }
  return out;
}
