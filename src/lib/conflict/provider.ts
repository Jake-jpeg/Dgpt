/**
 * The conflict wall's data source, behind a clean interface.
 *
 * Stage 1 ships ONLY the stub (synthetic match-list). The real firm-system
 * integration later implements this same interface — the gate behavior in
 * the app is real and enforced now regardless of the data source.
 */
import type { PartyName } from "@/lib/db/repo";
import matchlist from "@/config/synthetic/conflict-matchlist.json";

export type ConflictResult = "CLEAR" | "HIT";

export interface ConflictCheckProvider {
  check(clientParty: PartyName, adverseParty: PartyName): Promise<ConflictResult>;
}

/** Normalize a name for matching: lowercase, collapse whitespace, strip punctuation. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function allNames(p: PartyName): string[] {
  return [p.fullLegalName, ...(p.priorNames ?? [])].map(normalizeName).filter(Boolean);
}

export class StubConflictCheckProvider implements ConflictCheckProvider {
  private readonly names: Set<string>;

  constructor(entries?: { name: string; priorNames?: string[] }[]) {
    const source = entries ?? (matchlist as { entries: { name: string; priorNames?: string[] }[] }).entries;
    this.names = new Set(
      source.flatMap((e) => [e.name, ...(e.priorNames ?? [])]).map(normalizeName)
    );
  }

  async check(clientParty: PartyName, adverseParty: PartyName): Promise<ConflictResult> {
    // Both parties are checked; the adversary (spouse) identity is the
    // conflict tiebreaker — a hit on EITHER side is a hit.
    const candidates = [...allNames(clientParty), ...allNames(adverseParty)];
    for (const n of candidates) {
      if (this.names.has(n)) return "HIT";
    }
    return "CLEAR";
  }
}

let _provider: ConflictCheckProvider | null = null;

export function getConflictProvider(): ConflictCheckProvider {
  if (!_provider) _provider = new StubConflictCheckProvider();
  return _provider;
}

/** Test hook. */
export function setConflictProviderForTests(p: ConflictCheckProvider | null): void {
  _provider = p;
}
