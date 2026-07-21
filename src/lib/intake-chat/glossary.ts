/**
 * Glossary access for the intake conversation.
 *
 * REUSES the existing attorney-controlled config in src/config/glossary.ts
 * rather than introducing a second store of legal content. That file already
 * holds the firm's terms, aliases, and [ATTORNEY TO SUPPLY] placeholders,
 * and already serves the Stage 1 bot; one approved definition should not be
 * able to drift from another.
 *
 * The hybrid rule (spec §2.2):
 *   HIT  → the entry is injected into the system prompt and used VERBATIM.
 *          The assistant may translate its framing into Korean, and nothing
 *          else.
 *   MISS → nothing is injected; the assistant explains in plain language
 *          under the constitution, which still forbids citing authority and
 *          still forbids applying any definition to the client's own facts.
 *
 * A term whose definition is still a placeholder is treated as a MISS: an
 * unwritten definition must never reach a client as though it were the
 * firm's approved words.
 */
import { GLOSSARY, ATTORNEY_TO_SUPPLY, type GlossaryTerm } from "@/config/glossary";

export interface GlossaryHit {
  id: string;
  term: string;
  definition: string;
  koDefinition?: string;
  approved: boolean;
}

/** A definition is usable only once the attorney has actually written it. */
export function isSupplied(entry: GlossaryTerm): boolean {
  return !entry.definition.includes(ATTORNEY_TO_SUPPLY);
}

const BY_KEY = new Map<string, GlossaryTerm>();
for (const entry of GLOSSARY) {
  BY_KEY.set(entry.term.toLowerCase(), entry);
  for (const alias of entry.aliases) BY_KEY.set(alias.toLowerCase(), entry);
}

function toHit(entry: GlossaryTerm): GlossaryHit {
  return {
    id: entry.id,
    term: entry.term,
    definition: entry.definition,
    koDefinition: entry.koDefinition,
    approved: Boolean(entry.approvedBy),
  };
}

/** Exact term/alias lookup. Placeholder entries return null (a MISS). */
export function lookupGlossary(term: string): GlossaryHit | null {
  const entry = BY_KEY.get(term.trim().toLowerCase());
  if (!entry || !isSupplied(entry)) return null;
  return toHit(entry);
}

/**
 * The small relevant slice injected alongside the current question.
 * Substring matching only — no inference — so what the assistant was given
 * is always reconstructible from the question text alone.
 */
export function glossarySliceFor(text: string, limit = 4): GlossaryHit[] {
  const haystack = text.toLowerCase();
  const hits = new Map<string, GlossaryTerm>();
  for (const [key, entry] of BY_KEY) {
    if (haystack.includes(key) && isSupplied(entry)) hits.set(entry.id, entry);
  }
  return [...hits.values()].slice(0, limit).map(toHit);
}

/** True while any term is still an unwritten placeholder. */
export function glossaryNeedsAttorneyContent(): boolean {
  return GLOSSARY.some((e) => !isSupplied(e));
}
