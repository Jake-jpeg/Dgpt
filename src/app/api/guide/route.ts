/**
 * POST /api/guide — the reader's guide on the articles (2026-11-07). PUBLIC
 * (the articles are public; this is their chat). Stateless: the browser
 * sends the short recent history; the server stores nothing the reader
 * typed. The AI layer is reached only through src/lib/guide.
 */
import { z } from "zod";
import { errorResponse, HttpError } from "@/lib/auth/rbac";
import { assertCsrf } from "@/lib/security/csrf";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { runGuideTurn, guideEnabled } from "@/lib/guide/engine";
import { logGuideOutput } from "@/lib/guide/log";
import { getArticle } from "@/content/blog";
import { GUIDE_MAX_MESSAGE_CHARS, GUIDE_MAX_TURNS, consultationUrl } from "@/config/guide-prompt";
import { getSessionUser } from "@/lib/auth/session";
import { requireUser } from "@/lib/auth/authz";
import { mayUseGuide } from "@/lib/db/signups";

const schema = z.object({
  message: z.string().trim().min(1).max(GUIDE_MAX_MESSAGE_CHARS),
  article: z.string().trim().max(120).optional(),
  lang: z.enum(["en", "ko"]).optional(),
  history: z.array(z.object({ role: z.enum(["reader", "guide"]), text: z.string().max(2000) })).max(GUIDE_MAX_TURNS * 2).optional(),
});

/**
 * The guide is for signed-up readers (2026-11-07): a Google/Microsoft
 * identity plus name and phone, disclaimers acknowledged, not rejected by
 * the firm. GET tells the chat whether this browser may use it.
 */
async function readerAccess(req: Request): Promise<{ userId: string | null; access: "OK" | "SIGN_IN" | "SIGN_UP" | "REJECTED" | "NOT_CLIENT" }> {
  const session = await getSessionUser(req);
  if (!session) return { userId: null, access: "SIGN_IN" };
  try {
    const authed = await requireUser(req, ["CLIENT"]);
    const m = await mayUseGuide(authed.account.id);
    if (m.ok) return { userId: authed.account.id, access: "OK" };
    return { userId: authed.account.id, access: m.reason === "REJECTED" ? "REJECTED" : "SIGN_UP" };
  } catch {
    return { userId: null, access: "NOT_CLIENT" };
  }
}

export async function GET(req: Request) {
  const a = await readerAccess(req);
  return Response.json({ enabled: guideEnabled(), access: a.access, signupUrl: "/signup", consultationUrl: consultationUrl(), maxChars: GUIDE_MAX_MESSAGE_CHARS, maxTurns: GUIDE_MAX_TURNS });
}

export async function POST(req: Request) {
  try {
    assertRateLimit(req, "intake-chat");
    assertCsrf(req);
    const a = await readerAccess(req);
    if (a.access !== "OK") throw new HttpError(a.access === "SIGN_IN" ? 401 : 403, a.access === "REJECTED" ? "The firm is unable to assist with this matter." : "SIGNUP_REQUIRED: sign up to use the guide");
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "VALIDATION: say something (up to 600 characters)");
    const { message, article, history } = parsed.data;
    const post = article ? getArticle(article, parsed.data.lang ?? "en") : null;
    const articleText = post
      ? post.sections.map((s) => [s.heading, ...(s.paragraphs ?? []), ...(s.bullets ?? [])].filter(Boolean).join("\n")).join("\n\n").slice(0, 12_000)
      : undefined;
    const r = await runGuideTurn(message, { articleTitle: post?.title, articleText }, history ?? []);
    await logGuideOutput({
      article: post?.slug ?? null,
      label: r.label,
      decidedBy: r.decidedBy,
      lang: r.lang,
      output: r.answer,
      userId: a.userId,
      model: r.usage?.model ?? null,
      tokensIn: r.usage?.tokensIn ?? null,
      tokensOut: r.usage?.tokensOut ?? null,
      latencyMs: r.usage?.latencyMs ?? null,
    });
    return Response.json({ answer: r.answer, label: r.label, citations: r.citations, lang: r.lang, consultationUrl: consultationUrl() });
  } catch (e) {
    return errorResponse(e);
  }
}
