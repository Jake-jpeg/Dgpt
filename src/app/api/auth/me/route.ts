import { getSessionUser } from "@/lib/auth/session";
import { testLoginAllowed } from "@/lib/auth/test-login";
import { isProviderConfigured } from "@/lib/auth/oauth";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  return Response.json({
    user: user ? { role: user.role, email: user.email, name: user.name } : null,
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
