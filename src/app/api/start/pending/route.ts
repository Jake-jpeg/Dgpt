/**
 * The signed-in client's parked June draft, if any (2026-10-30). Matched on
 * the account's PROVIDER-VERIFIED email — the only link between an
 * anonymous draft and a person. Nothing about anyone else is returned.
 */
import { errorResponse } from "@/lib/auth/rbac";
import { requireUser } from "@/lib/auth/authz";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { pendingStartDraftFor } from "@/lib/june/start";
import { maskEmail } from "@/lib/db/invitations";

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    const authed = await requireUser(req, ["CLIENT"]);
    const draft = await pendingStartDraftFor(authed.account.email);
    if (!draft) return Response.json({ pending: null });
    return Response.json({
      pending: {
        id: draft.id,
        yourName: draft.draft.yourName,
        spouseName: draft.draft.spouseName,
        spouseEmailMasked: maskEmail(draft.draft.spouseEmail),
        state: draft.draft.state,
        children: draft.draft.children,
        assets: draft.draft.assets,
        quote: draft.quote,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
