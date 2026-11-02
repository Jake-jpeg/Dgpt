/**
 * Where DivorceGPT takes cases from the front door (operator, 2026-11-02:
 * "Park NJ — DivorceGPT will only serve NY for the MVP").
 *
 * This gates the FRONT DOOR only: June, the door copy, and case creation
 * from a June draft. The New Jersey playbook (schema, forms, tests) stays in
 * the repo and the firm's own picker can still open an NJ matter by hand.
 * Adding "NJ" back here is the whole switch.
 */
export type ServedState = "NY" | "NJ";

export const SERVED_STATES: readonly ServedState[] = ["NY"];

export const STATE_NAMES: Record<ServedState, { en: string; ko: string }> = {
  NY: { en: "New York", ko: "뉴욕" },
  NJ: { en: "New Jersey", ko: "뉴저지" },
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
