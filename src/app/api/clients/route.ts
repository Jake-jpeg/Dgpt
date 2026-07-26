/**
 * Client registrations — the attorney's connection queue (2026-07-26).
 *
 * Clients register by simply signing in (Google/Outlook); each registration
 * is an UNLINKED CLIENT shell until the attorney connects it to a matter or
 * declines it. This endpoint lists those registrations for the firm portal:
 * unlinked ones for the "connect" picker, and each client's linkage so the
 * panel can show state. STAFF may view; only the ATTORNEY connects/declines
 * (those routes enforce it).
 */
import { requireUser } from "@/lib/auth/authz";
import { errorResponse } from "@/lib/auth/rbac";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { listUsers } from "@/lib/db/users";
import { getDb } from "@/lib/db/index";

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    await requireUser(req, ["STAFF", "ATTORNEY"]);
    const clients = (await listUsers()).filter((u) => u.role === "CLIENT" && u.active);
    const rows = await getDb().all<{ client_user_id: string }>(
      `SELECT client_user_id FROM matter WHERE client_user_id IS NOT NULL`
    );
    const linked = new Set(rows.map((r) => r.client_user_id));
    return Response.json({
      clients: clients.map((c) => ({
        id: c.id,
        email: c.email,
        name: c.name,
        createdAt: c.createdAt,
        registered: Boolean(c.subject), // has actually signed in at least once
        linked: linked.has(c.id),
      })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
