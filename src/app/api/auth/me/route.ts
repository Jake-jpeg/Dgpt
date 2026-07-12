/**
 * Who am I — session identity plus the AUTHORITATIVE role from the DB
 * (the cookie's role claim is a hint; app_user.role governs, exactly as in
 * src/lib/auth/authz.ts). Also tells the client UI which sign-in paths are
 * available and, for clients, whether a matter is already linked.
 */
import { getSessionUser } from "@/lib/auth/session";
import { testLoginAllowed } from "@/lib/auth/test-login";
import { isProviderConfigured } from "@/lib/auth/oauth";
import { resolveAccount } from "@/lib/db/users";
import { adminBootstrapEmails } from "@/lib/env";
import { listMattersForClient } from "@/lib/db/matters";

export async function GET(req: Request) {
  const session = await getSessionUser(req);
  let user: { role: string; email: string; name: string; active: boolean } | null = null;
  let clientMatterId: string | null = null;
  if (session) {
    const account = resolveAccount({
      subject: session.subject,
      email: session.email,
      name: session.name,
      sessionRole: session.role,
      adminBootstrapEmails: adminBootstrapEmails(),
    });
    user = {
      role: account.role, // DB role — authoritative
      email: account.email,
      name: account.name || session.name,
      active: account.active,
    };
    if (account.role === "CLIENT") {
      clientMatterId = listMattersForClient(account.id)[0]?.id ?? null;
    }
  }
  return Response.json({
    user,
    clientMatterId,
    // True when a test sign-in is available to THIS request: either the
    // non-production dev stub, or beta-gated production test login (the
    // request must already carry a valid beta-key cookie).
    devStub: testLoginAllowed(req),
    providers: {
      google: isProviderConfigured("google"),
      entra: isProviderConfigured("entra"),
    },
  });
}
