/**
 * Batch 4 acceptance: accommodations + client workflow.
 * - Clients can request help WITHOUT giving a reason (none is even storable).
 * - STAFF/ATTORNEY record alternate intake methods.
 * - Missing-information requests: client sees plain labels only, never the
 *   internal note.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { resetDbForTests } from "@/lib/db/index";
import {
  cookieFor,
  SYNTH_CLIENT,
  SYNTH_ATTORNEY,
  setupClientWithMatter,
  jsonRequest,
  params,
  freshLimits,
  type MatterContext,
} from "./helpers";
import {
  POST as assistancePost,
  GET as assistanceGet,
} from "@/app/api/matters/[id]/assistance/route";
import {
  POST as accommodationPost,
  GET as accommodationGet,
} from "@/app/api/matters/[id]/accommodations/route";
import {
  GET as infoGet,
  POST as infoPost,
} from "@/app/api/matters/[id]/info-requests/route";
import { GET as matterGet } from "@/app/api/matters/[id]/route";
import { listAssistanceRequests } from "@/lib/db/matter-workflow";

let ctx: MatterContext;
let clientCookie: string;
let attorneyCookie: string;

beforeEach(async () => {
  resetDbForTests();
  freshLimits();
  ctx = await setupClientWithMatter();
  clientCookie = await cookieFor(SYNTH_CLIENT);
  attorneyCookie = await cookieFor(SYNTH_ATTORNEY);
});

describe("assistance requests", () => {
  it("client can request help; no reason is collected or storable", async () => {
    const res = await assistancePost(
      jsonRequest(`/api/matters/${ctx.matterId}/assistance`, {
        cookie: clientCookie,
        body: { reason: "I have a disability" }, // extra fields are ignored
      }),
      params({ id: ctx.matterId })
    );
    expect(res.status).toBe(201);
    const rows = listAssistanceRequests(ctx.matterId);
    expect(rows.length).toBe(1);
    expect(JSON.stringify(rows)).not.toContain("disability"); // nowhere to store it
    // The client-facing option is visible on the matter view.
    freshLimits();
    const view = await matterGet(
      jsonRequest(`/api/matters/${ctx.matterId}`, { method: "GET", cookie: clientCookie }),
      params({ id: ctx.matterId })
    );
    const body = await view.json();
    expect(body.matter.helpLabel).toBe("I need help completing this intake.");
  });

  it("staff/attorney see and update requests; clients cannot list them", async () => {
    await assistancePost(
      jsonRequest(`/api/matters/${ctx.matterId}/assistance`, { cookie: clientCookie, body: {} }),
      params({ id: ctx.matterId })
    );
    freshLimits();
    const staffView = await assistanceGet(
      jsonRequest(`/api/matters/${ctx.matterId}/assistance`, { method: "GET", cookie: attorneyCookie }),
      params({ id: ctx.matterId })
    );
    expect(staffView.status).toBe(200);
    expect((await staffView.json()).requests.length).toBe(1);

    freshLimits();
    const clientList = await assistanceGet(
      jsonRequest(`/api/matters/${ctx.matterId}/assistance`, { method: "GET", cookie: clientCookie }),
      params({ id: ctx.matterId })
    );
    expect(clientList.status).toBe(403);
  });
});

describe("accommodations", () => {
  it("attorney records a telephone intake; client cannot", async () => {
    const res = await accommodationPost(
      jsonRequest(`/api/matters/${ctx.matterId}/accommodations`, {
        cookie: attorneyCookie,
        body: { method: "TELEPHONE", note: "prefers phone" },
      }),
      params({ id: ctx.matterId })
    );
    expect(res.status).toBe(201);

    freshLimits();
    const clientTry = await accommodationPost(
      jsonRequest(`/api/matters/${ctx.matterId}/accommodations`, {
        cookie: clientCookie,
        body: { method: "PAPER" },
      }),
      params({ id: ctx.matterId })
    );
    expect(clientTry.status).toBe(403);

    freshLimits();
    const list = await accommodationGet(
      jsonRequest(`/api/matters/${ctx.matterId}/accommodations`, { method: "GET", cookie: attorneyCookie }),
      params({ id: ctx.matterId })
    );
    expect((await list.json()).accommodations[0].method).toBe("TELEPHONE");
  });

  it("unknown methods are rejected", async () => {
    const res = await accommodationPost(
      jsonRequest(`/api/matters/${ctx.matterId}/accommodations`, {
        cookie: attorneyCookie,
        body: { method: "TELEPATHY" },
      }),
      params({ id: ctx.matterId })
    );
    expect(res.status).toBe(400);
  });
});

describe("missing-information requests", () => {
  it("client sees open labels only — never the internal note", async () => {
    await infoPost(
      jsonRequest(`/api/matters/${ctx.matterId}/info-requests`, {
        cookie: attorneyCookie,
        body: {
          label: "A copy of your marriage certificate",
          internalNote: "cert needed to verify date discrepancy vs intake answer",
        },
      }),
      params({ id: ctx.matterId })
    );
    freshLimits();
    const res = await infoGet(
      jsonRequest(`/api/matters/${ctx.matterId}/info-requests`, { method: "GET", cookie: clientCookie }),
      params({ id: ctx.matterId })
    );
    const body = await res.json();
    expect(body.requests.length).toBe(1);
    expect(body.requests[0].label).toContain("marriage certificate");
    expect(JSON.stringify(body)).not.toContain("discrepancy");
    expect(JSON.stringify(body)).not.toContain("internalNote");
  });

  it("clients cannot create info requests", async () => {
    const res = await infoPost(
      jsonRequest(`/api/matters/${ctx.matterId}/info-requests`, {
        cookie: clientCookie,
        body: { label: "self-created" },
      }),
      params({ id: ctx.matterId })
    );
    expect(res.status).toBe(403);
  });
});
