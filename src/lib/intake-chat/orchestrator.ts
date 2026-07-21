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
import { deriveChecklist, type ChecklistEntry } from "@/lib/intake2/engine";
import { getConfigChecklistState } from "@/lib/db/checklist";
import { evaluateGate, isGateState } from "@/lib/intake/scope-gate";
import { assertTransition, type MachineState } from "@/lib/intake/machine";
import { getCard, type CardId } from "@/config/cards";
import { GLOSSARY } from "@/config/glossary";
import { operatingFirmName } from "@/config/branding";
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

export function intakeChatModel(): string {
  return (
    envOptional("ANTHROPIC_INTAKE_MODEL") ||
    envOptional("ANTHROPIC_MODEL") ||
    "claude-sonnet-5"
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
    record_checklist: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["documentId", "clientReport"],
        properties: {
          documentId: { type: "string" },
          clientReport: {
            type: "string",
            enum: ["HAS_IT", "NEEDS_TO_GET", "DOES_NOT_EXIST", "UNSURE"],
          },
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
  record_checklist?: { documentId: string; clientReport: string }[];
  gate_response?: { gateId: string; value: unknown } | null;
  flag_for_attorney?: { reason: string } | null;
  control: "CONTINUE" | "STOPPED_SCOPE" | "STOPPED_DV" | "SECTION_COMPLETE" | "INTAKE_COMPLETE";
}

/* ── transcript-derived conversation state ──────────────────────────── */

const EV_READBACK = "read-back summary shown";
const EV_CONFIRMED = "client confirmed the read-back";
const EV_STOPPED_PREFIX = "stopped:";
const EV_CHECKLIST_PREFIX = "checklist recorded ";

function checklistReportKey(matterId: string): string {
  return `intake-chat-client-reports:${matterId}`;
}

export async function getClientChecklistReports(matterId: string): Promise<Record<string, string>> {
  const r = await getDb().get<{ value: string }>(
    `SELECT value FROM app_config WHERE key = ?`,
    checklistReportKey(matterId)
  );
  if (!r) return {};
  try {
    return JSON.parse(r.value) as Record<string, string>;
  } catch {
    return {};
  }
}

async function saveClientChecklistReport(
  matterId: string,
  documentId: string,
  report: string,
  actingUserId: string
): Promise<void> {
  const all = await getClientChecklistReports(matterId);
  all[documentId] = report;
  const { nowIso } = await import("@/lib/db/index");
  await getDb().run(
    `INSERT INTO app_config (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    checklistReportKey(matterId),
    JSON.stringify(all),
    actingUserId,
    nowIso()
  );
}

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
  const checklist = deriveChecklist(schema, answers, checklistState);
  const transcript = await listChatMessages(sessionId);
  const reported = await getClientChecklistReports(matter.id);

  const stoppedEvent = transcript.find(
    (m) => m.role === "SYSTEM_EVENT" && m.content.startsWith(EV_STOPPED_PREFIX)
  );
  const seqState: SequencerState = {
    schema,
    answers,
    machineState: session.state as MachineState,
    checklist,
    checklistReported: Object.keys(reported),
    welcomed: transcript.some((m) => m.role === "ASSISTANT"),
    readBackShown: transcript.some((m) => m.role === "SYSTEM_EVENT" && m.content === EV_READBACK),
    confirmed: transcript.some((m) => m.role === "SYSTEM_EVENT" && m.content === EV_CONFIRMED),
    stopped: stoppedEvent
      ? stoppedEvent.content.includes("dv")
        ? "DV"
        : "SCOPE"
      : session.state === "READY_FOR_REVIEW"
        ? null
        : null,
  };
  return { session, matter, schema, answers, checklist, transcript, seqState, step: nextStep(seqState) };
}

/* ── the scripted opening (server-side, never model-generated) ──────── */

export function scriptedWelcome(): string {
  return (
    `Hello — I'm the intake assistant for ${operatingFirmName()}. I'm not a lawyer and I ` +
    `can't give legal advice; a licensed attorney reviews everything we go ` +
    `through here.\n\n` +
    `We'll take this one question at a time. It can take up to ` +
    `${expectedHours()} hours in total, but you can pause and come back ` +
    `anytime — nothing is lost. We'll ask about everything that may or may ` +
    `not end up in your settlement agreement, including things that may not ` +
    `apply to you. If a question is unclear, just ask — I can explain what ` +
    `it means and give an example.\n\n` +
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
  if (transcript.some((m) => m.role === "ASSISTANT")) return;
  if (!transcript.some((m) => m.role === "SYSTEM_EVENT" && m.content.startsWith("intake assistant started"))) {
    await appendSystemEvent(sessionId, constitutionEventText(intakeTone()));
  }
  await appendChatMessage({
    sessionId,
    role: "ASSISTANT",
    content: scriptedWelcome(),
    lang: "en",
  });
}

/* ── prompt assembly ────────────────────────────────────────────────── */

function glossarySlice(): string {
  const entries = GLOSSARY.filter((t) => !t.definition.startsWith("[ATTORNEY TO SUPPLY"));
  if (entries.length === 0) return "No approved glossary entries are available yet.";
  return entries
    .map((t) => `- ${t.term}: ${t.definition}`)
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
        `"I don't know" / "prefer not to say" is recorded honestly as the string "UNSURE" for selects or as their words for text.`
      );
    }
    case "CHECKLIST": {
      const entry = ctx.checklist.find((c) => c.documentId === step.id);
      return (
        `CURRENT STEP — DOCUMENT CHECKLIST ITEM (document id ${step.id}).\n` +
        `Ask about: "${entry?.requestText ?? entry?.title ?? step.id}".\n` +
        `Record record_checklist [{documentId: "${step.id}", clientReport: HAS_IT | NEEDS_TO_GET | DOES_NOT_EXIST | UNSURE}].`
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

function transcriptWindow(transcript: ChatMessageRow[], n = 24): string {
  return transcript
    .slice(-n)
    .map((m) =>
      m.role === "SYSTEM_EVENT" ? `[system: ${m.content}]` : `${m.role}: ${m.content}`
    )
    .join("\n");
}

function buildUserPrompt(ctx: ConversationContext, clientMessage: string, correction?: string): string {
  const prog = progress(ctx.seqState);
  return (
    `INTAKE PROGRESS: ${prog.answered}/${prog.total} questions answered` +
    (prog.sectionTitle ? ` · current section "${prog.sectionTitle}" (${prog.sectionIndex}/${prog.sectionCount})` : "") +
    `.\n\n${describeStep(ctx.step, ctx)}\n\n` +
    `APPROVED GLOSSARY (use verbatim on a hit; plain language otherwise):\n${glossarySlice()}\n\n` +
    `RECENT CONVERSATION:\n${transcriptWindow(ctx.transcript)}\n\n` +
    (correction ? `SERVER CORRECTION (your previous proposal was rejected): ${correction}\n\n` : "") +
    `CLIENT'S NEW MESSAGE:\n${clientMessage}`
  );
}

/* ── applying a validated turn ──────────────────────────────────────── */

const GATE_CARD_EVENT: Record<string, string> = {
  DV_RESOURCES: "stopped: dv",
  NY_BAR_REFERRAL: "stopped: scope",
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
 * Validate + apply one INTAKE_TURN proposal. Returns null when the proposal
 * is invalid (caller retries with the correction), or the applied result.
 */
async function applyTurn(
  ctx: ConversationContext,
  turn: IntakeTurn,
  actingUserId: string
): Promise<{ result: TurnResult } | { correction: string }> {
  const sessionId = ctx.session.id;

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
      await appendChatMessage({ sessionId, role: "ASSISTANT", content: say, lang: turn.lang });
      return {
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
    for (const flag of evaluation.reviewFlags ?? []) {
      await addAttorneyFlag(sessionId, flag);
      await recordAudit(sessionId, "GATE_FLAGGED_FOR_ATTORNEY", `${current}:${flag}`);
    }
    await recordAudit(sessionId, "GATE_PASSED", current);
    await appendSystemEvent(sessionId, `gate ${current} answered`);
    ctx.session = (await getSession(sessionId))!;
    ctx.seqState.machineState = ctx.session.state as MachineState;
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
          `Only propose values for the current question, matching its type exactly.`,
      };
    }
    for (const a of turn.record_answers) {
      await appendSystemEvent(sessionId, `answer recorded q=${a.questionId}`);
    }
    ctx.answers = await getMatterAnswers(ctx.matter.id);
    ctx.seqState.answers = ctx.answers;
  }

  // 3. Checklist reports — ids validated against the DERIVED list.
  if (turn.record_checklist && turn.record_checklist.length > 0) {
    const valid = new Set(ctx.checklist.map((c) => c.documentId));
    const bad = turn.record_checklist.find((c) => !valid.has(c.documentId));
    if (bad) {
      return { correction: `Unknown checklist document id "${bad.documentId}". Only report on the current checklist item.` };
    }
    for (const c of turn.record_checklist) {
      await saveClientChecklistReport(ctx.matter.id, c.documentId, c.clientReport, actingUserId);
      await appendSystemEvent(sessionId, `${EV_CHECKLIST_PREFIX}doc=${c.documentId} report=${c.clientReport}`);
    }
    ctx.seqState.checklistReported = Object.keys(await getClientChecklistReports(ctx.matter.id));
  }

  // 4. Attorney flag.
  if (turn.flag_for_attorney?.reason) {
    await addAttorneyFlag(sessionId, `CHAT_FLAG: ${turn.flag_for_attorney.reason.slice(0, 200)}`);
    await recordAudit(sessionId, "CHAT_FLAGGED_FOR_ATTORNEY");
    await appendSystemEvent(sessionId, "flagged for attorney");
  }

  // 5. Read-back / confirmation / completion bookkeeping. The SEQUENCER —
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
  await appendChatMessage({ sessionId, role: "ASSISTANT", content: say, lang: turn.lang });
  await touchSession(sessionId);

  return {
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
    if ("result" in applied) return applied.result;
    correction = applied.correction;
    ctx = await loadConversation(opts.sessionId);
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
    transcript: ctx.transcript,
    progress: progress(ctx.seqState),
    stopped: ctx.seqState.stopped ?? null,
    complete: ctx.session.state === "READY_FOR_REVIEW",
    state: ctx.session.state,
  };
}
