import { clearSessionCookieHeader } from "@/lib/auth/session";
import { assertCsrf } from "@/lib/security/csrf";
import { errorResponse } from "@/lib/auth/rbac";

export async function POST(req: Request) {
  try {
    assertCsrf(req);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "Set-Cookie": clearSessionCookieHeader(),
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
