/**
 * Intake lock / attorney reopen (2026-07-31).
 *
 * The defect this closes: a scope gate that returned OUT stopped the client
 * PERMANENTLY. `stopped` was derived from the FIRST `stopped:` event in an
 * append-only transcript, the client's portal only starts a session when it
 * has none, no firm page called /api/intake/start at all, and a session an
 * attorney did start carried the ATTORNEY's ownerSubject — so the client
 * would never have seen it. The client sat on "please contact the firm to
 * continue," which led nowhere.
 *
 * In Phase 1 that is the NORMAL path, not an edge case: GATE_CHILDREN
 * returns OUT for every client who has children.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import { SYNTH_ATTORNEY, provisionAccount, freshLimits } from "./helpers";
import { createMatter } from "@/lib/db/matters";
import { connectClientToMatter } from "@/lib/db/invitations";
import { listSessionsByMatter, getSession } from "@/lib/db/repo";
import { appendSystemEvent, listChatMessages } from "@/lib/db/intake-chat";
import { readIntakeLock, lockIntake, reopenIntake } from "@/lib/intake/lock";
import { soleSuccessor } from "@/lib/intake/machine";
import type { SessionUser } from "@/lib/auth/session";

const CLIENT: SessionUser = {
  subject: "devstub|client:locktest",
  role: "CLIENT",
  email: "lock-client@example.test",
  name: "Lock Client",
};

async function connectedMatter() {
  const attorney = await provisionAccount(SYNTH_ATTORNEY);
  const client = await provisionAccount(CLIENT);
  const matter = await createMatter({ label: "Lock Matter", createdBy: attorney.id });
  await connectClientToMatter({ matterId: matter.id, clientUserId: client.id });
  const session = (await listSessionsByMatter(matter.id))[0];
  return { attorney, client, matter, session };
}

beforeEach(() => {
  resetDbForTests();
  freshLimits();
});

describe("the machine exposes a single successor for every stoppable gate", () => {
  it("GATE_DV, GATE_CHILDREN and GATE_COMPLEXITY each have exactly one", () => {
    expect(soleSuccessor("GATE_DV")).toBe("GATE_CHILDREN");
    expect(soleSuccessor("GATE_CHILDREN")).toBe("GATE_COMPLEXITY");
    expect(soleSuccessor("GATE_COMPLEXITY")).toBe("TIER_BRANCH");
    // Branching / terminal states have none — reopening leaves them alone.
    expect(soleSuccessor("GATE_RESIDENCY")).toBeNull();
    expect(soleSuccessor("TIER_BRANCH")).toBeNull();
  });
});

describe("attorney reopen", () => {
  it("clears a DV stop and carries the session PAST the gate that tripped", async () => {
    const { attorney, matter, session } = await connectedMatter();

    // Walk the session to the DV gate the way the real cascade does, then
    // write exactly what the orchestrator's OUT branch writes.
    const { updateSession } = await import("@/lib/db/repo");
    await updateSession(session.id, { state: "GATE_VENUE" });
    await updateSession(session.id, { state: "GATE_DV" });
    await appendSystemEvent(session.id, "stopped: dv");
    let lock = await readIntakeLock(matter.id);
    expect(lock.locked).toBe(true);
    expect(lock.reason).toBe("dv");

    lock = await reopenIntake({
      matterId: matter.id,
      actingUserId: attorney.id,
      note: "spoke with client 7/31",
    });
    expect(lock.locked).toBe(false);
    expect(lock.reason).toBeNull();

    // Past the gate — otherwise the client lands on the same question and
    // re-locks on their next message.
    expect((await getSession(session.id))!.state).toBe("GATE_CHILDREN");
  });

  it("keeps the transcript APPEND-ONLY — the stop is never erased, only outranked", async () => {
    const { attorney, matter, session } = await connectedMatter();
    await appendSystemEvent(session.id, "stopped: dv");
    await reopenIntake({ matterId: matter.id, actingUserId: attorney.id });

    const events = (await listChatMessages(session.id)).filter((m) => m.role === "SYSTEM_EVENT");
    expect(events.some((m) => m.content === "stopped: dv")).toBe(true);
    expect(events.some((m) => m.content.startsWith("reopened by attorney"))).toBe(true);
    // Order is what decides, and the reopen came second.
    expect(events[events.length - 1].content).toMatch(/^reopened by attorney/);
  });

  it("a LATER stop re-locks a reopened session (last word wins, both directions)", async () => {
    const { attorney, matter, session } = await connectedMatter();
    await appendSystemEvent(session.id, "stopped: dv");
    await reopenIntake({ matterId: matter.id, actingUserId: attorney.id });
    expect((await readIntakeLock(matter.id)).locked).toBe(false);

    await appendSystemEvent(session.id, "stopped: scope");
    const lock = await readIntakeLock(matter.id);
    expect(lock.locked).toBe(true);
    expect(lock.reason).toBe("scope");
  });

  it("a fresh session minted by the reopen is owned by the CLIENT, not the attorney", async () => {
    // The trap that made the obvious fix wrong: /api/matters/[id] resolves the
    // client's session by ownerSubject === client.subject, so a session
    // stamped with the ATTORNEY's subject is invisible to the client.
    const { attorney, client, matter } = await connectedMatter();
    const { purgeSession } = await import("@/lib/db/repo");
    for (const s of await listSessionsByMatter(matter.id)) await purgeSession(s.id, "TEST");
    expect(await listSessionsByMatter(matter.id)).toHaveLength(0);

    await reopenIntake({ matterId: matter.id, actingUserId: attorney.id });
    const sessions = await listSessionsByMatter(matter.id);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].ownerSubject).toBe(client.subject);
    expect(sessions[0].ownerSubject).not.toBe(SYNTH_ATTORNEY.subject);
    expect(sessions[0].state).toBe("GATE_RESIDENCY");
  });
});

describe("attorney lock", () => {
  it("locks an open intake, is idempotent, and reopen releases it", async () => {
    const { attorney, matter } = await connectedMatter();
    expect((await readIntakeLock(matter.id)).locked).toBe(false);

    const locked = await lockIntake({
      matterId: matter.id,
      actingUserId: attorney.id,
      note: "threats in a call",
    });
    expect(locked.locked).toBe(true);
    expect(locked.reason).toBe("locked by attorney");

    // Locking twice does not stack a second event.
    await lockIntake({ matterId: matter.id, actingUserId: attorney.id });
    const events = (await listChatMessages(locked.sessionId!)).filter(
      (m) => m.content === "stopped: locked by attorney"
    );
    expect(events).toHaveLength(1);

    expect((await reopenIntake({ matterId: matter.id, actingUserId: attorney.id })).locked).toBe(
      false
    );
  });

  it("refuses to reopen a matter with no connected client", async () => {
    const attorney = await provisionAccount(SYNTH_ATTORNEY);
    const matter = await createMatter({ label: "Unconnected", createdBy: attorney.id });
    await expect(
      reopenIntake({ matterId: matter.id, actingUserId: attorney.id })
    ).rejects.toThrow(/Connect the client/);
  });
});
