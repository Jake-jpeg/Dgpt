import type { WordForm, WordPayload } from "../../engine";
import { ud1 } from "./ud1";
import { complaint } from "./complaint";
import { ud4, ud5, ud9, ud12 } from "./packet";
import { ud6, ud7 } from "./affidavits";
import { ud14, ud15 } from "./finalization";
import { ud10, ud11 } from "./judgment";
import { stipulation } from "./stipulation";

/** NY generators, keyed by the ALLOWED_RENDERS form name. */
export const NY_FORMS: Record<string, (p: WordPayload) => WordForm> = {
  ud1,
  complaint,
  ud4,
  ud5,
  ud9,
  ud12,
  ud6,
  ud7,
  ud14,
  ud15,
  ud10,
  ud11,
  stipulation,
};
