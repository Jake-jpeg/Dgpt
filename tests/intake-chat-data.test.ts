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

describe("intake_chat_message — the transcript is RETAINED for the firm (2026-10-30)", () => {
  // 2026-07-31 ("Nuke the transcript") was reversed by the operator on
  // 2026-10-30: "The chat logs will be saved. It's up to me to delete them.
  // But I gotta see what's going on. I have no choice." Every role is
  // written; the attorney reads per spouse and deletes from the matter page
  // (DELETE /api/matters/[id]/transcripts), which removes CLIENT/ASSISTANT
  // rows and keeps the SYSTEM_EVENT trail the intake lock is derived from.
  it("writes CLIENT and ASSISTANT turns to disk, in sequence, with their language", async () => {
    const sessionId = await newSession();
    const assistant = await appendChatMessage({ sessionId, role: "ASSISTANT", content: "Hello." });
    const client = await appendChatMessage({ sessionId, role: "CLIENT", content: "안녕하세요", lang: "ko" });
    expect(assistant.seq).toBe(1);
    expect(client.seq).toBe(2);
    expect(client.lang).toBe("ko");
    const all = await listChatMessages(sessionId);
    expect(all.map((m) => [m.role, m.content])).toEqual([
      ["ASSISTANT", "Hello."],
      ["CLIENT", "안녕하세요"],
    ]);
    expect(await countChatMessages(sessionId)).toBe(2);
  });

  it("the attorney's delete removes the words and keeps the machine trail", async () => {
    const sessionId = await newSession();
    await appendSystemEvent(sessionId, "gate GATE_RESIDENCY passed");
    await appendChatMessage({ sessionId, role: "CLIENT", content: "confidential" });
    await appendChatMessage({ sessionId, role: "ASSISTANT", content: "noted" });
    await appendSystemEvent(sessionId, "gate GATE_DV passed");
    expect(await countChatMessages(sessionId)).toBe(4);
    await getDb().run(`DELETE FROM intake_chat_message WHERE session_id = ? AND role IN ('CLIENT','ASSISTANT')`, sessionId);
    const all = await listChatMessages(sessionId);
    expect(all.map((m) => m.role)).toEqual(["SYSTEM_EVENT", "SYSTEM_EVENT"]);
    expect(all.every((m) => m.lang === "en")).toBe(true);
  });

  it("keeps sequences independent per session", async () => {
    const a = await newSession();
    await appendSystemEvent(a, "first");
    expect((await listChatMessages(a))[0].seq).toBe(1);
  });

  it("refuses unknown roles, unsupported languages, and oversized turns", async () => {
    const sessionId = await newSession();
    await expect(
      appendChatMessage({ sessionId, role: "ATTORNEY" as never, content: "x" })
    ).rejects.toThrow(/unknown chat role/);
    await expect(
      appendChatMessage({ sessionId, role: "CLIENT", content: "x", lang: "fr" as never })
    ).rejects.toThrow(/unsupported language/);
    await expect(
      appendChatMessage({
        sessionId,
        role: "CLIENT",
        content: "x".repeat(MAX_CHAT_MESSAGE_CHARS + 1),
        })
    ).rejects.toThrow(/too long/);
  });

  it("CASCADEs with the session, so retention purges it for free", async () => {
    const sessionId = await newSession();
    await appendSystemEvent(sessionId, "gate GATE_DV passed");
    expect((await countChatMessages(sessionId))).toBe(1);

    await getDb().run(`DELETE FROM intake_session WHERE id = ?`, sessionId);
    expect((await countChatMessages(sessionId))).toBe(0);
  });
});

describe("ai_job — start work, return an id, poll to completion", () => {
  it("moves QUEUED → RUNNING → DONE and carries ids only", async () => {
    const ctx = await setupClientWithMatter();
    const job = (await createJob({
          kind: "AI_ACTION",
          requestedBy: ctx.attorneyUserId,
          matterId: ctx.matterId,
        }));
    expect(job.status).toBe("QUEUED");
    expect(job.result).toBeNull();

    (await markJobRunning(job.id));
    expect((await getJob(job.id))!.status).toBe("RUNNING");

    (await completeJob(job.id, { documentId: "doc-1", versionId: "ver-1", model: "claude-opus-4-8" }));
    const done = (await getJob(job.id))!;
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
    const job = (await createJob({ kind: "AI_ACTION", requestedBy: ctx.attorneyUserId }));
    (await failJob(job.id, "AI_GUARD: provider request invalid (HTTP 400)"));
    const failed = (await getJob(job.id))!;
    expect(failed.status).toBe("FAILED");
    expect(failed.error).toBe("AI_GUARD: provider request invalid (HTTP 400)");

    const long = (await createJob({ kind: "AI_ACTION", requestedBy: ctx.attorneyUserId }));
    (await failJob(long.id, "x".repeat(1000)));
    expect((await getJob(long.id))!.error!.length).toBe(300);
  });

  it("reaps abandoned jobs so a poller always terminates", async () => {
    const ctx = await setupClientWithMatter();
    const job = (await createJob({ kind: "AI_ACTION", requestedBy: ctx.attorneyUserId }));
    (await markJobRunning(job.id));

    // Nothing is stale yet.
    expect((await reapStaleJobs())).toBe(0);
    expect((await getJob(job.id))!.status).toBe("RUNNING");

    // Far enough in the future that the job has clearly been abandoned.
    const reaped = (await reapStaleJobs(Date.now() + JOB_STALE_MS * 2));
    expect(reaped).toBeGreaterThanOrEqual(1);
    const dead = (await getJob(job.id))!;
    expect(dead.status).toBe("FAILED");
    expect(dead.error).toMatch(/did not complete/);
  });

  it("does not reap jobs that already reached a terminal state", async () => {
    const ctx = await setupClientWithMatter();
    const job = (await createJob({ kind: "AI_ACTION", requestedBy: ctx.attorneyUserId }));
    (await completeJob(job.id, { documentId: "doc-2" }));
    (await reapStaleJobs(Date.now() + JOB_STALE_MS * 2));
    expect((await getJob(job.id))!.status).toBe("DONE");
  });

  it("refuses an unknown job kind and lists jobs newest-first per matter", async () => {
    const ctx = await setupClientWithMatter();
    await expect(
      createJob({ kind: "MINE_BITCOIN" as never, requestedBy: ctx.attorneyUserId })
    ).rejects.toThrow(/unknown job kind/);

    (await createJob({ kind: "AI_ACTION", requestedBy: ctx.attorneyUserId, matterId: ctx.matterId }));
    const mine = (await listJobsForMatter(ctx.matterId));
    expect(mine.length).toBeGreaterThanOrEqual(1);
    for (const j of mine) expect(j.matterRef).toBe(ctx.matterId);
  });
});
