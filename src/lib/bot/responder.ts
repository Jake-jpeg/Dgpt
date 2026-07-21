/**
 * The intake bot's ENTIRE response surface — the UPL firewall.
 *
 * BotResponse is a closed union of exactly four kinds, and every `text` in it
 * is a verbatim lookup from attorney-controlled config:
 *
 *   1. PROCESS_COPY    — scripted process explanations (src/config/process-copy.ts)
 *   2. GLOSSARY_CARD   — approved definitions served verbatim by retrieval
 *                        (src/config/glossary.ts)
 *   3. CLARIFICATION   — scripted clarification questions from the fixed list
 *                        (src/config/clarifications.ts)
 *   4. STATIC_CARD     — referral / rejection / deflection cards
 *                        (src/config/cards.ts)
 *
 * There is no template interpolation, no string concatenation with user
 * input, and no generative path. The bot is structurally incapable of
 * producing substantive legal content: this module's only text sources are
 * the four config files above, and the guardrail tests assert every response
 * text appears verbatim in that corpus.
 */
import { getCard, type StaticCard } from "@/config/cards";
import { getTermById } from "@/config/glossary";
import { getProcessCopy } from "@/config/process-copy";
import { getClassifier } from "./classifier";
import { logBotInteraction } from "@/lib/db/repo";

export type BotResponse =
  | { kind: "PROCESS_COPY"; id: string; text: string }
  | { kind: "GLOSSARY_CARD"; id: string; term: string; text: string }
  | { kind: "CLARIFICATION"; id: string; text: string }
  | { kind: "STATIC_CARD"; id: string; card: StaticCard };

export function processCopyResponse(id: Parameters<typeof getProcessCopy>[0]): BotResponse {
  return { kind: "PROCESS_COPY", id, text: getProcessCopy(id) };
}

export function staticCardResponse(id: Parameters<typeof getCard>[0]): BotResponse {
  return { kind: "STATIC_CARD", id, card: getCard(id) };
}


/**
 * Handle free text typed at the bot. Classify → look up → serve. The user's
 * raw text is logged ONLY as its classified intent code (PII minimization);
 * the bot's reply is logged by content ID (UPL defense: proof of exactly what
 * was served, reconstructable verbatim from config + ID).
 */
export async function respondToUserText(sessionRef: string, input: string): Promise<BotResponse> {
  const intent = getClassifier().classify(input);
  (await logBotInteraction(sessionRef, "USER", "FREE_TEXT", `INTENT_${intent.intent}`));

  let response: BotResponse;
  switch (intent.intent) {
    case "DEFINITION": {
      const term = getTermById(intent.termId);
      response = term
        ? { kind: "GLOSSARY_CARD", id: term.id, term: term.term, text: term.definition }
        : staticCardResponse("DEFLECT_UNRECOGNIZED");
      break;
    }
    case "PROCESS_QUESTION":
      response = processCopyResponse("INTAKE_EXPLAINER");
      break;
    case "ADVICE_SEEKING":
      // "So does that mean I waive X?" → never answered; deflect to consult.
      response = staticCardResponse("DEFLECT_CONSULT");
      break;
    case "UNRECOGNIZED":
      response = staticCardResponse("DEFLECT_UNRECOGNIZED");
      break;
  }

  (await logBotInteraction(
        sessionRef,
        "BOT",
        response.kind,
        response.kind === "STATIC_CARD" ? response.card.id : response.id
      ));
  return response;
}
