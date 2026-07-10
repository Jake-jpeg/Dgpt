/**
 * Intent classifier for the intake bot — the ONLY place free user text is
 * interpreted, and its output is a closed enum + validated IDs. It never
 * produces text.
 *
 * Stage 1 ships a deterministic keyword classifier. If an LLM is ever slotted
 * in, it must implement IntentClassifier: classification only, output checked
 * against known glossary/copy IDs, and any unvalidated output is treated as
 * UNRECOGNIZED. An LLM in this position cannot add response surfaces because
 * the responder (responder.ts) maps intents to config lookups — there is no
 * code path from classifier output to generated prose.
 */
import { GLOSSARY } from "@/config/glossary";

export type Intent =
  | { intent: "DEFINITION"; termId: string }
  | { intent: "PROCESS_QUESTION" }
  | { intent: "ADVICE_SEEKING" }
  | { intent: "UNRECOGNIZED" };

export interface IntentClassifier {
  classify(input: string): Intent;
}

/**
 * Patterns that indicate the user is applying a concept to THEIR OWN facts or
 * asking for a recommendation/prediction — always deflected, even when a
 * glossary term also matches ("so does that mean I waive X?" → deflection,
 * not the waiver card).
 */
const ADVICE_PATTERNS: RegExp[] = [
  /\bshould\s+(i|we)\b/i,
  /\bdo\s+(i|we)\s+(need|have|get|qualify|owe|waive|lose|keep|win)\b/i,
  /\bdoes\s+(that|this|it|signing|filing)\s+mean\b/i,
  /\bwhat\s+(should|would|will)\s+(i|we|happen)\b/i,
  /\bam\s+i\b/i,
  /\bcan\s+(i|we|he|she|my\s+\w+)\b/i,
  /\bin\s+my\s+(case|situation)\b/i,
  /\bmy\s+(case|situation|house|kids?|spouse|husband|wife|401k|pension|money|rights?)\b/i,
  /\badvi[cs]e\b/i,
  /\brecommend/i,
  /\bwhat\s+are\s+my\b/i,
  /\bis\s+it\s+(better|worth|smart|a\s+good\s+idea)\b/i,
  /\bhow\s+(do|can|should)\s+(i|we)\b/i,
  /\bentitled\b/i,
  /\bfair\b/i,
  /\bso\s+(does|do|if|that|then)\b/i,
];

/** Patterns that look like a definition request. */
const DEFINITION_PATTERNS: RegExp[] = [
  /what\s+(does|do|is|are)\s+(.+?)\s*(mean|means)?\s*\??$/i,
  /^define\s+(.+?)\s*\??$/i,
  /^(what'?s|whats)\s+(a\s+|an\s+|the\s+)?(.+?)\s*\??$/i,
  /meaning\s+of\s+(.+?)\s*\??$/i,
];

/** Patterns that ask about the process itself (served scripted process copy). */
const PROCESS_PATTERNS: RegExp[] = [
  /\bwhat\s+happens\s+(next|after|now)\b/i,
  /\bhow\s+long\b/i,
  /\bwhy\s+(do\s+you|are\s+you|is\s+this)\s+ask/i,
  /\bwhat\s+is\s+this\s+(intake|form|process)\b/i,
  /\bwho\s+sees\s+(this|my)\b/i,
];

function findGlossaryTerm(text: string): string | null {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9\s()]/g, " ").replace(/\s+/g, " ").trim()} `;
  // Longest alias first so "case information statement" beats "cis" etc.
  const candidates = GLOSSARY.flatMap((term) =>
    term.aliases.map((a) => ({ alias: a.toLowerCase(), id: term.id }))
  ).sort((a, b) => b.alias.length - a.alias.length);
  for (const c of candidates) {
    if (t.includes(` ${c.alias} `)) return c.id;
  }
  return null;
}

export class KeywordClassifier implements IntentClassifier {
  classify(input: string): Intent {
    const text = String(input ?? "").slice(0, 500).trim();
    if (!text) return { intent: "UNRECOGNIZED" };

    // Advice-seeking / applied-to-my-facts ALWAYS wins over a term match.
    if (ADVICE_PATTERNS.some((p) => p.test(text))) {
      return { intent: "ADVICE_SEEKING" };
    }

    const looksLikeDefinition = DEFINITION_PATTERNS.some((p) => p.test(text));
    const termId = findGlossaryTerm(text);
    if (termId && (looksLikeDefinition || text.split(/\s+/).length <= 6)) {
      return { intent: "DEFINITION", termId };
    }

    if (PROCESS_PATTERNS.some((p) => p.test(text))) {
      return { intent: "PROCESS_QUESTION" };
    }

    // A definition-shaped question about a term NOT in the approved glossary
    // is still unanswerable — we never invent definitions.
    return { intent: "UNRECOGNIZED" };
  }
}

let _classifier: IntentClassifier | null = null;

export function getClassifier(): IntentClassifier {
  if (!_classifier) _classifier = new KeywordClassifier();
  return _classifier;
}
