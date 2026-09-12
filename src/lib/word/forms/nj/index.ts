import type { WordForm, WordPayload } from "../../engine";
import { complaint, summons, verification } from "./phase1";
import { acknowledgment, cdr_plaintiff, cdr_defendant, insurance } from "./phase2";
import { jod, jod_cert_plaintiff, jod_cert_defendant } from "./phase3";

/** NJ generators, keyed by the ALLOWED_RENDERS form name (RL's route keys). */
export const NJ_FORMS: Record<string, (p: WordPayload) => WordForm> = {
  complaint,
  summons,
  verification,
  acknowledgment,
  cdr_plaintiff,
  cdr_defendant,
  insurance,
  jod,
  jod_cert_plaintiff,
  jod_cert_defendant,
};
