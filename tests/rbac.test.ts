/**
 * ACCEPTANCE CRITERION 4: client and attorney roles are hard-separated
 * server-side; no client session can reach attorney data — by URL, API call,
 * or otherwise.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  cookieFor,
  SYNTH_CLIENT,
  SYNTH_CLIENT_2,
  SYNTH_NOT_ALLOWLISTED,
  startSession,
  runIdentity,
  jsonRequest,
  params,
  freshLimits,
} from "./helpers";
import { GET as attorneyList } from "@/app/api/attorney/sessions/route";
import { GET as attorneyDetail } from "@/app/api/attorney/sessions/[id]/route";
import { GET as intakeView } from "@/app/api/intake/[id]/route";
import { POST as startRoute } from "@/app/api/intake/start/route";
import { POST as devLogin } from "@/app/api/auth/dev-login/route";

beforeEach(freshLimits);

describe("attorney endpoints are closed to clients", () => {
  it("client hitting the attorney session list gets 403 and no data", async () => {
    const cookie = await cookieFor(SYNTH_CLIENT);
    const res = await attorneyList(
      jsonRequest("/api/attorney/sessions", { method: "GET", cookie })
    );
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.ready).toBeUndefined();
    expect(data.inProgress).toBeUndefined();
  });

  it("client hitting an attorney review URL directly gets 403", async () => {
    const clientCookie = await cookieFor(SYNTH_CLIENT);
    const id = await startSession(clientCookie);
    await runIdentity(clientCookie, id);
    freshLimits();
    const res = await attorneyDetail(
      jsonRequest(`/api/attorney/sessions/${id}`, { method: "GET", cookie: clientCookie }),
      params({ id })
    );
    expect(res.status).toBe(403);
  });

  it("anonymous requests get 401", async () => {
    const res = await attorneyList(jsonRequest("/api/attorney/sessions", { method: "GET" }));
    expect(res.status).toBe(401);
  });

  it("a forged role claim fails signature verification", async () => {
    // Cookie signed with the wrong secret → not accepted.
    const res = await attorneyList(
      jsonRequest("/api/attorney/sessions", {
        method: "GET",
        cookie: "dgpt_session=eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiQVRUT1JORVkifQ.forged",
      })
    );
    expect(res.status).toBe(401);
  });
});

describe("attorney allowlist", () => {
  it("an ATTORNEY-role session whose email is NOT allowlisted is rejected per-request", async () => {
    const cookie = await cookieFor(SYNTH_NOT_ALLOWLISTED);
    const res = await attorneyList(
      jsonRequest("/api/attorney/sessions", { method: "GET", cookie })
    );
    expect(res.status).toBe(403);
  });

  it("dev-login as attorney works but allowlist still gates the data", async () => {
    const res = await devLogin(
      jsonRequest("/api/auth/dev-login", {
        body: { role: "ATTORNEY", email: "impostor@example.test", name: "X" },
      })
    );
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie")!;
    const cookie = setCookie.split(";")[0];
    freshLimits();
    const listRes = await attorneyList(
      jsonRequest("/api/attorney/sessions", { method: "GET", cookie })
    );
    expect(listRes.status).toBe(403);
  });
});

describe("clients cannot see each other's sessions", () => {
  it("another client's session view is a 404, not a data leak", async () => {
    const c1 = await cookieFor(SYNTH_CLIENT);
    const c2 = await cookieFor(SYNTH_CLIENT_2);
    const id = await startSession(c1);
    await runIdentity(c1, id);
    freshLimits();
    const res = await intakeView(
      jsonRequest(`/api/intake/${id}`, { method: "GET", cookie: c2 }),
      params({ id })
    );
    expect(res.status).toBe(404);
  });
});

describe("CSRF and auth on state-changing endpoints", () => {
  it("intake start without the CSRF header is rejected", async () => {
    const cookie = await cookieFor(SYNTH_CLIENT);
    const req = new Request("http://localhost:3000/api/intake/start", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
    });
    const res = await startRoute(req);
    expect(res.status).toBe(403);
  });

  it("cross-origin intake start is rejected", async () => {
    const cookie = await cookieFor(SYNTH_CLIENT);
    const res = await startRoute(
      jsonRequest("/api/intake/start", {
        cookie,
        headers: { origin: "https://evil.example" },
      })
    );
    expect(res.status).toBe(403);
  });

  it("anonymous intake start is rejected", async () => {
    const res = await startRoute(jsonRequest("/api/intake/start", {}));
    expect(res.status).toBe(401);
  });
});

describe("rate limiting", () => {
  it("hammering an endpoint trips the limiter", async () => {
    const cookie = await cookieFor(SYNTH_CLIENT);
    freshLimits();
    let limited = false;
    for (let i = 0; i < 100; i++) {
      const res = await startRoute(jsonRequest("/api/intake/start", { cookie }));
      if (res.status === 429) {
        limited = true;
        break;
      }
    }
    expect(limited).toBe(true);
  });
});
