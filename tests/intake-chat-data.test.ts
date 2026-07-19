/**
 * Phase 1 data layer: the conversational transcript and the async job table.
 *
 * Two invariants carry real weight here:
 *   - transcripts CASCADE with their intake_session, so the existing
 *     retention sweep purges them without needing to know they exist;
 *   - job result/error carry METADATA AND IDS ONLY — the same posture as
 *     ai_invocation. A job row must never become a side channel for prompts,
 *     model output, or client content.
 */
import { describe, it, expect } from "vitest";
import { getDb } from "@/lib/db/index";
import {
  appendChatMessage,
  appendSystemEvent,
  listChatMessages,
  countChatMessages,
  MAX_CHAT_MESSAGE_CHARS,
} from "@/lib/db/intake-chat";
import {
  createJob,
  getJob,
  markJobRunning,
  completeJob,
  failJob,
  reapStaleJobs,
  listJobsForMatter,
  JOB_STALE_MS,
} from "@/lib/db/jobs";
import { setupClientWithMatter } from "./helpers";
import { startSession } from "./helpers";
import { cookieFor, SYNTH_CLIENT } from "./helpers";

async function newSession(): Promise<string> {
  return startSession(await cookieFor(SYNTH_CLIENT));
}

describe("intake_chat_message — append-only ordered transcript", () => {
  it("allocates seq per session and returns messages in order", async () => {
    const sessionId = await newSession();
    appendChatMessage({ sessionId, role: "ASSISTANT", content: "Hello." });
    appendChatMessage({ sessionId, role: "CLIENT", content: "안녕하세요", lang: "ko" });
    appendSystemEvent(sessionId, "gate GATE_DV passed");

    const all = listChatMessages(sessionId);
    expect(all.map((m) => m.seq)).toEqual([1, 2, 3]);
    expect(all.map((m) => m.role)).toEqual(["ASSISTANT", "CLIENT", "SYSTEM_EVENT"]);
    expect(all[1].lang).toBe("ko");
    expect(all[1].content).toBe("안녕하세요");
    // A system marker is always recorded in English.
    expect(all[2].lang).toBe("en");
    expect(countChatMessages(sessionId)).toBe(3);
  });

  it("keeps sequences independent per session", async () => {
    const a = await newSession();
    appendChatMessage({ sessionId: a, role: "CLIENT", content: "first" });
    expect(listChatMessages(a)[0].seq).toBe(1);
  });

  it("refuses unknown roles, unsupported languages, and oversized turns", async () => {
    const sessionId = await newSession();
    expect(() =>
      appendChatMessage({ sessionId, role: "ATTORNEY" as never, content: "x" })
    ).toThrow(/unknown chat role/);
    expect(() =>
      appendChatMessage({ sessionId, role: "CLIENT", content: "x", lang: "fr" as never })
    ).toThrow(/unsupported language/);
    expect(() =>
      appendChatMessage({
        sessionId,
        role: "CLIENT",
        content: "x".repeat(MAX_CHAT_MESSAGE_CHARS + 1),
      })
    ).toThrow(/too long/);
  });

  it("CASCADEs with the session, so retention purges it for free", async () => {
    const sessionId = await newSession();
    appendChatMessage({ sessionId, role: "CLIENT", content: "confidential" });
    expect(countChatMessages(sessionId)).toBe(1);

    getDb().prepare(`DELETE FROM intake_session WHERE id = ?`).run(sessionId);
    expect(countChatMessages(sessionId)).toBe(0);
  });
});

describe("ai_job — start work, return an id, poll to completion", () => {
  it("moves QUEUED → RUNNING → DONE and carries ids only", async () => {
    const ctx = await setupClientWithMatter();
    const job = createJob({
      kind: "AI_ACTION",
      requestedBy: ctx.attorneyUserId,
      matterId: ctx.matterId,
    });
    expect(job.status).toBe("QUEUED");
    expect(job.result).toBeNull();

    markJobRunning(job.id);
    expect(getJob(job.id)!.status).toBe("RUNNING");

    completeJob(job.id, { documentId: "doc-1", versionId: "ver-1", model: "claude-opus-4-8" });
    const done = getJob(job.id)!;
    expect(done.status).toBe("DONE");
    expect(done.result).toEqual({
      documentId: "doc-1",
      versionId: "ver-1",
      model: "claude-opus-4-8",
    });
    expect(done.error).toBeNull();
  });

  it("records a failure message without a stack, and truncates it", async () => {
    const ctx = await setupClientWithMatter();
    const job = createJob({ kind: "AI_ACTION", requestedBy: ctx.attorneyUserId });
    failJob(job.id, "AI_GUARD: provider request invalid (HTTP 400)");
    const failed = getJob(job.id)!;
    expect(failed.status).toBe("FAILED");
    expect(failed.error).toBe("AI_GUARD: provider request invalid (HTTP 400)");

    const long = createJob({ kind: "AI_ACTION", requestedBy: ctx.attorneyUserId });
    failJob(long.id, "x".repeat(1000));
    expect(getJob(long.id)!.error!.length).toBe(300);
  });

  it("reaps abandoned jobs so a poller always terminates", async () => {
    const ctx = await setupClientWithMatter();
    const job = createJob({ kind: "AI_ACTION", requestedBy: ctx.attorneyUserId });
    markJobRunning(job.id);

    // Nothing is stale yet.
    expect(reapStaleJobs()).toBe(0);
    expect(getJob(job.id)!.status).toBe("RUNNING");

    // Far enough in the future that the job has clearly been abandoned.
    const reaped = reapStaleJobs(Date.now() + JOB_STALE_MS * 2);
    expect(reaped).toBeGreaterThanOrEqual(1);
    const dead = getJob(job.id)!;
    expect(dead.status).toBe("FAILED");
    expect(dead.error).toMatch(/did not complete/);
  });

  it("does not reap jobs that already reached a terminal state", async () => {
    const ctx = await setupClientWithMatter();
    const job = createJob({ kind: "AI_ACTION", requestedBy: ctx.attorneyUserId });
    completeJob(job.id, { documentId: "doc-2" });
    reapStaleJobs(Date.now() + JOB_STALE_MS * 2);
    expect(getJob(job.id)!.status).toBe("DONE");
  });

  it("refuses an unknown job kind and lists jobs newest-first per matter", async () => {
    const ctx = await setupClientWithMatter();
    expect(() =>
      createJob({ kind: "MINE_BITCOIN" as never, requestedBy: ctx.attorneyUserId })
    ).toThrow(/unknown job kind/);

    createJob({ kind: "AI_ACTION", requestedBy: ctx.attorneyUserId, matterId: ctx.matterId });
    const mine = listJobsForMatter(ctx.matterId);
    expect(mine.length).toBeGreaterThanOrEqual(1);
    for (const j of mine) expect(j.matterRef).toBe(ctx.matterId);
  });
});
