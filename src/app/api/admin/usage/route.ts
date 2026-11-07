/** The operator's usage view (2026-11-07): who uses the guide, how many turns, tokens, estimated cost. ADMIN only. */
import { errorResponse } from "@/lib/auth/rbac";
import { requireUser } from "@/lib/auth/authz";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { usageByReader, aiPrices, estimateCostUsd, listGuideLog } from "@/lib/guide/log";

export async function GET(req: Request) {
  try {
    assertRateLimit(req, "intake");
    await requireUser(req, ["ADMIN"]);
    const readers = await usageByReader();
    const totals = readers.reduce((a, r) => ({ turns: a.turns + r.turns, tokensIn: a.tokensIn + r.tokensIn, tokensOut: a.tokensOut + r.tokensOut }), { turns: 0, tokensIn: 0, tokensOut: 0 });
    return Response.json({
      prices: aiPrices(),
      totals: { ...totals, estCostUsd: estimateCostUsd(totals.tokensIn, totals.tokensOut) },
      readers: readers.map((r) => ({ ...r, estCostUsd: estimateCostUsd(r.tokensIn, r.tokensOut) })),
      recent: (await listGuideLog(50)).map((l) => ({ at: l.createdAt, article: l.article, label: l.label, decidedBy: l.decidedBy, userId: l.userId, tokensIn: l.tokensIn, tokensOut: l.tokensOut, output: l.output.slice(0, 240) })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
