/**
 * Test helpers — exercise the REAL route handlers over the REAL persistence
 * layer, exactly as HTTP would, with synthetic identities only.
 */
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE,
  type SessionUser,
} from "@/lib/auth/session";
import { listMattersForClient } from "@/lib/db/matters";
import { resetRateLimitsForTests } from "@/lib/security/rate-limit";

export const SYNTH_CLIENT: SessionUser = {
  subject: "devstub|client:testclient@example.test",
  role: "CLIENT",
  email: "testclient@example.test",
  name: "Synthetic Client",
};

export const SYNTH_CLIENT_2: SessionUser = {
  subject: "devstub|client:otherclient@example.test",
  role: "CLIENT",
  email: "otherclient@example.test",
  name: "Other Synthetic Client",
};

export const SYNTH_ATTORNEY: SessionUser = {
  subject: "devstub|attorney:attorney@example.test",
  role: "ATTORNEY",
  email: "attorney@example.test",
  name: "Synthetic Attorney",
};

/** An Entra-authenticated user who is NOT on the attorney allowlist. */
export const SYNTH_NOT_ALLOWLISTED: SessionUser = {
  subject: "devstub|attorney:impostor@example.test",
  role: "ATTORNEY",
  email: "impostor@example.test",
  name: "Not Allowlisted",
};

export async function cookieFor(user: SessionUser): Promise<string> {
  const token = await createSessionToken(user);
  return `${SESSION_COOKIE}=${token}`;
}

