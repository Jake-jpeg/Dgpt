/**
 * Who am I — the authenticated IDENTITY plus the AUTHORITATIVE account from
 * the DB, when one exists. Providers authenticate; the database authorizes:
 * a signed-in Google/Microsoft identity with no app account gets
 * `user: null` and an `identity` block only (the invite flow uses it to
 * show which account an invitation would bind to).
 */
import { getSessionUser } from "@/lib/auth/session";
import { testLoginAllowed } from "@/lib/auth/test-login";
import { isProviderConfigured } from "@/lib/auth/oauth";
import { findAccountForSession } from "@/lib/db/users";
import { adminBootstrapEmails } from "@/lib/env";
import { listMattersForClient } from "@/lib/db/matters";

export async function GET(req: Request) {
  const session = await getSessionUser(req);
  let user: { role: string; email: string; name: string; active: boolean } | null = null;
  let identity: { email: string; name: string } | null = null;
  let clientMatterId: string | null = null;

  if (session) {
    identity = { email: session.email, name: session.name };
    const account = (await findAccountForSession({
          subject: session.subject,
          email: session.email,
          name: session.name,
          adminBootstrapEmails: adminBootstrapEmails(),
        }));
    if (account && account.subject === session.subject) {
      user = {
        role: account.role, // DB role — authoritative
        email: account.email,
        name: account.name || session.name,
        active: account.active,
      };
      if (account.role === "CLIENT") {
        clientMatterId = (await listMattersForClient(account.id))[0]?.id ?? null;
      }
    }
  }

  return Response.json(
    {
      user,
      identity,
      clientMatterId,
      // True only in LOCAL development (APP_STAGE=local + DEV_AUTH_STUB).
      devStub: testLoginAllowed(req),
      providers: {
        google: isProviderConfigured("google"),
        entra: isProviderConfigured("entra"),
        msa: isProviderConfigured("msa"),
      },
    },
    {
      // Identity must NEVER be cached: a CDN- or browser-cached body here
      // keeps a signed-out user looking signed in (and vice versa). This is
      // the "CDN needs no-store" landmine applied to the one endpoint every
      // screen's header trusts.
      headers: { "cache-control": "no-store" },
    }
  );
}
