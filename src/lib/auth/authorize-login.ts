/**
 * Post-authentication authorization + destination decision.
 *
 * PROVIDERS AUTHENTICATE IDENTITY; THE DATABASE AUTHORIZES. This is the one
 * place that turns a resolved account (already bound to the authenticated
 * stable subject) into a landing destination, applying the SAME firm-account
 * guardrails regardless of which provider carried the identity.
 *
 * Firm login on EITHER provider:
 *   - A firm-role account (STAFF / ATTORNEY / ADMIN) is a firm login whether
 *     it arrived via Microsoft Entra or via Google (e.g. a Google Workspace
 *     firm mailbox). It must be ACTIVE; an ATTORNEY must additionally be on
 *     the ATTORNEY_EMAILS allowlist. It lands in /admin (ADMIN) or /firm.
 *   - These are the exact checks authz.ts re-runs on every later request, so
 *     the login gate and the per-request gate agree.
 *
 * Provider-specific handling for NON-firm identities:
 *   - Microsoft (entra) is firm-only: an authenticated Microsoft identity
 *     that does not resolve to an active firm account is refused outright —
 *     Microsoft authentication alone confers nothing.
 *   - Google is the client path: an invited client (CLIENT account) lands on
 *     their matter; a brand-new Google identity with no account lands on the
 *     invitation page. Sign-in alone still creates no account.
 *
 * NO ENUMERATION ON THE MICROSOFT PATH: every firm-side rejection reaching an
 * entra caller collapses to ONE generic message. Distinguishing "deactivated
 * firm account" / "attorney off the allowlist" / "no account at all" would let
 * anyone holding a Microsoft credential — a terminated employee, or someone on
 * a compromised mailbox — probe which identities map to real firm accounts.
 * Google keeps the specific reasons: that path is reached by invited clients
 * and firm staff, not by anonymous probing.
 */
import { HttpError } from "@/lib/auth/rbac";
import type { UserRow } from "@/lib/db/users";
import type { ProviderId } from "@/lib/auth/oauth";

/** The single thing an entra caller is ever told about a firm-side refusal. */
const ENTRA_GENERIC_REFUSAL =
  "This Microsoft account is not linked to an authorized firm account";

export function decideLoginDestination(opts: {
  provider: ProviderId;
  /** Account already confirmed to be bound to the authenticated subject. */
  boundAccount: UserRow | null;
  attorneyAllowlist: string[];
}): string {
  const { provider, boundAccount, attorneyAllowlist } = opts;

  // Entra hears one message for every firm-side refusal; Google hears why.
  const refuseFirmSide = (reason: string): never => {
    throw new HttpError(403, provider === "entra" ? ENTRA_GENERIC_REFUSAL : reason);
  };

  // A firm-role account is a firm login on either provider.
  if (boundAccount && boundAccount.role !== "CLIENT") {
    if (!boundAccount.active) {
      refuseFirmSide("This firm account is not active");
    }
    if (
      boundAccount.role === "ATTORNEY" &&
      !attorneyAllowlist.includes(boundAccount.email.toLowerCase())
    ) {
      refuseFirmSide("This account is not authorized for attorney access");
    }
    return boundAccount.role === "ADMIN" ? "/admin" : "/firm";
  }

  // Not a firm-role account.
  if (provider === "entra") {
    // Microsoft is firm-only — same generic refusal as every other entra path.
    throw new HttpError(403, ENTRA_GENERIC_REFUSAL);
  }

  // Google client path.
  return boundAccount ? "/portal/matter" : "/invite";
}