export function jsonRequest(
  url: string,
  opts: { method?: string; body?: unknown; cookie?: string; headers?: Record<string, string> } = {}
): Request {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-dgpt-csrf": "1",
    ...(opts.cookie ? { cookie: opts.cookie } : {}),
    ...(opts.headers ?? {}),
  };
  return new Request(`http://localhost:3000${url}`, {
    method: opts.method ?? "POST",
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

export function params<T extends Record<string, string>>(p: T): { params: Promise<T> } {
  return { params: Promise.resolve(p) };
}

export function freshLimits(): void {
  resetRateLimitsForTests();
}

// ── 2.0 matter/invitation setup (invitation-only portal) ─────────────

import {
  createUser,
  findAccountForSession,
  getUserByEmail,
  getUserBySubject,
} from "@/lib/db/users";
import { createMatter, grantMatterAccess, bindClientToMatter, markConflictsExternal } from "@/lib/db/matters";
import { recordDisclosureAck } from "@/lib/db/disclosure";
import { DISCLOSURE_VERSION } from "@/config/disclosure";
import { POST as conflictRoute } from "@/app/api/matters/[id]/conflict/route";
import { getSession } from "@/lib/db/repo";

/**
 * Test-fixture account setup. Providers no longer create accounts (pilot
 * hardening), so synthetic accounts are pre-created here exactly as an
 * admin would create them, then bound to the synthetic session subject as
 * a first login would.
 */
export async function provisionAccount(user: SessionUser) {
  if (!(await getUserBySubject(user.subject)) && !(await getUserByEmail(user.email))) {
    (await createUser({ email: user.email, role: user.role, name: user.name }));
  }
  const account = (await findAccountForSession({
      subject: user.subject,
      email: user.email,
      name: user.name,
      adminBootstrapEmails: (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    }));
  if (!account) throw new Error(`provisionAccount failed for ${user.email}`);
  return account;
}

export interface MatterContext {
  matterId: string;
  clientUserId: string;
  attorneyUserId: string;
}

/**
 * Full onboarding for a synthetic client (open-signup era): attorney
 * account, matter, client bound directly (as the login callback binds a
 * self-signed-up client), disclosure acknowledged. Leaves the matter's
 * conflict status untouched (NOT_STARTED).
 */
export async function setupClientWithMatter(
  client: SessionUser = SYNTH_CLIENT
): Promise<MatterContext> {
  const attorney = (await provisionAccount(SYNTH_ATTORNEY));
  const clientAccount = (await provisionAccount(client));
  const matter = (await createMatter({ label: `Synthetic Matter (${client.email})`, createdBy: attorney.id }));
  (await grantMatterAccess(matter.id, attorney.id, attorney.id));
  (await bindClientToMatter(matter.id, clientAccount.id));
  (await markConflictsExternal(matter.id));
  (await recordDisclosureAck({
        matterRef: matter.id,
        userRef: clientAccount.id,
        version: DISCLOSURE_VERSION,
      }));
  return { matterId: matter.id, clientUserId: clientAccount.id, attorneyUserId: attorney.id };
}

/** Attorney disposition through the real route (structural guards exercised). */
export async function setConflictDisposition(
  matterId: string,
  disposition: "CLEARED" | "DECLINED" | "NEEDS_MORE_INFORMATION",
  attorney: SessionUser = SYNTH_ATTORNEY
) {
  freshLimits();
  const res = await conflictRoute(
    jsonRequest(`/api/matters/${matterId}/conflict`, {
      cookie: await cookieFor(attorney),
      body: { disposition },
    }),
    params({ id: matterId })
  );
  return { status: res.status, data: await res.json() };
}

export async function clearMatter(matterId: string) {
  const r = await setConflictDisposition(matterId, "CLEARED");
  if (r.status !== 200) throw new Error(`attorney clearance failed: ${r.status}`);
}

// ── flow drivers (through the real HTTP handlers) ────────────────────

import { POST as startRoute } from "@/app/api/intake/start/route";
import { POST as identityRoute } from "@/app/api/intake/[id]/identity/route";
import { POST as gateRoute } from "@/app/api/intake/[id]/gate/route";
import { POST as branchRoute } from "@/app/api/intake/[id]/branch/route";
import { POST as answersRoute } from "@/app/api/intake/[id]/answers/route";
import { POST as completeRoute } from "@/app/api/intake/[id]/complete/route";

export const CLEAN_IDENTITY = {
  clientParty: { fullLegalName: "Casey Syntheticperson", priorNames: ["Casey Testcase"] },
  adverseParty: { fullLegalName: "Jordan Syntheticperson", priorNames: [] },
};

/** Identity that hits the synthetic conflict match-list. */
export const HIT_IDENTITY = {
  clientParty: { fullLegalName: "Casey Syntheticperson", priorNames: [] },
  adverseParty: { fullLegalName: "Harold Fictionberg", priorNames: [] },
};

/**
 * Start an intake session through the real route. 2.0: intake is
 * invitation-only, so this helper first ensures the synthetic user has a
 * matter — full invitation + disclosure flow for clients, a granted matter
 * for staff/attorneys.
 */
export async function startSession(cookie: string): Promise<string> {
  const token = cookie.split("=").slice(1).join("=");
  const user = await verifySessionToken(token);
  if (!user) throw new Error("startSession: invalid synthetic cookie");
  let matterId: string;
  if (user.role === "CLIENT") {
    const account = (await provisionAccount(user));
    const mine = (await listMattersForClient(account.id));
    matterId = mine[0]?.id ?? (await setupClientWithMatter(user)).matterId;
  } else {
    const account = (await provisionAccount(user));
    const m = (await createMatter({
          label: `Synthetic ${account.role}-initiated Matter`,
          createdBy: account.id,
        }));
    (await grantMatterAccess(m.id, account.id, account.id));
    (await markConflictsExternal(m.id));
    matterId = m.id;
  }
  freshLimits();
  const res = await startRoute(
    jsonRequest("/api/intake/start", { cookie, body: { matterId } })
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`start failed: ${data.error}`);
  return data.session.id;
}

/**
 * LEGACY-WALL FIXTURE. The live flow retired the in-app conflict wall
 * (open signup, 2026-07-21): real sessions are born at GATE_RESIDENCY with
 * the matter marked EXTERNAL. The wall MACHINERY still exists dormant —
 * screening, attorney-only dispositions, purge-on-decline — and its
 * guarantees stay pinned by tests. This builds the legacy state directly:
 * a NOT_STARTED matter and a PRE_GATE session, exactly as the old flow
 * produced them.
 */
export async function startPregateSession(cookie: string): Promise<string> {
  const token = cookie.split("=").slice(1).join("=");
  const user = await verifySessionToken(token);
  if (!user) throw new Error("startPregateSession: invalid synthetic cookie");
  const account = (await provisionAccount(user));
  const attorney = (await provisionAccount(SYNTH_ATTORNEY));
  const matter = (await createMatter({
        label: `Legacy-wall fixture (${account.email})`,
        createdBy: attorney.id,
      }));
  (await grantMatterAccess(matter.id, attorney.id, attorney.id));
  if (user.role === "CLIENT") {
    (await bindClientToMatter(matter.id, account.id));
  } else {
    (await grantMatterAccess(matter.id, account.id, attorney.id));
  }
  (await recordDisclosureAck({
        matterRef: matter.id,
        userRef: account.id,
        version: DISCLOSURE_VERSION,
      }));
  const { createSession } = await import("@/lib/db/repo");
  const sess = (await createSession({
        initiatedBy: user.role === "CLIENT" ? "CLIENT" : "ATTORNEY",
        ownerSubject: user.subject,
        initialState: "PRE_GATE",
        matterId: matter.id,
      }));
  return sess.id;
}

export async function runIdentity(cookie: string, id: string, identity: unknown = CLEAN_IDENTITY) {
  freshLimits();
  const res = await identityRoute(
    jsonRequest(`/api/intake/${id}/identity`, { cookie, body: identity }),
    params({ id })
  );
  return { status: res.status, data: await res.json() };
}

/**
 * COMPAT SHIM (wall retired 2026-07-21): sessions are now born past the
 * conflict wall at GATE_RESIDENCY, so there is no identity/clearance step to
 * run. Kept so older flow tests read unchanged; simply asserts the session
 * is where the new flow puts it.
 */
export async function runIdentityAndClear(
  _cookie: string,
  id: string,
  _identity: unknown = CLEAN_IDENTITY
) {
  const s = await getSession(id);
  if (!s) throw new Error("runIdentityAndClear: no session");
  if (!s.conflictClear) throw new Error("expected session born past the retired wall");
  return { status: 200, data: { result: "BORN_CLEAR" } };
}

export async function runGate(cookie: string, id: string, answer: unknown) {
  freshLimits();
  const res = await gateRoute(
    jsonRequest(`/api/intake/${id}/gate`, { cookie, body: { answer } }),
    params({ id })
  );
  return { status: res.status, data: await res.json() };
}

/**
 * Drive a session through all gates with in-scope answers (2-year NY
 * residency passes the cascade in one step). Wall retired 2026-07-21:
 * sessions are born at GATE_RESIDENCY.
 */
export async function runToTierBranch(cookie: string, id: string): Promise<void> {
  for (const answer of [true, "Kings", false, false, "FULLY_AGREE"]) {
    const r = await runGate(cookie, id, answer);
    if (r.data.status === "TERMINATED") throw new Error("unexpected gate trip");
  }
}

export async function runBranch(cookie: string, id: string, assets: string, alimony: string) {
  freshLimits();
  const res = await branchRoute(
    jsonRequest(`/api/intake/${id}/branch`, {
      cookie,
      body: { branch_assets: assets, branch_alimony: alimony },
    }),
    params({ id })
  );
  return { status: res.status, data: await res.json() };
}

export async function submitAnswersHttp(
  cookie: string,
  id: string,
  answers: { fieldId: string; value: unknown }[]
) {
  freshLimits();
  const res = await answersRoute(
    jsonRequest(`/api/intake/${id}/answers`, { cookie, body: { answers } }),
    params({ id })
  );
  return { status: res.status, data: await res.json() };
}

export async function completeHttp(cookie: string, id: string) {
  freshLimits();
  const res = await completeRoute(
    jsonRequest(`/api/intake/${id}/complete`, { cookie }),
    params({ id })
  );
  return { status: res.status, data: await res.json() };
}

export const TIER1_ANSWERS: { fieldId: string; value: unknown }[] = [
  { fieldId: "grounds_basis", value: "IRRETRIEVABLE_6MO" },
  { fieldId: "grounds_date", value: "2025-01-15" },
  { fieldId: "marriage_date", value: "2015-06-20" },
  { fieldId: "marriage_place", value: "Brooklyn, New York" },
  { fieldId: "ceremony_type", value: "CIVIL" },
  { fieldId: "client_address", value: "1 Synthetic Way, Testville NY 11200" },
  { fieldId: "client_phone", value: "555-000-0000" },
  { fieldId: "client_email", value: "testclient@example.test" },
  { fieldId: "spouse_address", value: "2 Synthetic Way, Testville NY 11200" },
  { fieldId: "separation_date", value: "2025-01-15" },
  { fieldId: "living_arrangement", value: "SEPARATE_RESIDENCES" },
  { fieldId: "children_confirm_none", value: true },
  { fieldId: "t1_no_assets_confirm", value: true },
  { fieldId: "t1_no_alimony_confirm", value: true },
  { fieldId: "name_change_requested", value: "NONE" },
  { fieldId: "prior_actions_any", value: false },
];

export const TIER2_ANSWERS: { fieldId: string; value: unknown }[] = [
  { fieldId: "grounds_basis", value: "IRRETRIEVABLE_6MO" },
  { fieldId: "grounds_date", value: "2025-01-15" },
  { fieldId: "marriage_date", value: "2010-06-20" },
  { fieldId: "marriage_place", value: "Albany, New York" },
  { fieldId: "ceremony_type", value: "RELIGIOUS" },
  { fieldId: "client_address", value: "1 Synthetic Way, Testville NY 11200" },
  { fieldId: "client_phone", value: "555-000-0001" },
  { fieldId: "client_email", value: "testclient@example.test" },
  { fieldId: "spouse_address", value: "2 Synthetic Way, Testville NY 11200" },
  { fieldId: "separation_date", value: "2025-02-01" },
  { fieldId: "living_arrangement", value: "SAME_RESIDENCE" },
  { fieldId: "children_confirm_none", value: true },
  { fieldId: "ed_business_interest", value: false },
  { fieldId: "ed_valuation_needed", value: false },
  { fieldId: "ed_realestate_any", value: true },
  { fieldId: "ed_realestate_disposition", value: "SELL_SPLIT" },
  { fieldId: "ed_vehicles_disposition", value: "KEEP_OWN" },
  { fieldId: "ed_accounts_disposition", value: "KEEP_OWN" },
  { fieldId: "ed_retirement_any", value: true },
  {
    fieldId: "ed_retirement_accounts",
    value: [
      { accountType: "401K", holder: "CLIENT", division: "SPLIT_AGREED" },
      { accountType: "IRA_ROTH", holder: "SPOUSE", division: "KEEP_OWN" },
    ],
  },
  { fieldId: "ed_debts_disposition", value: "KEEP_OWN" },
  { fieldId: "ed_personal_confirm", value: true },
  { fieldId: "maint_arrangement", value: "AGREED_TERMS" },
  { fieldId: "maint_payor", value: "CLIENT" },
  { fieldId: "maint_form", value: "PERIODIC" },
  { fieldId: "maint_amount", value: 1500 },
  { fieldId: "maint_frequency", value: "MONTHLY" },
  { fieldId: "maint_duration_months", value: 48 },
  { fieldId: "name_change_requested", value: "SPOUSE" },
  { fieldId: "name_change_names", value: "Jordan Priorperson" },
  { fieldId: "prior_actions_any", value: false },
];
