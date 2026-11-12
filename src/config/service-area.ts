/**
 * Where DivorceGPT takes cases. New York only.
 *
 * 2026-11-02: "Park NJ — DivorceGPT will only serve NY for the MVP."
 * 2026-11-12: "Nuke all of NJ for now. We're not doing NJ until we perfect
 * NY." The New Jersey playbook (schema, forms, residency rule, tests) was
 * removed from the build; it lives in git history (commits before
 * 2026-11-12) if a second state ever comes back.
 */
export type ServedState = "NY";

export const SERVED_STATES: readonly ServedState[] = ["NY"];

export const STATE_NAMES: Record<ServedState, { en: string; ko: string }> = {
  NY: { en: "New York", ko: "뉴욕" },
};

export function servesState(s: string | null | undefined): s is ServedState {
  return Boolean(s) && (SERVED_STATES as readonly string[]).includes(s as string);
}

/** "New York" / "New York and New Jersey" — for copy. */
export function servedStatesPhrase(lang: "en" | "ko" = "en"): string {
  const names = SERVED_STATES.map((s) => STATE_NAMES[s][lang]);
  if (lang === "ko") return names.join("과 ");
  return names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
