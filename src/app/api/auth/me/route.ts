import { getSessionUser } from "@/lib/auth/session";
import { devAuthStubEnabled } from "@/lib/env";
import { isProviderConfigured } from "@/lib/auth/oauth";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  return Response.json({
    user: user ? { role: user.role, email: user.email, name: user.name } : null,
    devStub: devAuthStubEnabled(),
    providers: {
      google: isProviderConfigured("google"),
      entra: isProviderConfigured("entra"),
    },
  });
}
